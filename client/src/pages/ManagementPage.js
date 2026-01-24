import React, { useState, useEffect } from 'react';
import ShopTypeManagement from '../components/ShopTypeManagement';
import ItemManagement from '../components/ItemManagement'; // Import new component

function ManagementPage() {
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    fetch('http://localhost:3001/api/all-data')
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
    // Optimistically update local state
    const key = fileName.replace('.yaml', '').replace(/_([a-z])/g, g => g[1].toUpperCase());
    setAppData(prev => ({ ...prev, [key]: data }));

    // Update server
    fetch(`http://localhost:3001/api/data/${fileName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) {
        // If server update fails, refetch data to revert optimistic update
        fetchData();
      }
    })
    .catch(() => fetchData()); // Refetch on error
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
          <ItemManagement
            items={appData.items}
            shops={appData.shops}
            whatIsWhere={appData.whatIsWhere}
            onUpdate={(newData) => handleUpdate('items.yaml', newData)}
          />
          <hr />
          {/* Other management components will go here */}
        </div>
      )}
    </div>
  );
}

export default ManagementPage;
