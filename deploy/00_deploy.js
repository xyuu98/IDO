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
        log("Deploying MockCustomToken and waiting for confirmations...")
        let initialSupply = networkConfig[chainId]["initialSupply"]
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
        let tokenAddress = MockCustomToken.address
        log(`MockCustomToken deployed at ${MockCustomToken.address}`)

        let totalAmount = networkConfig[chainId]["totalAmount"]
        let price = networkConfig[chainId]["price"]
        let endTime = networkConfig[chainId]["endTime"]
        let usdtAddress = networkConfig[chainId]["usdtAddress"]
        let fundAddress = networkConfig[chainId]["fundAddress"]

        log("----------------------------------------------------")
        log("Deploying IDO and waiting for confirmations...")
        const IDO = await deploy("IDO", {
            from: deployer,
            args: [
                totalAmount,
                price,
                endTime,
                usdtAddress,
                tokenAddress,
                fundAddress,
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
        let initialSupply = networkConfig[chainId]["initialSupply"]
        let totalAmount = networkConfig[chainId]["totalAmount"]
        let price = networkConfig[chainId]["price"]
        let endTime = networkConfig[chainId]["endTime"]
        let fundAddress = networkConfig[chainId]["fundAddress"]

        log("Deploying MockUSDT and waiting for confirmations...")
        await deploy("MockUSDT", {
            from: deployer,
            args: [initialSupply],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        const MockUSDT = await ethers.getContract("MockUSDT", deployer)
        let MockUSDTAddress = MockUSDT.address
        log(`MockUSDT deployed at ${MockUSDT.address}`)

        log("----------------------------------------------------")
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
        let tokenAddress = MockCustomToken.address
        log(`MockCustomToken deployed at ${MockCustomToken.address}`)

        log("----------------------------------------------------")
        log("Deploying IDO and waiting for confirmations...")
        const IDO = await deploy("IDO", {
            from: deployer,
            args: [
                totalAmount,
                price,
                endTime,
                MockUSDTAddress,
                tokenAddress,
                fundAddress,
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
        await verify(MockCustomToken.address, [initialSupply])
        await verify(IDO.address, [
            totalAmount,
            price,
            endTime,
            usdtAddress,
            tokenAddress,
            fundAddress,
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
            price,
            endTime,
            usdtAddress,
            tokenAddress,
            fundAddress,
        ])
    }
}

module.exports.tags = ["all", ""]
