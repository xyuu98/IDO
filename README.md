# Hardhat IDO

-   [Hardhat IDO](#hardhat-ido)
-   [Getting Started](#getting-started)
    -   [Requirements](#requirements)
    -   [Quickstart](#quickstart)
-   [Usage](#usage)
    -   [Testing](#testing)
        -   [Test Coverage](#test-coverage)
-   [Deployment to a testnet or mainnet](#deployment-to-a-testnet-or-mainnet)
    -   [Scripts](#scripts)
    -   [Estimate gas](#estimate-gas)
        -   [Estimate gas cost in USD](#estimate-gas-cost-in-usd)
    -   [Verify on etherscan](#verify)
-   [Linting](#linting)
-   [Formatting](#formatting)
-   [Thank you!](#thank-you)

# Getting Started

## Requirements

-   [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
    -   You'll know you did it right if you can run `git --version` and you see a response like `git version x.x.x`
-   [Nodejs](https://nodejs.org/en/)
    -   You'll know you've installed nodejs right if you can run:
        -   `node --version` and get an ouput like: `vx.x.x`
-   [Yarn](https://yarnpkg.com/getting-started/install) instead of `npm`
    -   You'll know you've installed yarn right if you can run:
        -   `yarn --version` and get an output like: `x.x.x`
        -   You might need to [install it with `npm`](https://classic.yarnpkg.com/lang/en/docs/install/) or `corepack`

## Quickstart

```
git clone https://github.com/xyuu98/IDO.git
cd IDO
yarn
```

# Usage

Deploy:

```
yarn hardhat deploy
```

## Testing

```
yarn hardhat test
```

### Test Coverage

```
yarn hardhat coverage
```

# Deployment to a testnet or mainnet

1. Setup environment variables

You'll want to set your `ChainName_RPC_URL` and `PRIVATE_KEY` as environment variables. You can add them to a `.env` file, similar to what you see in `.env.example`.

-   `PRIVATE_KEY`: The private key of your account (like from [metamask](https://metamask.io/)). **NOTE:** FOR DEVELOPMENT, PLEASE USE A KEY THAT DOESN'T HAVE ANY REAL FUNDS ASSOCIATED WITH IT.
    -   You can [learn how to export it here](https://support.metamask.io/hc/en-us/articles/360015289632-How-to-Export-an-Account-Private-Key).
-   `ChainName_RPC_URL`: This is url of the testnet node you're working with. You can get setup with one for free from [Alchemy](https://www.alchemy.com/)

2. Get testnet BNB

Head over to [BNB-Smart-Chain Faucet](https://testnet.bnbchain.org/faucet-smart) and get some tesnet BNB. You should see the BNB show up in your metamask.

3. Deploy

```
yarn hardhat deploy --network bsctest
```

## Scripts

After deploy to a testnet or local net, you can run the scripts.

```
yarn hardhat run scripts/bindReferrer.js
```

or

```
yarn hardhat run scripts/ido.js
```

or

```
yarn hardhat run scripts/tokenWithdraw.js
```

## Estimate gas

You can estimate how much gas things cost by running:

```
yarn hardhat test
```

And you'll see and output file called `gas-report.txt`

### Estimate gas cost in USD

To get a USD estimation of gas cost, you'll need a `COINMARKETCAP_API_KEY` environment variable. You can get one for free from [CoinMarketCap](https://pro.coinmarketcap.com/signup).

Then, uncomment the line `coinmarketcap: COINMARKETCAP_API_KEY,` in `hardhat.config.js` to get the USD estimation. Just note, everytime you run your tests it will use an API call, so it might make sense to have using coinmarketcap disabled until you need it. You can disable it by just commenting the line back out.

## Verify

If you deploy to a testnet or mainnet, you can verify it if you get an [API Key](https://etherscan.io/myapikey) from Etherscan and set it as an environemnt variable named `ETHERSCAN_API_KEY` or `BSCSCAN_API_KEY`. You can pop it into your `.env` file as seen in the `.env.example`.

In it's current state, if you have your api key set, it will auto verify sepolia contracts!

However, you can manual verify with:

```
yarn hardhat verify --constructor-args arguments.js DEPLOYED_CONTRACT_ADDRESS
```

# Linting

`solhint` installation: [Documentation](https://protofire.github.io/solhint/#installation)

To check linting / code formatting:

```
yarn lint
```

or, to fix:

```
yarn lint:fix
```

# Formatting

```
yarn format
```

# Thank you!

If you appreciated this, feel free to follow me or donate!

ETH/Polygon/BSC/etc Address: 0xc45b0D6c9d184e8630f94C5Ee43BF765B5b4Aee9
