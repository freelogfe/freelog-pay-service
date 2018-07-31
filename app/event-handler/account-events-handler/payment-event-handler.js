'use strict'

const queue = require('async/queue')
const {tradeType, accountEvent} = require('../../enum/index')

module.exports = class AccountPaymentEventHandler {

    constructor(app) {
        this.app = app
        this.paymentOrderProvider = app.dal.paymentOrderProvider
        this.queue = queue(this.accountPaymentEventHandler.bind(this), 3)
    }

    /**
     * 事件处理函数
     */
    handler() {
        this.queue.push(...arguments, this.callback.bind(this))
    }

    /**
     * 账户金额变动事件处理函数
     * @param accountInfo
     */
    async accountPaymentEventHandler(args) {

        const {fromAccountInfo, toAccountInfo, amount, userId, paymentOrderId, remark} = args
        const paymentOrderInfo = await this.paymentOrderProvider.findOne({paymentOrderId})
        if (!paymentOrderInfo || paymentOrderInfo.status === 0) {
            console.log('错误的事件触发,请排查系统BUG')
            return
        }

        this.sendAccountAmountChangedEvent({
            amount, userId, remark,
            accountInfo: toAccountInfo,
            correlativeTradeId: paymentOrderId,
            correlativeAccountId: fromAccountInfo.accountId,
        })
        this.sendAccountAmountChangedEvent({
            userId, remark,
            accountInfo: fromAccountInfo,
            amount: amount * -1,
            correlativeTradeId: paymentOrderId,
            correlativeAccountId: toAccountInfo.accountId,
        })

        //此处还需要发送消息给对应的订单方,例如合同订单

        console.log(`支付成功,订单号:${paymentOrderId},外部订单号:${paymentOrderInfo.outsideTradeNo}`)
    }

    /**
     * 发送账户金额变更事件
     * @param accountInfo
     * @param amount
     */
    sendAccountAmountChangedEvent({accountInfo, amount, userId, remark, correlativeAccountId, correlativeTradeId}) {

        const {accountId, balance} = accountInfo
        const accountAmountChangedEventParams = {
            amount, userId, accountId,
            correlativeAccountId, correlativeTradeId,
            beforeBalance: accountInfo.balance + amount * -1,
            remark: remark || '转账',
            tradePoundage: 0,
            tradeType: tradeType.Payment,
            afterBalance: balance
        }

        this.app.emit(accountEvent.accountAmountChangedEvent, accountAmountChangedEventParams)
    }

    /**
     * 错误处理
     * @param err
     */
    callback(error) {
        if (error instanceof Error) {
            console.log("payment-event-handler", '事件执行异常', error)
            this.app.logger.error("payment-event-handler", '事件执行异常', error)
        }
    }
}