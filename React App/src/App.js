import React, { Component } from 'react'
import CoinFactory from '../build/contracts/CoinFactory.json'
import Coin from "../build/contracts/Coin.json"
import getWeb3 from './utils/getWeb3'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      factoryInstance: null,
      coins: [],
      activeAddress: null
    }

    this.getCreatedCoins = this.getCreatedCoins.bind(this);
  }

  componentWillMount() {
    getWeb3.then(results => {
      this.setState({web3: results.web3});
      this.instantiateContract();
    }).catch(() => {
      console.log('Error finding web3.');
    });
  }

  instantiateContract() {
    const contract = require('truffle-contract');
    const coin_factory = contract(CoinFactory);

    coin_factory.setProvider(this.state.web3.currentProvider);

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      this.setState({accounts: accounts});
      this.setState({activeAddress: accounts[0]});

      coin_factory.deployed().then((instance) => {
        this.setState({factoryInstance : instance});
        // this.createTestCoin();
      });

      console.log(this.state.accounts);
      console.log(this.state.activeAddress);
    });
  }

  getCreatedCoins(address) {
    this.state.factoryInstance.creationBlock.call().then((results) => {
      var factoryEvent = this.state.factoryInstance.CoinCreated({owner: address}, {fromBlock: results.valueOf() - 1, toBlock: 50});

      factoryEvent.get((error, results) => {
        if (error)
          console.log('Error in event handler: ' + error);
        else
          console.log(results);
      });
    });
  }

  render() {
    let containerStyle = {
      margin: 50
    }

    return (
      <div style={containerStyle}> 
        <NewCoinForm factoryInstance={this.state.factoryInstance}/>
      </div>
    );
  }
}

class NewCoinForm extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      name: "",
      symbol: "",
      decimals: 0,
      supply: 100
    }

    this.createCoin = this.createCoin.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    let formStyle = {
      position: 'relative',
      float: 'left',
      border: "1px solid black",
      padding: 15
    }

    let tableRowStyle = {
      margin: 30
    }

    return (
        <form style={formStyle} onSubmit={this.handleSubmit}> 
          <h2> Create Coin </h2>
          <table><tbody>
            <tr style={tableRowStyle}>
              <td>Name:</td>
              <td><input type="text" name="name" value={this.state.name} onChange={this.handleChange}/></td>
            </tr>
            <tr style={tableRowStyle}>
              <td>Symbol:</td>
              <td><input type="text" name="symbol"value={this.state.symbol} onChange={this.handleChange} /></td>
            </tr>
            <tr style={tableRowStyle}>
              <td>Decimals:</td>
              <td><input type="number" name="decimals" value={this.state.decimals} onChange={this.handleChange}/></td>
            </tr>
            <tr style={tableRowStyle}>
              <td>Supply:</td>
              <td><input type="number" name="supply" value={this.state.supply} onChange={this.handleChange}/></td>
            </tr>
            <tr style={tableRowStyle}>
              <td></td>
              <td><input type="submit" value="Create Coin"/></td>
            </tr>
          </tbody></table>
        </form>
    );
  }

  handleChange(event) {
    var stateObject = function() {
      var returnObj = {};
      returnObj[this.target.name] = this.target.value;
         return returnObj;
    }.bind(event)();

    this.setState(stateObject);  
  }

  handleSubmit(event) {
    event.preventDefault();
    if (!this.state.name || !this.state.symbol || !this.state.decimals || !this.state.supply) return;
    alert("Coin being created")
    this.createCoin(this.state.name, this.state.symbol, this.state.decimals, this.state.supply);
    event.stopPropagation();
  }

  createCoin(name, symbol, decimals, supply) {
    this.props.factoryInstance.createCoin(name, symbol, decimals, supply, {from: this.state.activeAddress}).then((result) => 
    {
      console.log("Coin created: " + name);
      console.log(result);
    });
  }
}

export default App
