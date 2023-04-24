// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Declaration.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract IDO is Ownable, ReentrancyGuard {
    ////////////////////////////////////////////
    /////////////   错误提示  ///////////////////
    ////////////////////////////////////////////
    error InvalidAddress();
    error AlreadyBound();
    error NotBind();
    error SetLater();
    error Ended();
    error NotEnded();
    error CallerIsNotUser();
    error AmountError();
    error AlreadyIDO();
    error NotIDO();
    error AlreadyWithdraw();
    error InsufficientBalance();
    error InsufficientAmount();
    ////////////////////////////////////////////
    ///////////////   事件  /////////////////////
    ////////////////////////////////////////////
    event bindSuc(
        address indexed participantself,
        address indexed firstReferrer,
        address indexed secondReferrer
    );
    event idoSuc(address indexed participantself, uint256 amount);
    event withdrawSuc(address indexed participantself, uint256 tokenAmount);
    event ownerWithdraw(uint256 indexed tokenAmount);
    ////////////////////////////////////////////
    ///////////////   修饰器  ///////////////////
    ////////////////////////////////////////////
    //caller不可是合约
    modifier callerIsUser() {
        if (tx.origin != msg.sender) revert CallerIsNotUser();
        _;
    }

    //必须已绑定上级
    modifier Bound() {
        if (addressToParticipant[msg.sender].firstReferrerAddress <= address(0))
            revert NotBind();
        _;
    }

    //结束无法使用
    modifier NotEnd() {
        if (endTime < block.timestamp) revert Ended();
        _;
    }

    ////////////////////////////////////////////
    //////////////  状态变量  ///////////////////
    ///////////////////////////////////////////
    //参与者
    Participant[] public participant;
    //用于计算百分数
    using SafeMath for uint256;

    //总额度
    uint256 private immutable TOTALAMOUNT;
    //每日限额
    // uint256 private immutable DAILYAMOUNT;
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
    //实例化
    IERC20 private immutable customToken = IERC20(address(customTokenAddress));
    IERC20 private immutable usdt = IERC20(address(usdtAddress));

    ////////////////////////////////////////////
    ////////////////  映射  ////////////////////
    ///////////////////////////////////////////
    //通过钱包地址映射到用户信息
    mapping(address => Participant) addressToParticipant;

    ////////////////////////////////////////////
    ///////////////  初始化  ////////////////////
    ////////////////////////////////////////////
    constructor(
        uint256 _totalAmount,
        /* uint256 _dailyAmount,*/
        uint256 _idoPrice,
        uint256 _endTime,
        address _usdtAddress,
        address _customTokenAddress
    ) {
        TOTALAMOUNT = _totalAmount;
        /*DAILYAMOUNT = _dailyAmount;*/
        IDOPRICE = _idoPrice;
        endTime = _endTime;
        usdtAddress = _usdtAddress;
        customTokenAddress = _customTokenAddress;
    }

    ////////////////////////////////////////////
    ///////////////  写入功能  //////////////////
    ////////////////////////////////////////////
    //设定结束时间
    function setEndTime(uint256 _newTime) external onlyOwner {
        if (_newTime < block.timestamp) revert SetLater();
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
        if (_referrerAddress == address(0)) revert InvalidAddress();
        //caller必须没有绑定过上级, 即只能绑定一次
        if (addressToParticipant[msg.sender].firstReferrerAddress > address(0))
            revert AlreadyBound();
        //输入的地址必须有上级
        if (
            addressToParticipant[_referrerAddress].firstReferrerAddress <=
            address(0)
        ) revert InvalidAddress();
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
        addressToParticipant[msg.sender] = participant[participant.length];
        //事件
        emit bindSuc(
            msg.sender,
            _referrerAddress,
            referrer.firstReferrerAddress
        );
    }

    //ido
    function ido(uint256 amount) external payable nonReentrant Bound NotEnd {
        //限额 DAILYAMOUNT

        //购买后的总已购额度不可超过总额度
        if (amount + purchasedAmount > TOTALAMOUNT * IDOPRICE)
            revert InsufficientAmount();
        //参与额度必须为100、300、500
        if (
            amount != 100 * 1e18 || amount != 300 * 1e18 || amount != 500 * 1e18
        ) revert AmountError();
        //赋值用户信息
        Participant memory idoer = addressToParticipant[msg.sender];
        //参与者ido状态必须为false,即一个用户只能参与一次ido
        if (idoer.ido == true) revert AlreadyIDO();
        //发送usdt的比例
        uint256 fundAddressAmount = amount.mul(95).div(100);
        uint256 firstReferrerAmount = amount.mul(3).div(100);
        uint256 secondReferrerAmount = amount.mul(2).div(100);
        //一定有一级和二级推荐人，一级奖励3%, 二级奖励2%, 剩余的全部给资金地址
        usdt.transfer(fundAddress, fundAddressAmount);
        usdt.transfer(idoer.firstReferrerAddress, firstReferrerAmount);
        usdt.transfer(idoer.secondReferrerAddress, secondReferrerAmount);
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
        if (endTime > block.timestamp) revert NotEnded();
        //赋值用户信息
        Participant memory idoer = addressToParticipant[msg.sender];
        //要求用户参与ido
        if (idoer.ido == false) revert NotIDO();
        //要求用户未提取过token
        if (idoer.withdrawal == true) revert AlreadyWithdraw();
        //tokenAmount不为0
        if (idoer.tokenAmount == 0) revert InsufficientBalance();
        //修改用户token数量信息
        addressToParticipant[msg.sender].tokenAmount = 0;
        //修改用户提取状态信息
        addressToParticipant[msg.sender].withdrawal = true;
        //发送token给用户
        customToken.transferFrom(address(this), msg.sender, idoer.tokenAmount);
        //事件
        emit withdrawSuc(msg.sender, idoer.tokenAmount);
    }

    //提取合约剩余token至资金地址
    function withdraw() external onlyOwner {
        if (customToken.balanceOf(address(this)) == 0)
            revert InsufficientBalance();
        customToken.transferFrom(
            address(this),
            fundAddress,
            customToken.balanceOf(address(this))
        );
        emit ownerWithdraw(customToken.balanceOf(address(this)));
    }

    ////////////////////////////////////////////
    ///////////////  读取功能  //////////////////
    ////////////////////////////////////////////
    //获取总额度
    function getTotalAmount() public view returns (uint256) {
        return TOTALAMOUNT;
    }

    //获取每日限额
    // function getDailyAmount() public view returns (uint256) {
    //     return DAILYAMOUNT;
    // }

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

    //通过用户钱包地址获取用户信息
    function getStructViaAdd(
        address _participant
    ) public view returns (Participant memory) {
        return addressToParticipant[_participant];
    }

    //获取截止时间
    function getEndTime() public view returns (uint256) {
        return endTime;
    }

    //获取ido代币地址
    function getTokenAddress() public view returns (address) {
        return customTokenAddress;
    }
}
