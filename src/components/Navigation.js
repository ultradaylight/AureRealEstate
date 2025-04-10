// src/components/Navigation.js
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import logo from '../assets/logo.svg';
import config from '../config.json';
import Trusteeship from '../abis/Trusteeship.json';
import AureRealEstate from '../abis/AUREREALESTATE.json';
import { activeNetwork } from '../networks';

const Navigation = ({ 
  account, 
  setAccount, 
  setProvider, 
  setTrusteeship, 
  setAureRealEstate,
  onBuyFilter,
  onSellFilter,
  onHomeFilter
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const connectHandler = async () => {
    if (!window.ethereum) {
      alert('No wallet detected. Please install MetaMask, Trust Wallet, or another Ethereum-compatible wallet to continue.');
      return;
    }
    try {
      const TARGET_CHAIN_ID = activeNetwork.chainId;
      let provider = new ethers.providers.Web3Provider(window.ethereum);
      let network = await provider.getNetwork();
      const chainId = network.chainId;

      if (chainId !== TARGET_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError) {
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

      if (!config[network.chainId].trusteeship || !config[network.chainId].aurerealEstate) {
        throw new Error(`Configuration for chainId ${network.chainId} is incomplete in config.json`);
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

  const buyHandler = () => {
    if (!account) {
      connectHandler();
    } else {
      onBuyFilter();
      setIsMenuOpen(false);
    }
  };

  const sellHandler = () => {
    if (!account) {
      connectHandler();
    } else {
      onSellFilter();
      setIsMenuOpen(false);
    }
  };

  const homeHandler = () => {
    onHomeFilter();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const blockExplorerUrl = account && activeNetwork.blockExplorerUrl 
    ? `${activeNetwork.blockExplorerUrl}/address/${account}`
    : 'https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/';

  return (
    <>
      <nav>
        <div className="nav__brand">
          <img src={logo} alt="Logo" />
          <h1>AureRealEstate</h1>
        </div>

        <button className="nav__hamburger" onClick={toggleMenu}>
          {isMenuOpen ? '✕' : '☰'}
        </button>

        <ul className={`nav__links ${isMenuOpen ? 'nav__links--open' : ''}`}>
          <li><button className="nav__link" onClick={homeHandler}>Home</button></li>
          <li><button className="nav__link" onClick={buyHandler}>Buy</button></li>
          <li><button className="nav__link" onClick={sellHandler}>Sell</button></li>
          <li>
            <a 
              href="https://aurelips.com" 
              className="nav__link" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
            >
              AureLips
            </a>
          </li>
        </ul>

        {account ? (
          <a 
            href={blockExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="nav__connect"
          >
            {account.slice(0, 6) + '...' + account.slice(38, 42)}
          </a>
        ) : (
          <button type="button" className="nav__connect" onClick={connectHandler}>
            Connect
          </button>
        )}
      </nav>

      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop}>
          ↑Top
        </button>
      )}
    </>
  );
};

export default Navigation;
