var CoinFactory = artifacts.require("./CoinFactory.sol");
var Coin = artifacts.require("./Coin.sol");

contract('CoinFactory', function(accounts) {
  var factoryInstance;
  var coinInstance;

  it("Create new coin instance and check the name", function(done) {
    var coin_factory = CoinFactory.deployed().then(function(instance){
      factoryInstance = instance;
      var new_coin = factoryInstance.createCoin("TestCoin", "TS", 0, 100, {from: accounts[0]});
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

  it("Get balance of owner", function(done){
    coinInstance.balanceOf(accounts[0]).then(function(result){
      assert.equal(result.valueOf(), 100, "The balance of the owner should be 100");
      done();
    });
  });

  it("Transfer 50 tokens to a seconds account and check balances", function(done){
    coinInstance.transfer(accounts[1], 50, {from: accounts[0]}).then(function(result){
      return coinInstance.balanceOf(accounts[1]);
    }).then(function(result){
      assert.equal(result.valueOf(), 50, "The balance of the seconds account should be 50");
      done();
    });
  });

  it("Account 0 will allow 20 additional tokens to be spend by account 1", function(done){
    coinInstance.approve(accounts[1], 20);
    coinInstance.allowance(accounts[0], accounts[1]).then(function(result){
      assert.equal(result.valueOf(), 20, "The allowance should be 20");
      done();
    });
  });

  it("Account 1 will transfer 20 tokens from account 0 to itself", function(done){
    coinInstance.transferFrom(accounts[0], accounts[1], 20, {from: accounts[1]});
    coinInstance.balanceOf(accounts[1]).then(function(result){
      assert.equal(result.valueOf(), 70, "The balance of the second account should be 70");
      done();
    });
  });
});
