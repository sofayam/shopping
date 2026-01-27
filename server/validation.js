const fs = require('fs').promises;
const path = require('path');

const CATALOG_PATH = path.join(__dirname, 'data', 'catalog.json');
const SHOPPING_LIST_PATH = path.join(__dirname, 'data', 'shopping_list.json');
const SHOPS_METADATA_PATH = path.join(__dirname, 'data', 'shops.json');

// Store the last validation result
let lastValidationResult = {
    timestamp: null,
    issues: [],
    valid: true,
    modified: false
};

const readFile = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw new Error('Could not read data file.');
    }
};

const writeFile = async (filePath, data) => {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        throw new Error('Could not write data file.');
    }
};

/**
 * Validates the consistency of all JSON data files
 * - Ensures catalog items have valid shops
 * - Ensures catalog items have valid types (if shops are assigned)
 * - Ensures shopping list items exist in catalog
 * - Ensures shopping list items have valid shops
 * - Removes invalid entries and reports issues
 */
async function validateDataConsistency() {
    console.log('Starting data consistency validation...');
    
    try {
        const catalog = await readFile(CATALOG_PATH);
        const shoppingList = await readFile(SHOPPING_LIST_PATH);
        const shopsMetadata = await readFile(SHOPS_METADATA_PATH);

        let issues = [];
        let catalogModified = false;
        let shoppingListModified = false;

        // Build set of all available shops
        const availableShops = new Set();
        for (const [shopType, shopInfo] of Object.entries(shopsMetadata)) {
            if (shopInfo.shops && Array.isArray(shopInfo.shops)) {
                shopInfo.shops.forEach(shop => availableShops.add(shop));
            }
        }

        // Validate catalog
        console.log('Validating catalog...');
        const validatedCatalog = catalog.filter(item => {
            const itemIssues = [];

            // Check if item has required fields
            if (!item.name) {
                itemIssues.push('missing name');
            }
            if (!item.type) {
                itemIssues.push('missing type');
            }

            // Check if shops are valid
            if (item.shops && Array.isArray(item.shops)) {
                const invalidShops = item.shops.filter(shop => !availableShops.has(shop));
                if (invalidShops.length > 0) {
                    itemIssues.push(`shops not found: ${invalidShops.join(', ')}`);
                }

                // Check if item type is supported by assigned shops
                let typeSupported = false;
                for (const shop of item.shops) {
                    for (const [shopType, shopInfo] of Object.entries(shopsMetadata)) {
                        if (shopInfo.shops.includes(shop) && shopInfo.itemTypes.includes(item.type)) {
                            typeSupported = true;
                            break;
                        }
                    }
                    if (typeSupported) break;
                }
                if (!typeSupported && item.shops.length > 0) {
                    itemIssues.push(`item type "${item.type}" not supported by assigned shops`);
                }
            }

            if (itemIssues.length > 0) {
                issues.push(`Catalog item "${item.name}": ${itemIssues.join(', ')}`);
                catalogModified = true;
                return false; // Filter out this item
            }

            return true;
        });

        if (catalog.length !== validatedCatalog.length) {
            console.warn(`Removed ${catalog.length - validatedCatalog.length} invalid catalog items`);
            await writeFile(CATALOG_PATH, validatedCatalog);
        }

        // Validate shopping list
        console.log('Validating shopping list...');
        const catalogNames = new Set(validatedCatalog.map(item => item.name));

        const validatedShoppingList = shoppingList.filter(item => {
            const itemIssues = [];

            // Check if item exists in catalog
            if (!catalogNames.has(item.name)) {
                itemIssues.push('not found in catalog');
            }

            // Check if shops are valid (if specified)
            if (item.shops && Array.isArray(item.shops)) {
                const invalidShops = item.shops.filter(shop => !availableShops.has(shop));
                if (invalidShops.length > 0) {
                    itemIssues.push(`shops not found: ${invalidShops.join(', ')}`);
                }
            }

            if (itemIssues.length > 0) {
                issues.push(`Shopping list item "${item.name}": ${itemIssues.join(', ')}`);
                shoppingListModified = true;
                return false; // Filter out this item
            }

            return true;
        });

        if (shoppingList.length !== validatedShoppingList.length) {
            console.warn(`Removed ${shoppingList.length - validatedShoppingList.length} invalid shopping list items`);
            await writeFile(SHOPPING_LIST_PATH, validatedShoppingList);
        }

        if (issues.length > 0) {
            console.warn('Data consistency issues found:');
            issues.forEach(issue => console.warn(`  - ${issue}`));
            console.warn('Invalid entries have been removed.');
        } else {
            console.log('All data files are consistent.');
        }

        lastValidationResult = {
            timestamp: new Date().toISOString(),
            issues,
            valid: issues.length === 0,
            modified: catalogModified || shoppingListModified
        };

        return lastValidationResult;
    } catch (error) {
        console.error('Error during data validation:', error);
        throw error;
    }
}

/**
 * Gets the last validation result
 */
function getLastValidationResult() {
    return lastValidationResult;
}

module.exports = { validateDataConsistency, getLastValidationResult };
