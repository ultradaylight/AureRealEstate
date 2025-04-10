import { useEffect, useRef } from 'react';

const Search = ({ onSearchResults, homes, togglePop, searchTerm, setSearchTerm }) => {
    const searchRef = useRef(null); // Ref to track the search component

    // Static list of addresses with corresponding NFT IDs
    const staticAddresses = [
        { id: "1", address: "480 Crimeffel St, TX 33140" },
        { id: "2", address: "864 Pulse St, CA 30263" },
        { id: "3", address: "695 Leaning St, TX 36574" },
        { id: "4", address: "985 Hodlosseum St, NY 22925" },
        { id: "5", address: "316 The St, IL 30568" },
        { id: "6", address: "187 Pulseenon St, IL 27414" },
        { id: "7", address: "184 Burj St, CA 39180" },
        { id: "8", address: "371 One St, WA 40916" },
        { id: "9", address: "376 MSTR St, NY 12468" },
        { id: "10", address: "296 Sommi St, FL 38059" },
        { id: "11", address: "801 The St, TX 20969" },
        { id: "12", address: "560 The St, WA 22798" },
        { id: "13", address: "703 FallingPrices St, TX 39213" },
        { id: "14", address: "172 Cuckingham St, FL 12276" },
        { id: "15", address: "963 Soy St, CA 32991" },
        { id: "16", address: "391 Long St, FL 30620" },
        { id: "17", address: "128 Hexland St, TX 20713" },
        { id: "18", address: "914 The St, NV 30493" },
        { id: "19", address: "482 Debt St, IL 32210" },
        { id: "20", address: "825 KyberKunk St, WA 17467" },
        { id: "21", address: "279 Ruggard St, NY 24786" },
        { id: "22", address: "796 MetaMask St, TX 32795" },
        { id: "23", address: "691 The St, NV 10346" },
        { id: "24", address: "788 Hotel St, FL 11855" },
        { id: "25", address: "940 Eth St, NV 28902" },
        { id: "26", address: "607 Degenerate St, NV 17853" },
        { id: "27", address: "629 Amhico St, FL 10631" },
        { id: "28", address: "258 Hotel St, NV 40751" },
        { id: "29", address: "188 Mati St, FL 28988" },
        { id: "30", address: "306 The St, NV 30777" },
        { id: "31", address: "734 The St, CA 42216" },
        { id: "32", address: "218 Hexo St, WA 41215" },
        { id: "33", address: "808 Mars St, Mars 31382" },
        { id: "34", address: "822 iRotation St, CA 17391" },
        { id: "35", address: "376 Karim St, IL 24566" },
        { id: "36", address: "738 Interpol St, IL 30578" },
        { id: "37", address: "541 Tether St, NY 32116" },
        { id: "38", address: "206 Habibi St, FL 24624" },
        { id: "39", address: "705 Elon St, TX 32483" },
        { id: "40", address: "164 UnderWaterChain St, IL 31440" },
        { id: "41", address: "392 XSpaces St, TX 37465" },
        { id: "42", address: "565 The St, FL 13943" },
        { id: "43", address: "362 Federal St, IL 37725" },
        { id: "44", address: "162 The St, WA 15066" },
        { id: "45", address: "877 The St, NY 25282" },
        { id: "46", address: "120 The St, FL 21781" },
        { id: "47", address: "491 The St, FL 14335" },
        { id: "48", address: "113 ZKP2P St, CA 27514" },
        { id: "49", address: "428 CowSwap St, NY 14235" },
        { id: "50", address: "731 Matchaxyz St, CA 19557" },
        { id: "51", address: "412 Balance St, NY 38081" },
        { id: "52", address: "202 Trump St, TX 11167" },
        { id: "53", address: "900 One St, MARS 33769" },
        { id: "54", address: "127 Unvaccinated St, MOON 10576" },
        { id: "55", address: "141 Freaky St, NV 32290" },
        { id: "56", address: "336 NoJumper St, FL 28410" },
        { id: "57", address: "138 Cousin St, TX 14266" },
        { id: "58", address: "262 Flood St, AC 33330" },
        { id: "59", address: "908 Exploit St, IL 26249" },
        { id: "60", address: "496 Auto St, NY 15761" },
        { id: "61", address: "848 EricWallzard St, TX 10827" },
        { id: "62", address: "716 PoorDai St, NY 40452" },
        { id: "63", address: "263 DipCatcher St, FL 39357" },
        { id: "64", address: "797 WenMoon St, AC 27350" },
        { id: "65", address: "410 Green St, CA 30820" },
        { id: "66", address: "778 Brown St, MARS 31064" },
        { id: "67", address: "600 LiberationDay St, IL 39944" },
        { id: "68", address: "720 PeterSchiff St, CA 23801" },
        { id: "69", address: "537 RichardHeart St, CA 40978" },
        { id: "70", address: "758 BlackDildo St, NY 21555" },
        { id: "71", address: "882 1TrillionPLS St, MOON 31872" },
        { id: "72", address: "811 55 St, NV 15960" },
        { id: "73", address: "520 822 St, FL 32063" },
        { id: "74", address: "200 82 St, WA 10024" },
        { id: "75", address: "598 42 St, FL 20657" },
        { id: "76", address: "386 67 St, CA 34966" },
        { id: "77", address: "373 68 St, IL 27367" },
        { id: "78", address: "728 808 St, WA 32670" },
        { id: "79", address: "505 6 St, NV 11627" },
        { id: "80", address: "988 0 St, IL 31458" },
        { id: "81", address: "573 Ye St, TX 23350" },
        { id: "82", address: "900 PMaker St, CA 37435" },
        { id: "83", address: "857 Turbo St, NY 37092" },
        { id: "84", address: "829 FastAbdoul St, IL 21455" },
        { id: "85", address: "723 Solana St, TX 23406" },
        { id: "86", address: "733 Federal St, NY 24855" },
        { id: "87", address: "521 BackToTheSever St, TX 34958" },
        { id: "88", address: "653 John St, NY 24771" },
        { id: "89", address: "178 Nakamoto St, WA 42266" },
        { id: "90", address: "458 Akademiks St, NV 18197" },
        { id: "91", address: "276 Bitcoin St, WA 17336" },
        { id: "92", address: "213 ElonMusk St, IL 11566" },
        { id: "93", address: "741 Vitalik St, WA 20313" },
        { id: "94", address: "643 JohnnyChaos St, IL 25802" },
        { id: "95", address: "382 PulseChain St, TX 33615" },
        { id: "96", address: "585 HexyBastard St, NY 20450" },
        { id: "97", address: "830 InternetMoneyFarms St, WA 12851" },
        { id: "98", address: "972 TrVon St, IL 29132" },
        { id: "99", address: "104 CoreyCosta St, WA 34596" },
        { id: "100", address: "179 KatieeP St, TX 38241" }
    ];

    // Combine static addresses with homes data
    const searchData = [
        ...staticAddresses,
        ...homes.map(home => ({
            id: home.id.toString(),
            address: home.address
        }))
    ];

    // Filter based on both ID and address
    const filteredResults = searchData.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
            item.id.toString().includes(searchTerm) ||
            item.address.toLowerCase().includes(searchLower)
        );
    });

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        
        const filteredHomes = homes.filter(home => {
            const searchLower = term.toLowerCase();
            return (
                home.id.toString().includes(term) ||
                home.address.toLowerCase().includes(searchLower)
            );
        });
        
        if (filteredHomes.length === 0) {
            const staticMatches = staticAddresses.filter(item => {
                const searchLower = term.toLowerCase();
                return (
                    item.id.toString().includes(term) ||
                    item.address.toLowerCase().includes(searchLower)
                );
            });
            const staticHomes = staticMatches.map(match => ({
                ...homes.find(h => h.id === match.id) || {},
                id: match.id,
                address: match.address
            }));
            onSearchResults(staticHomes);
        } else {
            onSearchResults(filteredHomes);
        }
    };

    // Handle clicking a search result
    const handleResultClick = (item) => {
        const selectedHome = homes.find(home => home.id.toString() === item.id) || {
            id: item.id,
            address: item.address,
            name: `NFT #${item.id}`, // Fallback name
            image: "default_image_url", // Add a default or fetch from somewhere
            attributes: [], // Add default attributes if needed
            description: "No description available" // Fallback description
        };
        togglePop(selectedHome); // Call togglePop, which will clear searchTerm
    };

    // Handle clicks outside the dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchRef.current && 
                !searchRef.current.contains(event.target) && 
                !event.target.closest('.card') // Ignore clicks on cards
            ) {
                setSearchTerm(''); // Clear search term to hide dropdown
                onSearchResults(homes); // Reset to original homes list
            }
        };

        // Add event listener when dropdown is visible
        if (searchTerm) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [searchTerm, homes, onSearchResults, setSearchTerm]);

    return (
        <header ref={searchRef}>
            <h2 className="header__title">Hunt it. Check it. Snag it.</h2>
            <input
                type="text"
                className="header__search"
                placeholder="Enter an address, neighborhood, city, ZIP code, or NFT ID"
                value={searchTerm}
                onChange={handleSearch}
            />
            
            {/* Display search results */}
            {searchTerm && (
                <div className="search__results">
                    {filteredResults.length > 0 ? (
                        <ul>
                            {filteredResults.map((item, index) => (
                                <li 
                                    key={index} 
                                    onClick={() => handleResultClick(item)} 
                                    style={{ cursor: 'pointer' }} // Add cursor to indicate clickability
                                >
                                    NFT #{item.id} - {item.address}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No matching properties found</p>
                    )}
                </div>
            )}
        </header>
    );
};

export default Search;
