const { expect, assert } = require("chai")
const { ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("IDO unit test", () => {
          // 各个测试用例中会用到的变量
          let IDO, MockUSDT, MockCustomToken, deployer, user1, user2, user3
          // 部署合约、获取各个变量
          beforeEach(async () => {
              // 获取所有账户
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              user1 = accounts[1]
              user2 = accounts[2]
              user3 = accounts[3]
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
                  ethers.utils.parseEther("5000"), // 总额度
                  ethers.utils.parseEther("0.1"), // 单价
                  Math.floor(Date.now() / 1000) + 3600, // 结束时间（1小时后）
                  MockUSDT.address, // MockUSDT地址
                  MockCustomToken.address, // 自定义代币地址
                  deployer.address //资金地址, 假设为合约部署者
              )
              await IDO.deployed()
              //设定设定初始账号
              await IDO.setFirstUser()
          })
          describe("0. constructor", () => {
              it("TOTALAMOUNT should be 100", async () => {
                  assert.equal(
                      (await IDO.getTotalAmount()).toString(),
                      ethers.utils.parseEther("5000")
                  )
              })
              it("IDOPRICE should be 0.1", async () => {
                  assert.equal(
                      (await IDO.getIdoPrice()).toString(),
                      ethers.utils.parseEther("0.1")
                  )
              })
              it("endTime should be now + 1h", async () => {
                  assert.equal(
                      await IDO.getEndTime(),
                      Math.floor(Date.now() / 1000) + 3600
                  )
              })
              it("fundAddress should be deployer address", async () => {
                  assert.equal(
                      (await IDO.getFundAddress()).toString(),
                      deployer.address.toString()
                  )
              })
              it("MockCustomToken address should be right", async () => {
                  assert.equal(
                      await IDO.getTokenAddress(),
                      MockCustomToken.address
                  )
              })
              it("participants length should be 1", async () => {
                  assert.equal(await IDO.getLength(), 1)
              })
          })
          describe("1. setEndTime", () => {
              it("only owner can call", async () => {
                  IDO = await IDO.connect(user1)
                  const newTime = Math.floor(Date.now() / 1000) + 3600
                  await expect(IDO.setEndTime(newTime)).to.be.reverted
              })
              //   it("Should be error if set time is earlier than now", async () => {
              //       const newTime = Math.floor(Date.now() / 1000) - 3600
              //       await expect(IDO.setEndTime(newTime)).to.be.reverted
              //   })
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
                  const a = (
                      await IDO.getInfoViaAddress(deployer.address)
                  ).toString()
                  const b = (await IDO.getInfoViaIndex(0)).toString()
                  assert.equal(a, b)
                  //   console.log(a)
                  //   console.log(b)
              })
              it("participant[0] first ref is deployer address", async () => {
                  const a = deployer.address.toString()
                  const b = (
                      await IDO.getInfoViaIndex(0)
                  ).firstReferrerAddress.toString()
                  assert.equal(a, b)
                  //   console.log(a)
                  //   console.log(b)
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
              it("_referrerAddress should have firstReferrer", async () => {
                  IDO = await IDO.connect(user1)
                  await expect(IDO.bindReferrer(user2.address)).to.be.reverted
              })
              it("could bind suc && user2's first ref is user1", async () => {
                  IDO = await IDO.connect(user1)
                  await IDO.bindReferrer(deployer.address)
                  IDO = await IDO.connect(user2)
                  await IDO.bindReferrer(user1.address)
                  const a = user1.address.toString()
                  const b = (
                      await IDO.getInfoViaIndex(2)
                  ).firstReferrerAddress.toString()
                  assert.equal(a, b)
                  //   console.log(a)
                  //   console.log(b)
                  //   console.log((await IDO.getLength()).toString())
              })
              it("could bind suc && user2's second ref is deployer", async () => {
                  IDO = await IDO.connect(user1)
                  await IDO.bindReferrer(deployer.address)
                  IDO = await IDO.connect(user2)
                  await IDO.bindReferrer(user1.address)
                  const a = deployer.address.toString()
                  const b = (
                      await IDO.getInfoViaIndex(2)
                  ).secondReferrerAddress.toString()
                  assert.equal(a, b)
                  //   console.log(a)
                  //   console.log(b)
                  //   console.log((await IDO.getLength()).toString())
              })
              it("could bind suc && mapping is right", async () => {
                  IDO = await IDO.connect(user1)
                  await IDO.bindReferrer(deployer.address)
                  IDO = await IDO.connect(user2)
                  await IDO.bindReferrer(user1.address)
                  const a = (
                      await IDO.getInfoViaAddress(user2.address)
                  ).toString()
                  const b = (await IDO.getInfoViaIndex(2)).toString()
                  assert.equal(a, b)
                  //   console.log(a)
                  //   console.log(b)
                  //   console.log((await IDO.getLength()).toString())
              })
          })
          describe("4. ido", () => {
              beforeEach(async () => {
                  //给账户发放usdt
                  MockUSDT = await MockUSDT.connect(deployer)
                  const initialBalance = ethers.utils.parseEther("1000")
                  await MockUSDT.transfer(user1.address, initialBalance)
                  await MockUSDT.transfer(user2.address, initialBalance)
                  await MockUSDT.transfer(user3.address, initialBalance)
                  //approve合约使用用户的usdt
                  MockUSDT = await MockUSDT.connect(user1)
                  await MockUSDT.approve(IDO.address, initialBalance)
                  MockUSDT = await MockUSDT.connect(user2)
                  await MockUSDT.approve(IDO.address, initialBalance)
                  MockUSDT = await MockUSDT.connect(user3)
                  await MockUSDT.approve(IDO.address, initialBalance)
                  //给合约发customToken
                  MockCustomToken = await MockCustomToken.connect(deployer)
                  const initialBalance2 = ethers.utils.parseEther("5000")
                  await MockCustomToken.transfer(
                      IDO.address,
                      ethers.utils.parseEther("5000")
                  )
                  //approve合约使用用户的custom token
                  MockCustomToken = await MockCustomToken.connect(user1)
                  await MockCustomToken.approve(IDO.address, initialBalance2)
                  MockCustomToken = await MockCustomToken.connect(user2)
                  await MockCustomToken.approve(IDO.address, initialBalance2)
                  MockCustomToken = await MockCustomToken.connect(user3)
                  await MockCustomToken.approve(IDO.address, initialBalance2)
                  //给user1和user2绑定上级
                  IDO = await IDO.connect(user1)
                  await IDO.bindReferrer(deployer.address)
                  IDO = await IDO.connect(user2)
                  await IDO.bindReferrer(user1.address)
              })
              it("tranfser mock usdt suc", async () => {
                  const a = (await MockUSDT.balanceOf(user1.address)).toString()
                  const b = (await MockUSDT.balanceOf(user2.address)).toString()
                  const c = (await MockUSDT.balanceOf(user3.address)).toString()
                  assert.equal(a, ethers.utils.parseEther("1000"))
                  assert.equal(b, ethers.utils.parseEther("1000"))
                  assert.equal(c, ethers.utils.parseEther("1000"))
              })
              it("tranfser mock custom token suc", async () => {
                  const a = (
                      await MockCustomToken.balanceOf(IDO.address)
                  ).toString()
                  assert.equal(a, ethers.utils.parseEther("5000"))
              })
              it("can't ido if users dont bind", async () => {
                  IDO = await IDO.connect(user3)
                  const idoAmount = ethers.utils.parseEther("100")
                  //   await IDO.ido(idoAmount)
                  await expect(IDO.ido(idoAmount)).to.be.revertedWith("NotBind")
              })
              it("can't ido if ended", async () => {
                  IDO = await IDO.connect(deployer)
                  const newTime = Math.floor(Date.now() / 1000) - 3600
                  const idoAmount = ethers.utils.parseEther("100")
                  await IDO.setEndTime(newTime)
                  //   await IDO.ido(idoAmount)
                  await expect(IDO.ido(idoAmount)).to.be.revertedWith("Ended")
              })
              it("can't ido if amount != 100,300,500", async () => {
                  const idoAmount = ethers.utils.parseEther("10")
                  await expect(IDO.ido(idoAmount)).to.be.revertedWith(
                      "AmountError"
                  )
              })
              it("can't ido if reach total amount", async () => {
                  const idoAmount = ethers.utils.parseEther("500")
                  await IDO.ido(idoAmount)
                  IDO = await IDO.connect(user1)
                  await expect(IDO.ido(idoAmount)).to.be.revertedWith(
                      "InsufficientAmount"
                  )
              })
              it("users can only ido once", async () => {
                  const idoAmount = ethers.utils.parseEther("100")
                  await IDO.ido(idoAmount)
                  await expect(IDO.ido(idoAmount)).to.be.revertedWith(
                      "AlreadyIDO"
                  )
              })
              it("after ido suc user sent usdt amount is right", async () => {
                  //user3绑定user2
                  IDO = await IDO.connect(user3)
                  await IDO.bindReferrer(user2.address)
                  //user3 ido，上级是user2，上上级是user1
                  const idoAmount = ethers.utils.parseEther("100")
                  await IDO.ido(idoAmount)
                  const user1Balance = (
                      await MockUSDT.balanceOf(user1.address)
                  ).toString()
                  const user2Balance = (
                      await MockUSDT.balanceOf(user2.address)
                  ).toString()
                  const user3Balance = (
                      await MockUSDT.balanceOf(user3.address)
                  ).toString()
                  const fundBalance = (
                      await MockUSDT.balanceOf(deployer.address)
                  ).toString()
                  assert.equal(user1Balance, ethers.utils.parseEther("1002"))
                  assert.equal(user2Balance, ethers.utils.parseEther("1003"))
                  assert.equal(user3Balance, ethers.utils.parseEther("900"))
                  assert.equal(fundBalance, ethers.utils.parseEther("7095"))
                  //   console.log(user1Balance)
                  //   console.log(user2Balance)
                  //   console.log(user3Balance)
                  //   console.log(fundBalance)
              })
              it("after ido suc users info changed token amount", async () => {
                  const idoAmount = ethers.utils.parseEther("100")
                  await IDO.ido(idoAmount)
                  const changedAmount = (
                      await IDO.getInfoViaAddress(user2.address)
                  ).tokenAmount.toString()
                  assert.equal(changedAmount, idoAmount.mul(10).toString())
              })
              it("after ido suc users info changed ido bool", async () => {
                  const idoAmount = ethers.utils.parseEther("100")
                  await IDO.ido(idoAmount)
                  const changedBoolIdo = (
                      await IDO.getInfoViaAddress(user2.address)
                  ).ido
                  assert.equal(changedBoolIdo, true)
              })
              it("after ido suc users info changed participantNumber", async () => {
                  const idoAmount = ethers.utils.parseEther("100")
                  await IDO.ido(idoAmount)
                  const participantNumber = await IDO.getParticipantNumber()
                  assert.equal(participantNumber, 1)
              })
              it("after ido suc users info changed purchasedAmount", async () => {
                  const idoAmount = ethers.utils.parseEther("100")
                  await IDO.ido(idoAmount)
                  const purchasedAmount = await IDO.getPurchasedAmount()
                  assert.equal(purchasedAmount.toString(), idoAmount.toString())
              })
          })
          describe("5. withdraw", () => {})
      })
