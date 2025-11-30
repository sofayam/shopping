import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Navbar, Nav, Alert } from 'react-bootstrap';
import './App.css';

import ShoppingList from './components/ShoppingList';
import CatalogManagement from './components/CatalogManagement';
import AddItemForm from './components/AddItemForm';


function App() {
  const [shoppingList, setShoppingList] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [view, setView] = useState('shopping'); // 'shopping' or 'catalog'
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [catalogRes, shoppingListRes, itemTypesRes] = await Promise.all([
        axios.get('/api/catalog'),
        axios.get('/api/shopping-list'),
        axios.get('/api/item-types'),
      ]);
      setCatalog(catalogRes.data);
      setShoppingList(shoppingListRes.data);
      setItemTypes(itemTypesRes.data);
    } catch (err) {
      setError('Failed to fetch data from the server. Is it running?');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewChange = (newView) => {
    setView(newView);
    fetchData(); // Refresh data when switching views
  }

  // --- Shopping List Handlers ---
  const handleAddItemToShoppingList = async (itemId) => {
    try {
      const res = await axios.post('/api/shopping-list', { itemId });
      setShoppingList([...shoppingList, res.data]);
    } catch (err) {
      console.error("Failed to add item to shopping list", err);
      setError('Failed to add item. Please try again.');
    }
  };

  const handleDeleteItemFromShoppingList = async (itemId) => {
    try {
      await axios.delete(`/api/shopping-list/${itemId}`);
      setShoppingList(shoppingList.filter(item => item.id !== itemId));
    } catch (err) {
      console.error("Failed to delete item from shopping list", err);
      setError('Failed to delete item. Please try again.');
    }
  };

  const handleToggleItemPurchased = async (itemId, purchased) => {
    try {
      const res = await axios.put(`/api/shopping-list/${itemId}`, { purchased });
      setShoppingList(shoppingList.map(item => item.id === itemId ? res.data : item));
    } catch (err) {
      console.error("Failed to update item status", err);
      setError('Failed to update item. Please try again.');
    }
  };

  // --- Catalog Handlers ---
  const handleAddItemToCatalog = async (item) => {
    try {
      const res = await axios.post('/api/catalog', item);
      setCatalog([...catalog, res.data]);
      // Also refresh item types
      const itemTypesRes = await axios.get('/api/item-types');
      setItemTypes(itemTypesRes.data);
    } catch (err) {
      console.error("Failed to add item to catalog", err);
      setError('Failed to add item to catalog. Please try again.');
    }
  };


  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#home">Shopping App</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link active={view === 'shopping'} onClick={() => handleViewChange('shopping')}>Shopping List</Nav.Link>
              <Nav.Link active={view === 'catalog'} onClick={() => handleViewChange('catalog')}>Manage Catalog</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        
        {view === 'shopping' ? (
          <ShoppingList 
            list={shoppingList}
            catalog={catalog}
            onToggle={handleToggleItemPurchased}
            onDelete={handleDeleteItemFromShoppingList}
            onAdd={handleAddItemToShoppingList}
          />
        ) : (
          <CatalogManagement 
            catalog={catalog}
            itemTypes={itemTypes}
            onAdd={handleAddItemToCatalog}
          />
        )}
      </Container>
    </>
  );
}

export default App;