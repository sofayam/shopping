import React, { useState } from 'react';
import { ListGroup, Button, Form, Card } from 'react-bootstrap';
import AddItemForm from './AddItemForm';

const ShoppingList = ({ list, catalog, onToggle, onDelete, onAdd, onArchive, onRemovePurchased, shops }) => {
  const [selectedShop, setSelectedShop] = useState('');

  // Filter list based on selected shop
  const getFilteredList = () => {
    if (!selectedShop) {
      return list;
    }
    return list.filter(item => {
      const itemShops = item.shops || [];
      return itemShops.length === 0 || itemShops.includes(selectedShop);
    });
  };

  // Group items by shop when no shop is selected
  const getGroupedByShop = () => {
    if (selectedShop) {
      return null;
    }
    
    const grouped = {};
    const itemsAdded = new Set();
    
    list.forEach(item => {
      // Skip if we've already added this item
      if (itemsAdded.has(item.name)) {
        return;
      }
      
      const itemShops = item.shops || [];
      
      // Determine which shop to add this item to
      let targetShop;
      if (itemShops.length === 0) {
        // Items with no shop restrictions go to the first shop in the list
        targetShop = shops.length > 0 ? shops[0] : 'Other';
      } else {
        // Add to the first appropriate shop
        targetShop = itemShops[0];
      }
      
      if (!grouped[targetShop]) grouped[targetShop] = {};
      const itemType = item.type || 'Uncategorized';
      if (!grouped[targetShop][itemType]) grouped[targetShop][itemType] = [];
      grouped[targetShop][itemType].push(item);
      
      itemsAdded.add(item.name);
    });
    return grouped;
  };

  const filteredList = getFilteredList();
  const groupedList = getGroupedByShop();

  return (
    <>
      <h2 className="mb-3">Shopping List</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <AddItemForm catalog={catalog} onAdd={onAdd} />
        </Card.Body>
      </Card>

      {/* Shop Filter Dropdown */}
      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Filter by Shop</Form.Label>
            <Form.Select 
              value={selectedShop} 
              onChange={(e) => setSelectedShop(e.target.value)}
            >
              <option value="">All Shops</option>
              {shops.map(shop => (
                <option key={shop} value={shop}>{shop}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Shopping List Display */}
      {selectedShop ? (
        // Flat list when shop is selected
        <>
          <ListGroup>
            {filteredList.length === 0 && <ListGroup.Item>No items available from {selectedShop}.</ListGroup.Item>}
            {filteredList.map(item => (
              <ListGroup.Item key={item.name} variant={item.purchased ? 'success' : ''} className="d-flex justify-content-between align-items-center">
                <div>
                  <Form.Check 
                    type="checkbox"
                    checked={item.purchased}
                    onChange={() => onToggle(item.name, !item.purchased)}
                    label={item.name}
                    className="me-2"
                  />
                </div>
                <Button variant="danger" size="sm" onClick={() => onDelete(item.name)}>
                  Delete
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </>
      ) : (
        // Grouped by shop and type when no shop selected
        <>
          {list.length === 0 ? (
            <ListGroup>
              <ListGroup.Item>Your shopping list is empty.</ListGroup.Item>
            </ListGroup>
          ) : (
            Object.entries(groupedList).map(([shop, typeGroups]) => (
              <div key={shop} className="mb-5">
                <h5>{shop}</h5>
                {Object.entries(typeGroups).map(([type, items]) => (
                  <div key={`${shop}-${type}`} className="mb-3">
                    <h6 className="text-muted">{type}</h6>
                    <ListGroup>
                      {items.map(item => (
                        <ListGroup.Item key={item.name} variant={item.purchased ? 'success' : ''} className="d-flex justify-content-between align-items-center">
                          <div>
                            <Form.Check 
                              type="checkbox"
                              checked={item.purchased}
                              onChange={() => onToggle(item.name, !item.purchased)}
                              label={item.name}
                              className="me-2"
                            />
                          </div>
                          <Button variant="danger" size="sm" onClick={() => onDelete(item.name)}>
                            Delete
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                ))}
              </div>
            ))
          )}
        </>
      )}

      {/* Action Buttons */}
      {list.length > 0 && (
        <div className="mt-4">
          <Button 
            variant="warning" 
            onClick={onRemovePurchased}
            className="me-2"
          >
            Remove Purchased Items
          </Button>
          <Button variant="info" onClick={onArchive}>
            Archive and Start New List
          </Button>
        </div>
      )}
    </>
  );
};

export default ShoppingList;
