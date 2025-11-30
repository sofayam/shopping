const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const CATALOG_PATH = path.join(__dirname, 'data', 'catalog.json');
const SHOPPING_LIST_PATH = path.join(__dirname, 'data', 'shopping_list.json');

app.use(cors());
app.use(express.json());

// --- Helper Functions ---
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

// --- Catalog API ---
app.get('/api/catalog', async (req, res) => {
    try {
        const catalog = await readFile(CATALOG_PATH);
        res.json(catalog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/catalog', async (req, res) => {
    try {
        const newItem = req.body;
        const catalog = await readFile(CATALOG_PATH);
        
        newItem.id = Date.now().toString(); // Simple unique ID
        catalog.push(newItem);
        
        await writeFile(CATALOG_PATH, catalog);
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/item-types', async (req, res) => {
    try {
        const catalog = await readFile(CATALOG_PATH);
        const types = [...new Set(catalog.map(item => item.type))];
        res.json(types);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// --- Shopping List API ---
app.get('/api/shopping-list', async (req, res) => {
    try {
        const shoppingList = await readFile(SHOPPING_LIST_PATH);
        res.json(shoppingList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/shopping-list', async (req, res) => {
    try {
        const { itemId } = req.body;
        const catalog = await readFile(CATALOG_PATH);
        const shoppingList = await readFile(SHOPPING_LIST_PATH);

        const itemToAdd = catalog.find(item => item.id === itemId);
        if (!itemToAdd) {
            return res.status(404).json({ message: 'Item not found in catalog.' });
        }

        // Add a purchased status to the list item
        const shoppingListItem = { ...itemToAdd, purchased: false };
        shoppingList.push(shoppingListItem);

        await writeFile(SHOPPING_LIST_PATH, shoppingList);
        res.status(201).json(shoppingListItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/shopping-list/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { purchased } = req.body;
        const shoppingList = await readFile(SHOPPING_LIST_PATH);

        const itemIndex = shoppingList.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in shopping list.' });
        }

        shoppingList[itemIndex].purchased = purchased;

        await writeFile(SHOPPING_LIST_PATH, shoppingList);
        res.json(shoppingList[itemIndex]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/shopping-list/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let shoppingList = await readFile(SHOPPING_LIST_PATH);

        const initialLength = shoppingList.length;
        shoppingList = shoppingList.filter(item => item.id !== id);

        if (shoppingList.length === initialLength) {
            return res.status(404).json({ message: 'Item not found in shopping list.' });
        }

        await writeFile(SHOPPING_LIST_PATH, shoppingList);
        res.status(204).send(); // No Content
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
