import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Container, Row, Col, Navbar, Nav, Tab } from 'react-bootstrap';
import ShoppingList from './components/ShoppingList';
import CatalogManagement from './components/CatalogManagement';
import ShopManagement from './components/ShopManagement';
import ShopTypeManagement from './components/ShopTypeManagement';
import IntegrityReport from './components/IntegrityReport';
import AddItemForm from './components/AddItemForm';

function App() {
  const [shoppingList, setShoppingList] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [shops, setShops] = useState([]);
  const [shopTypes, setShopTypes] = useState([]); // New state for shop types
  const [integrityReport, setIntegrityReport] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('shopping');

  const fetchData = async () => {
    try {
      const [listRes, catalogRes, shopsRes, shopTypesRes, reportRes] = await Promise.all([
        axios.get('/api/shopping-list'),
        axios.get('/api/catalog'),
        axios.get('/api/shops'),
        axios.get('/api/shop-types'), // Fetch shop types
        axios.get('/api/integrity-check'),
      ]);
      setShoppingList(listRes.data);
      setCatalog(catalogRes.data);
      setShops(shopsRes.data);
      setShopTypes(shopTypesRes.data); // Set shop types state
      setIntegrityReport(reportRes.data);
    } catch (err) {
      setError('Failed to fetch data. Please ensure the server is running.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allShops = useMemo(() => {
    return ['All Shops', ...shops.map(s => s.name).sort()];
  }, [shops]);

  const enrichedCatalog = useMemo(() => {
    if (!shops.length || !shopTypes.length) return catalog.map(item => ({...item, availableShops: item.shops || []}));
    
    const shopTypesMap = new Map(shopTypes.map(st => [st.name, st])); // Map by name
    const shopToProductTypesMap = new Map(); // Map<shopName, productTypes[]>
    shops.forEach(shop => {
      const shopType = shopTypesMap.get(shop.shopTypeName); // Use shopTypeName
      if (shopType) {
        shopToProductTypesMap.set(shop.name, shopType.productTypes);
      }
    });

    const typeToShopsMap = new Map(); // Map<productType, shopNames[]>
    shopToProductTypesMap.forEach((productTypes, shopName) => {
      productTypes.forEach(productType => {
        if (!typeToShopsMap.has(productType)) {
          typeToShopsMap.set(productType, []);
        }
        typeToShopsMap.get(productType).push(shopName);
      });
    });

    return catalog.map(item => {
      // If shops are explicitly listed on the item, use them as an override.
      if (item.shops && item.shops.length > 0) {
        return { ...item, availableShops: item.shops };
      }
      // Otherwise, determine available shops based on the item's type.
      const availableShops = typeToShopsMap.get(item.type) || [];
      return { ...item, availableShops };
    });
  }, [catalog, shops, shopTypes]);

  // This effect synchronizes the shopping list with the catalog.
  // If an item in the catalog is updated, this ensures the change is reflected in the shopping list.
  useEffect(() => {
    // Do not run on initial load, only on subsequent catalog changes.
    if (enrichedCatalog.length === 0) return;

    const enrichedCatalogMap = new Map(enrichedCatalog.map(item => [item.name, item])); // Map by name

    setShoppingList(prevShoppingList => {
      if (prevShoppingList.length === 0) {
        return prevShoppingList;
      }
      return prevShoppingList.map(listItem => {
        const freshEnrichedItem = enrichedCatalogMap.get(listItem.name); // Lookup by name
        if (freshEnrichedItem) {
          // Create a new object with the fresh data from the catalog,
          // but preserve the properties specific to the shopping list item.
          return { ...freshEnrichedItem, ticked: listItem.ticked, listId: listItem.listId };
        }
        // If the item is no longer in the catalog, keep the old shopping list item.
        return listItem;
      });
    });
  }, [enrichedCatalog]);

  const handleAddItemToShoppingList = async (item) => {
    try {
      const res = await axios.post('/api/shopping-list', item);
      setShoppingList([...shoppingList, res.data]);
    } catch (err) {
      console.error('Failed to add item to shopping list:', err);
    }
  };

  const handleRemoveItemFromShoppingList = async (listId) => {
    try {
      await axios.delete(`/api/shopping-list/${listId}`);
      setShoppingList(shoppingList.filter((item) => item.listId !== listId));
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleToggleItemTicked = async (listId, ticked) => {
    try {
      const res = await axios.patch(`/api/shopping-list/${listId}`, { ticked });
      setShoppingList(
        shoppingList.map((item) => (item.listId === listId ? res.data : item))
      );
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };
  
  const handleRemoveTickedItems = async () => {
    try {
      const res = await axios.post('/api/shopping-list/remove-ticked');
      setShoppingList(res.data);
    } catch (err) {
      console.error('Failed to remove ticked items:', err);
    }
  };

  const handleArchiveList = async () => {
    try {
      await axios.post('/api/shopping-list/archive');
      setShoppingList([]);
    } catch (err) {
      console.error('Failed to archive list:', err);
    }
  };

  const handleAddItemToCatalog = async (item) => {
    try {
      if (!item.name || !item.type) {
        alert('Item Name and Type are required.');
        return;
      }
      const res = await axios.post('/api/catalog', item);
      setCatalog([...catalog, res.data]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add item.';
      alert(`Error: ${errorMsg}`);
      console.error(err);
    }
  };

  const handleUpdateCatalogItem = async (item) => {
    try {
      const res = await axios.put(`/api/catalog/${item.name}`, item);
      setCatalog(catalog.map(i => (i.name === item.name ? res.data : i)));
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save changes.';
      alert(`Error: ${errorMsg}\n\nYour changes were not saved. This may be a server or file permission issue.`);
      console.error(err);
    }
  };

  const handleDeleteCatalogItem = async (itemName) => {
    try {
      await axios.delete(`/api/catalog/${itemName}`);
      setCatalog(catalog.filter(i => i.name !== itemName));
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete item.';
      alert(`Error: ${errorMsg}`);
      console.error(err);
    }
  };

  // --- Shop Handlers ---
  const handleAddShop = async (shop) => {
    try {
      if (!shop.name || !shop.shopTypeName) {
        alert('Shop Name and Shop Type are required.');
        return;
      }
      const res = await axios.post('/api/shops', shop);
      setShops([...shops, res.data]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add shop.';
      alert(`Error: ${errorMsg}`);
      console.error(err);
    }
  };

  const handleUpdateShop = async (shop) => {
    try {
      const res = await axios.put(`/api/shops/${shop.name}`, shop);
      setShops(shops.map(s => (s.name === shop.name ? res.data : s)));
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update shop.';
      alert(`Error: ${errorMsg}`);
      console.error(err);
    }
  };

  const handleDeleteShop = async (shopName) => {
    try {
      await axios.delete(`/api/shops/${shopName}`);
      setShops(shops.filter(s => s.name !== shopName));
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete shop.';
      alert(`Error: ${errorMsg}`);
      console.error(err);
    }
  };

  // --- Shop Type Handlers ---
  const handleAddShopType = async (shopType) => {
    try {
      if (!shopType.name || !shopType.productTypes) {
        alert('Shop Type Name and Product Types are required.');
        return;
      }
      const res = await axios.post('/api/shop-types', shopType);
      setShopTypes([...shopTypes, res.data]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add shop type.';
      alert(`Error: ${errorMsg}`);
      console.error(err);
    }
  };

  const handleUpdateShopType = async (shopType) => {
    try {
      const res = await axios.put(`/api/shop-types/${shopType.name}`, shopType);
      setShopTypes(shopTypes.map(st => (st.name === shopType.name ? res.data : st)));
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update shop type.';
      alert(`Error: ${errorMsg}`);
      console.error(err);
    }
  };

  const handleDeleteShopType = async (shopTypeName) => {
    try {
      await axios.delete(`/api/shop-types/${shopTypeName}`);
      setShopTypes(shopTypes.filter(st => st.name !== shopTypeName));
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete shop type.';
      alert(`Error: ${errorMsg}`);
      console.error(err);
    }
  };


  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#home">Shopping PWA</Navbar.Brand>
        </Container>
      </Navbar>
      <Container className="mt-4">
        {error && <div className="alert alert-danger">{error}</div>}
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="shopping">Shopping List</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="catalog">Manage Catalog</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="shops">Manage Shops</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="shopTypes">Manage Shop Types</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="report">
                Status Report {integrityReport.length > 0 && <span className="badge bg-danger ms-1">{integrityReport.length}</span>}
              </Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey="shopping">
              <Row className="mb-3">
                <Col>
                  <AddItemForm catalog={enrichedCatalog} onAddItem={handleAddItemToShoppingList} />
                </Col>
              </Row>
              <Row>
                <Col>
                  <ShoppingList
                    list={shoppingList}
                    allShops={allShops}
                    onRemove={handleRemoveItemFromShoppingList}
                    onToggle={handleToggleItemTicked}
                    onRemoveTicked={handleRemoveTickedItems}
                    onArchive={handleArchiveList}
                  />
                </Col>
              </Row>
            </Tab.Pane>
            <Tab.Pane eventKey="catalog">
              <CatalogManagement
                catalog={catalog}
                onAddItem={handleAddItemToCatalog}
                onUpdateItem={handleUpdateCatalogItem}
                onDeleteItem={handleDeleteCatalogItem}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="shops">
              <ShopManagement
                shops={shops}
                shopTypes={shopTypes} // Pass shopTypes to ShopManagement
                onAddShop={handleAddShop}
                onUpdateShop={handleUpdateShop}
                onDeleteShop={handleDeleteShop}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="shopTypes">
              <ShopTypeManagement
                shopTypes={shopTypes}
                onAddShopType={handleAddShopType}
                onUpdateShopType={handleUpdateShopType}
                onDeleteShopType={handleDeleteShopType}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="report">
              <IntegrityReport messages={integrityReport} />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
    </>
  );
}

export default App;