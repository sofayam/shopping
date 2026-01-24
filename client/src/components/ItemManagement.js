import React, { useState, useEffect } from 'react';

const BLANK_ITEM = { name: '', item_type: '', preferred_shop: '' };

function ItemManagement({ items, shops, whatIsWhere, onUpdate }) {
  const [formState, setFormState] = useState(BLANK_ITEM);
  const [isEditing, setIsEditing] = useState(false);
  const [itemTypes, setItemTypes] = useState([]);

  useEffect(() => {
    if (whatIsWhere) {
      setItemTypes(Object.keys(whatIsWhere));
    }
  }, [whatIsWhere]);

  if (!items || !shops || !whatIsWhere) {
    return <p>Loading item data...</p>;
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setFormState(item);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormState(BLANK_ITEM);
  };

  const handleDelete = (nameToDelete) => {
    const updatedItems = items.filter(item => item.name !== nameToDelete);
    onUpdate(updatedItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.item_type) {
      alert('Name and Item Type are required.');
      return;
    }

    let updatedItems;
    if (isEditing) {
      updatedItems = items.map(item => item.name === formState.name ? formState : item);
    } else {
      if (items.some(item => item.name === formState.name)) {
        alert('An item with this name already exists.');
        return;
      }
      updatedItems = [...items, formState];
    }
    onUpdate(updatedItems);
    handleCancel();
  };

  return (
    <section>
      <h3>Items</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Item Type</th>
            <th>Preferred Shop</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.name}>
              <td>{item.name}</td>
              <td>{item.item_type}</td>
              <td>{item.preferred_shop || 'None'}</td>
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
        <input
          type="text"
          name="name"
          placeholder="Item Name"
          value={formState.name}
          onChange={handleFormChange}
          disabled={isEditing} // Prevent changing name on edit to preserve key
        />
        <select name="item_type" value={formState.item_type} onChange={handleFormChange}>
          <option value="">Select Type</option>
          {itemTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select name="preferred_shop" value={formState.preferred_shop} onChange={handleFormChange}>
          <option value="">No Preference</option>
          {shops.map(shop => <option key={shop.name} value={shop.name}>{shop.name}</option>)}
        </select>
        <button type="submit">{isEditing ? 'Update Item' : 'Add Item'}</button>
        {isEditing && <button type="button" onClick={handleCancel}>Cancel</button>}
      </form>
    </section>
  );
}

export default ItemManagement;
