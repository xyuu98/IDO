const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const IDO = await ethers.getContract("IDO", deployer)
    console.log(`Got contract IDO at ${IDO.address}`)
    console.log("withdrawing token...")
    const transactionResponse = await IDO.tokenWithdraw()
    await transactionResponse.wait()
    console.log("Got token!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
