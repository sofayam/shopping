import React, { useState, useEffect, useMemo } from 'react';

function ShoppingPage() {
  const [appData, setAppData] = useState(null);
  const [selectedShops, setSelectedShops] = useState({});
  const [tickedItems, setTickedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all application data
  useEffect(() => {
    fetch('http://localhost:3001/api/all-data')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setAppData(data);
        const initialShopSelection = data.shops.reduce((acc, shop) => {
          acc[shop.name] = false;
          return acc;
        }, {});
        setSelectedShops(initialShopSelection);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const handleShopSelection = (event) => {
    const { name, checked } = event.target;
    setSelectedShops(prev => ({ ...prev, [name]: checked }));
  };

  const purchaseList = useMemo(() => {
    if (!appData || Object.values(selectedShops).every(v => !v)) {
      return [];
    }
    const neededItemNames = appData.itemList || [];
    const allItems = appData.items || [];
    const neededItems = allItems.filter(item => neededItemNames.includes(item.name));
    const activeShopNames = Object.keys(selectedShops).filter(shopName => selectedShops[shopName]);
    const activeShops = appData.shops.filter(shop => activeShopNames.includes(shop.name));
    let assignments = {};
    neededItems.forEach(item => {
      let bestShop = null;
      let bestRank = Infinity;
      if (item.preferred_shop && activeShopNames.includes(item.preferred_shop)) {
        bestShop = item.preferred_shop;
      } else {
        const allowedShopTypes = appData.whatIsWhere[item.item_type] || [];
        activeShops.forEach(shop => {
          const rank = allowedShopTypes.indexOf(shop.shop_type);
          if (rank !== -1 && rank < bestRank) {
            bestRank = rank;
            bestShop = shop.name;
          }
        });
      }
      if (bestShop) {
        if (!assignments[bestShop]) {
          assignments[bestShop] = [];
        }
        assignments[bestShop].push(item);
      }
    });
    let finalList = [];
    for (const shopName in assignments) {
      const shop = appData.shops.find(s => s.name === shopName);
      const aisleOrder = shop.aisle_order || [];
      const sortedItems = assignments[shopName].sort((a, b) => {
        const indexA = aisleOrder.indexOf(a.item_type);
        const indexB = aisleOrder.indexOf(b.item_type);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      finalList.push({ shopName: shopName, items: sortedItems });
    }
    return finalList;
  }, [appData, selectedShops]);

  const updateServerList = (newList) => {
    fetch('http://localhost:3001/api/item-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newList),
    }).catch(error => setError(error.message));
  };

  const handleTickChange = (event) => {
    const { name, checked } = event.target;
    setTickedItems(prev => ({ ...prev, [name]: checked }));
  };

  const handleDefer = (itemName) => {
    setAppData(prev => ({
      ...prev,
      itemList: prev.itemList.filter(it => it !== itemName),
    }));
  };

  const handlePurge = () => {
    const itemsToKeep = appData.itemList.filter(item => !tickedItems[item]);
    updateServerList(itemsToKeep);
    setAppData(prev => ({ ...prev, itemList: itemsToKeep }));
    setTickedItems({});
  };

  const hasTickedItems = Object.values(tickedItems).some(ticked => ticked);

  return (
    <div>
      <h1>Shopping Trip</h1>
      {loading && <p>Loading data...</p>}
      {error && <p>Error: {error}</p>}
      {appData && (
        <div>
          <h2>1. Choose shop or shops to visit</h2>
          {appData.shops.map(shop => (
            <div key={shop.name}>
              <label><input type="checkbox" name={shop.name} checked={selectedShops[shop.name] || false} onChange={handleShopSelection} /> {shop.name} ({shop.shop_type})</label>
            </div>
          ))}
          <hr />
          <h2>2. Your Purchase List</h2>
          {purchaseList.length > 0 ? (
            <>
              {purchaseList.map(shopData => (
                <div key={shopData.shopName}>
                  <h3>{shopData.shopName}</h3>
                  <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                    {shopData.items.map(item => (
                      <li key={item.name} style={{ textDecoration: tickedItems[item.name] ? 'line-through' : 'none' }}>
                        <label>
                          <input type="checkbox" name={item.name} checked={tickedItems[item.name] || false} onChange={handleTickChange} />
                          {item.name} <small>({item.item_type})</small>
                        </label>
                        <button onClick={() => handleDefer(item.name)} style={{ marginLeft: '10px', fontSize: '0.8em' }}>Defer</button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {hasTickedItems && <button onClick={handlePurge}>Purge Ticked Items</button>}
            </>
          ) : (
            <p>Select one or more shops to generate a purchase list.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ShoppingPage;
