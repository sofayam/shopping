import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function AddItemPage() {
  const { itemName } = useParams();
  const navigate = useNavigate();

  const [itemTypes, setItemTypes] = useState([]);
  const [shopTypes, setShopTypes] = useState([]);
  
  const [typeInput, setTypeInput] = useState('');
  const [typeSuggestions, setTypeSuggestions] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedShopTypes, setSelectedShopTypes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/all-data')
      .then(res => res.json())
      .then(data => {
        setItemTypes(data.itemTypesList || []);
        setShopTypes(data.shopTypes || []);
        setLoading(false);
      })
      .catch(err => {
        setError(`Failed to load data: ${err.message}`);
        setLoading(false);
      });
  }, []);

  const normalizedItemTypes = Array.isArray(itemTypes) 
    ? itemTypes.map(it => typeof it === 'string' ? it : it.name).sort()
    : [];

  const handleTypeInputChange = (e) => {
    const value = e.target.value;
    setTypeInput(value);
    setError('');
    
    if (value.length > 0) {
      const filtered = normalizedItemTypes.filter(type =>
        type.toLowerCase().includes(value.toLowerCase())
      );
      setTypeSuggestions(filtered);
    } else {
      setTypeSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setTypeInput('');
    setTypeSuggestions([]);
    setSelectedType(suggestion);
    setSelectedShopTypes([]);
  };

  const handleRemoveSelectedType = () => {
    setSelectedType('');
    setTypeInput('');
    setTypeSuggestions([]);
    setSelectedShopTypes([]);
  };

  const handleShopTypeToggle = (shopType) => {
    setSelectedShopTypes(prev => 
      prev.includes(shopType)
        ? prev.filter(st => st !== shopType)
        : [...prev, shopType]
    );
  };

  const validateAndSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const itemTypeToUse = selectedType || typeInput.trim();
      
      if (!itemTypeToUse) {
        setError('Please select or enter an item type.');
        setLoading(false);
        return;
      }

      // Re-fetch all data right before validation and writing to have the freshest data
      const allDataRes = await fetch('/api/all-data');
      const allData = await allDataRes.json();
      const currentItems = allData.items || [];
      const currentItemTypes = allData.itemTypesList || [];

      if (!selectedType && currentItemTypes.map(it => it.toLowerCase()).includes(itemTypeToUse.toLowerCase())) {
        setError('That item type already exists.');
        setLoading(false);
        return;
      }

      const newItem = {
        name: itemName,
        item_type: itemTypeToUse,
        preferred_shop: '',
        only_shop: '',
        nicknames: []
      };

      const updatedItems = [...currentItems, newItem];
      await fetch('/api/data/items.yaml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItems)
      });

      if (!selectedType && typeInput.trim()) {
        const updatedItemTypes = [...currentItemTypes, typeInput.trim()];
        await fetch('/api/data/item_types.yaml', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItemTypes)
        });

        if (selectedShopTypes.length > 0) {
          const updatedShopTypeMap = { ...(allData.shopTypeToItemTypes || {}) };

          selectedShopTypes.forEach(shopType => {
            const existingList = updatedShopTypeMap[shopType] || [];
            const newList = Array.isArray(existingList) 
              ? [...existingList, typeInput.trim()]
              : [...(existingList.item_types || []), typeInput.trim()];
            updatedShopTypeMap[shopType] = newList;
          });

          await fetch('/api/data/shop_type_to_item_types.yaml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedShopTypeMap)
          });
        }
      }

      // Finally, add the new item to the main shopping list
      const currentItemList = allData.itemList || [];
      const newList = [...currentItemList, itemName];
      await fetch('/api/item-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList),
      });

      setLoading(false);
      navigate('/');
    } catch (err) {
      setError(`Failed to create item: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await validateAndSubmit();
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Add New Item: {itemName}</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.section}>
          <p style={{...styles.label, marginBottom: '15px', fontSize: '1.1rem'}}>
            What type of item is this?
          </p>
          
          {selectedType ? (
            <div style={styles.selectedTypeBox}>
              <span style={{fontSize: '1.1rem', fontWeight: '500'}}>{selectedType}</span>
              <button
                type="button"
                onClick={handleRemoveSelectedType}
                style={styles.removeButton}
              >
                ✕ Change
              </button>
            </div>
          ) : (
            <div style={{position: 'relative'}}>
              <input
                type="text"
                value={typeInput}
                onChange={handleTypeInputChange}
                placeholder="Search or type a new type..."
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                style={styles.input}
                autoFocus
              />
              
              {typeSuggestions.length > 0 && (
                <div style={styles.suggestionsBox}>
                  {typeSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      style={styles.suggestionItem}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {typeInput && !selectedType && (
            <div style={{marginTop: '20px'}}>
              <p style={styles.label}>
                Which shops sell this type? (optional)
              </p>
              <div style={styles.checkboxGroup}>
                {shopTypes.map(shopType => (
                  <label key={shopType} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedShopTypes.includes(shopType)}
                      onChange={() => handleShopTypeToggle(shopType)}
                      style={styles.checkboxInput}
                    />
                    {shopType}
                  </label>
                ))}
              </div>
            </div>
          )}

          <p style={styles.note}>
            You can edit more details (nicknames, preferences) later in the Management section.
          </p>
        </div>

        <div style={styles.buttonGroup}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={styles.primaryButton}
            disabled={loading || (!selectedType && !typeInput.trim())}
          >
            {loading ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #eee'
  },
  label: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#333',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    border: '2px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  selectedTypeBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px',
    backgroundColor: '#e8f5e9',
    border: '2px solid #4CAF50',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  removeButton: {
    padding: '8px 12px',
    fontSize: '0.9rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  suggestionsBox: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
  },
  suggestionItem: {
    display: 'block',
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    textAlign: 'left',
    border: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
    marginBottom: '15px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '1.05rem',
    cursor: 'pointer',
    padding: '10px',
    borderRadius: '4px',
  },
  checkboxInput: {
    cursor: 'pointer',
    width: '24px',
    height: '24px',
    minWidth: '24px',
    minHeight: '24px',
  },
  note: {
    fontSize: '0.875rem',
    color: '#666',
    fontStyle: 'italic',
    padding: '10px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    textAlign: 'center',
  },
  error: {
    color: '#d32f2f',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
    flexWrap: 'wrap',
  },
  primaryButton: {
    flex: '1',
    minWidth: '100px',
    padding: '14px 16px',
    fontSize: '1.1rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: '1',
    minWidth: '100px',
    padding: '14px 16px',
    fontSize: '1.1rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default AddItemPage;
