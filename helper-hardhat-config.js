const networkConfig = {
    31337: {
        name: "localhost",
        totalAmount: "100000000000000000000",
        limitedAmount: "10000000000000000000",
        price: "100000000000000000",
        endTime: "1682784000",
        initialSupply: "100000000000000000000",
    },
    11155111: {
        name: "sepolia",
        totalAmount: "100000000000000000000",
        limitedAmount: "10000000000000000000",
        price: "100000000000000000",
        endTime: "1682784000",
        usdtAddress: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        initialSupply: "100000000000000000000",
    },
    1: {
        name: "ethereum",
    },
    97: {
        name: "bsctest",
        totalAmount: "100000000000000000000",
        limitedAmount: "10000000000000000000",
        price: "100000000000000000",
        endTime: "1682784000",
        usdtAddress: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
        initialSupply: "100000000000000000000",
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
