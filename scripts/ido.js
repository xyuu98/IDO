const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const IDO = await ethers.getContract("IDO", deployer)
    console.log(`Got contract IDO at ${IDO.address}`)
    console.log("IDO ing...")
    const transactionResponse = await IDO.ido({
        value: ethers.utils.parseEther("100"), //repalce this usdt amount
    })
    await transactionResponse.wait()
    console.log("IDO suc!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
