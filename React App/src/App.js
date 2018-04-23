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
          <div className="col-md-6 col-md-offset-4">
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
              <div className="col-md-4">Account:</div>
              <div className="col-md-8"><span><b>{String(this.props.activeAddress) }</b></span></div>
          </div>
          <div className="row" style={rowStyle}>
              <div className="col-md-4">Name:</div>
              <div className="col-md-8"><input style={{width: '100%'}} type="text" name="name" value={this.state.name} onChange={this.handleChange}/></div>
          </div>
          <div className="row" style={rowStyle}>
              <div className="col-md-4">Symbol:</div>
              <div className="col-md-8"><input style={{width: '100%'}} type="text" name="symbol" value={this.state.symbol} onChange={this.handleChange}/></div>
          </div>
          <div className="row" style={rowStyle}>
              <div className="col-md-4">Decimals:</div>
              <div className="col-md-8"><input style={{width: '100%'}} type="number" name="decimals" value={this.state.decimals} onChange={this.handleChange}/></div>
          </div>
          <div className="row" style={rowStyle}>
              <div className="col-md-4">Supply:</div>
              <div className="col-md-8"><input style={{width: '100%'}} type="number" name="supply" value={this.state.supply} onChange={this.handleChange}/></div>
          </div>
          <div className="row" style={rowStyle}>
              <div className="col-md-4"><input type="submit" value="Create Coin"/></div>
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
      border: "1px solid black",
      padding: "5px"
    }

    return(
      <div className="row" style={displayStyle}>
        {this.state.coinInstances.map((coinInstance, key) => <SingleCoin web3={this.props.web3} instance={coinInstance} activeAddress={this.props.activeAddress} key={key}/>)}
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
      balances: {},
      displayBalances: false,
      addressTo: null,
      amount: null
    }

    this.getCoinInfo = this.getCoinInfo.bind(this);
    this.toggleBalanceDisplay = this.toggleBalanceDisplay.bind(this);
    this.transferToken = this.transferToken.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.getBalances = this.getBalances.bind(this);

    this.getCoinInfo();
    this.getBalances();
  }

  render(){
    let containerStyle = {
      border: "3px solid 	#6495ED",
      marginBottom: "5px"
    }

    let tableStyle = {
      border: "1px solid black",
      width: '100%',
      marginBottom: "20px"
    }

    let tdStyle1 = {
      width: '70%',
      border: "1px solid black",
      paddingLeft: '5px',
      textAlign: 'center'
    }

    let tdStyle2 = {
      width: '30%',
      border: "1px solid black",
      paddingLeft: '5px',
      textAlign: 'center'
    }

    return(
      <div>
      {
      this.state.name ?
      <div className="col-md-12" style={containerStyle}>
        <div className="row">
          <div className="col-md-6" style={{paddingTop: "5px"}}>
          <h4 style={{textAlign: 'left'}}><strong>{this.state.name}</strong></h4>
          <p><strong>Balance:</strong> {(this.state.balances[this.props.activeAddress] / Math.pow(10, this.state.decimals)) + " " + this.state.symbol} </p>
          </div>
          <div className="col-md-6" style={{marginTop: "22px"}}>
            <button style={{float: "right"}} onClick={this.toggleBalanceDisplay}>Details</button>
          </div>
        </div>
      </div> : null
      }
      { this.state.displayBalances ? 
        <form onSubmit={this.handleSubmit} style={{width: "100%"}}>
          <input type="text" placeholder="Address" style={{width: "100%", marginBottom: "3px"}} name="addressTo" onChange={this.handleChange}/>
          <input type="number" placeholder="Amount" style={{width: "100%", marginBottom: "3px"}} name="amount" onChange={this.handleChange}/>
          <input type="submit" value="Transfer" style={{marginBottom: "10px", width:"30%"}}/>
        </form> :
        null
      }
      {
      this.state.displayBalances && this.state.name ? 
        <table style={tableStyle}>
          <tbody>
            {Object.keys(this.state.balances).map((key, index) => 
            <tr key={key}>
              <td style={tdStyle1}>
                {String(key)}
              </td>
              <td style={tdStyle2}>
                {this.state.balances[key] / Math.pow(10, this.state.decimals)}
              </td>
            </tr>)}  
          </tbody>
        </table> :
        null
      }
      </div>
    );
  }

  toggleBalanceDisplay(){
    this.setState(prevState => ({
      displayBalances: !prevState.displayBalances
    }));
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

    this.props.instance.totalSupply.call().then((result) => {
      var balancesObj = Object.assign({}, this.state.balances);
      balancesObj[this.props.activeAddress] = Number(result.valueOf());

      this.setState({balances: balancesObj});
      console.log(this.state.balances[this.props.activeAddress])
    });
  }

  handleSubmit(event){
    event.preventDefault();
    if (!this.state.addressTo || !this.state.amount) return;

    this.transferToken(this.state.addressTo, this.state.amount);
    event.stopPropagation();
  }

  handleChange(event){
    var stateObject = function() {
      var returnObj = {};
      returnObj[this.target.name] = this.target.value;
         return returnObj;
    }.bind(event)();

    this.setState(stateObject);  
  }

  transferToken(addressTo, amount){
    this.props.instance.transfer(addressTo, amount * Math.pow(10, this.state.decimals), {from: this.props.activeAddress});
  }

  getBalances(){
    this.props.instance.creationBlock.call().then((results) => {
      var transferEvent = this.props.instance.Transfer({}, {fromBlock: results.valueOf() - 1, toBlock: 'latest'});

      transferEvent.watch((error, results) => {
        var sender = results.args.from;
        var receiver = results.args.to;

        this.props.instance.balanceOf(sender).then((result) => {
          var balancesObj = Object.assign({}, this.state.balances);
          balancesObj[sender] = Number(result.valueOf());
          this.setState({balances: balancesObj});
        });

        this.props.instance.balanceOf(receiver).then((result) => {
          var balancesObj = Object.assign({}, this.state.balances);
          balancesObj[receiver] = Number(result.valueOf());
          this.setState({balances: balancesObj});
        });
      });
    });
  }
}

export default App
