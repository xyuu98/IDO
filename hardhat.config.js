require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
const BSC_TEST_RPC_URL = process.env.BSC_TEST_RPC_URL
const BSC_RPC_URL = process.env.BSC_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY

module.exports = {
    solidity: {
        compilers: [{ version: "0.8.7" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        ethereum: {
            url: ETHEREUM_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 56,
            blockConfirmations: 6,
        },
        bsctest: {
            url: BSC_TEST_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 97,
            blockConfirmations: 6,
        },
        bsc: {
            url: BSC_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 56,
            blockConfirmations: 6,
        },
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        token: "ETH",
        coinmarkertcap: COINMARKETCAP_API_KEY,
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
        customChains: [
            {
                network: "sepolia",
                chainId: 11155111,
                urls: {
                    apiURL: "http://api-sepolia.etherscan.io/api",
                    browserURL: "https://sepolia.etherscan.io",
                },
            },
            {
                network: "ethereum",
                chainId: 1,
                urls: {
                    apiURL: "http://api-sepolia.etherscan.io/api",
                    browserURL: "https://sepolia.etherscan.io",
                },
            },
        ],
    },
    bscscan: {
        apiKey: BSCSCAN_API_KEY,
        customChains: [
            {
                network: "bsctest",
                chainId: 97,
                urls: {
                    apiURL: "https://api-testnet.bscscan.com/",
                    browserURL: "https://testnet.bscscan.com/",
                },
            },
            {
                network: "bsc",
                chainId: 56,
                urls: {
                    apiURL: "https://api.bscscan.com/",
                    browserURL: "https://bscscan.com/",
                },
            },
        ],
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        user: {
            default: 1,
        },
    },
    mocha: {
        timeout: 500000,
    },
}
