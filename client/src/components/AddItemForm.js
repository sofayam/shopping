import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';

const AddItemForm = ({ catalog, onAdd }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue) return;

    // Find the catalog item that matches the input value (name or nickname)
    const selectedItem = catalog.find(
      item => item.name.toLowerCase() === inputValue.toLowerCase() ||
              item.nicknames.some(nick => nick.toLowerCase() === inputValue.toLowerCase())
    );

    if (selectedItem) {
      onAdd(selectedItem.id);
      setInputValue('');
    } else {
      alert(`Item "${inputValue}" not found in catalog.`);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-4">
      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Add Item from Catalog</Form.Label>
            <Form.Control
              type="text"
              list="catalog-items-datalist"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Type to search..."
            />
            <datalist id="catalog-items-datalist">
              {catalog.map(item => (
                <option key={item.id} value={item.name} />
              ))}
              {/* Add nicknames to the datalist as well */}
              {catalog.flatMap(item => item.nicknames.map(nick => (
                <option key={`${item.id}-${nick}`} value={nick} />
              ))).filter((value, index, self) => self.indexOf(value) === index)}
            </datalist>
          </Form.Group>
        </Col>
        <Col xs="auto" className="d-flex align-items-end">
          <Button type="submit">Add to List</Button>
        </Col>
      </Row>
    </Form>
  );
};

export default AddItemForm;
