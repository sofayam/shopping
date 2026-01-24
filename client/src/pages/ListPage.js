import React, { useState, useEffect } from 'react';

function ListPage() {
  const [itemList, setItemList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');

  // Fetch initial list
  useEffect(() => {
    fetch('http://localhost:3001/api/item-list')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setItemList(data || []); // Ensure itemList is an array
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Function to update the list on the server
  const updateServerList = (newList) => {
    fetch('http://localhost:3001/api/item-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newList),
    })
    .then(response => {
      if (!response.ok) {
        // If server update fails, revert the UI to the previous state
        throw new Error('Failed to update list on server.');
      }
      // On success, the optimistic UI update is now confirmed.
    })
    .catch(error => {
      setError(error.message);
      // Consider reverting state here if the update fails
    });
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return; // Don't add empty items
    const newList = [...itemList, newItem.trim()];
    setItemList(newList); // Optimistic UI update
    updateServerList(newList);
    setNewItem(''); // Clear input field
  };

  const handleDeleteItem = (indexToDelete) => {
    const newList = itemList.filter((_, index) => index !== indexToDelete);
    setItemList(newList); // Optimistic UI update
    updateServerList(newList);
  };

  return (
    <div>
      <h1>Item List Management</h1>
      <p>This is the master list of all items you currently need.</p>
      
      <form onSubmit={handleAddItem}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add a new item"
        />
        <button type="submit">Add Item</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      
      {itemList && (
        <ul>
          {itemList.map((item, index) => (
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
