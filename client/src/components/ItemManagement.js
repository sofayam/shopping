import React, { useState, useEffect } from 'react';

const BLANK_ITEM = { name: '', item_type: '', preferred_shop: '', only_shop: '' };

function ItemManagement({ items, shops, itemTypes, shopTypeToItemTypes, onUpdate }) { // Added shopTypeToItemTypes prop
  const [formState, setFormState] = useState(BLANK_ITEM);
  const [isEditing, setIsEditing] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);

  if (!items || !shops || !itemTypes || !shopTypeToItemTypes) { // Check for shopTypeToItemTypes prop
    return <p>Loading item data...</p>;
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));

    if (name === 'name' && !isEditing && value.length > 0) {
      const filteredSuggestions = items
        .filter(item => item.name.toLowerCase().includes(value.toLowerCase()))
        .map(item => item.name);
      setNameSuggestions(filteredSuggestions);
    } else {
      setNameSuggestions([]);
    }
  };

  const handleSelectNameSuggestion = (suggestion) => {
    setFormState(prev => ({ ...prev, name: suggestion }));
    setNameSuggestions([]);
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setFormState(item);
    setNameSuggestions([]); // Clear suggestions when editing
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormState(BLANK_ITEM);
    setNameSuggestions([]); // Clear suggestions on cancel
  };

  const handleDelete = (nameToDelete) => {
    const updatedItems = items.filter(item => item.name !== nameToDelete);
    onUpdate(updatedItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.item_type.trim()) {
      alert('Name and Item Type are required.');
      return;
    }

    // Validate preferred shop if selected
    if (formState.preferred_shop && formState.preferred_shop.trim()) {
      const selectedShop = shops.find(shop => shop.name === formState.preferred_shop);

      if (!selectedShop) {
        alert(`Preferred Shop "${formState.preferred_shop}" does not exist.`);
        return;
      }
      
      const itemTypesSoldByShopType = shopTypeToItemTypes[selectedShop.shop_type] || [];
      if (!itemTypesSoldByShopType.includes(formState.item_type)) {
        alert(`Preferred Shop "${selectedShop.name}" (type: ${selectedShop.shop_type}) does not sell Item Type "${formState.item_type}" according to Shop Type to Item Types Sold mapping.`);
        return;
      }
    }

    // Validate only_shop if selected
    if (formState.only_shop && formState.only_shop.trim()) {
      const selectedShop = shops.find(shop => shop.name === formState.only_shop);

      if (!selectedShop) {
        alert(`Only Shop "${formState.only_shop}" does not exist.`);
        return;
      }
      
      const itemTypesSoldByShopType = shopTypeToItemTypes[selectedShop.shop_type] || [];
      if (!itemTypesSoldByShopType.includes(formState.item_type)) {
        alert(`Only Shop "${selectedShop.name}" (type: ${selectedShop.shop_type}) does not sell Item Type "${formState.item_type}" according to Shop Type to Item Types Sold mapping.`);
        return;
      }
    }

    let updatedItems;
    if (isEditing) {
      updatedItems = items.map(item => item.name === formState.name ? formState : item);
    } else {
      if (items.some(item => item.name === formState.name.trim())) {
        alert('An item with this name already exists.');
        return;
      }
      updatedItems = [...items, { ...formState, name: formState.name.trim() }];
    }
    onUpdate(updatedItems);
    handleCancel();
  };

  // Filter shops for the preferred shop dropdown
  const filteredPreferredShops = formState.item_type
    ? shops.filter(shop => {
        const itemTypesSoldByShopType = shopTypeToItemTypes[shop.shop_type] || [];
        return itemTypesSoldByShopType.includes(formState.item_type);
      })
    : [];

  // Filter shops for the only shop dropdown (same logic as preferred shop)
  const filteredOnlyShops = formState.item_type
    ? shops.filter(shop => {
        const itemTypesSoldByShopType = shopTypeToItemTypes[shop.shop_type] || [];
        return itemTypesSoldByShopType.includes(formState.item_type);
      })
    : [];

  return (
    <section>
      <h3>Items</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Item Type</th>
            <th>Preferred Shop</th>
            <th>Only Shop</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.name}>
              <td>{item.name}</td>
              <td>{item.item_type}</td>
              <td>{item.preferred_shop || 'None'}</td>
              <td>{item.only_shop || 'None'}</td>
              <td>
                <button onClick={() => handleEditClick(item)}>Edit</button>
                <button onClick={() => handleDelete(item.name)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h4>{isEditing ? 'Edit Item' : 'Add New Item'}</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type="text"
            name="name"
            placeholder="Item Name"
            value={formState.name}
            onChange={handleFormChange}
            disabled={isEditing} // Prevent changing name on edit to preserve key
          />
          {!isEditing && nameSuggestions.length > 0 && (
            <ul style={{ listStyleType: 'none', padding: 0, margin: '0', border: '1px solid #ccc', maxHeight: '150px', overflowY: 'auto', background: 'white', position: 'absolute', zIndex: 100, width: '100%' }}>
              {nameSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSelectNameSuggestion(suggestion)}
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
        <select name="item_type" value={formState.item_type} onChange={handleFormChange}>
          <option value="">Select Type</option>
          {itemTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select name="preferred_shop" value={formState.preferred_shop} onChange={handleFormChange}>
          <option value="">No Preference</option>
          {filteredPreferredShops.map(shop => <option key={shop.name} value={shop.name}>{shop.name}</option>)}
        </select>
        <select name="only_shop" value={formState.only_shop} onChange={handleFormChange}>
          <option value="">No Restriction</option>
          {filteredOnlyShops.map(shop => <option key={shop.name} value={shop.name}>{shop.name}</option>)}
        </select>
        <button type="submit">{isEditing ? 'Update Item' : 'Add Item'}</button>
        {isEditing && <button type="button" onClick={handleCancel}>Cancel</button>}
      </form>
    </section>
  );
}

export default ItemManagement;

