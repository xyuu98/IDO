const { expect, assert } = require("chai")
const { ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("IDO", () => {
          // 各个测试用例中会用到的变量
          let IDO, MockUSDT, MockCustomToken, deployer, user1, user2

          // 部署合约、获取各个变量
          beforeEach(async () => {
              // 获取所有账户
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              user1 = accounts[1]
              user2 = accounts[2]
              // 部署自定义代币
              const MockCustomTokenContract = await ethers.getContractFactory(
                  "MockCustomToken"
              )
              MockCustomToken = await MockCustomTokenContract.deploy(
                  ethers.utils.parseEther("1000")
              )
              await MockCustomToken.deployed()

              // 部署MockUSDT
              const MockUSDTContract = await ethers.getContractFactory(
                  "MockUSDT"
              )
              MockUSDT = await MockUSDTContract.deploy()
              await MockUSDT.deployed()

              // 部署IDO合约
              const IDOContract = await ethers.getContractFactory("IDO")
              IDO = await IDOContract.deploy(
                  ethers.utils.parseEther("100"), // 总额度
                  ethers.utils.parseEther("0.1"), // 单价
                  Math.floor(Date.now() / 1000) + 3600, // 结束时间（1小时后）
                  MockUSDT.address, // MockUSDT地址
                  MockCustomToken.address // 自定义代币地址
              )
              await IDO.deployed()

              //设定设定初始账号
              await IDO.setFirstUser()
              //   assert.equal(IDO.participant.length, 1)
          })
          describe("1. setEndTime", () => {
              it("Should be error if set time is earlier than now", async () => {
                  const newTime = Math.floor(Date.now() / 1000) - 3600
                  await expect(IDO.setEndTime(newTime)).to.be.reverted
              })
              it("Should be suc if set time is later than now or same", async () => {
                  const newTime = Math.floor(Date.now() / 1000) + 3600
                  assert.equal(
                      await IDO.setEndTime(newTime).toString(),
                      await IDO.getEndTime().toString()
                  )
              })
          })
          describe("2. setFirstUser", () => {
              it("Should set the first participant[0] is addressToParticipant[msg.sender]", async () => {
                  assert.equal(
                      await IDO.getInfoViaAddress(deployer.address)
                          .firstReferrerAddress,
                      await IDO.getInfoViaIndex(0).firstReferrerAddress
                  )
              })
              it("Should firstReferrerAddress be same as secondReferrerAddress", async () => {
                  assert.equal(
                      await IDO.getInfoViaAddress(deployer.address)
                          .firstReferrerAddress,
                      await IDO.getInfoViaIndex(0).secondReferrerAddress
                  )
              })
              it("Should ido state be same", async () => {
                  assert.equal(
                      await IDO.getInfoViaAddress(deployer.address).ido,
                      await IDO.getInfoViaIndex(0).ido
                  )
              })
              it("Should token amount  be same", async () => {
                  assert.equal(
                      await IDO.getInfoViaAddress(deployer.address).tokenAmount,
                      await IDO.getInfoViaIndex(0).tokenAmount
                  )
              })
              it("Should withdrawal state  be same", async () => {
                  assert.equal(
                      await IDO.getInfoViaAddress(deployer.address).withdrawal,
                      await IDO.getInfoViaIndex(0).withdrawal
                  )
              })
          })
          describe("3. bindReferrer", () => {
              it("_referrerAddress can't be address(0)", async () => {
                  await expect(IDO.bindReferrer(0)).to.be.reverted
              })
              it("caller can't have firstReferrer", async () => {
                  await expect(IDO.bindReferrer(deployer.address)).to.be
                      .reverted
              })
              //   it("participant.length should be 1", async () => {
              //       assert.equal(await IDO.participant.length, 1)
              //   })
              it("_referrerAddress should have firstReferrer", async () => {
                  IDO = await IDO.connect(user1)
                  await expect(IDO.bindReferrer(user2.address)).to.be.reverted
              })
              //   it("could bind suc", async () => {
              //       IDO = await IDO.connect(user1)
              //       await IDO.bindReferrer(deployer.address)
              //       assert.equal(
              //           await IDO.getInfoViaAddress(deployer.address)
              //               .firstReferrerAddress,
              //           await IDO.getInfoViaIndex(1).firstReferrerAddress
              //       )
              //   })
          })
      })
