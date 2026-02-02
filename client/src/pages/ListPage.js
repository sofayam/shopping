import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ListPage() {
  const navigate = useNavigate();
  const [appData, setAppData] = useState(null); // New state for all data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [suggestions, setSuggestions] = useState([]); // New state for autocomplete suggestions

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/all-data');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setAppData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  // Function to update the item list on the server
  const updateServerItemList = (newList) => { // Renamed for clarity
    fetch('/api/item-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newList),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update list on server.');
      }
    })
    .catch(error => {
      setError(error.message);
    });
  };

  const handleUndefer = async (itemName) => {
    try {
      // Fetch the latest items data to avoid race conditions
      const allDataRes = await fetch('/api/all-data');
      const allData = await allDataRes.json();
      const currentItems = allData.items || [];

      // Find the item and remove the is_deferred property
      const updatedItems = currentItems.map(item => {
        if (item.name === itemName) {
          const newItem = { ...item };
          delete newItem.is_deferred;
          return newItem;
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
      fetchData(); // Call the existing fetchData to refresh appData

    } catch (err) {
      setError(`Failed to undefer item: ${err.message}`);
    }
  };

  const handleDefer = async (itemName) => {
    try {
      // Fetch the latest items data to avoid race conditions
      const allDataRes = await fetch('/api/all-data');
      const allData = await allDataRes.json();
      const currentItems = allData.items || [];

      // Find the item and set is_deferred to true
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
      fetchData(); // Call the existing fetchData to refresh appData

    } catch (err) {
      setError(`Failed to defer item: ${err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewItem(value);

    if (appData && appData.items && value.length > 0) {
      const filteredSuggestions = appData.items
        .filter(item => {
          // Check if value matches name
          if (item.name.toLowerCase().includes(value.toLowerCase())) {
            return true;
          }
          // Check if value matches any nickname
          if (item.nicknames && Array.isArray(item.nicknames)) {
            return item.nicknames.some(nick => nick.toLowerCase().includes(value.toLowerCase()));
          }
          return false;
        })
        .map(item => item.name); // Always show canonical name
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setNewItem(suggestion);
    setSuggestions([]); // Clear suggestions after selection
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    if (!appData || !appData.items) { // Ensure appData and items are loaded
      alert('Data not loaded yet. Please wait.');
      return;
    }

    const currentItemList = appData.itemList || [];
    if (currentItemList.includes(newItem.trim())) { // Prevent adding duplicates to the list
      alert('Item is already in the list.');
      return;
    }

    const itemExistsInModel = appData.items.some(item => item.name === newItem.trim());
    
    if (!itemExistsInModel) {
      // Item doesn't exist, navigate to the creation page
      navigate(`/add-item/${newItem.trim()}`);
      return;
    }

    // Item exists, add it to list
    const newList = [...currentItemList, newItem.trim()];
    setAppData(prev => ({ ...prev, itemList: newList })); // Update local appData
    updateServerItemList(newList); // Update server
    setNewItem('');
    setSuggestions([]); // Clear suggestions after adding
  };

  const handleDeleteItem = (indexToDelete) => {
    if (!appData || !appData.itemList) return;

    const currentItemList = appData.itemList;
    const newList = currentItemList.filter((_, index) => index !== indexToDelete);
    setAppData(prev => ({ ...prev, itemList: newList })); // Update local appData
    updateServerItemList(newList); // Update server
  };

  const allAppItems = appData ? appData.items || [] : [];
  const deferredItems = allAppItems.filter(item => item.is_deferred);
  const activeItemList = appData ? (appData.itemList || []).filter(itemName => {
    const item = allAppItems.find(i => i.name === itemName);
    return item && !item.is_deferred;
  }) : [];

  return (
    <div>
      <h1>Item List Management</h1>
      <p>This is the master list of all items you currently need.</p>
      
      <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={newItem}
          onChange={handleInputChange}
          placeholder="Add an item to the list"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          style={{
            flex: 1,
            padding: '16px',
            fontSize: '18px',
            border: '2px solid #ccc',
            borderRadius: '4px',
            minHeight: '44px',
            WebkitAppearance: 'none',
            appearance: 'none',
          }}
        />
        <button 
          type="submit"
          style={{
            padding: '16px 24px',
            fontSize: '18px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            minHeight: '44px',
            whiteSpace: 'nowrap',
          }}
        >
          Add Item
        </button>
        {suggestions.length > 0 && (
          <ul style={{ listStyleType: 'none', padding: 0, margin: '5px 0', border: '1px solid #ccc', maxHeight: '150px', overflowY: 'auto', background: 'white', position: 'absolute', zIndex: 100 }}>
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                style={{ padding: '8px', cursor: 'pointer' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e0e0e0'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </form>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      
      {appData && ( // Render only when appData is loaded
        <>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            {activeItemList.map((itemName, index) => {
              const item = allAppItems.find(i => i.name === itemName);
              if (!item) return null; // Should not happen if filtering is correct

              return (
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee', marginBottom: '0', gap: '16px', flexWrap: 'nowrap' }}>
                  <span style={{ fontSize: '1.05rem', flex: 1 }}>{item.name} <small>({item.item_type})</small></span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '100px', flexShrink: 0 }}>
                    <button onClick={() => handleDefer(item.name)} style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                      Defer
                    </button>
                    <button onClick={() => handleDeleteItem(index)} style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {deferredItems.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h2>Deferred Items</h2>
              <p>These items are currently deferred and can be rescheduled:</p>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                {deferredItems.map(item => (
                  <li key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee', marginBottom: '0', gap: '16px', flexWrap: 'nowrap' }}>
                    <span style={{ fontSize: '1.05rem', flex: 1 }}>{item.name} <small>({item.item_type})</small></span>
                    <button onClick={() => handleUndefer(item.name)} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                      Undefer
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ListPage;
