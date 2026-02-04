const express = require('express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
// const cors = require('cors'); // Removed as frontend and backend will be served from the same origin

const app = express();
const port = 3001; // Server will now serve both frontend and backend on this port

// In-memory cache for ticked items
let tickedItemsCache = {};

// app.use(cors()); // Removed
app.use(express.json({ limit: '10mb' }));

// Serve static files from the React app's build directory
app.use(express.static(path.join(__dirname, '../client/build')));

const dataDir = path.join(__dirname, '../data_persistence');
const BACKUP_DIR = path.join(__dirname, '../data_backups'); // New constant
const PURCHASE_HISTORY_FILE = 'purchase_history.yaml'; // New constant

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Function to create a timestamped backup of data_persistence
const createBackup = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);
  fs.mkdirSync(backupPath, { recursive: true });

  fs.readdirSync(dataDir).forEach(file => {
    const src = path.join(dataDir, file);
    const dest = path.join(backupPath, file);
    fs.copyFileSync(src, dest);
  });
  console.log(`[Server] Created backup: ${backupPath}`);
  return backupPath;
};

// Function to restore the latest backup
const restoreLatestBackup = () => {
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(name => name.startsWith('backup-'))
    .sort()
    .reverse(); // Latest backup first

  if (backups.length === 0) {
    throw new Error('No backups found to restore.');
  }

  const latestBackupPath = path.join(BACKUP_DIR, backups[0]);

  // Clear current data_persistence
  fs.readdirSync(dataDir).forEach(file => {
    fs.unlinkSync(path.join(dataDir, file));
  });

  // Copy files from latest backup to data_persistence
  fs.readdirSync(latestBackupPath).forEach(file => {
    const src = path.join(latestBackupPath, file);
    const dest = path.join(dataDir, file);
    fs.copyFileSync(src, dest);
  });
  console.log(`[Server] Restored from backup: ${latestBackupPath}`);
  return latestBackupPath;
};

// Helper function to recursively replace identifiers in a data structure
const replaceIdentifierInYamlData = (data, oldIdentifier, newIdentifier, isPreview = false) => {
  let replacementsCount = 0;
  const lowerOldIdentifier = oldIdentifier.toLowerCase();

  const traverseAndReplace = (currentData, key = null) => {
    if (typeof currentData === 'string') {
      // Check if the string itself is the oldIdentifier (case-insensitive match)
      if (currentData.toLowerCase() === lowerOldIdentifier) {
        replacementsCount++;
        return isPreview ? currentData : newIdentifier;
      }
      return currentData;
    } else if (Array.isArray(currentData)) {
      // If it's an array, iterate over its elements
      return currentData.map(item => traverseAndReplace(item));
    } else if (typeof currentData === 'object' && currentData !== null) {
      const newObject = {};
      for (const prop in currentData) {
        if (Object.prototype.hasOwnProperty.call(currentData, prop)) {
          let newProp = prop;
          // Check if the property name itself is the oldIdentifier (case-insensitive match)
          if (prop.toLowerCase() === lowerOldIdentifier) {
            replacementsCount++;
            newProp = isPreview ? prop : newIdentifier;
          }
          // Recursively process the value
          newObject[newProp] = traverseAndReplace(currentData[prop], prop);
        }
      }
      return newObject;
    }
    return currentData;
  };

  const result = traverseAndReplace(data);
  return { data: result, replacementsCount };
};


// --- Validation State ---
let lastValidationResult = null;

// --- Data Reading ---

const readYaml = (fileName) => {
  try {
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) { // Check if file exists before trying to read
      // Return appropriate empty structure for non-existent files
      if (fileName === 'shop_type_to_item_types.yaml') { // This is a map
        return {};
      }
      return []; // Most other files are lists
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents);

    // Handle empty or null YAML content
    if (data === null || typeof data === 'undefined') {
      if (fileName === 'shop_type_to_item_types.yaml') {
        return {};
      }
      return [];
    }
    return data;
  } catch (e) {
    // Log a warning for file not found, error for other issues
    if (e.code === 'ENOENT') {
      console.warn(`[Server] YAML file not found: ${fileName}. Returning empty structure.`);
      if (fileName === 'shop_type_to_item_types.yaml') {
        return {};
      }
      return [];
    } else {
      console.error(`[Server] Error reading ${fileName}:`, e);
      if (fileName === 'shop_type_to_item_types.yaml') {
        return {};
      }
      return [];
    }
  }
};

// --- Data Writing ---

const writeYaml = (fileName, data) => {
  const yamlStr = yaml.dump(data);
  fs.writeFileSync(path.join(dataDir, fileName), yamlStr, 'utf8');
};

// --- Purchase History Reading/Writing ---
const readPurchaseHistory = () => {
  try {
    const fileContents = fs.readFileSync(path.join(dataDir, PURCHASE_HISTORY_FILE), 'utf8');
    const data = yaml.load(fileContents);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (e.code === 'ENOENT') { // File not found
      return [];
    }
    console.error(`Error reading ${PURCHASE_HISTORY_FILE}:`, e);
    return [];
  }
};

const writePurchaseHistory = (data) => {
  const yamlStr = yaml.dump(data);
  fs.writeFileSync(path.join(dataDir, PURCHASE_HISTORY_FILE), yamlStr, 'utf8');
};

// Helper function to extract names from an array of objects or strings
const extractNames = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(entry => typeof entry === 'string' ? entry : entry.name).filter(Boolean);
};

// Whitelist of files that can be modified via the API
const EDITABLE_FILES = [
  'items.yaml',
  'shops.yaml',
  'shop_types.yaml',
  'item_types.yaml',
  'shop_type_to_item_types.yaml', // Renamed from item_type_to_shop_type.yaml
  // 'preferred_shops_by_item_type.yaml', // Removed as per user's request
  'item_list.yaml',
  PURCHASE_HISTORY_FILE // Add purchase_history.yaml to editable files
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

  // Build sets for quick lookup
  // Handle both formats: objects with .name property and simple strings
  const validItemNames = new Set(items.map(item => item.name));
  const validShopNames = new Set(shops.map(shop => shop.name));
  const validShopTypeNames = new Set(shopTypes.map(st => typeof st === 'string' ? st : st.name));
  const validItemTypeNames = new Set(itemTypes.map(it => typeof it === 'string' ? it : it.name));

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
    // Validate nicknames if present
    if (item.nicknames && Array.isArray(item.nicknames)) {
      item.nicknames.forEach((nick, idx) => {
        if (!nick || nick.trim() === '') {
          issues.push(`items.yaml: Item "${item.name}" has empty nickname at index ${idx}`);
        }
      });
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

  // Check for orphan item types (defined but not assigned to any shop type)
  const assignedItemTypes = new Set();
  Object.values(shopTypeToItemTypes).forEach(itemTypesList => {
    if (Array.isArray(itemTypesList)) {
      itemTypesList.forEach(itemType => assignedItemTypes.add(itemType));
    }
  });
  
  validItemTypeNames.forEach(itemType => {
    if (!assignedItemTypes.has(itemType)) {
      issues.push(`item_types.yaml: Item type "${itemType}" is not assigned to any shop type in shop_type_to_item_types.yaml`);
    }
  });

  // Validate item_list.yaml
  itemList.forEach(itemName => {
    if (!validItemNames.has(itemName)) {
      issues.push(`item_list.yaml: Item "${itemName}" is not defined in items.yaml`);
    }
  });

  // Check for duplicate items (case-insensitive)
  const itemNameLower = new Map();
  items.forEach(item => {
    const lower = item.name.toLowerCase();
    if (itemNameLower.has(lower)) {
      issues.push(`items.yaml: Duplicate item name (case-insensitive) "${item.name}" - already exists as "${itemNameLower.get(lower)}"`);
    } else {
      itemNameLower.set(lower, item.name);
    }
  });

  // Check for duplicate shops (case-insensitive)
  const shopNameLower = new Map();
  shops.forEach(shop => {
    const lower = shop.name.toLowerCase();
    if (shopNameLower.has(lower)) {
      issues.push(`shops.yaml: Duplicate shop name (case-insensitive) "${shop.name}" - already exists as "${shopNameLower.get(lower)}"`);
    } else {
      shopNameLower.set(lower, shop.name);
    }
  });

  // Check for duplicate item types (case-insensitive)
  const itemTypeLower = new Map();
  itemTypes.forEach((itemType, idx) => {
    const typeName = typeof itemType === 'string' ? itemType : itemType.name;
    const lower = typeName.toLowerCase();
    if (itemTypeLower.has(lower)) {
      issues.push(`item_types.yaml: Duplicate item type (case-insensitive) "${typeName}" at index ${idx} - already exists as "${itemTypeLower.get(lower)}"`);
    } else {
      itemTypeLower.set(lower, typeName);
    }
  });

  // Check for duplicate shop types (case-insensitive)
  const shopTypeLower = new Map();
  shopTypes.forEach((shopType, idx) => {
    const typeName = typeof shopType === 'string' ? shopType : shopType.name;
    const lower = typeName.toLowerCase();
    if (shopTypeLower.has(lower)) {
      issues.push(`shop_types.yaml: Duplicate shop type (case-insensitive) "${typeName}" at index ${idx} - already exists as "${shopTypeLower.get(lower)}"`);
    } else {
      shopTypeLower.set(lower, typeName);
    }
  });

  // Check for orphan shop types (defined but not used by any shop)
  const usedShopTypes = new Set(shops.map(shop => shop.shop_type));
  validShopTypeNames.forEach(shopType => {
    if (!usedShopTypes.has(shopType)) {
      issues.push(`shop_types.yaml: Shop type "${shopType}" is not used by any shop in shops.yaml`);
    }
  });

  // Check for shop types with no item types assigned
  validShopTypeNames.forEach(shopType => {
    const itemTypesForShop = shopTypeToItemTypes[shopType];
    if (!itemTypesForShop || !Array.isArray(itemTypesForShop) || itemTypesForShop.length === 0) {
      issues.push(`shop_type_to_item_types.yaml: Shop type "${shopType}" has no item types assigned`);
    }
  });

  // Check for nickname conflicts and duplicates
  items.forEach(item => {
    if (item.nicknames && Array.isArray(item.nicknames)) {
      const seenNicknames = new Set();
      item.nicknames.forEach((nick, idx) => {
        // Check for duplicate nicknames in same item
        if (seenNicknames.has(nick.toLowerCase())) {
          issues.push(`items.yaml: Item "${item.name}" has duplicate nickname "${nick}"`);
        } else {
          seenNicknames.add(nick.toLowerCase());
        }
        // Check if nickname conflicts with item name
        if (nick.toLowerCase() === item.name.toLowerCase()) {
          issues.push(`items.yaml: Item "${item.name}" has nickname "${nick}" that matches its own canonical name`);
        }
        // Check if nickname matches another item's name
        items.forEach(otherItem => {
          if (otherItem.name !== item.name && nick.toLowerCase() === otherItem.name.toLowerCase()) {
            issues.push(`items.yaml: Item "${item.name}" has nickname "${nick}" that matches another item's name "${otherItem.name}"`);
          }
        });
      });
    }
  });

  // Check for duplicate items in itemList
  const seenInList = new Set();
  itemList.forEach(itemName => {
    if (seenInList.has(itemName)) {
      issues.push(`item_list.yaml: Duplicate item "${itemName}" in list`);
    } else {
      seenInList.add(itemName);
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

// Ticked items endpoints
app.get('/api/ticked-items', (req, res) => {
  res.json(tickedItemsCache);
});

app.post('/api/ticked-items', (req, res) => {
  tickedItemsCache = req.body || {};
  res.status(200).send({ message: 'Ticked items updated successfully.' });
});

// All identifiers endpoint
app.get('/api/all-identifiers', (req, res) => {
  try {
    const identifiers = new Set();

    // Read all relevant YAML files
    const items = readYaml('items.yaml');
    const shops = readYaml('shops.yaml');
    const itemTypes = readYaml('item_types.yaml');
    const shopTypes = readYaml('shop_types.yaml');
    const itemList = readYaml('item_list.yaml');
    const shopTypeToItemTypes = readYaml('shop_type_to_item_types.yaml');

    // Extract item names and nicknames
    items.forEach(item => {
      if (item.name) identifiers.add(item.name);
      if (Array.isArray(item.nicknames)) {
        item.nicknames.forEach(nick => identifiers.add(nick));
      }
    });

    // Extract shop names
    shops.forEach(shop => {
      if (shop.name) identifiers.add(shop.name);
    });

    // Extract item type names
    extractNames(itemTypes).forEach(name => identifiers.add(name));

    // Extract shop type names
    extractNames(shopTypes).forEach(name => identifiers.add(name));

    // Extract item names from item_list
    itemList.forEach(itemName => identifiers.add(itemName));

    // Extract shop types and item types from shop_type_to_item_types (keys and values)
    Object.keys(shopTypeToItemTypes).forEach(shopType => identifiers.add(shopType));
    Object.values(shopTypeToItemTypes).forEach(itemTypesList => {
      if (Array.isArray(itemTypesList)) {
        itemTypesList.forEach(itemType => identifiers.add(itemType));
      }
    });

    const sortedIdentifiers = Array.from(identifiers).sort();
    res.json(sortedIdentifiers);

  } catch (e) {
    console.error('Error fetching all identifiers:', e);
    res.status(500).send({ message: 'Failed to fetch all identifiers.' });
  }
});

// Backup and Rollback Endpoints
app.post('/api/create-backup', (req, res) => {
  try {
    const backupPath = createBackup();
    res.status(200).send({ message: `Backup created at ${backupPath}` });
  } catch (e) {
    console.error('Error creating backup:', e);
    res.status(500).send({ message: `Failed to create backup: ${e.message}` });
  }
});

app.post('/api/rollback-backup', (req, res) => {
  try {
    const restoredPath = restoreLatestBackup();
    // Re-run validation after restore
    performValidation();
    res.status(200).send({ message: `Restored from backup ${restoredPath}` });
  } catch (e) {
    console.error('Error restoring backup:', e);
    res.status(500).send({ message: `Failed to restore backup: ${e.message}` });
  }
});

// Global Replace Endpoints
app.post('/api/global-replace-preview', (req, res) => {
  const { oldIdentifier, newIdentifier } = req.body;

  if (!oldIdentifier || !newIdentifier) {
    return res.status(400).send({ message: 'Both oldIdentifier and newIdentifier are required.' });
  }

  const previewResults = {};
  let totalOccurrences = 0;

  EDITABLE_FILES.forEach(fileName => {
    try {
      const fileContent = readYaml(fileName);
      const { replacementsCount } = replaceIdentifierInYamlData(fileContent, oldIdentifier, newIdentifier, true); // isPreview = true
      if (replacementsCount > 0) {
        previewResults[fileName] = replacementsCount;
        totalOccurrences += replacementsCount;
      }
    } catch (e) {
      console.error(`Error during preview for ${fileName}:`, e);
      // Continue to next file, but maybe log an error for the user
    }
  });

  res.status(200).json({ previewResults, totalOccurrences });
});

app.post('/api/global-replace', (req, res) => {
  const { oldIdentifier, newIdentifier } = req.body;

  if (!oldIdentifier || !newIdentifier) {
    return res.status(400).send({ message: 'Both oldIdentifier and newIdentifier are required.' });
  }

  try {
    // 1. Create backup
    createBackup();

    // 2. Perform replacements
    const replacedFiles = {};
    EDITABLE_FILES.forEach(fileName => {
      const fileContent = readYaml(fileName);
      const { data: newContent, replacementsCount } = replaceIdentifierInYamlData(fileContent, oldIdentifier, newIdentifier, false); // isPreview = false
      if (replacementsCount > 0) {
        writeYaml(fileName, newContent);
        replacedFiles[fileName] = replacementsCount;
      }
    });

    // 3. Re-run validation
    const validationResult = performValidation();

    res.status(200).json({
      message: 'Global replacement completed.',
      replacedFiles,
      validationResult
    });

  } catch (e) {
    console.error('Error during global replacement:', e);
    res.status(500).send({ message: `Global replacement failed: ${e.message}` });
  }
});


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
  const { itemsToKeep, purgedItems, selectedShops } = req.body;

  if (!Array.isArray(itemsToKeep) || !Array.isArray(purgedItems) || typeof selectedShops !== 'object') {
    return res.status(400).send({ message: 'Invalid payload for item list update. Expected itemsToKeep, purgedItems, and selectedShops.' });
  }

  try {
    // 1. Update item_list.yaml with items to keep
    writeYaml('item_list.yaml', itemsToKeep);

    // 2. Archive purged items to purchase_history.yaml
    if (purgedItems.length > 0) {
      const history = readPurchaseHistory();
      const selectedShopNames = Object.keys(selectedShops).filter(shopName => selectedShops[shopName]);
      const newHistoryEntry = {
        timestamp: new Date().toISOString(),
        purgedItems: purgedItems,
        selectedShops: selectedShopNames, // Changed to list of selected shop names
      };
      history.push(newHistoryEntry);
      writePurchaseHistory(history);
    }

    // 3. Clear ticked items cache
    tickedItemsCache = {};

    res.status(200).send({ message: 'Item list updated and purged items archived successfully.' });
  } catch (e) {
    console.error('Error updating item_list.yaml or archiving purged items:', e);
    res.status(500).send({ message: 'Failed to update item list or archive purged items.' });
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