import React, { useState, useEffect } from 'react';
import ShopTypeManagement from '../components/ShopTypeManagement';
import ItemTypeManagement from '../components/ItemTypeManagement';
import ItemManagement from '../components/ItemManagement';
import ShopManagement from '../components/ShopManagement';
// import WhatIsWhereManagement from '../components/WhatIsWhereManagement'; // Removed
import ShopTypeToItemTypesManagement from '../components/ShopTypeToItemTypesManagement';

function ManagementPage() {
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    console.log("[ManagementPage] Fetching data...");
    fetch('/api/all-data')
      .then(response => {
        if (!response.ok) {
          console.error(`[ManagementPage] Network response not ok: ${response.status}`);
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log("[ManagementPage] Data fetched successfully:", data);
        setAppData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("[ManagementPage] Error fetching data:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = (fileName, data) => {
    console.log(`[ManagementPage] Attempting to update ${fileName} with data:`, data);
    // Optimistically update local state
    let key = fileName.replace('.yaml', '').replace(/_([a-z])/g, g => g[1].toUpperCase());
    if (fileName === 'item_types.yaml') {
      key = 'itemTypesList';
    } else if (fileName === 'shop_type_to_item_types.yaml') {
      key = 'shopTypeToItemTypes';
    }
    setAppData(prev => ({ ...prev, [key]: data }));

    // Update server
    fetch(`/api/data/${fileName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) {
        console.error(`[ManagementPage] Server update failed for ${fileName}. Status: ${response.status}`);
        fetchData();
      } else {
        console.log(`[ManagementPage] Server update successful for ${fileName}.`);
      }
    })
    .catch(error => {
      console.error(`[ManagementPage] Error during fetch for ${fileName}:`, error);
      fetchData();
    });
  };

  console.log("[ManagementPage] Current appData state:", appData);
  console.log("[ManagementPage] Current loading state:", loading);
  console.log("[ManagementPage] Current error state:", error);

  return (
    <div>
      <h1>Data Management</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {appData && (
        <div>
          <ShopTypeManagement
            shopTypes={appData.shopTypes}
            onUpdate={(newData) => handleUpdate('shop_types.yaml', newData)}
          />
          <hr />
          <ItemTypeManagement
            itemTypes={appData.itemTypesList}
            onUpdate={(newData) => handleUpdate('item_types.yaml', newData)}
          />
          <hr />
          <ShopTypeToItemTypesManagement
            shopTypeToItemTypes={appData.shopTypeToItemTypes}
            shopTypes={appData.shopTypes}
            itemTypes={appData.itemTypesList}
            onUpdate={(newData) => handleUpdate('shop_type_to_item_types.yaml', newData)}
          />
          <hr />
          <ItemManagement
            items={appData.items}
            shops={appData.shops}
            itemTypes={appData.itemTypesList}
            shopTypeToItemTypes={appData.shopTypeToItemTypes}
            onUpdate={(newData) => handleUpdate('items.yaml', newData)}
          />
          <hr />
          <ShopManagement
            shops={appData.shops}
            shopTypes={appData.shopTypes}
            itemTypes={appData.itemTypesList}
            shopTypeToItemTypes={appData.shopTypeToItemTypes} // Pass new prop
            onUpdate={(newData) => handleUpdate('shops.yaml', newData)}
          />
          <hr />
          {/* WhatIsWhereManagement removed */}
        </div>
      )}
    </div>
  );
}

export default ManagementPage;



