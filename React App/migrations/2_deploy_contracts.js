var CoinFactory = artifacts.require("./CoinFactory.sol");

module.exports = function(deployer) {
    deployer.deploy(CoinFactory);
};