import { useEffect, useState } from 'react';
import { BrowserProvider, Contract, formatEther, getAddress, parseEther } from 'ethers';
import './App.css';

const ca = "0x55E229e28b745c4a4a1408b6c5a2f73E64d149F1";
let abi = [
  "function registerAsSeller() public payable",
  "function isSeller(address) public view returns(bool)",
  "function listItem(string memory _name,uint128 _listingAmount,uint _endTime) public payable",
  "function feeCollected() public view returns(uint256)",
  "function totalItemsListed() public view returns(uint256)",
  "function seeItems(address) public view returns((address,address,uint128,uint128,uint64,uint64,string,bool)[])",
  "function makeBidding(uint index,address _seller) public payable",
  "function buyerRefund(address) public view returns(uint)",
  "function claimRefund() external",
  "function cancelBid(uint index) public",
  "function feeWithdraw() public",
  "function claimSellAmount(uint index) public"
];

function App() {
  const [userAddress, setUserAddress] = useState(null);
  const [contract, setContract] = useState(null);
  const [isUserSeller, setIsSeller] = useState(false);
  const [feeCollected, setFeeCollected] = useState(0);
  const [totalItemsListed, setTotalItemsListed] = useState(0);
  const [itemName, setItemName] = useState("");
  const [listingAmount, setListingAmount] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [searchAddress, setSearchAddress] = useState(null);
  const [formattedData, setFormattedData] = useState([]);
  const [biddingPrice, setBiddingPrice] = useState(0);
  const [userRefund, setUserRefund] = useState(0);

  useEffect(() => {
    if (!window.ethereum || !contract) return;

    (async () => {
      try {
      } catch (err) {
        console.error(err);
      }
    })();
    const handleAccountsChanged = (accounts) => {
      setUserAddress(accounts[0] || "");
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [contract, userAddress]);


  async function connectWallet() {
    if (!window.ethereum) return alert("Wallet Not Found");

    const provider = new BrowserProvider(window.ethereum);
    const account = await provider.send("eth_requestAccounts", []);
    setUserAddress(account[0]);

    const signer = await provider.getSigner();
    let cont = new Contract(ca, abi, signer);
    setContract(cont);
  }

  async function registerAsSeller() {
    if (!contract) return alert("Connect Wallet First");

    try {
      let tx = await contract.registerAsSeller({ value: parseEther("0.0002").toString() });
      await tx.wait();
      checkDetails();
      alert("Registration Success");
    } catch (err) {
      alert(err.reason || err.message);
    }
  }

  async function checkDetails() {
    if (!contract) return;

    let tx = await contract.isSeller(userAddress);
    let fee = await contract.feeCollected();
    let items = await contract.totalItemsListed();
    let refund = await contract.buyerRefund(userAddress);

    setIsSeller(tx);
    setFeeCollected(formatEther(fee));
    setTotalItemsListed(items);
    setUserRefund(formatEther(refund));
  }

  async function listItem() {
    if (!contract) return alert("Connect Wallet First");

    try {
      if (!itemName || listingAmount <= 0 || endTime <= 0)
        return alert("Check values again");

      let fee = listingAmount / 100;

      let tx = await contract.listItem(
        itemName,
        parseEther(listingAmount.toString()),
        endTime,
        { value: parseEther(fee.toString()).toString() }
      );
      await tx.wait();
      alert("Item listed!");
      checkDetails();
    } catch (err) {
      alert(err.reason || err.message);
    }
  }

  async function seeItems() {
    if (!contract) return alert("Connect Wallet First");

    try {
      let data = await contract.seeItems(searchAddress);
      data = Array.isArray(data) ? data : [];

      let formatted = data.map(item => ({
        sellerAddress: item[0],
        buyerAddress: item[1],
        listingAmount: Number(formatEther(item[2])),
        highestBid: Number(formatEther(item[3])),
        startingTime: new Date(Number(item[4]) * 1000).toLocaleDateString(),
        endingTime: new Date(Number(item[5]) * 1000).toLocaleDateString(),
        name: item[6],
        isActive: item[7]
      }));
      setFormattedData(formatted);
    } catch (err) {
      alert(err.reason || err.message);
    }
  }

  async function makeBidding(index, seller) {
    if (!contract) return alert("Connect Wallet First");

    try {
      let tx = await contract.makeBidding(index, seller, {
        value: parseEther(biddingPrice.toString()).toString()
      });

      await tx.wait();
      alert("Transaction Successful");
      seeItems(searchAddress);
      checkDetails();
    } catch (err) {
      alert(err.reason || err.message);
    }
  }

  async function claimRefund() {
    if (!contract) return;
    try {
      let tx = await contract.claimRefund();
      await tx.wait();
      checkDetails();
      alert("Refund Claimed");
    } catch (err) {
      alert(err.reason || err.message);
    }
  }

  async function cancelBid(index) {
    if (!contract) return;
    try {
      let tx = await contract.cancelBid(index);
      await tx.wait();
      seeItems(searchAddress);
      alert("Bid Cancelled");
    } catch (err) {
      alert(err.reason || err.message);
    }
  }

  async function feeWithdraw() {
    if (!contract) return;
    try {
      let tx = await contract.feeWithdraw();
      await tx.wait();
      checkDetails();
      alert("Fee withdrawn");
    } catch (err) {
      alert(err.reason || err.message);
    }
  }
  async function claimSellAmount(index) {
    if (!contract) return;
    try {
      let tx = await contract.claimSellAmount(index);
      await tx.wait();
      checkDetails();
      alert("Bid Amount Successfully withdrawn");
    } catch (err) {
      alert(err.reason || err.message);
    }
  }

  return (
    <div className="App">
      <header className="App-header">

        {!contract && (
          <p>Bidding Dapp</p>
        )}

        <div className="top-left" style={{ display: contract ? "block" : "none" }}>
          <p>Address : {userAddress}</p>
          <p>Seller : {isUserSeller ? "✅" : "❌"}</p>
          <p>Fee Collected : {feeCollected} ETH</p>
          <p>Total Items : {totalItemsListed}</p>
          <div className="refund-row">
            <p>Refund Balance : {userRefund} ETH</p>
            <button onClick={claimRefund} className="claim-refund-btn">Claim</button>
          </div>
        </div>

        {!contract && (
          <button onClick={connectWallet} className="connect-wallet-btn">
            Connect Wallet
          </button>
        )}

        {contract && (
          <div className="admin-controls">
            <button onClick={registerAsSeller} className="register-seller-btn">
              Register As Seller
            </button>

            {getAddress(userAddress) === getAddress("0xb4df6ac663383fb70bf1171d10f458c41933f85b") && (
              <>
                <button onClick={feeWithdraw} className="withdraw-fee-btn">
                  Withdraw Fee
                </button>
              </>
            )}
          </div>
        )}

        <div className="see-items" style={{ display: contract ? "block" : "none" }}>
          <input
            type="text"
            placeholder="User Address"
            onChange={(e) => setSearchAddress(e.target.value)}
            className="input-medium"
          />

          <button onClick={seeItems} className="view-items-btn">
            View Items
          </button>

          <div className="items">
            {formattedData.map((item, index) => (
              <div key={index} className="align-items">
                <h3>Name : {item.name}</h3>
                <p>Listing : {item.listingAmount} ETH</p>
                <p>Highest Bid : {item.highestBid} ETH</p>
                <p>Seller : {item.sellerAddress}</p>
                <p>Buyer : {item.buyerAddress}</p>
                <p>Start : {item.startingTime}</p>
                <p>End : {item.endingTime}</p>
                <p>Active : {item.isActive ? "✅" : "❌"}</p>
                {item.isActive?
                  <div style={{}}>
                    <input
                      type="number"
                      placeholder="Enter Bid Amount"
                      className="input-medium"
                      onChange={(e) => setBiddingPrice(e.target.value)}
                    />
                  <button
                    onClick={() => makeBidding(index, item.sellerAddress)}
                    className="bid-btn"
                  >
                    Make Bid
                  </button>
                  {getAddress(item.sellerAddress) === getAddress(userAddress) && (
                    <button
                      onClick={() => cancelBid(index)}
                      className="cancel-bid-btn"
                    >
                      Cancel Bid
                    </button>
                  )}
                </div>:
                <div>
                  {getAddress(item.sellerAddress) === getAddress(userAddress) && (
                    <button
                      onClick={()=>claimSellAmount(index)}
                      className="cancel-bid-btn"
                    >
                      Claim Sell Amount
                    </button>
                  )}
                  <p style={{color:'rgba(189, 245, 92, 1)'}}>Event Ended Or Cancelled - No More Bidding</p>
                </div>}
            </div>
            ))}
          </div>
        </div>
        <div className="list-item" style={{ display: contract ? "block" : "none" }}>
          {isUserSeller ? (
            <>
              <input type="text" placeholder="Item Name" className="form-input" onChange={(e) => setItemName(e.target.value)} /><br/><br/>
              <input type="number" placeholder="Listing Price" className="form-input" onChange={(e) => setListingAmount(e.target.value)} /><br/><br/>
              <input type="number" placeholder="Deadline" className="form-input" onChange={(e) => setEndTime(e.target.value)} /><br/><br/>
              <button onClick={listItem} className="list-item-btn">
                List Item
              </button>
            </>
          ) : (
            "Please Register First To List Items"
          )}
        </div>

      </header>
    </div>
  );
}

export default App;
