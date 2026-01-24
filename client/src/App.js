import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ListPage from './pages/ListPage';
import ShoppingPage from './pages/ShoppingPage';
import ManagementPage from './pages/ManagementPage';
import './App.css';

function App() {
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
          </ul>
        </nav>

        <hr />

        <Routes>
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/manage" element={<ManagementPage />} />
          <Route path="/" element={<ListPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
