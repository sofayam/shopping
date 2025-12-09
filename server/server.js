const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

const DATA_DIR = path.join(__dirname, 'data');
const CATALOG_PATH = path.join(DATA_DIR, 'catalog.json');
const SHOPPING_LIST_PATH = path.join(DATA_DIR, 'shopping_list.json');
const SHOPS_PATH = path.join(DATA_DIR, 'shops.json');

app.use(cors());
app.use(bodyParser.json());

// Helper functions to read/write data
const readData = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, start with an empty array.
    console.error(`Error reading file ${filePath}, returning empty array. Error:`, error);
    return [];
  }
};

// This function now throws an error on failure, allowing the caller to handle it.
const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const handleWrite = (res, filePath, data, successStatus = 200, successData) => {
    try {
        writeData(filePath, data);
        res.status(successStatus).json(successData);
    } catch (error) {
        console.error(`FATAL: Failed to write to ${path.basename(filePath)}:`, error);
        res.status(500).json({ message: `Failed to save data to ${path.basename(filePath)} on server.` });
    }
};

// --- Integrity Check API ---
app.get('/api/integrity-check', (req, res) => {
    const catalog = readData(CATALOG_PATH);
    const shops = readData(SHOPS_PATH);
    const shoppingList = readData(SHOPPING_LIST_PATH);
    
    const report = [];

    // Check 1: Shops in catalog items must exist in the shops list
    const definedShopNames = new Set(shops.map(s => s.name));
    catalog.forEach(item => {
        if (item.shops && item.shops.length > 0) {
            item.shops.forEach(shopName => {
                if (!definedShopNames.has(shopName)) {
                    report.push({
                        level: 'error',
                        message: `Data Integrity Error: Catalog item "${item.name}" (type: ${item.type}) refers to a shop "${shopName}" that is not defined in the list of shops.`
                    });
                }
            });
        }
    });

    // Check 2: Items in shopping list must exist in catalog
    const catalogItemIds = new Set(catalog.map(i => i.id));
    shoppingList.forEach(listItem => {
        if (!catalogItemIds.has(listItem.id)) {
            report.push({
                level: 'warning',
                message: `Data Integrity Warning: Shopping list contains an item "${listItem.name}" that no longer exists in the catalog.`
            });
        }
    });

    // Check 3: Duplicate ID checks
    const checkDuplicates = (items, fileName, idField = 'id') => {
        const seen = new Set();
        items.forEach(item => {
            if (seen.has(item[idField])) {
                report.push({
                    level: 'error',
                    message: `Data Integrity Error: Duplicate ID "${item[idField]}" found in ${fileName}.`
                });
            }
            seen.add(item[idField]);
        });
    };
    checkDuplicates(catalog, 'catalog.json');
    checkDuplicates(shops, 'shops.json');
    checkDuplicates(shoppingList, 'shopping_list.json', 'listId');

    res.json(report);
});


// --- Catalog API ---
app.get('/api/catalog', (req, res) => {
  const catalog = readData(CATALOG_PATH);
  res.json(catalog);
});

app.post('/api/catalog', (req, res) => {
  const catalog = readData(CATALOG_PATH);
  const newItem = { id: uuidv4(), ...req.body };
  catalog.push(newItem);
  handleWrite(res, CATALOG_PATH, catalog, 201, newItem);
});

app.put('/api/catalog/:id', (req, res) => {
  const { id } = req.params;
  const updatedItem = req.body;
  let catalog = readData(CATALOG_PATH);
  
  const itemIndex = catalog.findIndex(item => item.id === id);

  if (itemIndex !== -1) {
    catalog[itemIndex] = { ...catalog[itemIndex], ...updatedItem };
    handleWrite(res, CATALOG_PATH, catalog, 200, catalog[itemIndex]);
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
});

app.delete('/api/catalog/:id', (req, res) => {
  const { id } = req.params;
  let catalog = readData(CATALOG_PATH);
  const initialLength = catalog.length;
  catalog = catalog.filter(item => item.id !== id);

  if (catalog.length < initialLength) {
    handleWrite(res, CATALOG_PATH, catalog, 200, { message: 'Item deleted' });
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
});

// --- Shops API ---
app.get('/api/shops', (req, res) => {
  const shops = readData(SHOPS_PATH);
  res.json(shops);
});

app.post('/api/shops', (req, res) => {
  const shops = readData(SHOPS_PATH);
  const newShop = { id: `shop-${uuidv4()}`, ...req.body };
  shops.push(newShop);
  handleWrite(res, SHOPS_PATH, shops, 201, newShop);
});

app.put('/api/shops/:id', (req, res) => {
  const { id } = req.params;
  const updatedShop = req.body;
  let shops = readData(SHOPS_PATH);
  
  const shopIndex = shops.findIndex(shop => shop.id === id);

  if (shopIndex !== -1) {
    shops[shopIndex] = { ...shops[shopIndex], ...updatedShop };
    handleWrite(res, SHOPS_PATH, shops, 200, shops[shopIndex]);
  } else {
    res.status(404).json({ message: 'Shop not found' });
  }
});

app.delete('/api/shops/:id', (req, res) => {
  const { id } = req.params;
  let shops = readData(SHOPS_PATH);
  const initialLength = shops.length;
  shops = shops.filter(shop => shop.id !== id);

  if (shops.length < initialLength) {
    handleWrite(res, SHOPS_PATH, shops, 200, { message: 'Shop deleted' });
  } else {
    res.status(404).json({ message: 'Shop not found' });
  }
});


// --- Shopping List API ---
app.get('/api/shopping-list', (req, res) => {
  const shoppingList = readData(SHOPPING_LIST_PATH);
  res.json(shoppingList);
});

app.post('/api/shopping-list', (req, res) => {
  const shoppingList = readData(SHOPPING_LIST_PATH);
  const itemToAdd = req.body;
  const newListItem = { ...itemToAdd, ticked: false, listId: uuidv4() };
  shoppingList.push(newListItem);
  handleWrite(res, SHOPPING_LIST_PATH, shoppingList, 201, newListItem);
});

app.delete('/api/shopping-list/:listId', (req, res) => {
  let shoppingList = readData(SHOPPING_LIST_PATH);
  const { listId } = req.params;
  const initialLength = shoppingList.length;
  shoppingList = shoppingList.filter(item => item.listId !== listId);

  if (shoppingList.length < initialLength) {
    handleWrite(res, SHOPPING_LIST_PATH, shoppingList, 200, { message: 'Item removed' });
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
});

app.patch('/api/shopping-list/:listId', (req, res) => {
    let shoppingList = readData(SHOPPING_LIST_PATH);
    const { listId } = req.params;
    const { ticked } = req.body;
    const itemIndex = shoppingList.findIndex(item => item.listId === listId);

    if (itemIndex !== -1) {
        shoppingList[itemIndex].ticked = ticked;
        handleWrite(res, SHOPPING_LIST_PATH, shoppingList, 200, shoppingList[itemIndex]);
    } else {
        res.status(404).json({ message: 'Item not found' });
    }
});

app.post('/api/shopping-list/archive', (req, res) => {
  handleWrite(res, SHOPPING_LIST_PATH, [], 200, { message: 'Shopping list archived' });
});

app.post('/api/shopping-list/remove-ticked', (req, res) => {
  let shoppingList = readData(SHOPPING_LIST_PATH);
  const untickedItems = shoppingList.filter(item => !item.ticked);
  handleWrite(res, SHOPPING_LIST_PATH, untickedItems, 200, untickedItems);
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
