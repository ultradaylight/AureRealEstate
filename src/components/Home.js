// src/components/Home.js
import { ethers } from 'ethers';
import { useEffect, useState, useCallback } from 'react';
import close from '../assets/close.svg';
import config from '../config.json';
import Trusteeship from '../abis/Trusteeship.json';
import AureRealEstate from '../abis/AUREREALESTATE.json';
import { activeNetwork } from '../networks'; // Import activeNetwork

const Home = ({ 
  home, 
  provider, 
  account, 
  trusteeship, 
  aureRealEstate, 
  togglePop, 
  setAccount, 
  setProvider, 
  setTrusteeship, 
  setAureRealEstate,
  fetchMintedCount
}) => {
  const [nftStatus, setNftStatus] = useState({
    isMinted: false,
    isForSale: false,
    salePrice: null,
    mintCost: null,
    owner: null
  });
  const [isPending, setIsPending] = useState(false);

  const checkNftStatus = useCallback(async () => {
    console.log('--- Checking NFT Status ---');
    console.log('NFT ID:', home.id);
    console.log('Provider:', provider ? 'Available' : 'Not available');
    console.log('Account:', account || 'Not connected');
    console.log('Trusteeship:', trusteeship ? 'Available' : 'Not available');
    console.log('AureRealEstate:', aureRealEstate ? 'Available' : 'Not available');

    if (!provider || !trusteeship || !aureRealEstate) {
      console.log('Missing required blockchain data');
      setNftStatus({ isMinted: false, isForSale: false, salePrice: null, mintCost: null, owner: null });
      return;
    }

    try {
      const mintCost = await aureRealEstate.cost();
      console.log('Mint Cost:', ethers.utils.formatEther(mintCost), 'PLS');

      const owner = await aureRealEstate.ownerOf(home.id).catch((err) => {
        console.log('ownerOf error:', err.message);
        return ethers.constants.AddressZero;
      });
      const isMinted = owner !== ethers.constants.AddressZero;
      console.log('Owner:', owner, 'Is Minted:', isMinted);

      let isForSale = false;
      let salePrice = null;
      const itemCount = await trusteeship.itemCount();
      for (let i = 1; i <= itemCount; i++) {
        const item = await trusteeship.items(i);
        if (item.tokenId.toString() === home.id.toString() && !item.sold) {
          isForSale = true;
          salePrice = ethers.utils.formatEther(await trusteeship.getTotalPrice(i));
          break;
        }
      }
      console.log('Is For Sale:', isForSale, 'Sale Price:', salePrice);

      setNftStatus({ isMinted, isForSale, salePrice, mintCost, owner });
    } catch (error) {
      console.error('Error checking NFT status:', error.message);
      setNftStatus({ isMinted: false, isForSale: false, salePrice: null, mintCost: null, owner: null });
    }
  }, [provider, account, trusteeship, aureRealEstate, home?.id]);

  const buyHandler = async () => {
    if (!provider || !account || !trusteeship) {
      alert('Please connect your wallet to buy');
      return;
    }
    try {
      setIsPending(true);
      const signer = await provider.getSigner();
      const trusteeshipContract = trusteeship.connect(signer);
      let itemId = null;
      const itemCount = await trusteeshipContract.itemCount();
      for (let i = 1; i <= itemCount; i++) {
        const item = await trusteeshipContract.items(i);
        if (item.tokenId.toString() === home.id.toString() && !item.sold) {
          itemId = i;
          break;
        }
      }
      if (!itemId) throw new Error("Item not found or already sold");
      const totalPrice = await trusteeshipContract.getTotalPrice(itemId);
      alert('Please confirm the transaction in your wallet');
      const transaction = await trusteeshipContract.purchaseItem(itemId, {
        value: totalPrice,
        gasLimit: 300000,
      });
      await transaction.wait();
      setIsPending(false);
      alert('Purchase successful!');
      checkNftStatus();
    } catch (error) {
      setIsPending(false);
      console.error('Error buying property:', error.message);
      alert('Purchase failed: ' + error.message);
    }
  };

  const mintHandler = async () => {
    if (!provider || !account || !aureRealEstate) {
      alert('Please connect your wallet to mint');
      return;
    }
    try {
      setIsPending(true);
      const signer = await provider.getSigner();
      const aureRealEstateWithSigner = aureRealEstate.connect(signer);
      console.log('AureRealEstate Address:', aureRealEstate.address);
      const mintCost = await aureRealEstate.cost();
      console.log('Mint Cost for Transaction:', ethers.utils.formatEther(mintCost));
      const baseURI = await aureRealEstate.baseURI();
      console.log('BaseURI from contract:', baseURI);
      const tokenURI = `${baseURI}${home.id}.json`;
      console.log('Minting with tokenURI:', tokenURI);
      alert('Please confirm the transaction in your wallet');
      const transaction = await aureRealEstateWithSigner.mintSpecific(home.id, tokenURI, {
        value: mintCost,
        gasLimit: 300000,
      });
      await transaction.wait();
      setIsPending(false);
      alert('Mint successful!');
      checkNftStatus();
      fetchMintedCount();
    } catch (error) {
      setIsPending(false);
      console.error('Error minting NFT:', error.message);
      alert('Mint failed: ' + error.message);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('No wallet detected. Please install MetaMask, Trust Wallet, or another Ethereum-compatible wallet to continue.');
      return;
    }
    try {
      const TARGET_CHAIN_ID = activeNetwork.chainId; // Use active network's chain ID
      let provider = new ethers.providers.Web3Provider(window.ethereum);
      let network = await provider.getNetwork();
      const chainId = network.chainId;

      if (chainId !== TARGET_CHAIN_ID) {
        try {
          // Try to switch to the active network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError) {
          // If the network isn’t in the wallet, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${TARGET_CHAIN_ID.toString(16)}`,
                chainName: activeNetwork.chainName,
                rpcUrls: [activeNetwork.rpcUrl],
                nativeCurrency: activeNetwork.nativeCurrency,
                blockExplorerUrls: activeNetwork.blockExplorerUrl ? [activeNetwork.blockExplorerUrl] : null,
              }],
            });
          } else {
            throw switchError;
          }
        }
        // Wait for the network to stabilize and refresh provider
        await new Promise(resolve => setTimeout(resolve, 500));
        provider = new ethers.providers.Web3Provider(window.ethereum);
        network = await provider.getNetwork();
      }

      if (network.chainId !== TARGET_CHAIN_ID) {
        throw new Error(`Failed to switch to ${activeNetwork.chainName}. Please ensure your wallet is on chain ID ${TARGET_CHAIN_ID}.`);
      }

      setProvider(provider);

      if (!config[network.chainId]) {
        alert(`Network configuration not found in config.json for ${activeNetwork.chainName}.`);
        return;
      }

      const trusteeship = new ethers.Contract(
        config[network.chainId].trusteeship.address,
        Trusteeship.abi,
        provider
      );
      setTrusteeship(trusteeship);

      const aureRealEstate = new ethers.Contract(
        config[network.chainId].aurerealEstate.address,
        AureRealEstate.abi,
        provider
      );
      setAureRealEstate(aureRealEstate);

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const connectedAccount = ethers.utils.getAddress(accounts[0]);
        setAccount(connectedAccount);

        window.ethereum.on('accountsChanged', (newAccounts) => {
          if (newAccounts.length > 0) {
            setAccount(ethers.utils.getAddress(newAccounts[0]));
          } else {
            setAccount(null);
            setProvider(null);
            setTrusteeship(null);
            setAureRealEstate(null);
          }
        });

        window.ethereum.on('chainChanged', async () => {
          const newProvider = new ethers.providers.Web3Provider(window.ethereum);
          const newNetwork = await newProvider.getNetwork();
          if (newNetwork.chainId === TARGET_CHAIN_ID) {
            setProvider(newProvider);
            setTrusteeship(new ethers.Contract(
              config[newNetwork.chainId].trusteeship.address,
              Trusteeship.abi,
              newProvider
            ));
            setAureRealEstate(new ethers.Contract(
              config[newNetwork.chainId].aurerealEstate.address,
              AureRealEstate.abi,
              newProvider
            ));
          } else {
            setAccount(null);
            setProvider(null);
            setTrusteeship(null);
            setAureRealEstate(null);
            alert(`Switched to an unsupported network. Please switch back to ${activeNetwork.chainName} (chain ID ${TARGET_CHAIN_ID}).`);
          }
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error.message);
      alert('Failed to connect wallet: ' + error.message);
    }
  };

  useEffect(() => {
    checkNftStatus();
  }, [checkNftStatus]);

  const shortAddress = nftStatus.owner ? 
    `${nftStatus.owner.slice(0, 6)}...${nftStatus.owner.slice(-4)}` : 
    'N/A';

  return (
    <div className="home">
      <div className='home__details'>
        <div className="home__image">
          <img src={home.image} alt={home.name} />
        </div>
        <div className="home__overview">
          <h1>{home.name}</h1>
          <p>
            <strong>{home.attributes[2]?.value || 'N/A'}</strong> bds |
            <strong>{home.attributes[3]?.value || 'N/A'}</strong> ba |
            <strong>{home.attributes[4]?.value || 'N/A'}</strong> sqft
          </p>
          <p>{home.address}</p>
          <p>
            Owner: <a 
              href={`${activeNetwork.blockExplorerUrl}/address/${nftStatus.owner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="owner-link"
            >
              {shortAddress}
            </a>
          </p>
          <h2>
            {!nftStatus.isMinted
              ? 'Mint Price: 1 Million PLS'
              : nftStatus.isForSale && nftStatus.salePrice
              ? `${Number(nftStatus.salePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLS`
              : 'NFT Minted'}
          </h2>
          {isPending && <p style={{ color: 'orange' }}>Transaction pending...</p>}
          {!account ? (
            <div>
              <button className='home__buy' onClick={connectWallet}>
                Connect Wallet
              </button>
            </div>
          ) : !nftStatus.isMinted ? (
            <div>
              <button
                className='home__buy'
                onClick={mintHandler}
                disabled={!account || isPending}
              >
                Mint Now
              </button>
              <button className='home__contact'>Contact agent</button>
            </div>
          ) : nftStatus.isForSale ? (
            <div>
              <button 
                className='home__buy' 
                onClick={buyHandler}
                disabled={!account || isPending}
              >
                Buy Now
              </button>
              <button className='home__contact'>Contact agent</button>
            </div>
          ) : (
            <div className='home__owned'>
              {nftStatus.isMinted ? 'Not For Sale' : 'Not Minted'}
            </div>
          )}
          <hr />
          <h2>Description</h2>
          <p>{home.description}</p>
          <hr />
          <h2>Facts and Features</h2>
          <ul>
            {home.attributes.map((attribute, index) => (
              <li key={index}>
                <strong>{attribute.trait_type}</strong>: {attribute.value}
              </li>
            ))}
          </ul>
        </div>
        <button onClick={togglePop} className="home__close">
          <img src={close} alt="Close" />
        </button>
      </div>
    </div>
  );
};

export default Home;
