// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Declaration.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract IDO is Ownable, ReentrancyGuard {
    //事件：
    event bindSuc(
        address indexed participantself,
        address indexed firstReferrer,
        address indexed secondReferrer
    );
    event idoSuc(address indexed participantself, uint256 amount);
    event withdrawSuc(address indexed participantself, uint256 tokenAmount);
    event ownerWithdraw(uint256 indexed tokenAmount);

    //修饰器：
    //caller不可是合约
    modifier callerIsUser() {
        require(tx.origin == msg.sender, "CallerisNotUser");
        _;
    }
    //必须已绑定上级
    modifier Bound() {
        require(
            addressToParticipant[msg.sender].firstReferrerAddress > address(0),
            "NotBind"
        );
        _;
    }
    //结束无法使用
    modifier NotEnd() {
        require(endTime >= block.timestamp, "Ended");
        _;
    }

    //状态变量：
    //参与者
    Participant[] public participant;
    //用于计算百分数
    using SafeMath for uint256;
    //总额度
    uint256 private immutable TOTALAMOUNT;
    //已购额度
    uint256 private purchasedAmount;
    //单价
    uint256 private immutable IDOPRICE;
    //结束时间
    uint256 private endTime;
    //收款地址
    address private fundAddress;
    //usdt地址
    address private usdtAddress;
    //idoToken地址
    address private customTokenAddress;
    //参与人数
    uint256 private participantNumber;

    //映射：
    //通过钱包地址映射到用户信息
    mapping(address => Participant) addressToParticipant;

    //初始化：
    constructor(
        uint256 _totalAmount,
        uint256 _idoPrice,
        uint256 _endTime,
        address _usdtAddress,
        address _customTokenAddress,
        address _fundAddress
    ) {
        TOTALAMOUNT = _totalAmount;
        IDOPRICE = _idoPrice;
        endTime = _endTime;
        usdtAddress = _usdtAddress;
        customTokenAddress = _customTokenAddress;
        fundAddress = _fundAddress;
    }

    //Write Func：
    //设定结束时间
    function setEndTime(uint256 _newTime) external onlyOwner {
        endTime = _newTime;
    }

    //设定初始账号,用这个地址开始进行推广
    function setFirstUser() external onlyOwner {
        //存入用户信息
        participant.push(
            Participant({
                firstReferrerAddress: msg.sender,
                secondReferrerAddress: msg.sender,
                ido: false,
                tokenAmount: 0,
                withdrawal: false
            })
        );
        //保存映射
        addressToParticipant[msg.sender] = participant[0];
    }

    //绑定(注册)
    function bindReferrer(
        address _referrerAddress
    ) external callerIsUser NotEnd {
        //不可为空地址
        require(_referrerAddress != address(0), "InvalidAddress");
        //caller必须没有绑定过上级, 即只能绑定一次
        require(
            addressToParticipant[msg.sender].firstReferrerAddress <= address(0),
            "AlreadyBound"
        );
        //输入的地址必须有上级
        require(
            addressToParticipant[_referrerAddress].firstReferrerAddress >
                address(0),
            "InvalidAddress"
        );
        //referrer为用户想要绑定上级的实例
        Participant memory referrer = addressToParticipant[_referrerAddress];
        //存入用户信息;绑定一级推荐人; 如果绑定的上级也存在上级，则二级推荐人也会绑定
        participant.push(
            Participant({
                firstReferrerAddress: _referrerAddress,
                secondReferrerAddress: referrer.firstReferrerAddress,
                ido: false,
                tokenAmount: 0,
                withdrawal: false
            })
        );
        //保存映射
        addressToParticipant[msg.sender] = participant[participant.length - 1];
        //事件
        emit bindSuc(
            msg.sender,
            _referrerAddress,
            referrer.firstReferrerAddress
        );
    }

    //ido
    function ido(uint256 amount) external nonReentrant Bound NotEnd {
        //购买后的总已购额度不可超过总额度
        require(
            amount + purchasedAmount <= (TOTALAMOUNT * IDOPRICE) / 1e18,
            "InsufficientAmount"
        );
        // 参与额度必须为100、300、500
        require(
            amount == 100 * 1e18 ||
                amount == 300 * 1e18 ||
                amount == 500 * 1e18,
            "AmountError"
        );
        //赋值用户信息
        Participant memory idoer = addressToParticipant[msg.sender];
        //参与者ido状态必须为false,即一个用户只能参与一次ido
        require(idoer.ido == false, "AlreadyIDO");
        //发送usdt的比例
        uint256 fundAddressAmount = amount.mul(95).div(100);
        uint256 firstReferrerAmount = amount.mul(3).div(100);
        uint256 secondReferrerAmount = amount.mul(2).div(100);
        //一定有一级和二级推荐人，一级奖励3%, 二级奖励2%, 剩余的全部给资金地址
        //实例化
        IERC20 usdt = IERC20(address(usdtAddress));
        require(
            usdt.transferFrom(msg.sender, fundAddress, fundAddressAmount),
            "TransferFailed1"
        );
        require(
            usdt.transferFrom(
                msg.sender,
                idoer.firstReferrerAddress,
                firstReferrerAmount
            ),
            "TransferFailed2"
        );
        require(
            usdt.transferFrom(
                msg.sender,
                idoer.secondReferrerAddress,
                secondReferrerAmount
            ),
            "TransferFailed3"
        );
        //修改用户可提取token的数量
        addressToParticipant[msg.sender].tokenAmount =
            amount.div(IDOPRICE) *
            1e18;
        //修改参与状态, 默认false, true则不可参与
        addressToParticipant[msg.sender].ido = true;
        //记录参与人数+1
        participantNumber += 1;
        //已购金额+amount
        purchasedAmount += amount;
        //事件
        emit idoSuc(msg.sender, amount);
    }

    //用户提取token
    function tokenWithdraw() external nonReentrant Bound {
        //ido结束才可提取
        require(endTime <= block.timestamp, "NotEnded");
        //赋值用户信息
        Participant memory idoer = addressToParticipant[msg.sender];
        //要求用户参与ido
        require(idoer.ido == true, "NotIDO");
        //要求用户未提取过token
        require(idoer.withdrawal == false, "AlreadyWithdraw");
        //tokenAmount不为0
        require(idoer.tokenAmount != 0, "InsufficientBalance");
        //修改用户token数量信息
        addressToParticipant[msg.sender].tokenAmount = 0;
        //修改用户提取状态信息
        addressToParticipant[msg.sender].withdrawal = true;
        //实例化
        IERC20 customToken = IERC20(address(customTokenAddress));
        //发送token给用户
        require(
            customToken.transfer(msg.sender, idoer.tokenAmount),
            "TransferFailed4"
        );
        //事件
        emit withdrawSuc(msg.sender, idoer.tokenAmount);
    }

    //提取合约剩余token至资金地址
    function withdraw() external onlyOwner {
        //实例化
        IERC20 customToken = IERC20(address(customTokenAddress));
        require(
            customToken.balanceOf(address(this)) != 0,
            "InsufficientBalance"
        );
        customToken.transfer(fundAddress, customToken.balanceOf(address(this)));
        emit ownerWithdraw(customToken.balanceOf(address(this)));
    }

    //Read Func：
    //获取总额度
    function getTotalAmount() public view returns (uint256) {
        return TOTALAMOUNT;
    }

    //获取已购买额度
    function getPurchasedAmount() public view returns (uint256) {
        return purchasedAmount;
    }

    //获取单价
    function getIdoPrice() public view returns (uint256) {
        return IDOPRICE;
    }

    //获取参与人数
    function getParticipantNumber() public view returns (uint256) {
        return participantNumber;
    }

    //获取用户数组长度
    function getLength() public view returns (uint256) {
        return participant.length;
    }

    //通过用户钱包地址获取用户信息
    function getInfoViaAddress(
        address _participant
    ) public view returns (Participant memory) {
        return addressToParticipant[_participant];
    }

    //通过用户钱包地址获取用户信息
    function getInfoViaIndex(
        uint256 _index
    ) public view returns (Participant memory) {
        return participant[_index];
    }

    //获取截止时间
    function getEndTime() public view returns (uint256) {
        return endTime;
    }

    //获取ido代币地址
    function getTokenAddress() public view returns (address) {
        return customTokenAddress;
    }

    //获取ido代币地址
    function getFundAddress() public view returns (address) {
        return fundAddress;
    }
}
