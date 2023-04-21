// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Declaration.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract IDO is Ownable, ReentrancyGuard {
    ////////////////////////////////////////////
    /////////////   错误提示  ///////////////////
    ////////////////////////////////////////////
    error AddressZero();
    error EarlyTime();
    error IDOisOver();
    error CallerIsNotUser();
    error AmountError();
    error AlreadyIDO();
    error NotIDO();
    error NotEnoughToken();
    error AlreadyWithdraw();
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
    modifier callerIsUser() {
        if (tx.origin != msg.sender) revert CallerIsNotUser();
        _;
    }
    ////////////////////////////////////////////
    //////////////  状态变量  ///////////////////
    ///////////////////////////////////////////
    //参与者
    Participant[] public participant;
    //计数参与人数量
    using Counters for Counters.Counter;
    Counters.Counter private _participantNumber;

    using SafeMath for uint256;

    //总额度
    uint256 private immutable TOTALAMOUNT;
    //每日限额
    uint256 private immutable DAILYAMOUNT;
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
        uint256 _dailyAmount,
        uint256 _idoPrice,
        uint256 _endTime,
        address _usdtAddress,
        address _customTokenAddress
    ) {
        TOTALAMOUNT = _totalAmount;
        DAILYAMOUNT = _dailyAmount;
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
        if (_newTime < block.timestamp) revert EarlyTime();
        endTime = _newTime;
    }

    //绑定上级
    function bindReferrer(address _referrerAddress) external callerIsUser {
        //不可为空地址
        if (_referrerAddress == address(0)) revert AddressZero();
        //结束无法绑定
        if (endTime < block.timestamp) revert IDOisOver();
        //绑定一级推荐人; 如果绑定的上级也存在上级，则二级推荐人也会绑定
        address _secondReferrerAddress;
        uint256 i;
        for (i = 0; i <= participant.length; i++) {
            if (
                participant[i].selfAddress == _referrerAddress &&
                participant[i].firstReferrerAddress != address(0)
            ) {
                _secondReferrerAddress = participant[i].firstReferrerAddress;
            }
        }
        //存入用户信息
        participant.push(
            Participant({
                selfAddress: msg.sender,
                firstReferrerAddress: _referrerAddress,
                secondReferrerAddress: _secondReferrerAddress,
                ido: false,
                tokenAmount: 0,
                withdrawal: false
            })
        );
        //保存映射
        addressToParticipant[msg.sender] = participant[i];
        //事件
        emit bindSuc(msg.sender, _referrerAddress, _secondReferrerAddress);
    }

    //ido
    function ido(uint256 amount) external payable nonReentrant {
        //参与额度必须为100、300、500
        if (
            amount != 100 * 1e18 || amount != 300 * 1e18 || amount != 500 * 1e18
        ) revert AmountError();
        IERC20 usdt = IERC20(address(usdtAddress));
        //遍历找出该用户信息
        Participant memory idoer;
        uint256 i;
        for (i = 0; i <= participant.length; i++) {
            if (participant[i].selfAddress == msg.sender) {
                idoer = participant[i];
            }
        }
        //参与者ido状态必须为false
        if (participant[i].ido == true) revert AlreadyIDO();
        //推荐人返usdt的比例
        uint256 firstReferrerAmount = amount.mul(3).div(100);
        uint256 secondReferrerAmount = amount.mul(2).div(100);
        //一定有一级推荐人，先给一级奖励3%
        usdt.transfer(idoer.firstReferrerAddress, firstReferrerAmount);
        //判断是否有二级推荐人，若有给2%，若无剩下的全给资金地址
        if (idoer.secondReferrerAddress != address(0)) {
            usdt.transfer(idoer.secondReferrerAddress, secondReferrerAmount);
            usdt.transfer(
                fundAddress,
                amount.sub(firstReferrerAmount).sub(secondReferrerAmount)
            );
        } else {
            usdt.transfer(fundAddress, amount.sub(firstReferrerAmount));
        }
        //修改用户可提取token的数量
        participant[i].tokenAmount = amount.div(IDOPRICE);
        //修改参与状态, 默认false, true则不可参与
        participant[i].ido = true;
        //记录参与人数+1
        _participantNumber.increment();
        participantNumber = _participantNumber.current();
        //事件
        emit idoSuc(msg.sender, amount);
    }

    //用户提取token
    function tokenWithdraw() external nonReentrant {
        //遍历找出该用户信息
        Participant memory idoer;
        uint256 i;
        for (i = 0; i <= participant.length; i++) {
            if (participant[i].selfAddress == msg.sender) {
                idoer = participant[i];
            }
        }
        //要求用户参与ido
        if (idoer.ido == false) revert NotIDO();
        //要求用户未提取过token
        if (idoer.withdrawal == true) revert AlreadyWithdraw();
        //tokenAmount不为0
        if (idoer.tokenAmount == 0) revert NotEnoughToken();
        //修改用户token数量信息
        participant[i].tokenAmount = 0;
        //修改用户提取状态信息
        participant[i].withdrawal = true;
        //发送token给用户
        IERC20 customToken = IERC20(address(customTokenAddress));
        customToken.transferFrom(address(this), msg.sender, idoer.tokenAmount);
        //事件
        emit withdrawSuc(msg.sender, idoer.tokenAmount);
    }

    //提取合约剩余token
    function withdraw() external onlyOwner {
        IERC20 customToken = IERC20(address(customTokenAddress));
        customToken.transferFrom(
            address(this),
            msg.sender,
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
    function getDailyAmount() public view returns (uint256) {
        return DAILYAMOUNT;
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
}
