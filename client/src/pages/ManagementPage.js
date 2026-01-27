import React from 'react';
import { Outlet, Link } from 'react-router-dom';

function ManagementPage() {
  return (
    <div>
      <h1>Data Management</h1>
      <nav>
        <ul>
          <li><Link to="shop-types">Shop Types</Link></li>
          <li><Link to="item-types">Item Types</Link></li>
          <li><Link to="shop-type-to-item-types">Shop Type to Item Types</Link></li>
          <li><Link to="items">Items</Link></li>
          <li><Link to="shops">Shops</Link></li>
        </ul>
      </nav>
      <hr />
      <Outlet />
    </div>
  );
}

export default ManagementPage;



