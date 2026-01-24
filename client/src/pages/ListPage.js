import React, { useState, useEffect } from 'react';

function ListPage() {
  const [appData, setAppData] = useState(null); // New state for all data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [suggestions, setSuggestions] = useState([]); // New state for autocomplete suggestions

  // Fetch all data
  useEffect(() => {
    fetch('http://localhost:3001/api/all-data') // Fetch all data
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setAppData(data); // Store all data
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Function to update the item list on the server
  const updateServerItemList = (newList) => { // Renamed for clarity
    fetch('http://localhost:3001/api/item-list', {
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

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewItem(value);

    if (appData && appData.items && value.length > 0) {
      const filteredSuggestions = appData.items
        .filter(item => item.name.toLowerCase().includes(value.toLowerCase()))
        .map(item => item.name);
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

    const itemExistsInModel = appData.items.some(item => item.name === newItem.trim());
    if (!itemExistsInModel) {
      alert('Item must be defined in the data model (Management Page -> Items) before adding to the list.');
      return;
    }

    const currentItemList = appData.itemList || [];
    if (currentItemList.includes(newItem.trim())) { // Prevent adding duplicates to the list
      alert('Item is already in the list.');
      return;
    }

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

  const itemListToDisplay = appData ? (appData.itemList || []) : []; // Get itemList from appData

  return (
    <div>
      <h1>Item List Management</h1>
      <p>This is the master list of all items you currently need.</p>
      
      <form onSubmit={handleAddItem}>
        <input
          type="text"
          value={newItem}
          onChange={handleInputChange} // Use new handler for input change
          placeholder="Add an item from the data model"
          // list="item-suggestions" // Can be used for native browser autocomplete, but we're building custom
        />
        <button type="submit">Add Item</button>
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
        <ul>
          {itemListToDisplay.map((item, index) => (
            <li key={index}>
              {item}
              <button onClick={() => handleDeleteItem(index)} style={{ marginLeft: '10px' }}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ListPage;
