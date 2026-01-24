import React, { useState } from 'react';
import { Table, Button, Form, Card, Row, Col, ButtonGroup, Modal } from 'react-bootstrap';

const ShopTypeManagement = ({ shopTypes, onAddShopType, onUpdateShopType, onDeleteShopType }) => {
  // State for the "Add Shop Type" form
  const [name, setName] = useState('');
  const [productTypes, setProductTypes] = useState('');

  // State for the Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [modalFormData, setModalFormData] = useState(null);

  const handleShowModal = (shopType) => {
    setModalFormData({ ...shopType });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalFormData(null);
  };

  const handleModalFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'productTypes') {
      setModalFormData(prev => ({ ...prev, productTypes: value.split(',').map(s => s.trim()).filter(Boolean) }));
    } else {
      setModalFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveModal = () => {
    onUpdateShopType(modalFormData);
    handleCloseModal();
  };

  const handleDelete = (shopTypeName) => {
    if (window.confirm(`Are you sure you want to delete "${shopTypeName}"? This cannot be undone.`)) {
      onDeleteShopType(shopTypeName);
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    onAddShopType({
      name,
      productTypes: productTypes.split(',').map(t => t.trim()).filter(Boolean),
    });
    // Reset form
    setName('');
    setProductTypes('');
  };

  const renderEditModal = () => {
    if (!modalFormData) return null;
    return (
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Shop Type: {modalFormData.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Shop Type Name*</Form.Label>
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
              <Form.Label>Product Types (comma-separated)*</Form.Label>
              <Form.Control
                type="text"
                name="productTypes"
                value={modalFormData.productTypes?.join(', ') || ''}
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
        <Card.Header>Add New Shop Type</Card.Header>
        <Card.Body>
          <Form onSubmit={handleAddSubmit}>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Shop Type Name*</Form.Label><Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Product Types (comma-separated)*</Form.Label><Form.Control type="text" value={productTypes} onChange={(e) => setProductTypes(e.target.value)} required /></Form.Group></Col>
            </Row>
            <Button type="submit">Add Shop Type</Button>
          </Form>
        </Card.Body>
      </Card>

      <h3>Current Shop Types</h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Product Types</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shopTypes.map(shopType => (
            <tr key={shopType.name}>
              <td>{shopType.name}</td>
              <td>{shopType.productTypes?.join(', ')}</td>
              <td>
                <ButtonGroup size="sm">
                  <Button variant="outline-primary" onClick={() => handleShowModal(shopType)}>Edit</Button>
                  <Button variant="outline-danger" onClick={() => handleDelete(shopType.name)}>Delete</Button>
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

export default ShopTypeManagement;
