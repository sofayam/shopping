import React, { useState } from 'react';
import { Table, Button, Form, Card, Row, Col, Alert } from 'react-bootstrap';

const ShopsManagement = ({ shopsMetadata, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [localMetadata, setLocalMetadata] = useState(JSON.parse(JSON.stringify(shopsMetadata)));
  const [newShopType, setNewShopType] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [selectedShopType, setSelectedShopType] = useState('');
  const [newItemType, setNewItemType] = useState('');
  const [error, setError] = useState('');

  const handleAddShopType = (e) => {
    e.preventDefault();
    setError('');

    if (!newShopType) {
      setError('Shop type name is required.');
      return;
    }

    // Use the shop type name as both ID and display name
    const shopTypeId = newShopType.toLowerCase().replace(/\s+/g, '-');

    if (localMetadata[shopTypeId]) {
      setError('Shop type already exists.');
      return;
    }

    setLocalMetadata({
      ...localMetadata,
      [shopTypeId]: {
        name: newShopType,
        itemTypes: [],
        shops: []
      }
    });

    setNewShopType('');
  };

  const handleAddShop = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedShopType || !newShopName) {
      setError('Please select a shop type and enter a shop name.');
      return;
    }

    if (localMetadata[selectedShopType].shops.includes(newShopName)) {
      setError('Shop already exists in this type.');
      return;
    }

    setLocalMetadata({
      ...localMetadata,
      [selectedShopType]: {
        ...localMetadata[selectedShopType],
        shops: [...localMetadata[selectedShopType].shops, newShopName]
      }
    });

    setNewShopName('');
  };

  const handleAddItemType = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedShopType || !newItemType) {
      setError('Please select a shop type and enter an item type.');
      return;
    }

    if (localMetadata[selectedShopType].itemTypes.includes(newItemType)) {
      setError('Item type already exists for this shop type.');
      return;
    }

    setLocalMetadata({
      ...localMetadata,
      [selectedShopType]: {
        ...localMetadata[selectedShopType],
        itemTypes: [...localMetadata[selectedShopType].itemTypes, newItemType]
      }
    });

    setNewItemType('');
  };

  const handleRemoveShop = (shopType, shopName) => {
    setLocalMetadata({
      ...localMetadata,
      [shopType]: {
        ...localMetadata[shopType],
        shops: localMetadata[shopType].shops.filter(s => s !== shopName)
      }
    });
  };

  const handleRemoveItemType = (shopType, itemType) => {
    setLocalMetadata({
      ...localMetadata,
      [shopType]: {
        ...localMetadata[shopType],
        itemTypes: localMetadata[shopType].itemTypes.filter(t => t !== itemType)
      }
    });
  };

  const handleSave = () => {
    onUpdate(localMetadata);
    setEditMode(false);
  };

  const handleCancel = () => {
    setLocalMetadata(JSON.parse(JSON.stringify(shopsMetadata)));
    setEditMode(false);
    setError('');
  };

  if (!editMode) {
    return (
      <>
        <h2 className="mb-3">Manage Shops</h2>
        <Button variant="primary" onClick={() => setEditMode(true)} className="mb-4">
          Edit Shops
        </Button>

        {Object.entries(shopsMetadata).map(([shopTypeId, shopTypeInfo]) => (
          <Card key={shopTypeId} className="mb-4">
            <Card.Header>
              <Card.Title className="mb-0">{shopTypeInfo.name}</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>Item Types</h6>
                <div className="mb-2">
                  {(!shopTypeInfo.itemTypes || shopTypeInfo.itemTypes.length === 0) ? (
                    <span className="text-muted">No item types</span>
                  ) : (
                    shopTypeInfo.itemTypes.map(itemType => (
                      <span key={itemType} className="badge bg-info me-2">{itemType}</span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h6>Shops</h6>
                {(!shopTypeInfo.shops || shopTypeInfo.shops.length === 0) ? (
                  <span className="text-muted">No shops</span>
                ) : (
                  <ul className="mb-0">
                    {shopTypeInfo.shops.map(shop => (
                      <li key={shop}>{shop}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Card.Body>
          </Card>
        ))}
      </>
    );
  }

  return (
    <>
      <h2 className="mb-3">Manage Shops</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Add New Shop Type</Card.Title>
          <Form onSubmit={handleAddShopType}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Shop Type Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={newShopType} 
                    onChange={e => setNewShopType(e.target.value)} 
                    placeholder="e.g., Supermarket" 
                  />
                  <small className="text-muted">ID will be auto-generated from the name</small>
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex align-items-end">
                <Button type="submit" className="mb-3">Add Shop Type</Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Manage Shops and Item Types</Card.Title>
          <Form.Group className="mb-4">
            <Form.Label>Select Shop Type</Form.Label>
            <Form.Select 
              value={selectedShopType} 
              onChange={e => setSelectedShopType(e.target.value)}
            >
              <option value="">Choose a shop type...</option>
              {Object.entries(localMetadata).map(([shopTypeId, shopTypeInfo]) => (
                <option key={shopTypeId} value={shopTypeId}>{shopTypeInfo.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedShopType && (
            <>
              <div className="mb-4">
                <h6>Add Item Type to {localMetadata[selectedShopType].name}</h6>
                <Form onSubmit={handleAddItemType}>
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Control 
                          type="text" 
                          value={newItemType} 
                          onChange={e => setNewItemType(e.target.value)} 
                          placeholder="e.g., dairy" 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Button type="submit" className="mb-3">Add Item Type</Button>
                    </Col>
                  </Row>
                </Form>

                <div className="mb-3">
                  {(!localMetadata[selectedShopType].itemTypes || localMetadata[selectedShopType].itemTypes.length === 0) ? (
                    <span className="text-muted">No item types yet</span>
                  ) : (
                    <div>
                      {localMetadata[selectedShopType].itemTypes.map(itemType => (
                        <div key={itemType} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                          <span className="badge bg-info">{itemType}</span>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleRemoveItemType(selectedShopType, itemType)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h6>Add Shop to {localMetadata[selectedShopType].name}</h6>
                <Form onSubmit={handleAddShop}>
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Control 
                          type="text" 
                          value={newShopName} 
                          onChange={e => setNewShopName(e.target.value)} 
                          placeholder="e.g., Tesco" 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Button type="submit" className="mb-3">Add Shop</Button>
                    </Col>
                  </Row>
                </Form>

                <div>
                  {(!localMetadata[selectedShopType].shops || localMetadata[selectedShopType].shops.length === 0) ? (
                    <span className="text-muted">No shops yet</span>
                  ) : (
                    <ul>
                      {localMetadata[selectedShopType].shops.map(shop => (
                        <li key={shop} className="d-flex justify-content-between align-items-center">
                          <span>{shop}</span>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleRemoveShop(selectedShopType, shop)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <div className="mt-4">
        <Button variant="success" onClick={handleSave} className="me-2">
          Save Changes
        </Button>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
};

export default ShopsManagement;
