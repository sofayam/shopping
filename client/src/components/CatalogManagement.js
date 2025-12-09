import React, { useState } from 'react';
import { Table, Button, Form, Card, Row, Col, ButtonGroup, Modal } from 'react-bootstrap';

const CatalogManagement = ({ catalog, onAddItem, onUpdateItem, onDeleteItem }) => {
  // State for the "Add Item" form
  const [name, setName] = useState('');
  const [nicknames, setNicknames] = useState('');
  const [type, setType] = useState('');
  const [shops, setShops] = useState('');

  // State for the Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [modalFormData, setModalFormData] = useState(null);

  const handleShowModal = (item) => {
    setModalFormData({ ...item });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalFormData(null);
  };

  const handleModalFormChange = (e) => {
    const { name, value } = e.target;
    setModalFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleModalArrayFormChange = (e) => {
    const { name, value } = e.target;
    setModalFormData(prev => ({
      ...prev,
      [name]: value.split(',').map(s => s.trim()).filter(Boolean)
    }));
  };

  const handleSaveModal = () => {
    onUpdateItem(modalFormData);
    handleCloseModal();
  };

  const handleDelete = (itemName) => {
    if (window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      onDeleteItem(itemName);
    }
  };

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    onAddItem({
      name,
      nicknames: nicknames.split(',').map(n => n.trim()).filter(Boolean),
      type,
      shops: shops.split(',').map(s => s.trim()).filter(Boolean),
    });
    // Reset form
    setName('');
    setNicknames('');
    setType('');
    setShops('');
  };

  const renderEditModal = () => {
    if (!modalFormData) return null;

    return (
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Item: {modalFormData.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
              <Form.Group className="mb-3">
                <Form.Label>Item Name*</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={modalFormData.name}
                  onChange={handleModalFormChange}
                  required
                  disabled // Name is the identifier, so it cannot be changed directly
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Item Type*</Form.Label>
                <Form.Control
                  type="text"
                  name="type"
                  value={modalFormData.type}
                  onChange={handleModalFormChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Nicknames (comma-separated)</Form.Label>
                <Form.Control
                  type="text"
                  name="nicknames"
                  value={modalFormData.nicknames?.join(', ') || ''}
                  onChange={handleModalArrayFormChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Shops (comma-separated)</Form.Label>
                <Form.Control
                  type="text"
                  name="shops"
                  value={modalFormData.shops?.join(', ') || ''}
                  onChange={handleModalArrayFormChange}
                />
              </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveModal}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <>
      <Card className="mb-4">
        <Card.Header>Add New Catalog Item</Card.Header>
        <Card.Body>
          <Form onSubmit={handleAddItemSubmit}>
            {/* Add Item Form remains the same */}
            <Row className="mb-3">
              <Col md={6}><Form.Group><Form.Label>Item Name*</Form.Label><Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Item Type*</Form.Label><Form.Control type="text" value={type} onChange={(e) => setType(e.target.value)} required /></Form.Group></Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}><Form.Group><Form.Label>Nicknames (comma-separated)</Form.Label><Form.Control type="text" value={nicknames} onChange={(e) => setNicknames(e.target.value)} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Shops (comma-separated)</Form.Label><Form.Control type="text" value={shops} onChange={(e) => setShops(e.target.value)} /></Form.Group></Col>
            </Row>
            <Button type="submit">Add Item</Button>
          </Form>
        </Card.Body>
      </Card>

      <h3>Current Catalog</h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Nicknames</th>
            <th>Shops</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {catalog.map(item => (
            <tr key={item.name}>
              <td>{item.name}</td>
              <td>{item.type}</td>
              <td>{item.nicknames?.join(', ')}</td>
              <td>{item.shops?.join(', ')}</td>
              <td>
                <ButtonGroup size="sm">
                  <Button variant="outline-primary" onClick={() => handleShowModal(item)}>Edit</Button>
                  <Button variant="outline-danger" onClick={() => handleDelete(item.name)}>Delete</Button>
                </ButtonGroup>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {renderEditModal()}
    </>
  );
};

export default CatalogManagement;
