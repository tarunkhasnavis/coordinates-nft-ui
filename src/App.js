import React, { useEffect, useState } from "react";
import "./styles/App.css";
import { ethers } from "ethers";
import myEpicNFT from "./utils/MyEpicNFT.json";

// Constants
const OPENSEA_LINK = "";
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0x3d1d6276Cb4adfAc90d997C27766072C2FF9C1B1";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentMint, setCurrentMint] = useState(0);

  // Implicitly connect wallet upon page load
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log(window);
      console.log("Make sure you have metamask.");
      return;
    }
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account)

      setupEventListener();
    } else {
      console.log("No authorized account found")
    }
  };

  // Explicitly connect wallet using button
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 

      setupEventListener();
    } catch (error) {
      console.log(error)
    }
  }

  // Check mint count
  const checkMintCount = async () => {
    try  {
      const { ethereum } = window;
      if (!ethereum) {
        console.log(window);
        console.log("Make sure you have metamask.");
        return;
      }

      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);

      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = "0x4"; 
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
      }

      const provider = new ethers.providers.Web3Provider(ethereum);
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNFT.abi, provider);

      let mintCount = await connectedContract.getTotalMintedSoFar();
      setCurrentMint(mintCount.toNumber());
    } catch (error) {
      console.log(error);
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNFT.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        });

        console.log("Setup event listener!")
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Mint NFT Button Action
  const askContractToMintNFT = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner();

        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNFT.abi, signer);
        
        console.log("Let try to mint an NFT");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining... please wait");
        await nftTxn.wait();

        provider.on("NewEpicNFTMint", (sender, tokenId) => {
          console.log(sender, tokenId.toNumber());
          alert(`Hey there! We've minted your NFT. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: <https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}>`)
        })

      } else {
        console.log("Ethereum object doesn't exist!");
      } 
    } catch (error) {
      console.log(error)
    }
  }

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const renderMintUI = () => (
    <button onClick={askContractToMintNFT} className="cta-button connect-wallet-button">
      Mint NFT
    </button>
  );

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    checkMintCount();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">Coordinates NFT Collection</p>
          <p className="sub-text">
            Get unique coordinates. Discover your NFT today.
          </p>
          <p className="sub-text">{currentMint}/50 Minted So Far!</p>
          {currentAccount === "" ? (renderNotConnectedContainer()) : (renderMintUI())}
        </div>
      </div>
    </div>
  );
};

export default App;
