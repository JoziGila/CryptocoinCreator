pragma solidity ^0.4.4;

import "./ERC20.sol";

contract Coin is ERC20{
  string public name;
  string public symbol;
  uint8 public decimals;

  uint supply;
  mapping (address => uint) balances;
  mapping (address => mapping(address => uint)) allowed;

  uint public creationBlock;

  function Coin(string _name, string _symbol, uint8 _decimals, uint _supply, address owner) public {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
    supply = _supply;
    creationBlock = block.number;

    balances[owner] = _supply;
  }

  function totalSupply() public constant returns (uint) {
    return supply;
  }

  function balanceOf(address _account) public constant returns (uint) {
    return balances[_account];
  }

  function allowance(address _owner, address _spender) public constant returns (uint){
    return allowed[_owner][_spender];
  }

  function transfer(address _to, uint _amount) public returns (bool) {
    require(_amount > 0 && balances[msg.sender] >= _amount);

    balances[msg.sender] -= _amount;
    balances[_to] += _amount;

    emit Transfer(msg.sender, _to, _amount);
    return true;
  }

  function approve(address _spender, uint _amount) public returns (bool) {
    require(_amount > 0 && balances[msg.sender] >= _amount);

    allowed[msg.sender][_spender] = _amount;

    emit Approval(msg.sender, _spender, _amount);
    return true;
  }

  function transferFrom(address _from, address _to, uint _amount) public returns (bool) {
    require(_amount > 0 && allowed[_from][msg.sender] >= _amount && balances[_from] >= _amount);
    
    allowed[_from][msg.sender] -= _amount;
    balances[_from] -= _amount;
    balances[_to] += _amount;

    emit Transfer(_from, _to, _amount);
    return true;
  }
}
