pragma solidity ^0.4.4;

// import "./ECR20Interface.sol";

contract Coin {
  string public name;
  string public symbol;
  uint8 public decimals;

  uint public supply;
  mapping (address => uint) balances;
  mapping (address => mapping(address => uint)) allowed;

  function Coin(string _name, string _symbol, uint8 _decimals, uint _supply) public {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
    supply = _supply;

    balances[msg.sender] = _supply;
  }

  function totalSupply() public constant returns (uint) {
    return supply;
  }
}
