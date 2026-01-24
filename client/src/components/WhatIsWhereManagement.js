import React, { useState, useEffect } from 'react';

const BLANK_MAPPING = { item_type: '', preferred_shop_types: '' };

function WhatIsWhereManagement({ whatIsWhere, items, shopTypes, onUpdate }) {
  const [formState, setFormState] = useState(BLANK_MAPPING);
  const [isEditing, setIsEditing] = useState(false);
  const [availableItemTypes, setAvailableItemTypes] = useState([]);

  useEffect(() => {
    if (items) {
      const uniqueItemTypes = [...new Set(items.map(item => item.item_type))];
      setAvailableItemTypes(uniqueItemTypes);
    }
  }, [items]);

  if (!whatIsWhere || !items || !shopTypes) {
    return <p>Loading WhatIsWhere data...</p>;
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (itemType, preferredShopTypes) => {
    setIsEditing(true);
    setFormState({ item_type: itemType, preferred_shop_types: preferredShopTypes.join(', ') });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormState(BLANK_MAPPING);
  };

  const handleDelete = (itemTypeToDelete) => {
    const updatedWhatIsWhere = { ...whatIsWhere };
    delete updatedWhatIsWhere[itemTypeToDelete];
    onUpdate(updatedWhatIsWhere);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.item_type.trim() || !formState.preferred_shop_types.trim()) {
      alert('Item Type and Preferred Shop Types are required.');
      return;
    }

    const newPreferredShopTypes = formState.preferred_shop_types.split(',').map(s => s.trim()).filter(s => s);
    // Validate that all entered shop types exist
    const invalidShopTypes = newPreferredShopTypes.filter(type => !shopTypes.includes(type));
    if (invalidShopTypes.length > 0) {
      alert(`Invalid Shop Type(s) entered: ${invalidShopTypes.join(', ')}. Please use existing shop types.`);
      return;
    }

    const updatedWhatIsWhere = { ...whatIsWhere };

    if (isEditing) {
      updatedWhatIsWhere[formState.item_type] = newPreferredShopTypes;
    } else {
      if (updatedWhatIsWhere[formState.item_type]) {
        alert('A mapping for this Item Type already exists.');
        return;
      }
      updatedWhatIsWhere[formState.item_type] = newPreferredShopTypes;
    }
    onUpdate(updatedWhatIsWhere);
    handleCancel();
  };

  return (
    <section>
      <h3>What Is Where (Item Type to Preferred Shop Types)</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Item Type</th>
            <th>Preferred Shop Types (Ordered)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(whatIsWhere).map(([itemType, preferredShopTypes]) => (
            <tr key={itemType}>
              <td>{itemType}</td>
              <td>{preferredShopTypes.join(', ')}</td>
              <td>
                <button onClick={() => handleEditClick(itemType, preferredShopTypes)}>Edit</button>
                <button onClick={() => handleDelete(itemType)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h4>{isEditing ? 'Edit Mapping' : 'Add New Mapping'}</h4>
      <form onSubmit={handleSubmit}>
        <select
          name="item_type"
          value={formState.item_type}
          onChange={handleFormChange}
          disabled={isEditing}
        >
          <option value="">Select Item Type</option>
          {availableItemTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <textarea
          name="preferred_shop_types"
          placeholder={`Preferred Shop Types (comma-separated, e.g., '${shopTypes.slice(0, 3).join(', ')}...')`}
          value={formState.preferred_shop_types}
          onChange={handleFormChange}
          rows="3"
          style={{ width: '100%' }}
        ></textarea>
        <small>Available Shop Types: {shopTypes.join(', ')}</small>
        <button type="submit">{isEditing ? 'Update Mapping' : 'Add Mapping'}</button>
        {isEditing && <button type="button" onClick={handleCancel}>Cancel</button>}
      </form>
    </section>
  );
}

export default WhatIsWhereManagement;
