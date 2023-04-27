const { expect, assert } = require("chai")
const { ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("IDO Staging Tests", function () {
          let deployer, user1
          const idoAmount = ethers.utils.parseEther("100")
          const totalAmount = ethers.utils.parseEther("5000")
          const price = ethers.utils.parseEther("0.1")
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              user1 = accounts[1]
              // 部署自定义代币
              const MockCustomTokenContract = await ethers.getContractFactory(
                  "MockCustomToken"
              )
              MockCustomToken = await MockCustomTokenContract.deploy(
                  ethers.utils.parseEther("10000")
              )
              await MockCustomToken.deployed()

              // 部署MockUSDT
              const MockUSDTContract = await ethers.getContractFactory(
                  "MockUSDT"
              )
              MockUSDT = await MockUSDTContract.deploy(
                  ethers.utils.parseEther("10000")
              )
              await MockUSDT.deployed()

              // 部署IDO合约
              const IDOContract = await ethers.getContractFactory("IDO")
              IDO = await IDOContract.deploy(
                  totalAmount, // 总额度
                  price, // 单价
                  Math.floor(Date.now() / 1000) + 3600, // 结束时间（1小时后）
                  MockUSDT.address, // MockUSDT地址
                  MockCustomToken.address, // 自定义代币地址
                  deployer.address //资金地址, 假设为合约部署者
              )

              //设定初始账户
              await IDO.setFirstUser()
          })
          it("allows user to bindReferrer and ido, when ido ended user can withdraw", async function () {
              //transfer usdt
              MockUSDT = await MockUSDT.connect(deployer)
              const initialBalance = ethers.utils.parseEther("1000")
              const transferUSDTTxResponse = MockUSDT.transfer(
                  user1.address,
                  initialBalance
              )
              await transferUSDTTxResponse.wait(1)
              //approve usdt
              MockUSDT = await MockUSDT.connect(user1)
              const tapproveUSDTTxResponse = MockUSDT.approve(
                  IDO.address,
                  initialBalance
              )
              await tapproveUSDTTxResponse.wait(1)
              //transfer customToken
              MockCustomToken = await MockCustomToken.connect(deployer)
              const initialBalance2 = ethers.utils.parseEther("5000")
              await MockCustomToken.transfer(IDO.address, initialBalance2)
              //bind
              IDO = await IDO.connect(user1)
              const bindTxResponse = await IDO.bindReferrer(deployer.address)
              await bindTxResponse.wait(1)
              assert.equal(
                  (
                      await IDO.getInfoViaAddress(user1.address)
                  ).firstReferrerAddress.toString(),
                  deployer.address.toString()
              )
              //ido
              const idoTxResponse = await IDO.ido(idoAmount)
              await idoTxResponse.wait(1)
              assert.equal(
                  (
                      await IDO.getInfoViaAddress(user1.address)
                  ).tokenAmount.toString(),
                  ((idoAmount / price) * 1e18).toString()
              )
              //withdraw
              const withdrawTxResponse = await IDO.tokenWithdraw()
              await withdrawTxResponse.wait(1)
              const customTokenAmount = (
                  await MockCustomToken.balanceOf(deployer.address)
              ).toString()
              assert.equal(
                  customTokenAmount,
                  ((idoAmount / price) * 1e18).toString()
              )
          })
      })
