const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const IDO = await ethers.getContract("IDO", deployer)
    console.log(`Got contract IDO at ${IDO.address}`)
    console.log("Binding Referrer...")
    const transactionResponse = await IDO.bindReferrer({
        value: " # Replace this: Your Referrer's address # ",
    })
    await transactionResponse.wait()
    console.log("Bound!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
