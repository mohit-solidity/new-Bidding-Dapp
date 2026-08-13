# Bidding dApp

A decentralized **auction and bidding dApp** built with **Solidity, React.js, and Ethers.js**.

Users can register as sellers, list items for auction, place bids using ETH, receive refunds when they are outbid, and claim the winning bid after an auction ends.

The auction logic is handled entirely by a Solidity smart contract, while the React frontend provides the interface for interacting with the contract.

## Features

### Sellers

* Register as a seller
* Pay a registration fee
* List items for auction
* Set a listing price
* Set an auction duration
* Hide or show listed items
* Cancel an auction if no bids have been placed
* Claim the winning bid after the auction ends

### Buyers / Bidders

* View available auctions
* Place bids using ETH
* Bid at least 5% higher than the current highest bid
* Automatically receive a refund when outbid
* Claim available refunds
* Participate in auctions before their deadline

### Auction Features

* On-chain auction state
* ETH-based bidding
* Minimum bid increment of 5%
* Automatic refund accounting for previous bidders
* Auction deadline extension
* Seller withdrawal after auction completion
* Auction cancellation
* Platform fee collection
* Contract pause/unpause functionality
* Reentrancy protection
* Solidity events

## How It Works

```text
                    ┌──────────────────┐
                    │      User        │
                    │   MetaMask       │
                    └────────┬─────────┘
                             │
                             │ Connect Wallet
                             ▼
                    ┌──────────────────┐
                    │   React Frontend │
                    │   + Ethers.js    │
                    └────────┬─────────┘
                             │
                             │ Contract Calls
                             ▼
                    ┌──────────────────┐
                    │ Bidding Contract │
                    │    Solidity      │
                    └────────┬─────────┘
                             │
             ┌───────────────┼────────────────┐
             ▼               ▼                ▼
        List Items       Place Bids       Refunds
             │               │                │
             ▼               ▼                ▼
          Seller          Highest           Outbid
          Details           Bidder           Users
```

## Auction Flow

### 1. Register as a Seller

A user must first register as a seller.

The registration requires:

```text
0.0002 ETH
```

Once registered, the address can create auction listings.

### 2. List an Item

The seller provides:

* Item name
* Listing amount
* Auction duration

The auction duration must be between **1 and 30 days**.

The seller also pays a platform fee equal to **1% of the listing amount**.

```text
Listing Amount
      │
      └── 1% → Platform Fee
```

### 3. Place a Bid

A bidder sends ETH to the smart contract.

The first bid must be greater than the seller's listing amount.

After that, every new bid must be at least **5% higher than the previous highest bid**.

For example:

```text
Current Bid: 1 ETH

Minimum Next Bid:
1 ETH + 5%
= 1.05 ETH
```

### 4. Previous Bidder Gets a Refund

When a new highest bid is placed, the previous highest bidder's ETH is recorded in:

```solidity
buyerRefund[previousBidder]
```

The previous bidder can then call:

```solidity
claimRefund()
```

to withdraw their ETH.

This means bidders do not need to wait for the auction to completely finish to recover funds after being outbid.

### 5. Auction Extension

If a bid is placed when less than **10 minutes** remain in the auction, the deadline is extended by another 10 minutes.

```text
Auction
───────────────────────────────┐
                               │
                         < 10 minutes
                               │
                               ▼
                    Extend by 10 minutes
```

This prevents a bidder from winning simply by placing a last-second bid.

### 6. Auction Completion

After the auction deadline has passed, the seller can claim the highest bid.

The seller calls:

```solidity
claimSellAmount(index)
```

The highest bid is then transferred to the seller.

## Smart Contract

The main smart contract is:

```text
src/logicBidding.sol
```

It contains the complete auction logic.

The contract is named:

```solidity
contract Bidding
```

and inherits from:

```solidity
ReentrancyGuard
Ownable
Pausable
```

This provides protection against reentrancy attacks, owner-controlled functionality, and emergency pause functionality.

## Important Contract Functions

### Seller Functions

```solidity
registerAsSeller()
```

Registers the caller as a seller.

```solidity
listItem(
    string memory _name,
    uint128 _listingAmount,
    uint _endTime
)
```

Creates a new auction listing.

```solidity
hideYourItems()
```

Hides the seller's listings from public viewing.

```solidity
showYourItems()
```

Makes the seller's listings publicly viewable.

```solidity
cancelBid(uint index)
```

Cancels an auction when no bidder has placed a bid.

```solidity
claimSellAmount(uint index)
```

Allows the seller to withdraw the winning bid after the auction ends.

## Bidding Functions

```solidity
makeBidding(uint index, address _seller)
```

Places a new bid on a seller's auction.

The contract requires the new bid to be at least 5% higher than the current highest bid.

```solidity
claimRefund()
```

Allows an outbid bidder to withdraw their accumulated refund.

## Owner Functions

```solidity
pause()
```

Pauses bidding-related contract operations.

```solidity
unpause()
```

Resumes the contract.

```solidity
feeWithdraw()
```

Allows the contract owner to withdraw collected platform fees.

## Smart Contract Data

Each seller's auction contains:

```solidity
struct seller {
    address sellerAddress;
    address buyerAddress;
    uint128 listingAmount;
    uint128 highestBid;
    uint64 startingTime;
    uint64 endingTime;
    string name;
    bool isActive;
}
```

This allows the contract to track:

* Seller
* Current highest bidder
* Starting listing price
* Current highest bid
* Auction start time
* Auction end time
* Item name
* Auction status

The contract stores auctions per seller using:

```solidity
mapping(address => seller[]) public sellerDetails;
```

## Events

The contract emits events when important actions occur.

### Item Listed

```solidity
event ItemListed(
    string name,
    address indexed seller,
    uint listingAmount,
    uint startTime,
    uint deadLine
);
```

### New Bid

```solidity
event NewBiddingPlaced(
    string name,
    address indexed sellerAddress,
    address indexed newBuyer,
    uint amount
);
```

These events can be used by the frontend or an indexing system to track auction activity.

## Tech Stack

### Frontend

* React 19
* JavaScript
* CSS
* Create React App

### Web3

* Solidity `^0.8.20`
* Ethers.js `6.15.0`
* MetaMask / Ethereum-compatible wallet

### Smart Contract Security

* OpenZeppelin `ReentrancyGuard`
* OpenZeppelin `Ownable`
* OpenZeppelin `Pausable`

The current `package.json` confirms React 19.2, Ethers.js 6.15, and Create React App are used by the project.

## Project Structure

```text
new-Bidding-Dapp/
│
├── public/
│
├── src/
│   ├── ABI.js
│   ├── App.js
│   ├── App.css
│   ├── Popup.css
│   ├── index.css
│   ├── index.js
│   ├── logicBidding.sol
│   ├── popup.js
│   ├── reportWebVitals.js
│   ├── setupTests.js
│   └── ...
│
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

The Solidity contract and ABI are kept inside the `src` directory alongside the React application.

## Getting Started

### Prerequisites

Install:

* Node.js
* npm
* Git
* MetaMask

### Clone the Repository

```bash
git clone https://github.com/mohit-solidity/new-Bidding-Dapp.git

cd new-Bidding-Dapp
```

### Install Dependencies

```bash
npm install
```

### Start the Application

```bash
npm start
```

The application will run at:

```text
http://localhost:3000
```

### Build for Production

```bash
npm run build
```

The project is also configured with a GitHub Pages deployment script:

```bash
npm run deploy
```

The repository's `package.json` defines the development, build, test, and GitHub Pages deployment scripts.

## Bidding Rules

| Rule                  | Requirement                         |
| --------------------- | ----------------------------------- |
| Seller registration   | 0.0002 ETH                          |
| Listing fee           | 1% of listing amount                |
| Auction duration      | 1–30 days                           |
| First bid             | Must be greater than listing amount |
| Next bid              | At least 5% higher                  |
| Last-minute extension | 10 minutes                          |
| Seller withdrawal     | After auction ends                  |
| Bidder refund         | Available after being outbid        |

## Security

The contract implements several security mechanisms:

### Reentrancy Protection

Functions that transfer ETH use OpenZeppelin's:

```solidity
nonReentrant
```

This is used on refund and seller withdrawal functions.

### Access Control

Owner-only functionality uses:

```solidity
onlyOwner
```

This protects administrative operations such as:

```solidity
pause()
unpause()
feeWithdraw()
```

### Emergency Pause

The owner can pause the contract if a critical problem is discovered.

```solidity
pause()
unpause()
```

## Important Disclaimer

This project is primarily an **educational Web3 project**.

The smart contract has **not been professionally audited**. It should not be considered production-ready or used with significant real funds without additional testing and a professional security review.

## What This Project Demonstrates

This project demonstrates practical concepts including:

* Solidity smart contract development
* Auction mechanics
* ETH transfers
* `msg.value`
* `msg.sender`
* Solidity mappings
* Structs and dynamic arrays
* Solidity events
* `block.timestamp`
* Contract state management
* Reentrancy protection
* Access control
* Pausable contracts
* React state management
* Ethers.js contract interaction
* Wallet integration
* Transaction handling
* On-chain bidding logic

## Future Improvements

Possible improvements include:

* Add NFT-based auctions
* Add auction images and metadata
* Add automatic auction discovery
* Add auction history
* Add event indexing
* Add Chainlink or another oracle where appropriate
* Add bid history
* Add seller reputation
* Add minimum seller reputation requirements
* Add ERC-20 token bidding
* Add ERC-721/ERC-1155 asset auctions
* Add Foundry/Hardhat tests
* Improve contract gas efficiency
* Add a dedicated backend/indexer
* Add contract verification and deployment information
* Add comprehensive security testing

## Author

**Mohit Sharma**

Blockchain Developer | Solidity • React.js • Ethers.js

GitHub:
https://github.com/mohit-solidity

Project:
https://github.com/mohit-solidity/new-Bidding-Dapp
