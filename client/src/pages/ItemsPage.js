import React, { useState, useEffect } from 'react';
import ItemManagement from '../components/ItemManagement';

function ItemsPage() {
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/all-data')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
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
    setAppData(prev => ({ ...prev, items: data }));
    fetch(`/api/data/${fileName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) {
        fetchData();
      }
    })
    .catch(error => {
      console.error(`Error during fetch for ${fileName}:`, error);
      fetchData();
    });
  };

  return (
    <div>
      <h2>Items</h2>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {appData && (
        <ItemManagement
          items={appData.items}
          shops={appData.shops}
          itemTypes={appData.itemTypesList}
          shopTypeToItemTypes={appData.shopTypeToItemTypes}
          onUpdate={(newData) => handleUpdate('items.yaml', newData)}
        />
      )}
    </div>
  );
}

export default ItemsPage;
