import React, { useState } from 'react';
import Select from 'react-select';
import { Button, Form, Row, Col } from 'react-bootstrap';

const AddItemForm = ({ catalog, onAddItem }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const options = catalog.map(item => ({
    value: item, // Still pass the full item object
    label: `${item.name} (${item.nicknames?.join(', ') || ''})`,
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedItem) {
      onAddItem(selectedItem.value);
      setSelectedItem(null); // Reset dropdown after adding
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col xs={12} md={8}>
          <Select
            options={options}
            value={selectedItem}
            onChange={setSelectedItem}
            placeholder="Type to search for an item..."
            isClearable
          />
        </Col>
        <Col xs={12} md={4} className="d-grid">
          <Button type="submit" disabled={!selectedItem}>
            Add to List
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default AddItemForm;
