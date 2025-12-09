import React, { useState } from 'react';
import { Table, Button, Form, Card, Row, Col, ButtonGroup, Modal } from 'react-bootstrap';

const ShopManagement = ({ shops, onAddShop, onUpdateShop, onDeleteShop }) => {
  // State for the "Add Shop" form
  const [name, setName] = useState('');
  const [types, setTypes] = useState('');

  // State for the Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [modalFormData, setModalFormData] = useState(null);

  const handleShowModal = (shop) => {
    setModalFormData({ ...shop });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalFormData(null);
  };

  const handleModalFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'types') {
      setModalFormData(prev => ({ ...prev, types: value.split(',').map(s => s.trim()).filter(Boolean) }));
    } else {
      setModalFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveModal = () => {
    onUpdateShop(modalFormData);
    handleCloseModal();
  };

  const handleDelete = (shopId) => {
    if (window.confirm('Are you sure you want to delete this shop? This cannot be undone.')) {
      onDeleteShop(shopId);
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    onAddShop({
      name,
      types: types.split(',').map(t => t.trim()).filter(Boolean),
    });
    // Reset form
    setName('');
    setTypes('');
  };

  const renderEditModal = () => {
    if (!modalFormData) return null;
    return (
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Shop: {modalFormData.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Shop Name*</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={modalFormData.name}
                onChange={handleModalFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Product Types (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                name="types"
                value={modalFormData.types?.join(', ') || ''}
                onChange={handleModalFormChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
          <Button variant="primary" onClick={handleSaveModal}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <>
      <Card className="mb-4">
        <Card.Header>Add New Shop</Card.Header>
        <Card.Body>
          <Form onSubmit={handleAddSubmit}>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Shop Name*</Form.Label><Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Product Types (comma-separated)*</Form.Label><Form.Control type="text" value={types} onChange={(e) => setTypes(e.target.value)} required /></Form.Group></Col>
            </Row>
            <Button type="submit">Add Shop</Button>
          </Form>
        </Card.Body>
      </Card>

      <h3>Current Shops</h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Product Types Sold</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shops.map(shop => (
            <tr key={shop.id}>
              <td>{shop.name}</td>
              <td>{shop.types?.join(', ')}</td>
              <td>
                <ButtonGroup size="sm">
                  <Button variant="outline-primary" onClick={() => handleShowModal(shop)}>Edit</Button>
                  <Button variant="outline-danger" onClick={() => handleDelete(shop.id)}>Delete</Button>
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

export default ShopManagement;
