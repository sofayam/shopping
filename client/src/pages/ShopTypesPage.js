import React, { useState, useEffect } from 'react';
import ShopTypeManagement from '../components/ShopTypeManagement';

function ShopTypesPage() {
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
    setAppData(prev => ({ ...prev, [fileName.replace('.yaml', '').replace(/_([a-z])/g, g => g[1].toUpperCase())]: data }));
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
      <h2>Shop Types</h2>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {appData && (
        <ShopTypeManagement
          shopTypes={appData.shopTypes}
          onUpdate={(newData) => handleUpdate('shop_types.yaml', newData)}
        />
      )}
    </div>
  );
}

export default ShopTypesPage;
