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

// --- Validation State ---
let lastValidationResult = null;

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

// --- Validation Logic ---

/**
 * Validates all YAML files for cross-file consistency
 * Returns an object with issues array and valid boolean
 */
const performValidation = () => {
  console.log('[Server] Starting validation of YAML files...');
  
  const issues = [];
  const rawData = {};
  
  // Read all files
  EDITABLE_FILES.forEach(file => {
    rawData[file] = readYaml(file);
  });

  const items = rawData['items.yaml'] || [];
  const shops = rawData['shops.yaml'] || [];
  const shopTypes = rawData['shop_types.yaml'] || [];
  const itemTypes = rawData['item_types.yaml'] || [];
  const shopTypeToItemTypes = rawData['shop_type_to_item_types.yaml'] || {};
  const itemList = rawData['item_list.yaml'] || [];

  // Debug logging
  console.log('[Server] Loaded itemTypes:', itemTypes);
  console.log('[Server] Loaded shopTypes:', shopTypes);

  // Build sets for quick lookup
  // Handle both formats: objects with .name property and simple strings
  const validItemNames = new Set(items.map(item => item.name));
  const validShopNames = new Set(shops.map(shop => shop.name));
  const validShopTypeNames = new Set(shopTypes.map(st => typeof st === 'string' ? st : st.name));
  const validItemTypeNames = new Set(itemTypes.map(it => typeof it === 'string' ? it : it.name));

  console.log('[Server] Valid item type names:', Array.from(validItemTypeNames));
  console.log('[Server] Valid shop type names:', Array.from(validShopTypeNames));

  // Validate items.yaml
  items.forEach(item => {
    if (!item.name) issues.push('items.yaml: Item missing name field');
    if (!item.item_type) issues.push(`items.yaml: Item "${item.name}" missing item_type field`);
    else if (!validItemTypeNames.has(item.item_type)) {
      issues.push(`items.yaml: Item "${item.name}" references unknown item_type "${item.item_type}"`);
    }
    // Only validate only_shop if it's not empty
    if (item.only_shop && item.only_shop.trim() && !validShopNames.has(item.only_shop)) {
      issues.push(`items.yaml: Item "${item.name}" has only_shop "${item.only_shop}" that doesn't exist`);
    }
    // Only validate preferred_shop if it's not empty
    if (item.preferred_shop && item.preferred_shop.trim() && !validShopNames.has(item.preferred_shop)) {
      issues.push(`items.yaml: Item "${item.name}" has preferred_shop "${item.preferred_shop}" that doesn't exist`);
    }
  });

  // Validate shops.yaml
  shops.forEach(shop => {
    if (!shop.name) issues.push('shops.yaml: Shop missing name field');
    if (!shop.shop_type) issues.push(`shops.yaml: Shop "${shop.name}" missing shop_type field`);
    else if (!validShopTypeNames.has(shop.shop_type)) {
      issues.push(`shops.yaml: Shop "${shop.name}" references unknown shop_type "${shop.shop_type}"`);
    }
    
    // Validate aisle_order
    if (shop.aisle_order && Array.isArray(shop.aisle_order)) {
      const validItemTypesForShop = shopTypeToItemTypes[shop.shop_type] || [];
      shop.aisle_order.forEach(itemType => {
        if (!validItemTypeNames.has(itemType)) {
          issues.push(`shops.yaml: Shop "${shop.name}" aisle_order references unknown item_type "${itemType}"`);
        } else if (!validItemTypesForShop.includes(itemType)) {
          issues.push(`shops.yaml: Shop "${shop.name}" aisle_order includes "${itemType}" which is not sold by shop_type "${shop.shop_type}"`);
        }
      });
    }
  });

  // Validate shop_types.yaml (can be strings or objects with name field)
  shopTypes.forEach((shopType, idx) => {
    const typeName = typeof shopType === 'string' ? shopType : shopType.name;
    if (!typeName || typeName.trim() === '') {
      issues.push('shop_types.yaml: ShopType at index ' + idx + ' is empty');
    }
  });

  // Validate item_types.yaml (can be strings or objects with name field)
  itemTypes.forEach((itemType, idx) => {
    const typeName = typeof itemType === 'string' ? itemType : itemType.name;
    if (!typeName || typeName.trim() === '') {
      issues.push('item_types.yaml: ItemType at index ' + idx + ' is empty');
    }
  });

  // Validate shop_type_to_item_types.yaml
  Object.entries(shopTypeToItemTypes).forEach(([shopType, itemTypesList]) => {
    if (!validShopTypeNames.has(shopType)) {
      issues.push(`shop_type_to_item_types.yaml: References unknown shop_type "${shopType}"`);
    }
    if (Array.isArray(itemTypesList)) {
      itemTypesList.forEach(itemType => {
        if (!validItemTypeNames.has(itemType)) {
          issues.push(`shop_type_to_item_types.yaml: shop_type "${shopType}" references unknown item_type "${itemType}"`);
        }
      });
    }
  });

  // Validate item_list.yaml
  itemList.forEach(itemName => {
    if (!validItemNames.has(itemName)) {
      issues.push(`item_list.yaml: Item "${itemName}" is not defined in items.yaml`);
    }
  });

  const isValid = issues.length === 0;
  
  if (isValid) {
    console.log('[Server] Validation complete: All files are valid ✓');
  } else {
    console.warn('[Server] Validation complete: Found', issues.length, 'issue(s)');
    issues.forEach(issue => console.warn(`  - ${issue}`));
  }

  lastValidationResult = {
    timestamp: new Date().toISOString(),
    issues,
    valid: isValid
  };

  return lastValidationResult;
};


// --- API Endpoints ---

// Validation endpoint - returns current validation status and can trigger re-validation
app.get('/api/validate', (req, res) => {
  const result = performValidation();
  res.json(result);
});

// Endpoint to check validation status without re-running validation
app.get('/api/validation-status', (req, res) => {
  res.json(lastValidationResult || { valid: true, issues: [], timestamp: null });
});

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
  
  // Perform validation on startup
  console.log('[Server] Performing validation on startup...');
  performValidation();
});