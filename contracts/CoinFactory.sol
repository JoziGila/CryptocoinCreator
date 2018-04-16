pragma solidity ^0.4.4;

import "./Coin.sol";

contract CoinFactory {
  event CoinCreated(address contractAddress, address owner);

  function createCoin(string _name, string _symbol, uint8 _decimals, uint _supply) public returns (address){
    Coin c = new Coin(_name, _symbol, _decimals, _supply);
    emit CoinCreated(address(c), msg.sender);

    return address(c);
  }
}
