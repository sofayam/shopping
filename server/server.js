const express = require('express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
// const cors = require('cors'); // Removed as frontend and backend will be served from the same origin

const app = express();
const port = 3001; // Server will now serve both frontend and backend on this port

// app.use(cors()); // Removed
app.use(express.json({ limit: '10mb' }));

// Serve static files from the React app's build directory
app.use(express.static(path.join(__dirname, '../client/build')));

const dataDir = path.join(__dirname, '../data_persistence');

// --- Data Reading ---

const readYaml = (fileName) => {
  try {
    const fileContents = fs.readFileSync(path.join(dataDir, fileName), 'utf8');
    const data = yaml.load(fileContents);
    // Return empty array for lists, empty object for mappings if data is null
    if (data === null) {
      if (fileName === 'what_is_where.yaml') {
        return {};
      }
      return []; // Default to empty array for other list-like files
    }
    return data;
  } catch (e) {
    console.error(`Error reading ${fileName}:`, e);
    // If file doesn't exist or is unreadable, return appropriate empty structure
    if (fileName === 'what_is_where.yaml') {
      return {};
    }
    return [];
  }
};

// --- Data Writing ---

const writeYaml = (fileName, data) => {
  const yamlStr = yaml.dump(data);
  fs.writeFileSync(path.join(dataDir, fileName), yamlStr, 'utf8');
};

// Whitelist of files that can be modified via the API
const EDITABLE_FILES = [
  'items.yaml',
  'shops.yaml',
  'shop_types.yaml',
  'item_types.yaml',
  'shop_type_to_item_types.yaml', // Renamed from item_type_to_shop_type.yaml
  // 'preferred_shops_by_item_type.yaml', // Removed as per user's request
  'item_list.yaml'
];

// --- API Endpoints ---

app.get('/api/all-data', (req, res) => {
  const data = {};
  const rawData = {}; // Store raw loaded data to perform cross-file validation

  EDITABLE_FILES.forEach(file => {
    const key = file.replace('.yaml', '').replace(/_([a-z])/g, g => g[1].toUpperCase());
    const loadedContent = readYaml(file);
    rawData[file] = loadedContent; // Store raw content

    if (file === 'item_types.yaml') {
      data['itemTypesList'] = loadedContent;
    } else if (file === 'shop_type_to_item_types.yaml') { // New handling for shopTypeToItemTypes
      data['shopTypeToItemTypes'] = loadedContent;
    } else {
      data[key] = loadedContent;
    }
  });

  // --- Cross-file validation for itemList ---
  const allItems = rawData['items.yaml'] || [];
  const validItemNames = new Set(allItems.map(item => item.name));

  let currentItemList = rawData['item_list.yaml'] || [];
  const validatedItemList = currentItemList.filter(itemName => validItemNames.has(itemName));

  // Update itemList in the data object
  data['itemList'] = validatedItemList;

  // --- Removed Cross-file validation for preferred_shops_by_item_type ---

  // --- Cross-file validation for shops.yaml (aisle_order) ---
  const allShops = rawData['shops.yaml'] || [];
  const shopTypeToItemTypesMap = rawData['shop_type_to_item_types.yaml'] || {};
  const validatedShops = allShops.map(shop => {
    const itemTypesSoldByShopType = shopTypeToItemTypesMap[shop.shop_type] || [];
    const validatedAisleOrder = (shop.aisle_order || []).filter(itemType => {
      if (!itemTypesSoldByShopType.includes(itemType)) {
        console.warn(`[Server Validation] Shop "${shop.name}" (type: ${shop.shop_type}) has item type "${itemType}" in aisle_order which is not sold by its shop type. Removing.`);
        return false;
      }
      return true;
    });
    return { ...shop, aisle_order: validatedAisleOrder };
  });
  data['shops'] = validatedShops;

  res.json(data);
});

// Generic endpoint to update a data file
app.post('/api/data/:fileName', (req, res) => {
  const { fileName } = req.params;
  if (!EDITABLE_FILES.includes(fileName)) {
    return res.status(403).send({ message: 'Forbidden: Invalid file name.' });
  }

  try {
    writeYaml(fileName, req.body);
    res.status(200).send({ message: `${fileName} updated successfully.` });
  } catch (e) {
    console.error(`Error writing ${fileName}:`, e);
    res.status(500).send({ message: `Failed to update ${fileName}.` });
  }
});

// Specific legacy endpoints (can be deprecated later)
app.get('/api/item-list', (req, res) => {
  res.json(readYaml('item_list.yaml'));
});

app.post('/api/item-list', (req, res) => {
  try {
    writeYaml('item_list.yaml', req.body);
    res.status(200).send({ message: 'Item list updated successfully.' });
  } catch (e) {
    console.error('Error writing item_list.yaml:', e);
    res.status(500).send({ message: 'Failed to update item list.' });
  }
});

// Catch-all for client-side routing - serves the React app's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});


app.listen(port, () => {
  console.log(`Server serving React app and API on all network interfaces (0.0.0.0) on port ${port}`);
  console.log(`Access from other devices on your LAN using your machine's IP address (e.g., http://192.168.1.100:${port})`);
});