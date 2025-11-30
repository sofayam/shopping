import React from 'react';
import { ListGroup, Button, Form } from 'react-bootstrap';
import AddItemForm from './AddItemForm';

const ShoppingList = ({ list, catalog, onToggle, onDelete, onAdd }) => {
  return (
    <>
      <h2 className="mb-3">Shopping List</h2>
      
      <AddItemForm catalog={catalog} onAdd={onAdd} />

      <ListGroup>
        {list.length === 0 && <ListGroup.Item>Your shopping list is empty.</ListGroup.Item>}
        {list.map(item => (
          <ListGroup.Item key={item.id} variant={item.purchased ? 'success' : ''} className="d-flex justify-content-between align-items-center">
            <div>
              <Form.Check 
                type="checkbox"
                checked={item.purchased}
                onChange={() => onToggle(item.id, !item.purchased)}
                label={item.name}
                className="me-2"
              />
            </div>
            <Button variant="danger" size="sm" onClick={() => onDelete(item.id)}>
              Delete
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  );
};

export default ShoppingList;
