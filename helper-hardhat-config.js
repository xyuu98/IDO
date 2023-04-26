const { ethers } = require("hardhat")

const networkConfig = {
    31337: {
        name: "localhost",
        totalAmount: ethers.utils.parseEther("100000"),
        price: ethers.utils.parseEther("0.1"),
        endTime: "1682784000", //2023.04.30
        initialSupply: ethers.utils.parseEther("100000"),
        fundAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", //hardhat account[0]
    },
    11155111: {
        name: "sepolia",
        totalAmount: ethers.utils.parseEther("100000"),
        price: ethers.utils.parseEther("0.1"),
        endTime: "1682784000",
        usdtAddress: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        initialSupply: ethers.utils.parseEther("100000"),
        fundAddress: "0x45821AF32F0368fEeb7686c4CC10B7215E00Ab04",
    },
    1: {
        name: "ethereum",
        totalAmount: "",
        price: "",
        endTime: "",
        usdtAddress: "",
        initialSupply: "",
        fundAddress: "",
    },
    97: {
        name: "bsctest",
        totalAmount: ethers.utils.parseEther("100000"),
        price: ethers.utils.parseEther("0.1"),
        endTime: "1682784000",
        usdtAddress: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
        initialSupply: ethers.utils.parseEther("100000"),
        fundAddress: "0x45821AF32F0368fEeb7686c4CC10B7215E00Ab04",
    },
    56: {
        name: "bsc",
        totalAmount: "",
        price: "",
        endTime: "",
        usdtAddress: "",
        initialSupply: "",
        fundAddress: "",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
