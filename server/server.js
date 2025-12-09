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
const SHOP_TYPES_PATH = path.join(DATA_DIR, 'shop_types.json');

app.use(cors());
app.use(bodyParser.json());

// Helper functions to read/write data
const readData = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}, returning empty array. Error:`, error);
    return [];
  }
};

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
    const shopTypes = readData(SHOP_TYPES_PATH);
    const shoppingList = readData(SHOPPING_LIST_PATH);
    
    const report = [];

    // Helper to check for duplicate names
    const checkDuplicateNames = (items, fileName) => {
        const seenNames = new Set();
        items.forEach(item => {
            if (seenNames.has(item.name)) {
                report.push({
                    level: 'error',
                    message: `Data Integrity Error: Duplicate name "${item.name}" found in ${fileName}. Names must be unique.`
                });
            }
            seenNames.add(item.name);
        });
    };

    // Check 1: Duplicate names in Catalog, Shops, Shop Types
    checkDuplicateNames(catalog, 'catalog.json');
    checkDuplicateNames(shops, 'shops.json');
    checkDuplicateNames(shopTypes, 'shop_types.json');
    
    // Check 2: Shops in catalog items must exist in the shops list
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

    // Check 3: ShopTypeName in shops must exist in shop types list
    const definedShopTypeNames = new Set(shopTypes.map(st => st.name));
    shops.forEach(shop => {
        if (!definedShopTypeNames.has(shop.shopTypeName)) {
            report.push({
                level: 'error',
                message: `Data Integrity Error: Shop "${shop.name}" refers to a shop type "${shop.shopTypeName}" that is not defined.`
            });
        }
    });

    // Check 4: Items in shopping list must exist in catalog
    const catalogItemNames = new Set(catalog.map(i => i.name));
    shoppingList.forEach(listItem => {
        if (!catalogItemNames.has(listItem.name)) {
            report.push({
                level: 'warning',
                message: `Data Integrity Warning: Shopping list contains an item "${listItem.name}" that no longer exists in the catalog.`
            });
        }
    });

    // Check 5: Duplicate listId in shopping list (still using UUID for list instances)
    const seenListIds = new Set();
    shoppingList.forEach(listItem => {
        if (seenListIds.has(listItem.listId)) {
            report.push({
                level: 'error',
                message: `Data Integrity Error: Duplicate listId "${listItem.listId}" found in shopping_list.json.`
            });
        }
        seenListIds.add(listItem.listId);
    });

    res.json(report);
});


// --- Catalog API ---
app.get('/api/catalog', (req, res) => {
  const catalog = readData(CATALOG_PATH);
  res.json(catalog);
});

app.post('/api/catalog', (req, res) => {
  const catalog = readData(CATALOG_PATH);
  const { name, ...rest } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Catalog item name is required.' });
  }
  if (catalog.some(item => item.name === name)) {
    return res.status(409).json({ message: `Catalog item with name "${name}" already exists.` });
  }
  const newItem = { name, ...rest };
  catalog.push(newItem);
  handleWrite(res, CATALOG_PATH, catalog, 201, newItem);
});

app.put('/api/catalog/:name', (req, res) => {
  const { name } = req.params;
  const updatedItem = req.body;
  let catalog = readData(CATALOG_PATH);
  
  const itemIndex = catalog.findIndex(item => item.name === name);

  if (itemIndex !== -1) {
    // Ensure name is not changed if it's the identifier
    if (updatedItem.name && updatedItem.name !== name) {
        return res.status(400).json({ message: 'Cannot change the name of a catalog item directly via PUT. Delete and re-add if name change is desired.' });
    }
    catalog[itemIndex] = { ...catalog[itemIndex], ...updatedItem, name: name }; // Ensure name remains the identifier
    handleWrite(res, CATALOG_PATH, catalog, 200, catalog[itemIndex]);
  } else {
    res.status(404).json({ message: 'Catalog item not found' });
  }
});

app.delete('/api/catalog/:name', (req, res) => {
  const { name } = req.params;
  let catalog = readData(CATALOG_PATH);
  const initialLength = catalog.length;
  catalog = catalog.filter(item => item.name !== name);

  if (catalog.length < initialLength) {
    handleWrite(res, CATALOG_PATH, catalog, 200, { message: 'Catalog item deleted' });
  } else {
    res.status(404).json({ message: 'Catalog item not found' });
  }
});

// --- Shops API ---
app.get('/api/shops', (req, res) => {
  const shops = readData(SHOPS_PATH);
  const shopTypes = readData(SHOP_TYPES_PATH);
  const shopTypesMap = new Map(shopTypes.map(st => [st.name, st])); // Map by name

  const enrichedShops = shops.map(shop => {
    const shopType = shopTypesMap.get(shop.shopTypeName);
    return {
      ...shop,
      productTypes: shopType ? shopType.productTypes : []
    };
  });
  res.json(enrichedShops);
});

app.post('/api/shops', (req, res) => {
  const shops = readData(SHOPS_PATH);
  const { name, shopTypeName } = req.body; // Expect shopTypeName
  if (!name || !shopTypeName) {
    return res.status(400).json({ message: 'Shop name and shopTypeName are required.' });
  }
  if (shops.some(shop => shop.name === name)) {
    return res.status(409).json({ message: `Shop with name "${name}" already exists.` });
  }
  const newShop = { name, shopTypeName };
  shops.push(newShop);
  handleWrite(res, SHOPS_PATH, shops, 201, newShop);
});

app.put('/api/shops/:name', (req, res) => {
  const { name } = req.params;
  const updatedShop = req.body;
  let shops = readData(SHOPS_PATH);
  
  const shopIndex = shops.findIndex(shop => shop.name === name);

  if (shopIndex !== -1) {
    if (updatedShop.name && updatedShop.name !== name) {
        return res.status(400).json({ message: 'Cannot change the name of a shop directly via PUT. Delete and re-add if name change is desired.' });
    }
    shops[shopIndex] = { ...shops[shopIndex], ...updatedShop, name: name };
    handleWrite(res, SHOPS_PATH, shops, 200, shops[shopIndex]);
  } else {
    res.status(404).json({ message: 'Shop not found' });
  }
});

app.delete('/api/shops/:name', (req, res) => {
  const { name } = req.params;
  let shops = readData(SHOPS_PATH);
  const initialLength = shops.length;
  shops = shops.filter(shop => shop.name !== name);

  if (shops.length < initialLength) {
    handleWrite(res, SHOPS_PATH, shops, 200, { message: 'Shop deleted' });
  } else {
    res.status(404).json({ message: 'Shop not found' });
  }
});

// --- Shop Types API ---
app.get('/api/shop-types', (req, res) => {
  const shopTypes = readData(SHOP_TYPES_PATH);
  res.json(shopTypes);
});

app.post('/api/shop-types', (req, res) => {
  const shopTypes = readData(SHOP_TYPES_PATH);
  const { name, ...rest } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Shop type name is required.' });
  }
  if (shopTypes.some(st => st.name === name)) {
    return res.status(409).json({ message: `Shop type with name "${name}" already exists.` });
  }
  const newShopType = { name, ...rest };
  shopTypes.push(newShopType);
  handleWrite(res, SHOP_TYPES_PATH, shopTypes, 201, newShopType);
});

app.put('/api/shop-types/:name', (req, res) => {
  const { name } = req.params;
  const updatedShopType = req.body;
  let shopTypes = readData(SHOP_TYPES_PATH);
  
  const shopTypeIndex = shopTypes.findIndex(st => st.name === name);

  if (shopTypeIndex !== -1) {
    if (updatedShopType.name && updatedShopType.name !== name) {
        return res.status(400).json({ message: 'Cannot change the name of a shop type directly via PUT. Delete and re-add if name change is desired.' });
    }
    shopTypes[shopTypeIndex] = { ...shopTypes[shopTypeIndex], ...updatedShopType, name: name };
    handleWrite(res, SHOP_TYPES_PATH, shopTypes, 200, shopTypes[shopTypeIndex]);
  } else {
    res.status(404).json({ message: 'Shop Type not found' });
  }
});

app.delete('/api/shop-types/:name', (req, res) => {
  const { name } = req.params;
  let shopTypes = readData(SHOP_TYPES_PATH);
  const initialLength = shopTypes.length;
  shopTypes = shopTypes.filter(st => st.name !== name);

  if (shopTypes.length < initialLength) {
    handleWrite(res, SHOP_TYPES_PATH, shopTypes, 200, { message: 'Shop Type deleted' });
  } else {
    res.status(404).json({ message: 'Shop Type not found' });
  }
});


// --- Shopping List API ---
app.get('/api/shopping-list', (req, res) => {
  const shoppingList = readData(SHOPPING_LIST_PATH);
  res.json(shoppingList);
});

app.post('/api/shopping-list', (req, res) => {
  const shoppingList = readData(SHOPPING_LIST_PATH);
  const itemToAdd = req.body; // This itemToAdd now has 'name' instead of 'id'
  const newListItem = { ...itemToAdd, ticked: false, listId: uuidv4() }; // listId still UUID
  shoppingList.push(newListItem);
  handleWrite(res, SHOPPING_LIST_PATH, shoppingList, 201, newListItem);
});

app.delete('/api/shopping-list/:listId', (req, res) => {
  const { listId } = req.params;
  let shoppingList = readData(SHOPPING_LIST_PATH);
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