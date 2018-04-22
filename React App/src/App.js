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
      });

      console.log(this.state.accounts);
      console.log(this.state.activeAddress);
    });
  }

  render() {
    return (
      <div className="container">
        <div className="row"> 
          <div className="col-md-4 col-md-offset-4">
            <NewCoinForm factoryInstance={this.state.factoryInstance} activeAddress={this.state.activeAddress} />
            <br />
            { this.state.factoryInstance ? 
            <CoinDisplay web3={this.state.web3} factoryInstance={this.state.factoryInstance} activeAddress={this.state.activeAddress} /> : null
            }
          </div>
        </div>
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
    let rowStyle = {
      margin: 5,
    }

    return (
      <div className="row" style={{border: '1px solid black', padding: 10, marginTop: 30}}>
        <form onSubmit={this.handleSubmit}> 
          <h3><strong> Create Coin </strong></h3>
          <br/>
          <div className="row" style={rowStyle}>
              <div className="col-md-5">Account:</div>
              <div className="col-md-7"><span><b>{String(this.props.activeAddress).slice(0, 6) + '....' + String(this.props.activeAddress).slice(-15) }</b></span></div>
          </div>
          <div className="row" style={rowStyle}>
              <div className="col-md-5">Name:</div>
              <div className="col-md-7"><input style={{width: '100%'}} type="text" name="name" value={this.state.name} onChange={this.handleChange}/></div>
          </div>
          <div className="row" style={rowStyle}>
              <div className="col-md-5">Symbol:</div>
              <div className="col-md-7"><input style={{width: '100%'}} type="text" name="symbol" value={this.state.symbol} onChange={this.handleChange}/></div>
          </div>
          <div className="row" style={rowStyle}>
              <div className="col-md-5">Decimals:</div>
              <div className="col-md-7"><input style={{width: '100%'}} type="number" name="decimals" value={this.state.decimals} onChange={this.handleChange}/></div>
          </div>
          <div className="row" style={rowStyle}>
              <div className="col-md-5">Supply:</div>
              <div className="col-md-7"><input style={{width: '100%'}} type="number" name="supply" value={this.state.supply} onChange={this.handleChange}/></div>
          </div>
          <div className="row" style={rowStyle}>
              <div className="col-md-3"><input type="submit" value="Create Coin"/></div>
          </div>
        </form>
      </div>
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
    if (!this.state.name || !this.state.symbol || !this.state.supply) return;

    this.createCoin(this.state.name, this.state.symbol, this.state.decimals, this.state.supply);
    event.stopPropagation();
  }

  createCoin(name, symbol, decimals, supply) {
    this.props.factoryInstance.createCoin(name, symbol, decimals, supply, {from: this.props.activeAddress}).then((result) => 
    {
      console.log("Coin created: " + name);
      console.log(result);
    });
  }
}

class CoinDisplay extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      coinInstances: []
    }

    this.getCreatedCoins = this.getCreatedCoins.bind(this);
    this.getCreatedCoins(this.props.activeAddress, this.props.factoryInstance)
  }

  render(){
    let displayStyle = {
      border: "1px solid black"
    }

    return(
      <div className="row" style={displayStyle}>
        {this.state.coinInstances.map((coinInstance, key) => <SingleCoin instance={coinInstance} activeAddress={this.props.activeAddress} key={key}/>)}
      </div>
    );
  }

  getCreatedCoins(address, factoryInstance) {
    factoryInstance.creationBlock.call().then((results) => {
      var factoryEvent = factoryInstance.CoinCreated({owner: address}, {fromBlock: results.valueOf() - 1, toBlock: 'latest'});

      const contract = require('truffle-contract');
      const coin_contract = contract(Coin);
      coin_contract.setProvider(this.props.web3.currentProvider);

      factoryEvent.watch((error, results) => {
        coin_contract.at(results.args.contractAddress).then((instance) => {
          console.log(instance)
          if (this.state.coinInstances.filter((element) => {return element.address === instance.address}).length < 1){
            this.setState(prevState => ({
              coinInstances: [...prevState.coinInstances, instance]
            }));
          }
        });
      });
    });
  }
}

class SingleCoin extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      name: null,
      symbol: null,
      decimals: null,
      balances: []
    }

    this.getCoinInfo = this.getCoinInfo.bind(this);
    this.getCoinInfo();
  }

  render(){
    return(
      <h1> {this.state.name} </h1>
    );
  }

  getCoinInfo(){
    this.props.instance.name.call().then((result) => {
      this.setState({name: result});
    });

    this.props.instance.symbol.call().then((result) => {
      this.setState({symbol: result});
    });

    this.props.instance.decimals.call().then((result) => {
      this.setState({decimals: result});
    });

    this.props.instance.balanceOf.call(this.props.activeAddress).then((result) => {
      
    });
  }
}

export default App
