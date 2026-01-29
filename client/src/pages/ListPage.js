import React, { useState, useEffect } from 'react';
import AddItemWizard from '../components/AddItemWizard';

function ListPage() {
  const [appData, setAppData] = useState(null); // New state for all data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [suggestions, setSuggestions] = useState([]); // New state for autocomplete suggestions
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardItemName, setWizardItemName] = useState('');

  // Fetch all data
  useEffect(() => {
    fetch('/api/all-data') // Fetch all data
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
      // Item doesn't exist, open wizard to create it
      setWizardItemName(newItem.trim());
      setWizardOpen(true);
      return;
    }

    // Item exists, add it to list
    const newList = [...currentItemList, newItem.trim()];
    setAppData(prev => ({ ...prev, itemList: newList })); // Update local appData
    updateServerItemList(newList); // Update server
    setNewItem('');
    setSuggestions([]); // Clear suggestions after adding
  };

  const handleWizardComplete = (itemName) => {
    setWizardOpen(false);
    
    // Refresh app data to get the newly created item
    fetch('/api/all-data')
      .then(response => response.json())
      .then(data => {
        setAppData(data);
        
        // Now add the item to the list
        const currentItemList = data.itemList || [];
        const newList = [...currentItemList, itemName];
        updateServerItemList(newList);
        setAppData(prev => ({ ...prev, itemList: newList }));
        
        setNewItem('');
        setSuggestions([]);
      })
      .catch(error => setError(error.message));
  };

  const handleWizardCancel = () => {
    setWizardOpen(false);
    setWizardItemName('');
    setNewItem('');
    setSuggestions([]);
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
      
      <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={newItem}
          onChange={handleInputChange}
          placeholder="Add an item from the data model"
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

      {wizardOpen && appData && (
        <AddItemWizard
          itemName={wizardItemName}
          itemTypes={appData.itemTypesList || []}
          shopTypes={appData.shopTypes || []}
          shopTypeToItemTypes={appData.shopTypeToItemTypes || {}}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      )}
    </div>
  );
}

export default ListPage;
