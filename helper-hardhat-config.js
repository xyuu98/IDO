const { ethers } = require("hardhat")

const networkConfig = {
    31337: {
        name: "localhost",
        totalAmount: ethers.utils.parseEther("100000"),
        limitedAmount: ethers.utils.parseEther("1000"),
        price: ethers.utils.parseEther("0.1"),
        endTime: "1682784000",
        initialSupply: ethers.utils.parseEther("100000"),
    },
    11155111: {
        name: "sepolia",
        totalAmount: ethers.utils.parseEther("100000"),
        limitedAmount: ethers.utils.parseEther("1000"),
        price: ethers.utils.parseEther("0.1"),
        endTime: "1682784000",
        usdtAddress: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        initialSupply: ethers.utils.parseEther("100000"),
    },
    1: {
        name: "ethereum",
    },
    97: {
        name: "bsctest",
        totalAmount: ethers.utils.parseEther("100000"),
        limitedAmount: ethers.utils.parseEther("1000"),
        price: ethers.utils.parseEther("0.1"),
        endTime: "1682784000",
        usdtAddress: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
        initialSupply: ethers.utils.parseEther("100000"),
    },
    56: {
        name: "bsc",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
