const networkConfig = {
    31337: {
        name: "localhost",
    },
    11155111: {
        name: "sepolia",
    },
    1: {
        name: "ethereum",
    },
    97: {
        name: "bsctest",
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
