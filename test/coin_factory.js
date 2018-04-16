var CoinFactory = artifacts.require("./CoinFactory.sol");
var Coin = artifacts.require("./Coin.sol");

contract('CoinFactory', function(accounts) {
  var factoryInstance;
  var coinInstance;

  it("Create new coin instance and check the name", function(done) {
    var coin_factory = CoinFactory.deployed().then(function(instance){
      factoryInstance = instance;
      var new_coin = factoryInstance.createCoin("TestCoin", "TS", 0, 100);
      return new_coin;
    }).then(function(result){
      var coin = Coin.at(result.logs[0].args.contractAddress).then(function(instance){
        coinInstance = instance;
        return coinInstance.name.call();
      }).then(function(result){
        assert.equal(result.valueOf(), "TestCoin", "The name should be TestCoin");
        done()
      });
    });
  });
});
