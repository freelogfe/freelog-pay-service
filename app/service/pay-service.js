'use strict'

const uuid = require('uuid')
const lodash = require('lodash')
const Service = require('egg').Service
const PaymentService = require('../payment-service/index')
const CurrencyTypeEnum = require('../enum/currency-type')
const {tradeType, tradeStatus, accountEvent} = require('../enum/index')
const accountAuthorization = require('../account-service/account-authorization/index')
const {accountInfoSecurity, paymentOrderSecurity} = require('../account-service/account-security/index')

module.exports = class PayService extends Service {

    constructor({app, request}) {
        super(...arguments)
        this.userId = request.userId
        this.accountProvider = app.dal.accountProvider
        this.paymentOrderProvider = app.dal.paymentOrderProvider
        this.accountPendTradeProvider = app.dal.accountPendTradeProvider
        this.accountTransferRecordProvider = app.dal.accountTransferRecordProvider
    }

    /**
     * 支付
     * @param fromAccountInfo 付款方账户
     * @param toAccountInfo 收款方账户
     * @param password 支付密码
     * @param amount 金额
     * @param paymentType 支付类型(1:合同)
     * @param outsideTradeNo 外部单号(要求唯一)
     * @param remark 备注
     * @returns {Promise<*>}
     */
    async payment({fromAccountInfo, toAccountInfo, password, amount, paymentType, outsideTradeNo, outsideTradeDesc, remark}) {

        const {result} = await this._transfer({
            fromAccountInfo, toAccountInfo, password, amount, tradeType: tradeType.Payment
        })

        if (!result) {
            return Promise.reject('支付失败')
        }

        const {userId} = this.ctx.request
        const paymentOrderId = uuid.v4().replace(/-/g, '')
        const paymentOrderInfo = {
            paymentOrderId, paymentType, amount, remark, outsideTradeNo, outsideTradeDesc,
            operationUserId: userId,
            accountId: fromAccountInfo.accountId,
            toAccountId: toAccountInfo.accountId,
            paymentStatus: 3,
            createDate: new Date().toISOString(),
            tradePoundage: 0,
            status: 1,
        }
        paymentOrderSecurity.paymentOrderSignature(paymentOrderInfo)
        this._sendAccountPaymentEvent({fromAccountInfo, toAccountInfo, amount, paymentOrderId, remark})

        return this.paymentOrderProvider.create(paymentOrderInfo).catch(error => {
            this.app.logger.error(`交易成功,但是创建支付订单失败`, paymentOrderInfo)
            throw error
        })
    }

    /**
     * 问询支付(发起确认函)
     */
    async inquirePayment({fromAccountInfo, toAccountInfo, password, amount, paymentType, outsideTradeNo, outsideTradeDesc, remark}) {

        const {app} = this
        await this._checkTransferAuthorization({
            accountInfo: fromAccountInfo, outsideTradeNo,
            amount, password, tradeType: tradeType.Payment
        })
        this._checkTransferAmount({fromAccountInfo, amount})
        this._checkTransferAccountStatus({fromAccountInfo, toAccountInfo})

        const fromAccountUpdateCondition = lodash.pick(fromAccountInfo, ['accountId', 'signature'])
        fromAccountInfo.freezeBalance = fromAccountInfo.freezeBalance + amount
        this._signAccountInfo(fromAccountInfo)

        await this.accountProvider.update(fromAccountUpdateCondition, {
            balance: fromAccountInfo.balance,
            freezeBalance: fromAccountInfo.freezeBalance,
            signature: fromAccountInfo.signature
        })

        const paymentOrderId = uuid.v4().replace(/-/g, '')
        const paymentOrderInfo = {
            paymentOrderId, paymentType, amount, remark, outsideTradeNo, outsideTradeDesc,
            operationUserId: this.ctx.request.userId,
            accountId: fromAccountInfo.accountId,
            toAccountId: toAccountInfo.accountId,
            createDate: new Date().toISOString(),
            paymentStatus: 1, tradePoundage: 0
        }

        paymentOrderSecurity.paymentOrderSignature(paymentOrderInfo)

        return this.paymentOrderProvider.create(paymentOrderInfo).tap(paymentOrderInfo => {
            app.emit(accountEvent.emitInquirePaymentEvent, paymentOrderInfo)
        })
    }

    /**
     * 充值
     * @param accountId 充值账户
     * @param cardNo 扣费银行卡号
     * @param amount 扣飞金额
     * @returns {Promise<void>}
     */
    async recharge({accountId, cardNo, amount, password}) {

        const {ctx} = this
        const accountInfo = await this.accountProvider.findOne({accountId})
        if (!accountInfo) {
            ctx.error({msg: '账户ID错误'})
        }

        const paymentService = new PaymentService(accountInfo.currencyType)
        //后续需要做安全性检查,限额检查,以及用户认证检查等
        const outsideTradeInfo = await paymentService.recharge({fromCardNo: cardNo, amount, password})
        if (outsideTradeInfo.tradeStatus !== tradeStatus.Pending) {
            console.log('待实现.目前没有同步场景')
        }

        return this._saveAccountPendTrade({
            accountInfo, cardNo, amount,
            outsideTradeId: outsideTradeInfo.tradeNumber,
            tradeStatus: outsideTradeInfo.tradeStatus,
            tradeType: tradeType.Recharge
        })
    }

    /**
     * 转账
     * @param fromAccountInfo
     * @param toAccountInfo
     * @param amount
     */
    async transfer({fromAccountInfo, toAccountInfo, password, amount, remark}) {

        const transferRecordInfo = await this.accountTransferRecordProvider.create({
            transferId: uuid.v4().replace(/-/g, ''),
            fromAccountId: fromAccountInfo.accountId,
            toAccountId: toAccountInfo.accountId,
            operationUserId: this.userId,
            tradePoundage: 0,
            status: 1, amount, remark,
        })
        const {result} = await this._transfer({
            fromAccountInfo, toAccountInfo, password, amount, tradeType: tradeType.Transfer
        })
        transferRecordInfo.status = result ? 2 : 3
        await transferRecordInfo.update({status: transferRecordInfo.status})
        if (result) {
            this.app.emit(accountEvent.accountTransferEvent, {transferRecordInfo, fromAccountInfo, toAccountInfo})
        }
        return transferRecordInfo
    }


    /**
     * 官方给用户tap货币
     * @param currencyType
     * @param cardNo
     * @returns {Promise<void>}
     */
    async tap({currencyType, cardNo}) {

        const {ctx} = this
        if (currencyType !== CurrencyTypeEnum.ETH) {
            ctx.error('目前只支持ETH货币')
        }
        /**
         * TODO:后续需要在业务中自动判断是否tap过.
         */
        const paymentService = new PaymentService(currencyType)

        return paymentService.tap(cardNo)
    }


    /**
     * 账户之间的转账
     * @param fromAccountInfo
     * @param toAccountInfo
     * @param password
     * @param amount
     * @param remark
     * @returns {Promise<any[]>}
     * @private
     */
    async _transfer({fromAccountInfo, toAccountInfo, password, amount, tradeType}) {

        const {app} = this
        await this._checkTransferAuthorization({accountInfo: fromAccountInfo, amount, password, tradeType})
        this._checkTransferAmount({fromAccountInfo, amount})
        this._checkTransferAccountStatus({fromAccountInfo, toAccountInfo})

        const toAccountUpdateCondition = lodash.pick(toAccountInfo, ['accountId', 'signature'])
        const fromAccountUpdateCondition = lodash.pick(fromAccountInfo, ['accountId', 'signature'])

        toAccountInfo.balance = toAccountInfo.balance + amount
        fromAccountInfo.balance = fromAccountInfo.balance - amount
        this._signAccountInfo(fromAccountInfo, toAccountInfo)

        const task1 = this.accountProvider.update(fromAccountUpdateCondition, {
            balance: fromAccountInfo.balance,
            signature: fromAccountInfo.signature
        })
        const task2 = this.accountProvider.update(toAccountUpdateCondition, {
            balance: toAccountInfo.balance,
            signature: toAccountInfo.signature
        })

        return Promise.all([task1, task2]).then(([fromResult, toResult]) => {
            const result = fromResult.nModified > 0 && toResult.nModified > 0
            if (!result) {
                app.logger.error("account-transfer-exception", fromAccountInfo, toAccountInfo, {fromResult, toResult})
                return Promise.reject('交易异常')
            }
            return {result, fromAccountInfo, toAccountInfo}
        })
    }

    /**
     * 检查账户余额是否能够完成本次转账
     * @param fromAccountInfo
     * @param amount
     * @private
     */
    _checkTransferAmount({fromAccountInfo, amount}) {

        const {ctx} = this
        const availableAmount = fromAccountInfo.balance - fromAccountInfo.freezeBalance

        if (amount <= 0) {
            ctx.error({msg: '交易金额必须大于0', data: {amount}})
        }
        if (amount > fromAccountInfo.balance) {
            ctx.error({
                msg: '余额不足,不能完成本次转账',
                data: {balance: fromAccountInfo.balance, freezeBalance: fromAccountInfo.freezeBalance}
            })
        }
        if (amount > availableAmount) {
            ctx.error({
                msg: '可用余额不足,不能完成本次转账',
                data: {balance: fromAccountInfo.balance, freezeBalance: fromAccountInfo.freezeBalance}
            })
        }

        return true
    }

    /**
     * 检查交易双方的账户信息
     * @private
     */
    _checkTransferAccountStatus({fromAccountInfo, toAccountInfo}) {

        const {ctx} = this
        if (fromAccountInfo.currencyType !== toAccountInfo.currencyType) {
            ctx.error({msg: `发起方账户与收款方账户币种不一致,无法执行交易操作`})
        }
        if (fromAccountInfo.status !== 1) {
            ctx.error({msg: `发起方账户状态异常,status:${fromAccountInfo.status}`})
        }
        if (toAccountInfo.status !== 1) {
            ctx.error({msg: `收款方账户状态异常,status:${toAccountInfo.status}`})
        }
        if (toAccountInfo.status === 5 || fromAccountInfo.status === 5) {
            ctx.error({msg: `账户正在进行其他交易中,请稍后再试`})
        }
        if (!accountInfoSecurity.accountSignVerify(fromAccountInfo)) {
            ctx.error({msg: '发起方账户数据异常,请联系客服'})
        }
        if (!accountInfoSecurity.accountSignVerify(toAccountInfo)) {
            ctx.error({msg: '收款方账户数据异常,请联系客服'})
        }
        return true
    }

    /**
     * 签名账户信息
     * @param accountInfo
     * @returns {*}
     * @private
     */
    _signAccountInfo(...args) {
        args.length && args.forEach(accountInfo => accountInfoSecurity.accountInfoSignature(accountInfo))
        return args.length > 0
    }

    /**
     * 检查账户交易授权信息
     * @param fromAccountInfo
     * @private
     */
    async _checkTransferAuthorization({accountInfo, amount, password, tradeType, outsideTradeNo}) {

        const {ctx} = this
        const params = {accountInfo, userId: ctx.request.userId, password, amount, tradeType, outsideTradeNo}
        const {authResult, message} = await accountAuthorization.authorization(params)

        if (!authResult) {
            ctx.error({msg: message})
        }
    }

    /**
     * 保存正在处理的外部交易记录
     * @private
     */
    _saveAccountPendTrade({accountInfo, cardNo, amount, outsideTradeId, tradeStatus, tradeType}) {

        const {ctx} = this
        const {userId} = ctx.request
        const {accountId, currencyType} = accountInfo
        const model = {
            accountId, currencyType, amount, userId, outsideTradeId, tradeType, cardNo, tradeStatus
        }

        return this.accountPendTradeProvider.create(model)
    }

    /**
     * 发送支付事件
     * @param fromAccountInfo
     * @param toAccountInfo
     * @param amount
     * @param payOrderId
     * @param remark
     * @private
     */
    _sendAccountPaymentEvent({fromAccountInfo, toAccountInfo, amount, paymentOrderId, remark}) {
        const {app, ctx} = this
        const {userId} = ctx.request
        const accountPaymentEventParams = {
            fromAccountInfo, toAccountInfo, amount, remark, paymentOrderId, userId
        }
        app.emit(accountEvent.accountPaymentEvent, accountPaymentEventParams)
    }
}