import React, { useState } from 'react';

const BLANK_SHOP = { name: '', shop_type: '', aisle_order: [] };

function ShopManagement({ shops, shopTypes, itemTypes, shopTypeToItemTypes, onUpdate }) { // Added shopTypeToItemTypes prop
  const [formState, setFormState] = useState(BLANK_SHOP);
  const [isEditing, setIsEditing] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [currentAisleItem, setCurrentAisleItem] = useState(''); // For adding to aisle_order
  const [aisleItemSuggestions, setAisleItemSuggestions] = useState([]); // For aisle_order autocomplete

  if (!shops || !shopTypes || !itemTypes || !shopTypeToItemTypes) { // Check for shopTypeToItemTypes prop
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

  const handleAisleItemInputChange = (e) => {
    const value = e.target.value;
    setCurrentAisleItem(value);

    if (value.length > 0) {
      const filteredSuggestions = itemTypes
        .filter(type => type.toLowerCase().includes(value.toLowerCase()))
        .filter(type => !formState.aisle_order.includes(type)) // Don't suggest already added types
        .map(type => type);
      setAisleItemSuggestions(filteredSuggestions);
    } else {
      setAisleItemSuggestions([]);
    }
  };

  const handleSelectAisleItemSuggestion = (suggestion) => {
    setCurrentAisleItem(suggestion);
    setAisleItemSuggestions([]);
  };

  const handleAddAisleItem = (e) => {
    e.preventDefault();
    const itemToAdd = currentAisleItem.trim();
    if (!itemToAdd) return;

    if (!itemTypes.includes(itemToAdd)) {
      alert(`"${itemToAdd}" is not a valid Item Type. Please add it via the Item Types management section first.`);
      return;
    }
    if (formState.aisle_order.includes(itemToAdd)) {
      alert(`"${itemToAdd}" is already in the Aisle Order.`);
      return;
    }

    // New validation: Check if the item type is sold by the shop's shop_type
    const itemTypesSoldByShopType = shopTypeToItemTypes[formState.shop_type] || [];
    if (!itemTypesSoldByShopType.includes(itemToAdd)) {
      alert(`Item Type "${itemToAdd}" is not sold by Shop Type "${formState.shop_type}". Please update "Shop Type to Item Types Sold" mapping.`);
      return;
    }

    setFormState(prev => ({
      ...prev,
      aisle_order: [...prev.aisle_order, itemToAdd],
    }));
    setCurrentAisleItem('');
    setAisleItemSuggestions([]);
  };

  const handleRemoveAisleItem = (itemToRemove) => {
    setFormState(prev => ({
      ...prev,
      aisle_order: prev.aisle_order.filter(item => item !== itemToRemove),
    }));
  };

  const handleMoveAisleItem = (itemToMove, direction) => {
    const currentIndex = formState.aisle_order.indexOf(itemToMove);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= formState.aisle_order.length) return;

    const newAisleOrder = [...formState.aisle_order];
    const [removed] = newAisleOrder.splice(currentIndex, 1);
    newAisleOrder.splice(newIndex, 0, removed);

    setFormState(prev => ({ ...prev, aisle_order: newAisleOrder }));
  };

  const handleEditClick = (shop) => {
    setIsEditing(true);
    setFormState({ ...shop, aisle_order: shop.aisle_order || [] }); // Ensure it's an array
    setNameSuggestions([]);
    setCurrentAisleItem('');
    setAisleItemSuggestions([]);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormState(BLANK_SHOP);
    setNameSuggestions([]);
    setCurrentAisleItem('');
    setAisleItemSuggestions([]);
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
      aisle_order: formState.aisle_order, // Already an array
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
              <td>{shop.aisle_order && shop.aisle_order.length > 0 ? shop.aisle_order.join(', ') : 'N/A'}</td>
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
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
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

        <div style={{ marginTop: '15px', border: '1px solid #eee', padding: '10px' }}>
          <h5>Aisle Order</h5>
          <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <input
              type="text"
              placeholder="Add Item Type to Aisle Order"
              value={currentAisleItem}
              onChange={handleAisleItemInputChange}
              style={{ width: 'calc(100% - 70px)' }}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <button type="button" onClick={handleAddAisleItem} style={{ width: '60px', marginLeft: '5px' }}>Add</button>
            {aisleItemSuggestions.length > 0 && (
              <ul style={{ listStyleType: 'none', padding: 0, margin: '0', border: '1px solid #ccc', maxHeight: '150px', overflowY: 'auto', background: 'white', position: 'absolute', zIndex: 100, width: '100%' }}>
                {aisleItemSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSelectAisleItemSuggestion(suggestion)}
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
            {console.log("[ShopManagement] formState.aisle_order before map:", formState.aisle_order)}
            {formState.aisle_order.map((item, index) => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', border: '1px solid #ddd', padding: '5px' }}>
                <span style={{ flexGrow: 1 }}>{item}</span>
                <button type="button" onClick={() => handleMoveAisleItem(item, 'up')} disabled={index === 0}>↑</button>
                <button type="button" onClick={() => handleMoveAisleItem(item, 'down')} disabled={index === formState.aisle_order.length - 1}>↓</button>
                <button type="button" onClick={() => handleRemoveAisleItem(item)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>

        <button type="submit">{isEditing ? 'Update Shop' : 'Add Shop'}</button>
        {isEditing && <button type="button" onClick={handleCancel}>Cancel</button>}
      </form>
    </section>
  );
}

export default ShopManagement;

