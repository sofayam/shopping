import React, { useState, useEffect } from 'react';

const BLANK_SHOP = { name: '', shop_type: '', aisle_order: '' };

function ShopManagement({ shops, shopTypes, whatIsWhere, onUpdate }) {
  const [formState, setFormState] = useState(BLANK_SHOP);
  const [isEditing, setIsEditing] = useState(false);
  const [itemTypes, setItemTypes] = useState([]);

  useEffect(() => {
    if (whatIsWhere) {
      setItemTypes(Object.keys(whatIsWhere));
    }
  }, [whatIsWhere]);

  if (!shops || !shopTypes || !whatIsWhere) {
    return <p>Loading shop data...</p>;
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (shop) => {
    setIsEditing(true);
    setFormState({ ...shop, aisle_order: shop.aisle_order ? shop.aisle_order.join(', ') : '' });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormState(BLANK_SHOP);
  };

  const handleDelete = (nameToDelete) => {
    const updatedShops = shops.filter(shop => shop.name !== nameToDelete);
    onUpdate(updatedShops);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.shop_type) {
      alert('Name and Shop Type are required.');
      return;
    }

    const newShop = {
      ...formState,
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
        <input
          type="text"
          name="name"
          placeholder="Shop Name"
          value={formState.name}
          onChange={handleFormChange}
          disabled={isEditing}
        />
        <select name="shop_type" value={formState.shop_type} onChange={handleFormChange}>
          <option value="">Select Shop Type</option>
          {shopTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <textarea
          name="aisle_order"
          placeholder="Aisle Order (comma-separated item types, e.g., 'fresh veg, dry goods')"
          value={formState.aisle_order}
          onChange={handleFormChange}
          rows="3"
          style={{ width: '100%' }}
        ></textarea>
        <button type="submit">{isEditing ? 'Update Shop' : 'Add Shop'}</button>
        {isEditing && <button type="button" onClick={handleCancel}>Cancel</button>}
      </form>
    </section>
  );
}

export default ShopManagement;
