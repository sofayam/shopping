import React, { useState } from 'react';
import { Table, Button, Form, Card, Row, Col } from 'react-bootstrap';

const CatalogManagement = ({ catalog, itemTypes, onAdd }) => {
  const [name, setName] = useState('');
  const [nicknames, setNicknames] = useState('');
  const [type, setType] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !type) {
      alert('Name and Type are required.');
      return;
    }
    const newNicknames = nicknames.split(',').map(n => n.trim()).filter(Boolean);
    onAdd({ name, nicknames: newNicknames, type });
    setName('');
    setNicknames('');
    setType('');
  };

  return (
    <>
      <h2 className="mb-3">Manage Catalog</h2>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Add New Item</Card.Title>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Item Name</Form.Label>
                  <Form.Control type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Milk" required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nicknames (comma-separated)</Form.Label>
                  <Form.Control type="text" value={nicknames} onChange={e => setNicknames(e.target.value)} placeholder="e.g., moo juice, white stuff" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Item Type</Form.Label>
                  <Form.Control list="item-types-datalist" type="text" value={type} onChange={e => setType(e.target.value)} placeholder="e.g., dairy" required />
                  <datalist id="item-types-datalist">
                    {itemTypes.map(t => <option key={t} value={t} />)}
                  </datalist>
                </Form.Group>
              </Col>
            </Row>
            <Button type="submit">Add Item</Button>
          </Form>
        </Card.Body>
      </Card>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Nicknames</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {catalog.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.nicknames.join(', ')}</td>
              <td>{item.type}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default CatalogManagement;
