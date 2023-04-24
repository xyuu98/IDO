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
        log("Deploying MockCustomToken and waiting for confirmations...")
        await deploy("MockCustomToken", {
            from: deployer,
            args: [initialSupply],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        const MockCustomToken = await ethers.getContract(
            "MockCustomToken",
            deployer
        )
        log(`MockCustomToken deployed at ${MockCustomToken.address}`)

        // let tokenAddress = networkConfig[chainId]["tokenAddress"]
        let totalAmount = networkConfig[chainId]["totalAmount"]
        // let limitedAmount = networkConfig[chainId]["limitedAmount"]
        let price = networkConfig[chainId]["price"]
        let endTime = networkConfig[chainId]["endTime"]
        let usdtAddress = networkConfig[chainId]["usdtAddress"]
        let tokenAddress = MockCustomToken.address

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

        // //Transfer token to IDO contract
        // log("----------------------------------------------------")
        // log("Transfer token to IDO contract...")
        // await MockCustomToken.transfer(IDO.address, totalAmount)
        // log("Transfer MockCustomToken succssed!")
    } else {
        log("Deploying MockUSDT and waiting for confirmations...")
        await deploy("MockUSDT", {
            from: deployer,
            args: [],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        const MockUSDT = await ethers.getContract("MockUSDT", deployer)
        log(`MockUSDT deployed at ${MockUSDT.address}`)
        log("----------------------------------------------------")
        let MockUSDTAddress = MockUSDT.address

        let initialSupply = networkConfig[chainId]["initialSupply"]
        log("Deploying MockCustomToken and waiting for confirmations...")
        await deploy("MockCustomToken", {
            from: deployer,
            args: [initialSupply],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        const MockCustomToken = await ethers.getContract(
            "MockCustomToken",
            deployer
        )
        log(`MockCustomToken deployed at ${MockCustomToken.address}`)
        let totalAmount = networkConfig[chainId]["totalAmount"]
        // let limitedAmount = networkConfig[chainId]["limitedAmount"]
        let price = networkConfig[chainId]["price"]
        let endTime = networkConfig[chainId]["endTime"]
        let tokenAddress = MockCustomToken.address

        log("----------------------------------------------------")
        log("Deploying IDO and waiting for confirmations...")
        const IDO = await deploy("IDO", {
            from: deployer,
            args: [
                totalAmount,
                /*limitedAmount,*/
                price,
                endTime,
                MockUSDTAddress,
                tokenAddress,
            ],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        log(`IDO deployed at ${IDO.address}`)

        // log("----------------------------------------------------")
        // log("Transfer token to IDO contract...")
        // //Transfer token to IDO contract
        // await MockCustomToken.transfer(IDO.address, totalAmount)
        // log("Transfer MockCustomToken succssed!")
        // log("----------------------------------------------------")
        // log("Transfer MockUSDT to IDO contract...")
        // //Transfer MockUSDT to IDO contract
        // await MockUSDT.transfer(IDO.address, initialSupply)
        // log("Transfer MockUSDT succssed!")
    }

    //Verify
    if (
        !developmentChains.includes(network.name) &&
        (chainId == 11155111 || chainId == 1) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(MockCustomToken.address, [initialSupply])
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
        await verify(MockCustomToken.address, [initialSupply])
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
