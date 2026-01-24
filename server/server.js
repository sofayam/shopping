const express = require('express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for potentially large data files

const dataDir = path.join(__dirname, 'data');

// --- Data Reading ---

const readYaml = (fileName) => {
  try {
    const fileContents = fs.readFileSync(path.join(dataDir, fileName), 'utf8');
    return yaml.load(fileContents);
  } catch (e) {
    console.error(`Error reading ${fileName}:`, e);
    return null;
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
  'what_is_where.yaml',
  'item_list.yaml'
];

// --- API Endpoints ---

app.get('/api/all-data', (req, res) => {
  const data = {};
  EDITABLE_FILES.forEach(file => {
    // a bit of camelCase for the client
    const key = file.replace('.yaml', '').replace(/_([a-z])/g, g => g[1].toUpperCase());
    data[key] = readYaml(file);
  });
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


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
