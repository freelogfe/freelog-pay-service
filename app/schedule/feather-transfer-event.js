/**
 * 固定间隔时间定时去请求以太坊飞致币交易事件
 * 然后对比交易号,如果是系统需要的交易信息,则处理之
 * **/

'use strict'

const Web3Client = require('../extend/web3/web3-client')
const Subscription = require('egg').Subscription;
const outsideTradeEvent = require('../enum/outside-trade-event')

module.exports = class FeatherTransferEvent extends Subscription {

    static get schedule() {
        return {
            cron: '*/10 * * * * *',  //10秒定时检查一次是否有新的支付事件
            type: 'worker', // 指定一个 worker需要执行
            immediate: true, //立即执行一次
            disable: false
        }
    }

    async subscribe() {

        var latestBlockNumber = 0
        const {dal, logger, config} = this.app
        const {ethTransferBlockNumProvider} = dal
        const latestBlockInfo = await ethTransferBlockNumProvider.getLatestBlockNumber()
        const ethClient = new Web3Client(config)

        if (!latestBlockInfo) {
            await this.initBlockInfo()
        } else {
            latestBlockNumber = latestBlockInfo.blockNumber + 1
        }

        ethClient.CoinContract.getPastEvents('Transfer', {fromBlock: latestBlockNumber}).then(events => {
            events.length && this.app.emit(outsideTradeEvent.featherTransferEvent, events)
        }).catch(error => {
            logger.error(`无法连接到本地eth服务器:${config.ethereum.web3RpcUri}`, error)
        })
    }

    /**
     * 初始化区块同步数据
     * @returns {Promise<void>}
     */
    async initBlockInfo() {

        const {ethTransferBlockNumProvider} = this.app.dal

        return ethTransferBlockNumProvider.initBlockInfo()
    }
}