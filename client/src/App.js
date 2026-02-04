import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import ListPage from './pages/ListPage';
import ShoppingPage from './pages/ShoppingPage';
import ManagementPage from './pages/ManagementPage';
import ShopTypesPage from './pages/ShopTypesPage';
import ItemTypesPage from './pages/ItemTypesPage';
import ShopTypeToItemTypesPage from './pages/ShopTypeToItemTypesPage';
import ItemsPage from './pages/ItemsPage';
import ShopsPage from './pages/ShopsPage';
import ValidationPage from './pages/ValidationPage';
import AddItemPage from './pages/AddItemPage';
import GlobalReplaceForm from './components/GlobalReplaceForm'; // Import the new component
import './App.css';

function App() {
  const [validationStatus, setValidationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check validation status on startup
    fetch('/api/validation-status')
      .then(response => response.json())
      .then(data => {
        setValidationStatus(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error checking validation status:', error);
        setLoading(false);
      });
  }, []);

  // If validation shows issues and user isn't already on validation page, redirect
  const shouldShowValidationRequired = validationStatus && !validationStatus.valid;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Manage List</Link>
            </li>
            <li>
              <Link to="/shopping">Go Shopping</Link>
            </li>
            <li>
              <Link to="/manage">Manage Data</Link>
            </li>
            <li>
              <Link to="/validation" style={{ color: shouldShowValidationRequired ? 'red' : 'inherit', fontWeight: shouldShowValidationRequired ? 'bold' : 'normal' }}>
                Validation {shouldShowValidationRequired ? '⚠' : ''}
              </Link>
            </li>
          </ul>
        </nav>

        <hr />

        <Routes>
          {/* Redirect to validation if issues found on startup */}
          <Route path="/" element={shouldShowValidationRequired ? <Navigate to="/validation" /> : <ListPage />} />
          <Route path="/shopping" element={shouldShowValidationRequired ? <Navigate to="/validation" /> : <ShoppingPage />} />
          <Route path="/add-item/:itemName" element={shouldShowValidationRequired ? <Navigate to="/validation" /> : <AddItemPage />} />
          
          <Route path="/validation" element={<ValidationPage onValidationStatusChange={setValidationStatus} />} />
          
          <Route path="/manage" element={<ManagementPage />}>
            <Route path="shop-types" element={<ShopTypesPage />} />
            <Route path="item-types" element={<ItemTypesPage />} />
            <Route path="shop-type-to-item-types" element={<ShopTypeToItemTypesPage />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="shops" element={<ShopsPage />} />
            <Route path="edit" element={<GlobalReplaceForm />} /> {/* New route for global replace */}
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
