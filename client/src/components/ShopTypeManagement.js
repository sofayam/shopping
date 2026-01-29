import React, { useState } from 'react';

function ShopTypeManagement({ shopTypes, onUpdate }) {
  const [newShopType, setNewShopType] = useState('');

  console.log("[ShopTypeManagement] Current shopTypes prop:", shopTypes);

  if (!shopTypes) {
    return <p>Loading shop types...</p>;
  }

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newShopType.trim() || shopTypes.includes(newShopType.trim())) {
      // Prevent adding empty or duplicate types
      return;
    }
    const updatedShopTypes = [...shopTypes, newShopType.trim()];
    onUpdate(updatedShopTypes);
    setNewShopType('');
  };

  const handleDelete = (typeToDelete) => {
    const updatedShopTypes = shopTypes.filter(type => type !== typeToDelete);
    onUpdate(updatedShopTypes);
  };

  return (
    <section>
      <h3>Shop Types</h3>
      <ul>
        {shopTypes.map(type => (
          <li key={type}>
            {type}
            <button onClick={() => handleDelete(type)} style={{ marginLeft: '10px' }}>Delete</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd}>
        <input
          type="text"
          value={newShopType}
          onChange={(e) => setNewShopType(e.target.value)}
          placeholder="New shop type"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <button type="submit">Add Shop Type</button>
      </form>
    </section>
  );
}

export default ShopTypeManagement;
