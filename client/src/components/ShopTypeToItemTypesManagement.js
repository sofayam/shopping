import React, { useState } from 'react';

const BLANK_MAPPING = { shop_type: '', item_types: [] };

function ShopTypeToItemTypesManagement({ shopTypeToItemTypes, shopTypes, itemTypes, onUpdate }) {
  const [formState, setFormState] = useState(BLANK_MAPPING);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemType, setCurrentItemType] = useState(''); // For adding to item_types list
  const [itemTypeSuggestions, setItemTypeSuggestions] = useState([]); // For item_type autocomplete

  if (!shopTypeToItemTypes || !shopTypes || !itemTypes) {
    return <p>Loading Shop Type to Item Types data...</p>;
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleItemTypeInputChange = (e) => {
    const value = e.target.value;
    setCurrentItemType(value);

    if (value.length > 0) {
      const filteredSuggestions = itemTypes
        .filter(type => type.toLowerCase().includes(value.toLowerCase()))
        .filter(type => !formState.item_types.includes(type)) // Don't suggest already added types
        .map(type => type);
      setItemTypeSuggestions(filteredSuggestions);
    } else {
      setItemTypeSuggestions([]);
    }
  };

  const handleSelectItemTypeSuggestion = (suggestion) => {
    setCurrentItemType(suggestion);
    setItemTypeSuggestions([]);
  };

  const handleAddItemType = (e) => {
    e.preventDefault();
    const typeToAdd = currentItemType.trim();
    if (!typeToAdd) return;

    if (!itemTypes.includes(typeToAdd)) {
      alert(`"${typeToAdd}" is not a valid Item Type. Please add it via the Item Types management section first.`);
      return;
    }
    if (formState.item_types.includes(typeToAdd)) {
      alert(`"${typeToAdd}" is already in the Item Types list for this shop type.`);
      return;
    }

    setFormState(prev => ({
      ...prev,
      item_types: [...prev.item_types, typeToAdd],
    }));
    setCurrentItemType('');
    setItemTypeSuggestions([]);
  };

  const handleRemoveItemType = (typeToRemove) => {
    setFormState(prev => ({
      ...prev,
      item_types: prev.item_types.filter(type => type !== typeToRemove),
    }));
  };

  const handleMoveItemType = (typeToMove, direction) => {
    const currentIndex = formState.item_types.indexOf(typeToMove);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= formState.item_types.length) return;

    const newItemTypes = [...formState.item_types];
    const [removed] = newItemTypes.splice(currentIndex, 1);
    newItemTypes.splice(newIndex, 0, removed);

    setFormState(prev => ({ ...prev, item_types: newItemTypes }));
  };

  const handleEditClick = (shopType, itemTypesList) => {
    setIsEditing(true);
    setFormState({ shop_type: shopType, item_types: itemTypesList || [] });
    setCurrentItemType('');
    setItemTypeSuggestions([]);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormState(BLANK_MAPPING);
    setCurrentItemType('');
    setItemTypeSuggestions([]);
  };

  const handleDelete = (shopTypeToDelete) => {
    const updatedMap = { ...shopTypeToItemTypes };
    delete updatedMap[shopTypeToDelete];
    onUpdate(updatedMap);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.shop_type.trim() || formState.item_types.length === 0) {
      alert('Shop Type and at least one Item Type are required.');
      return;
    }

    if (!shopTypes.includes(formState.shop_type)) {
      alert(`"${formState.shop_type}" is not a valid Shop Type. Please add it via the Shop Types management section first.`);
      return;
    }

    const updatedMap = { ...shopTypeToItemTypes };

    if (isEditing) {
      updatedMap[formState.shop_type] = formState.item_types;
    } else {
      if (updatedMap[formState.shop_type]) {
        alert('A mapping for this Shop Type already exists.');
        return;
      }
      updatedMap[formState.shop_type] = formState.item_types;
    }
    onUpdate(updatedMap);
    handleCancel();
  };

  const unmappedShopTypes = shopTypes.filter(type => !shopTypeToItemTypes[type]);

  return (
    <section>
      <h3>Shop Type to Item Types Sold</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Shop Type</th>
            <th>Item Types Sold (Ordered)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(shopTypeToItemTypes).map(([shopType, itemTypesList]) => (
            <tr key={shopType}>
              <td>{shopType}</td>
              <td>{itemTypesList.join(', ')}</td>
              <td>
                <button onClick={() => handleEditClick(shopType, itemTypesList)}>Edit</button>
                <button onClick={() => handleDelete(shopType)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h4>{isEditing ? 'Edit Mapping' : 'Add New Mapping'}</h4>
      <form onSubmit={handleSubmit}>
        <select
          name="shop_type"
          value={formState.shop_type}
          onChange={handleFormChange}
          disabled={isEditing}
        >
          <option value="">Select Shop Type</option>
          {isEditing ? (
            <option key={formState.shop_type} value={formState.shop_type}>{formState.shop_type}</option>
          ) : (
            unmappedShopTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))
          )}
        </select>

        <div style={{ marginTop: '15px', border: '1px solid #eee', padding: '10px' }}>
          <h5>Item Types Sold</h5>
          <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <input
              type="text"
              placeholder="Add Item Type"
              value={currentItemType}
              onChange={handleItemTypeInputChange}
              style={{ width: 'calc(100% - 70px)' }}
            />
            <button type="button" onClick={handleAddItemType} style={{ width: '60px', marginLeft: '5px' }}>Add</button>
            {itemTypeSuggestions.length > 0 && (
              <ul style={{ listStyleType: 'none', padding: 0, margin: '0', border: '1px solid #ccc', maxHeight: '150px', overflowY: 'auto', background: 'white', position: 'absolute', zIndex: 100, width: '100%' }}>
                {itemTypeSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSelectItemTypeSuggestion(suggestion)}
                    style={{ padding: '8px', cursor: 'pointer' }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e0e0e0'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ul style={{ listStyleType: 'none', padding: 0, marginTop: '10px' }}>
            {formState.item_types.map((type, index) => (
              <li key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', border: '1px solid #ddd', padding: '5px' }}>
                <span style={{ flexGrow: 1 }}>{type}</span>
                <button type="button" onClick={() => handleMoveItemType(type, 'up')} disabled={index === 0}>↑</button>
                <button type="button" onClick={() => handleMoveItemType(type, 'down')} disabled={index === formState.item_types.length - 1}>↓</button>
                <button type="button" onClick={() => handleRemoveItemType(type)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>

        <button type="submit">{isEditing ? 'Update Mapping' : 'Add Mapping'}</button>
        {isEditing && <button type="button" onClick={handleCancel}>Cancel</button>}
      </form>
    </section>
  );
}

export default ShopTypeToItemTypesManagement;
