'use strict'

module.exports = async app => {

    let {ethClient} = app
    let {CoinContract, OfficaialOpsContract, ethContractInfo} = ethClient

    const taskEnums = {
        /**
         * 获取货币符号
         */
        getSymbolTask() {
            return CoinContract.methods.symbol().call(ethClient.adminInfo).then(data => {
                console.log(`CoinContract-symbol:${data}`)
            })
        },

        /**
         * 设置货币合约地址
         */
        setBaseCoinAddressTask() {
            return OfficaialOpsContract.methods.setCoinAddress(ethContractInfo.Coin.address).send({from: ethContractInfo.account.admin}).then(receipt => {
                console.log("设置货币合约地址")
            })
        },

        /**
         * 增发货币(barb)
         */
        mintTokenTask() {
            return OfficaialOpsContract.methods.mintToken(2000000000).send({from: ethContractInfo.account.admin}).then(data => {
                console.log("增发货币")
            })
        },

        /**
         * 获取总发行额度
         */
        getTotalSupplyTask() {
            return CoinContract.methods.totalSupply().call({from: ethContractInfo.account.admin}).then(data => {
                console.log(`CoinContract-totalSupply:${data}`)
            })
        }
    }

    const initTaskChain = [taskEnums.getSymbolTask, taskEnums.setBaseCoinAddressTask, taskEnums.mintTokenTask, taskEnums.getTotalSupplyTask]

    await initTaskChain.reduce((promiseChain, currentPromise) => {
        return promiseChain.then((chainedResult) => {
            return currentPromise(chainedResult).then((res) => res)
        })
    }, Promise.resolve())
}


