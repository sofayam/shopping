import React, { useState, useEffect } from 'react';
import ShopTypeManagement from '../components/ShopTypeManagement';
import ItemTypeManagement from '../components/ItemTypeManagement'; // Import new component
import ItemManagement from '../components/ItemManagement';
import ShopManagement from '../components/ShopManagement';
import WhatIsWhereManagement from '../components/WhatIsWhereManagement';

function ManagementPage() {
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/all-data')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        setAppData(data);
        setLoading(false);
      })
      .catch(error => {
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
        // If server update fails, refetch data to revert optimistic update
        fetchData();
      } else {
        console.log(`[ManagementPage] Server update successful for ${fileName}.`);
      }
    })
    .catch(error => {
      console.error(`[ManagementPage] Error during fetch for ${fileName}:`, error);
      fetchData(); // Refetch on error
    });
  };

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
            itemTypes={appData.itemTypesList} // Use the new itemTypesList
            onUpdate={(newData) => handleUpdate('item_types.yaml', newData)}
          />
          <hr />
          <ItemManagement
            items={appData.items}
            shops={appData.shops}
            itemTypes={appData.itemTypesList} // Pass itemTypes explicitly
            onUpdate={(newData) => handleUpdate('items.yaml', newData)}
          />
          <hr />
          <ShopManagement
            shops={appData.shops}
            shopTypes={appData.shopTypes}
            itemTypes={appData.itemTypesList} // Pass itemTypes explicitly
            onUpdate={(newData) => handleUpdate('shops.yaml', newData)}
          />
          <hr />
          <WhatIsWhereManagement
            whatIsWhere={appData.whatIsWhere}
            itemTypes={appData.itemTypesList} // Pass itemTypes explicitly
            shopTypes={appData.shopTypes}
            onUpdate={(newData) => handleUpdate('what_is_where.yaml', newData)}
          />
          <hr />
        </div>
      )}
    </div>
  );
}

export default ManagementPage;
