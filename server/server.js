const express = require('express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, 'data');

// Helper function to read a YAML file
const readYaml = (fileName) => {
  try {
    const fileContents = fs.readFileSync(path.join(dataDir, fileName), 'utf8');
    return yaml.load(fileContents);
  } catch (e) {
    console.error(`Error reading ${fileName}:`, e);
    return null;
  }
};

// API endpoint to get all data
app.get('/api/all-data', (req, res) => {
  const data = {
    items: readYaml('items.yaml'),
    shops: readYaml('shops.yaml'),
    shopTypes: readYaml('shop_types.yaml'),
    whatIsWhere: readYaml('what_is_where.yaml'),
    itemList: readYaml('item_list.yaml'),
  };
  res.json(data);
});

// API endpoint to get the item list
app.get('/api/item-list', (req, res) => {
  res.json(readYaml('item_list.yaml'));
});

// API endpoint to update the item list
app.post('/api/item-list', (req, res) => {
  const newItemList = req.body;
  try {
    const yamlStr = yaml.dump(newItemList);
    fs.writeFileSync(path.join(dataDir, 'item_list.yaml'), yamlStr, 'utf8');
    res.status(200).send({ message: 'Item list updated successfully.' });
  } catch (e) {
    console.error('Error writing item_list.yaml:', e);
    res.status(500).send({ message: 'Failed to update item list.' });
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
