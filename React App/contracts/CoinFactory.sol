pragma solidity ^0.4.4;

import "./Coin.sol";

contract CoinFactory {
  event CoinCreated(address contractAddress, address indexed owner);

  uint public creationBlock;

  function CoinFactory() public {
    creationBlock = block.number;
  }

  function createCoin(string _name, string _symbol, uint8 _decimals, uint _supply) public {
    Coin c = new Coin(_name, _symbol, _decimals, _supply, msg.sender);

    emit CoinCreated(c, msg.sender);
  }
}
