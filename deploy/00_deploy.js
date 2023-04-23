const { network } = require("hardhat")
const { verify } = require("../utils/verify")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //Deploy
    if (!developmentChains.includes(network.name)) {
        let initialSupply = networkConfig[chainId]["initialSupply"]
        log("Deploying TestToken and waiting for confirmations...")
        const TestToken = await deploy("TestToken", {
            from: deployer,
            args: [initialSupply],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        log(`TestToken deployed at ${TestToken.address}`)
        // let tokenAddress = networkConfig[chainId]["tokenAddress"]
        let totalAmount = networkConfig[chainId]["totalAmount"]
        // let limitedAmount = networkConfig[chainId]["limitedAmount"]
        let price = networkConfig[chainId]["price"]
        let endTime = networkConfig[chainId]["endTime"]
        let usdtAddress = networkConfig[chainId]["usdtAddress"]
        let tokenAddress = TestToken.address

        log("----------------------------------------------------")
        log("Deploying IDO and waiting for confirmations...")
        const IDO = await deploy("IDO", {
            from: deployer,
            args: [
                totalAmount,
                /*limitedAmount,*/
                price,
                endTime,
                usdtAddress,
                tokenAddress,
            ],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        log(`IDO deployed at ${IDO.address}`)
    } else {
        log("Deploying TestToken and waiting for confirmations...")
        const UsdtTest = await deploy("UsdtTest", {
            from: deployer,
            args: [],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        log(`UsdtTest deployed at ${UsdtTest.address}`)
        log("----------------------------------------------------")
        let UsdtTestAddress = UsdtTest.address

        let initialSupply = networkConfig[chainId]["initialSupply"]
        log("Deploying TestToken and waiting for confirmations...")
        const TestToken = await deploy("TestToken", {
            from: deployer,
            args: [initialSupply],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        log(`TestToken deployed at ${TestToken.address}`)
        let totalAmount = networkConfig[chainId]["totalAmount"]
        // let limitedAmount = networkConfig[chainId]["limitedAmount"]
        let price = networkConfig[chainId]["price"]
        let endTime = networkConfig[chainId]["endTime"]
        let tokenAddress = TestToken.address

        log("----------------------------------------------------")
        log("Deploying IDO and waiting for confirmations...")
        const IDO = await deploy("IDO", {
            from: deployer,
            args: [
                totalAmount,
                /*limitedAmount,*/
                price,
                endTime,
                UsdtTestAddress,
                tokenAddress,
            ],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        log(`IDO deployed at ${IDO.address}`)
    }

    //Verify
    if (
        !developmentChains.includes(network.name) &&
        (chainId == 11155111 || chainId == 1) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(TestToken.address, [initialSupply])
        await verify(IDO.address, [
            totalAmount,
            /*limitedAmount,*/
            price,
            endTime,
            usdtAddress,
            tokenAddress,
        ])
    }
    if (
        !developmentChains.includes(network.name) &&
        (chainId == 97 || chainId == 56) &&
        process.env.BSCSCAN_API_KEY
    ) {
        await verify(TestToken.address, [initialSupply])
        await verify(IDO.address, [
            totalAmount,
            /*limitedAmount,*/
            price,
            endTime,
            usdtAddress,
            tokenAddress,
        ])
    }
}

module.exports.tags = ["all", ""]
