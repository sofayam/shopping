import React, { useState } from 'react';

function ItemTypeManagement({ itemTypes, onUpdate }) {
  const [newItemType, setNewItemType] = useState('');

  if (!itemTypes) {
    return <p>Loading item types...</p>;
  }

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newItemType.trim() || itemTypes.includes(newItemType.trim())) {
      // Prevent adding empty or duplicate types
      return;
    }
    const updatedItemTypes = [...itemTypes, newItemType.trim()];
    onUpdate(updatedItemTypes);
    setNewItemType('');
  };

  const handleDelete = (typeToDelete) => {
    const updatedItemTypes = itemTypes.filter(type => type !== typeToDelete);
    onUpdate(updatedItemTypes);
  };

  return (
    <section>
      <h3>Item Types</h3>
      <ul>
        {itemTypes.map(type => (
          <li key={type}>
            {type}
            <button onClick={() => handleDelete(type)} style={{ marginLeft: '10px' }}>Delete</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd}>
        <input
          type="text"
          value={newItemType}
          onChange={(e) => setNewItemType(e.target.value)}
          placeholder="New item type"
        />
        <button type="submit">Add Item Type</button>
      </form>
    </section>
  );
}

export default ItemTypeManagement;
