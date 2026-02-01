import React, { useState, useEffect, useMemo } from 'react';

function ShoppingPage() {
  const [appData, setAppData] = useState(null);
  const [selectedShops, setSelectedShops] = useState({});
  const [tickedItems, setTickedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all application data
  useEffect(() => {
    fetch('/api/all-data')
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
      return { allocated: [], unallocated: [] }; // Return empty arrays for both
    }

    const neededItemNames = appData.itemList || [];
    const allItems = appData.items || [];
    const neededItems = allItems.filter(item => neededItemNames.includes(item.name) && !item.is_deferred);
    const activeShopNames = Object.keys(selectedShops).filter(shopName => selectedShops[shopName]);
    const activeShops = appData.shops.filter(shop => activeShopNames.includes(shop.name));
    const shopTypeToItemTypesMap = appData.shopTypeToItemTypes || {};

    console.log("[ShoppingPage] Needed Items:", neededItems);
    console.log("[ShoppingPage] Active Shops:", activeShops);

    let assignments = {};
    let assignedItemNames = new Set(); // Track assigned items

    neededItems.forEach(item => {
      let bestShopName = null;

      // Priority 0: Item-specific only_shop (if set, must be selected or item is unallocated)
      if (item.only_shop && item.only_shop.trim()) {
        if (activeShopNames.includes(item.only_shop)) {
          bestShopName = item.only_shop;
        }
        // If only_shop is set but not selected, item remains unallocated
      } else {
        // Priority 1: Item-specific preferred shop
        if (item.preferred_shop && item.preferred_shop.trim() && activeShopNames.includes(item.preferred_shop)) {
          bestShopName = item.preferred_shop;
        } else {
          // Priority 2: Find any active shop that sells this item type
          for (const shop of activeShops) {
            const itemTypesSoldByShopType = shopTypeToItemTypesMap[shop.shop_type] || [];
            if (itemTypesSoldByShopType.includes(item.item_type)) {
              bestShopName = shop.name;
              break; // Pick the first compatible shop found
            }
          }
        }
      }

      if (bestShopName) {
        if (!assignments[bestShopName]) {
          assignments[bestShopName] = [];
        }
        assignments[bestShopName].push(item);
        assignedItemNames.add(item.name); // Mark as assigned
      }
    });

    console.log("[ShoppingPage] Assigned Item Names:", assignedItemNames);

    // Identify unallocated items
    const unallocatedItems = neededItems.filter(item => !assignedItemNames.has(item.name));
    console.log("[ShoppingPage] Unallocated Items:", unallocatedItems);

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

    console.log("[ShoppingPage] Final Purchase List (Allocated):", finalList);
    return { allocated: finalList, unallocated: unallocatedItems }; // Return both
  }, [appData, selectedShops]);

  const updateServerList = (newList) => {
    fetch('/api/item-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newList),
    }).catch(error => setError(error.message));
  };

  const handleTickChange = (event) => {
    const { name, checked } = event.target;
    setTickedItems(prev => ({ ...prev, [name]: checked }));
  };

  const handleDefer = async (itemName) => {
    try {
      // Fetch the latest items data to avoid race conditions
      const allDataRes = await fetch('/api/all-data');
      const allData = await allDataRes.json();
      const currentItems = allData.items || [];

      // Find the item and mark it as deferred
      const updatedItems = currentItems.map(item => {
        if (item.name === itemName) {
          return { ...item, is_deferred: true };
        }
        return item;
      });

      // Persist the change to the server
      await fetch('/api/data/items.yaml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItems),
      });

      // Re-fetch all data to ensure the UI is fully consistent with the server
      // This will cause the purchaseList to recalculate and exclude the deferred item
      await fetch('/api/all-data')
        .then(response => response.json())
        .then(data => setAppData(data))
        .catch(err => setError(err.message));

    } catch (err) {
      setError(`Failed to defer item: ${err.message}`);
    }
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
          {purchaseList.allocated.length > 0 ? (
            <>
              {purchaseList.allocated.map(shopData => (
                <div key={shopData.shopName}>
                  <h3>{shopData.shopName}</h3>
                  <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                    {shopData.items.map(item => {
                      // Determine if item is in preferred shop
                      const isInPreferredShop = item.preferred_shop && item.preferred_shop.trim() === shopData.shopName;
                      let preferenceIndicator = null;
                      
                      if (isInPreferredShop) {
                        preferenceIndicator = '👍';
                      } else if (item.preferred_shop && item.preferred_shop.trim()) {
                        preferenceIndicator = `☹️ (${item.preferred_shop} preferred)`;
                      }
                      
                      return (
                        <li key={item.name} style={{ textDecoration: tickedItems[item.name] ? 'line-through' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #eee', gap: '12px', flexWrap: 'nowrap' }}>
                          <label style={{ flex: 1 }}>
                            <input type="checkbox" name={item.name} checked={tickedItems[item.name] || false} onChange={handleTickChange} />
                            {item.name} {preferenceIndicator && <span style={{ marginLeft: '5px', fontSize: '0.9em' }}>{preferenceIndicator}</span>} <small>({item.item_type})</small>
                          </label>
                          <button onClick={() => handleDefer(item.name)} style={{ marginLeft: '0', fontSize: '0.8em', padding: '6px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}>Defer</button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {hasTickedItems && <button onClick={handlePurge}>Purge Ticked Items</button>}
            </>
          ) : (
            <p>Select one or more shops to generate a purchase list.</p>
          )}

          {purchaseList.unallocated.length > 0 && (
            <>
              <hr />
              <h2>3. Unallocated Items</h2>
              <p>These items could not be allocated to your selected shops:</p>
              <ul>
                {purchaseList.unallocated.map(item => {
                  // Determine suggested shop
                  let suggestion = null;
                  const shopTypeToItemTypesMap = appData.shopTypeToItemTypes || {};
                  
                  if (item.only_shop && item.only_shop.trim()) {
                    // If only_shop is set, suggest that shop
                    suggestion = `(select ${item.only_shop})`;
                  } else if (item.preferred_shop && item.preferred_shop.trim()) {
                    // If preferred_shop is set, suggest that
                    suggestion = `(try ${item.preferred_shop})`;
                  } else {
                    // Find first shop that sells this item type
                    const shopWithItemType = appData.shops.find(shop => {
                      const itemTypesSoldByShopType = shopTypeToItemTypesMap[shop.shop_type] || [];
                      return itemTypesSoldByShopType.includes(item.item_type);
                    });
                    if (shopWithItemType) {
                      suggestion = `(available at ${shopWithItemType.name})`;
                    } else {
                      suggestion = '(no shop sells this item type)';
                    }
                  }
                  
                  return (
                    <li key={item.name}>
                      {item.name} <small>({item.item_type})</small> {suggestion && <span style={{ marginLeft: '8px', color: '#666', fontSize: '0.9em' }}>{suggestion}</span>}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ShoppingPage;

