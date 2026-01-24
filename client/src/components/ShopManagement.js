import React, { useState, useEffect } from 'react';

const BLANK_SHOP = { name: '', shop_type: '', aisle_order: '' };

function ShopManagement({ shops, shopTypes, itemTypes, onUpdate }) { // itemTypes prop
  const [formState, setFormState] = useState(BLANK_SHOP);
  const [isEditing, setIsEditing] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);

  // No longer need useEffect to derive itemTypes from whatIsWhere
  // useEffect(() => {
  //   if (whatIsWhere) {
  //     setAvailableItemTypes(Object.keys(whatIsWhere));
  //   }
  // }, [whatIsWhere]);

  if (!shops || !shopTypes || !itemTypes) { // Check for itemTypes prop
    return <p>Loading shop data...</p>;
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));

    if (name === 'name' && !isEditing && value.length > 0) {
      const filteredSuggestions = shops
        .filter(shop => shop.name.toLowerCase().includes(value.toLowerCase()))
        .map(shop => shop.name);
      setNameSuggestions(filteredSuggestions);
    } else {
      setNameSuggestions([]);
    }
  };

  const handleSelectNameSuggestion = (suggestion) => {
    setFormState(prev => ({ ...prev, name: suggestion }));
    setNameSuggestions([]);
  };

  const handleEditClick = (shop) => {
    setIsEditing(true);
    setFormState({ ...shop, aisle_order: shop.aisle_order ? shop.aisle_order.join(', ') : '' });
    setNameSuggestions([]); // Clear suggestions when editing
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormState(BLANK_SHOP);
    setNameSuggestions([]); // Clear suggestions on cancel
  };

  const handleDelete = (nameToDelete) => {
    const updatedShops = shops.filter(shop => shop.name !== nameToDelete);
    onUpdate(updatedShops);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.shop_type.trim()) {
      alert('Name and Shop Type are required.');
      return;
    }

    const newShop = {
      ...formState,
      name: formState.name.trim(),
      shop_type: formState.shop_type.trim(),
      aisle_order: formState.aisle_order.split(',').map(s => s.trim()).filter(s => s),
    };

    let updatedShops;
    if (isEditing) {
      updatedShops = shops.map(shop => shop.name === newShop.name ? newShop : shop);
    } else {
      if (shops.some(shop => shop.name === newShop.name)) {
        alert('A shop with this name already exists.');
        return;
      }
      updatedShops = [...shops, newShop];
    }
    onUpdate(updatedShops);
    handleCancel();
  };

  return (
    <section>
      <h3>Shops</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Shop Type</th>
            <th>Aisle Order</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shops.map(shop => (
            <tr key={shop.name}>
              <td>{shop.name}</td>
              <td>{shop.shop_type}</td>
              <td>{shop.aisle_order ? shop.aisle_order.join(', ') : 'N/A'}</td>
              <td>
                <button onClick={() => handleEditClick(shop)}>Edit</button>
                <button onClick={() => handleDelete(shop.name)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h4>{isEditing ? 'Edit Shop' : 'Add New Shop'}</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type="text"
            name="name"
            placeholder="Shop Name"
            value={formState.name}
            onChange={handleFormChange}
            disabled={isEditing}
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
        <select name="shop_type" value={formState.shop_type} onChange={handleFormChange}>
          <option value="">Select Shop Type</option>
          {shopTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <textarea
          name="aisle_order"
          placeholder={`Aisle Order (comma-separated item types, e.g., '${itemTypes.slice(0, 3).join(', ')}...')`}
          value={formState.aisle_order}
          onChange={handleFormChange}
          rows="3"
          style={{ width: '100%' }}
        ></textarea>
        <small>Available Item Types: {itemTypes.join(', ')}</small>
        <button type="submit">{isEditing ? 'Update Shop' : 'Add Shop'}</button>
        {isEditing && <button type="button" onClick={handleCancel}>Cancel</button>}
      </form>
    </section>
  );
}

export default ShopManagement;
