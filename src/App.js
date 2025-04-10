// src/App.js
import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';
import Footer from './components/Footer';
import { homesData } from './data/homesData';

// Helper function to format large numbers with suffixes
const formatLargeNumber = (number) => {
  if (!number || isNaN(number)) return 'N/A';

  const units = [
    { value: 1e15, suffix: 'Q' },  // Quadrillion
    { value: 1e12, suffix: 'T' },  // Trillion
    { value: 1e9,  suffix: 'B' },  // Billion
    { value: 1e6,  suffix: 'M' },  // Million
    { value: 1e3,  suffix: 'K' },  // Thousand
    { value: 1,    suffix: '' }    // No suffix for < 1000
  ];

  const absNumber = Math.abs(number);
  const unit = units.find(u => absNumber >= u.value) || units[units.length - 1];
  const formatted = (number / unit.value).toFixed(2);
  
  // Remove trailing zeros after decimal if unnecessary (e.g., 55.00 -> 55)
  const cleanNumber = parseFloat(formatted).toString();
  return `${cleanNumber}${unit.suffix}`;
};

function App() {
  const [provider, setProvider] = useState(null);
  const [trusteeship, setTrusteeship] = useState(null);
  const [aureRealEstate, setAureRealEstate] = useState(null);
  const [account, setAccount] = useState(null);
  const [homes, setHomes] = useState(homesData);
  const [home, setHome] = useState(null);
  const [toggle, setToggle] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBuyFilterActive, setIsBuyFilterActive] = useState(false);
  const [isSellFilterActive, setIsSellFilterActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [transactionStep, setTransactionStep] = useState(0);
  const [priceInput, setPriceInput] = useState({});
  const [floorPrice, setFloorPrice] = useState(null);
  const [mintedCount, setMintedCount] = useState(null);
  const MAX_NFTS = 100;

  const checkNftStatusBatch = useCallback(async (homeIds) => {
    if (!provider || !trusteeship || !aureRealEstate) {
      console.log('Skipping batch check: missing provider or contracts');
      return homeIds.map(homeId => ({
        homeId,
        isMinted: false,
        isForSale: false,
        salePrice: null,
        seller: null,
        owner: null
      }));
    }

    try {
      // Batch fetch ownership status
      console.log('Batch checking ownerOf for tokens:', homeIds);
      const ownerPromises = homeIds.map(homeId =>
        aureRealEstate.ownerOf(homeId).catch(() => ethers.constants.AddressZero)
      );
      const owners = await Promise.all(ownerPromises);
      const statusMap = new Map();

      // Initialize status for all homes
      homeIds.forEach((homeId, index) => {
        const owner = owners[index];
        const isMinted = owner !== ethers.constants.AddressZero;
        statusMap.set(homeId.toString(), {
          homeId,
          isMinted,
          isForSale: false,
          salePrice: null,
          seller: null,
          owner: isMinted ? owner : null
        });
        if (!isMinted) {
          console.log(`Token ${homeId} not minted`);
        } else {
          console.log(`Token ${homeId} is minted, owner: ${owner}`);
        }
      });

      // Fetch all listings once
      const itemCount = await trusteeship.itemCount();
      console.log(`Total item count: ${itemCount.toString()}`);
      if (itemCount.gt(0)) {
        const itemPromises = [];
        for (let i = 1; i <= itemCount.toNumber(); i++) {
          itemPromises.push(trusteeship.items(i));
        }
        const items = await Promise.all(itemPromises);

        // Batch fetch total prices for unsold items, handling reverts individually
        const pricePromises = items.map((item, index) =>
          !item.sold
            ? trusteeship.getTotalPrice(index + 1).catch(err => {
                console.warn(`Failed to get price for item ${index + 1}: ${err.reason || err.message}`);
                return null; // Return null for failed price fetches
              })
            : Promise.resolve(null)
        );
        const prices = await Promise.all(pricePromises);

        // Update status with listing info
        items.forEach((item, index) => {
          if (!item.sold && prices[index] !== null) { // Only update if price fetch succeeded
            const tokenIdStr = item.tokenId.toString();
            if (statusMap.has(tokenIdStr)) {
              const status = statusMap.get(tokenIdStr);
              status.isForSale = true;
              status.salePrice = ethers.utils.formatEther(prices[index]);
              status.seller = item.seller;
              console.log(`Token ${tokenIdStr} is for sale at ${status.salePrice} by ${status.seller}`);
            }
          }
        });
      }

      return homeIds.map(homeId => statusMap.get(homeId.toString()));
    } catch (error) {
      console.error('Error in batch NFT status check:', error);
      return homeIds.map(homeId => ({
        homeId,
        isMinted: false,
        isForSale: false,
        salePrice: null,
        seller: null,
        owner: null
      }));
    }
  }, [provider, trusteeship, aureRealEstate]);

  const filterBuyHomes = useCallback(async () => {
    if (!provider || !trusteeship || !aureRealEstate) {
      alert('Please connect your wallet to view homes for sale');
      return;
    }

    setIsLoading(true);
    setIsBuyFilterActive(true);
    setIsSellFilterActive(false);

    try {
      console.log('Starting filterBuyHomes, processing homes:', homesData.map(h => h.id));
      const homeIds = homesData.map(home => home.id);
      const statuses = await checkNftStatusBatch(homeIds);

      const filteredHomes = homesData.filter((home, index) => {
        const status = statuses[index];
        return !status.isMinted || status.isForSale;
      });

      console.log('Filtered homes:', filteredHomes);
      setHomes(filteredHomes);
    } catch (error) {
      console.error('Unexpected error in filterBuyHomes:', error);
      alert('Failed to load homes for sale. Check console for details.');
      setHomes(homesData);
    } finally {
      setIsLoading(false);
    }
  }, [checkNftStatusBatch, provider, trusteeship, aureRealEstate]);

  const filterSellHomes = useCallback(async () => {
    if (!provider || !trusteeship || !aureRealEstate || !account) {
      alert('Please connect your wallet to view your listings');
      return;
    }

    setIsLoading(true);
    setIsSellFilterActive(true);
    setIsBuyFilterActive(false);

    try {
      console.log('Starting filterSellHomes, processing homes:', homesData.map(h => h.id));
      const homeIds = homesData.map(home => home.id);
      const statuses = await checkNftStatusBatch(homeIds);

      const sellHomes = homesData
        .map((home, index) => {
          const status = statuses[index];
          const isOwned = status.owner && status.owner.toLowerCase() === account.toLowerCase();
          const isListedByUser = status.isForSale && status.seller && status.seller.toLowerCase() === account.toLowerCase();
          if (isOwned || isListedByUser) {
            return {
              ...home,
              isForSale: status.isForSale,
              salePrice: status.salePrice,
              owner: status.owner
            };
          }
          return null;
        })
        .filter(home => home !== null);

      console.log('Filtered sell homes:', sellHomes);
      setHomes(sellHomes);
    } catch (error) {
      console.error('Error in filterSellHomes:', error);
      setHomes([]);
    } finally {
      setIsLoading(false);
    }
  }, [checkNftStatusBatch, provider, trusteeship, aureRealEstate, account]);

  const filterHomeHomes = useCallback(() => {
    setHomes(homesData);
    setIsBuyFilterActive(false);
    setIsSellFilterActive(false);
    setIsLoading(false);
    setSearchTerm('');
  }, []);

  const updatePriceHandler = async (itemId, newPrice) => {
    if (!provider || !trusteeship || !account) {
      alert('Please connect your wallet to update price');
      return;
    }
    if (!newPrice || newPrice.trim() === '' || parseFloat(newPrice) <= 0) {
      alert('Please enter a valid price to proceed.');
      return;
    }
    try {
      setIsConfirming(true);
      const signer = await provider.getSigner();
      const trusteeshipContract = trusteeship.connect(signer);
      const itemCount = await trusteeshipContract.itemCount();
      let actualItemId = null;
      for (let i = 1; i <= itemCount; i++) {
        const item = await trusteeshipContract.items(i);
        if (item.tokenId.toString() === itemId.toString() && !item.sold) {
          actualItemId = i;
          break;
        }
      }
      if (!actualItemId) throw new Error("Item not found or not for sale");
      const priceInWei = ethers.utils.parseEther(newPrice);
      const transaction = await trusteeshipContract.updateItemPrice(actualItemId, priceInWei, { gasLimit: 300000 });
      await transaction.wait();
      alert('Price updated successfully!');
      setIsConfirming(false);
      filterSellHomes();
      fetchFloorPrice();
    } catch (error) {
      console.error('Error updating price:', error.message);
      alert('Price update failed: ' + error.message);
      setIsConfirming(false);
    }
  };

  const listForSaleHandler = async (tokenId, price) => {
    if (!provider || !trusteeship || !aureRealEstate || !account) {
      alert('Please connect your wallet to list this NFT');
      return;
    }
    if (!price || price.trim() === '' || parseFloat(price) <= 0) {
      alert('Please enter a valid price to proceed.');
      return;
    }
    try {
      setIsConfirming(true);
      setTransactionStep(1);
      const signer = await provider.getSigner();
      const aureRealEstateContract = aureRealEstate.connect(signer);
      const trusteeshipContract = trusteeship.connect(signer);

      const approvalTx = await aureRealEstateContract.approve(trusteeship.address, tokenId, { gasLimit: 100000 });
      await approvalTx.wait();

      setTransactionStep(2);
      const priceInWei = ethers.utils.parseEther(price);
      const listingTx = await trusteeshipContract.listItem(aureRealEstate.address, tokenId, priceInWei, { gasLimit: 300000 });
      await listingTx.wait();

      alert('NFT listed for sale successfully!');
      setIsConfirming(false);
      setTransactionStep(0);
      setPriceInput(prev => ({ ...prev, [tokenId]: '' }));
      filterSellHomes();
      fetchFloorPrice();
    } catch (error) {
      console.error('Error putting NFT up for sale:', error.message);
      alert('Listing failed: ' + error.message);
      setIsConfirming(false);
      setTransactionStep(0);
    }
  };

  const cancelSaleHandler = async (tokenId) => {
    if (!provider || !trusteeship || !account) {
      alert('Please connect your wallet to cancel this sale');
      return;
    }
    try {
      setIsConfirming(true);
      const signer = await provider.getSigner();
      const trusteeshipContract = trusteeship.connect(signer);
      const itemCount = await trusteeshipContract.itemCount();
      let actualItemId = null;
      for (let i = 1; i <= itemCount; i++) {
        const item = await trusteeshipContract.items(i);
        if (item.tokenId.toString() === tokenId.toString() && !item.sold) {
          actualItemId = i;
          break;
        }
      }
      if (!actualItemId) throw new Error("Item not found or not for sale");
      const transaction = await trusteeshipContract.withdrawItem(actualItemId, { gasLimit: 300000 });
      await transaction.wait();
      alert('Sale canceled successfully!');
      setIsConfirming(false);
      filterSellHomes();
      fetchFloorPrice();
    } catch (error) {
      console.error('Error canceling sale:', error.message);
      alert('Cancel sale failed: ' + error.message);
      setIsConfirming(false);
    }
  };

  const fetchFloorPrice = useCallback(async () => {
    if (!provider || !trusteeship || !account) {
      setFloorPrice(null);
      return;
    }
    try {
      const itemCount = await trusteeship.itemCount();
      let lowestPrice = null;

      for (let i = 1; i <= itemCount; i++) {
        const item = await trusteeship.items(i);
        if (!item.sold && item.price > 0) {
          const totalPrice = await trusteeship.getTotalPrice(i).catch(() => null);
          if (totalPrice) {
            const priceInEth = ethers.utils.formatEther(totalPrice);
            const price = parseFloat(priceInEth);
            if (lowestPrice === null || price < lowestPrice) {
              lowestPrice = price;
            }
          }
        }
      }

      setFloorPrice(lowestPrice !== null ? formatLargeNumber(lowestPrice) : null);
    } catch (error) {
      console.error('Error fetching floor price:', error.message);
      setFloorPrice(null);
    }
  }, [provider, trusteeship, account]);

  const fetchMintedCount = useCallback(async () => {
    if (!provider || !aureRealEstate || !account) {
      setMintedCount(null);
      return;
    }
    try {
      const totalSupply = await aureRealEstate.totalSupply();
      setMintedCount(totalSupply.toNumber());
    } catch (error) {
      console.error('Error fetching minted count:', error.message);
      setMintedCount(null);
    }
  }, [provider, aureRealEstate, account]);

  const loadBlockchainData = useCallback(async () => {
    // Empty for now; wallet connection happens in Navigation.js or Home.js
  }, []);

  const handleSearchResults = (filteredHomes) => {
    setHomes(filteredHomes);
    setIsBuyFilterActive(false);
    setIsSellFilterActive(false);
    setIsLoading(false);
  };

  const togglePop = (home) => {
    setHome(home);
    if (toggle) {
      setHomes(homesData);
      setIsBuyFilterActive(false);
      setIsSellFilterActive(false);
      setIsLoading(false);
    }
    setToggle(!toggle);
    setSearchTerm('');
  };

  const handlePriceInputChange = (homeId, value) => {
    setPriceInput(prev => ({ ...prev, [homeId]: value }));
  };

  useEffect(() => {
    loadBlockchainData();
    fetchFloorPrice();
    fetchMintedCount();
  }, [loadBlockchainData, fetchFloorPrice, fetchMintedCount, account, trusteeship, aureRealEstate]);

  return (
    <div>
      <Navigation 
        account={account} 
        setAccount={setAccount} 
        setProvider={setProvider}
        setTrusteeship={setTrusteeship}
        setAureRealEstate={setAureRealEstate}
        onBuyFilter={filterBuyHomes}
        onSellFilter={filterSellHomes}
        onHomeFilter={filterHomeHomes}
      />
      <Search 
        onSearchResults={handleSearchResults} 
        homes={homesData} 
        togglePop={togglePop}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <div className='cards__section'>
        <div className="header-with-floor">
          <h3>
            {isBuyFilterActive ? 'Homes For Sale' : 
             isSellFilterActive ? (homes.length > 0 ? 'Your Properties' : 'You Have Yet To Acquire Any Properties') : 
             'Homes For You'}
          </h3>
          <div className="market-info">
            {account && floorPrice && (
              <span className="floor-price">
                Floor: {floorPrice} PLS
              </span>
            )}
            {account && mintedCount !== null && mintedCount < MAX_NFTS && (
              <span className="mint-counter">
                Minted: {mintedCount}/{MAX_NFTS} – Cost: 1M PLS
              </span>
            )}
          </div>
        </div>
        <hr />
        {isLoading && (
          <div className="loading-prompt">
            <p>Loading homes from blockchain...</p>
          </div>
        )}
        {isConfirming && (
          <div className="loading-prompt">
            <p>
              {transactionStep === 1 
                ? "Please confirm the approval in your wallet (Step 1 of 2)..." 
                : transactionStep === 2 
                ? "Please confirm the listing in your wallet (Step 2 of 2)..." 
                : "Confirming transaction..."}
            </p>
          </div>
        )}
        <div className='cards'>
          {homes.map((home, index) => (
            <div 
              className={`card ${isSellFilterActive ? 'card--own' : ''}`} 
              key={index} 
              onClick={() => togglePop(home)}
            >
              <div className='card__image'>
                <img src={home.image} alt={home.name} />
              </div>
              <div className='card__info'>
                <h4>{home.name}</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |
                  <strong>{home.attributes[3].value}</strong> ba |
                  <strong>{home.attributes[4].value}</strong> sqft
                </p>
                <p>NFT #{home.id} - {home.address}</p>
                {isSellFilterActive && (
                  <div className="card__own-status">
                    {home.isForSale ? (
                      <>
                        <p>For Sale: {Number(home.salePrice).toLocaleString()} PLS</p>
                        <input
                          type="number"
                          value={priceInput[home.id] || ''}
                          onChange={(e) => handlePriceInputChange(home.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="New Price (PLS)"
                          className="price-input"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePriceHandler(home.id, priceInput[home.id] || '');
                          }}
                          className="update-price-btn"
                        >
                          Update Price
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelSaleHandler(home.id);
                          }}
                          className="cancel-sale-btn"
                        >
                          Cancel Sale
                        </button>
                      </>
                    ) : (
                      <>
                        <p>Not For Sale</p>
                        <input
                          type="number"
                          value={priceInput[home.id] || ''}
                          onChange={(e) => handlePriceInputChange(home.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Set Price (PLS)"
                          className="price-input"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            listForSaleHandler(home.id, priceInput[home.id] || '');
                          }}
                          className="list-for-sale-btn"
                        >
                          List for Sale
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {toggle && (
        <Home 
          home={home} 
          provider={provider} 
          account={account} 
          trusteeship={trusteeship} 
          aureRealEstate={aureRealEstate} 
          togglePop={togglePop} 
          setAccount={setAccount}
          setProvider={setProvider}
          setTrusteeship={setTrusteeship}
          setAureRealEstate={setAureRealEstate}
          fetchMintedCount={fetchMintedCount}
        />
      )}
      <Footer />
    </div>
  );
}

export default App;
