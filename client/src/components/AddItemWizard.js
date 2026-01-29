import React, { useState } from 'react';

function AddItemWizard({ itemName, itemTypes, shopTypes, shopTypeToItemTypes, onComplete, onCancel }) {
  const [step, setStep] = useState('typeSelection'); // 'typeSelection' | 'newTypeAssociation' | 'confirming'
  const [selectedType, setSelectedType] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [selectedShopTypes, setSelectedShopTypes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredType, setHoveredType] = useState(null);

  // Normalize item types (handle both strings and objects)
  const normalizedItemTypes = Array.isArray(itemTypes) 
    ? itemTypes.map(it => typeof it === 'string' ? it : it.name) 
    : [];
  
  console.log('AddItemWizard received itemTypes:', itemTypes);
  console.log('Normalized itemTypes:', normalizedItemTypes);

  const handleTypeSelection = (e) => {
    setSelectedType(e.target.value);
    setNewTypeName('');
    setSelectedShopTypes([]);
    setError('');
  };

  const handleCreateNewType = () => {
    setSelectedType('');
    setStep('newTypeAssociation');
    setError('');
  };

  const handleNewTypeNameChange = (e) => {
    setNewTypeName(e.target.value);
    setError('');
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
      // Determine which item type to use
      const itemTypeToUse = selectedType || newTypeName.trim();
      
      if (!itemTypeToUse) {
        setError('Please select or enter an item type.');
        setLoading(false);
        return;
      }

      // Only check for existing type if we're creating a NEW one (not selecting existing)
      if (!selectedType && normalizedItemTypes.includes(itemTypeToUse)) {
        setError('That item type already exists.');
        setLoading(false);
        return;
      }

      // Create new item
      const newItem = {
        name: itemName,
        item_type: itemTypeToUse,
        preferred_shop: '',
        only_shop: '',
        nicknames: []
      };

      // Fetch current items
      const itemsRes = await fetch('/api/all-data');
      const allData = await itemsRes.json();
      const currentItems = allData.items || [];

      // Add new item
      const updatedItems = [...currentItems, newItem];
      await fetch('/api/data/items.yaml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItems)
      });

      // If creating new item type, add it
      if (!selectedType && newTypeName.trim()) {
        const updatedItemTypes = [...normalizedItemTypes, newTypeName.trim()];
        await fetch('/api/data/item_types.yaml', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItemTypes)
        });

        // Associate new type with selected shop types
        if (selectedShopTypes.length > 0) {
          const currentShopTypeMap = allData.shopTypeToItemTypes || {};
          const updatedShopTypeMap = { ...currentShopTypeMap };

          selectedShopTypes.forEach(shopType => {
            const existingList = updatedShopTypeMap[shopType] || [];
            const newList = Array.isArray(existingList) 
              ? [...existingList, newTypeName.trim()]
              : [...(existingList.item_types || []), newTypeName.trim()];
            updatedShopTypeMap[shopType] = newList;
          });

          await fetch('/api/data/shop_type_to_item_types.yaml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedShopTypeMap)
          });
        }
      }

      setLoading(false);
      onComplete(itemName);
    } catch (err) {
      setError(`Failed to create item: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 'newTypeAssociation') {
      // Moving to confirmation
      setStep('confirming');
    } else {
      // Final submission
      await validateAndSubmit();
    }
  };

  const handleBack = () => {
    if (step === 'newTypeAssociation') {
      setStep('typeSelection');
    } else if (step === 'confirming') {
      setStep('newTypeAssociation');
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Add New Item: {itemName}</h2>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <p style={styles.error}>{error}</p>}

          {step === 'typeSelection' && (
            <div style={styles.section}>
              <p style={{...styles.label, marginBottom: '15px', fontSize: '1.1rem'}}>
                Select the type of item or create a new one:
              </p>
              
              <div style={styles.radioGroup}>
                {normalizedItemTypes.length > 0 ? (
                  normalizedItemTypes.map(type => (
                    <label 
                      key={type} 
                      style={{
                        ...styles.radioLabel,
                        backgroundColor: selectedType === type ? '#e8f5e9' : (hoveredType === type ? '#f5f5f5' : '#ffffff'),
                        border: selectedType === type ? '2px solid #4CAF50' : '2px solid #ddd',
                      }}
                      onMouseEnter={() => setHoveredType(type)}
                      onMouseLeave={() => setHoveredType(null)}
                    >
                      <input
                        type="radio"
                        name="itemType"
                        value={type}
                        checked={selectedType === type}
                        onChange={handleTypeSelection}
                        style={styles.radioInput}
                      />
                      <span style={{fontSize: '1.05rem'}}>{type}</span>
                    </label>
                  ))
                ) : (
                  <p style={{color: '#666', fontStyle: 'italic'}}>No existing item types. Create a new one.</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleCreateNewType}
                style={styles.secondaryButton}
              >
                Create New Item Type
              </button>
            </div>
          )}

          {step === 'newTypeAssociation' && (
            <div style={styles.section}>
              <label style={styles.label}>
                New Item Type Name:
                <input
                  type="text"
                  value={newTypeName}
                  onChange={handleNewTypeNameChange}
                  placeholder="e.g., 'fresh veg', 'electronics'"
                  style={styles.input}
                  autoFocus
                />
              </label>

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

          {step === 'confirming' && (
            <div style={styles.section}>
              <p style={styles.confirmText}>
                <strong>Item:</strong> {itemName}
              </p>
              <p style={styles.confirmText}>
                <strong>Type:</strong> {newTypeName}
              </p>
              {selectedShopTypes.length > 0 && (
                <p style={styles.confirmText}>
                  <strong>Available in:</strong> {selectedShopTypes.join(', ')}
                </p>
              )}
              <p style={styles.note}>
                You can edit more details (nicknames, preferences) later in the Management section.
              </p>
            </div>
          )}

          <div style={styles.buttonGroup}>
            {(step === 'newTypeAssociation' || step === 'confirming') && (
              <button
                type="button"
                onClick={handleBack}
                style={styles.secondaryButton}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.primaryButton}
              disabled={loading}
            >
              {loading ? 'Creating...' : step === 'confirming' ? 'Create Item' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px 8px 0 0',
    padding: '20px',
    width: '100%',
    maxWidth: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '1.25rem',
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
  },
  label: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#333',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginTop: '8px',
    boxSizing: 'border-box',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
    marginBottom: '15px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '1.05rem',
    cursor: 'pointer',
    padding: '12px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    backgroundColor: '#ffffff',
    border: '2px solid transparent',
  },
  radioInput: {
    cursor: 'pointer',
    width: '24px',
    height: '24px',
    minWidth: '24px',
    minHeight: '24px',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
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
  confirmText: {
    fontSize: '1rem',
    color: '#333',
    margin: '5px 0',
  },
  note: {
    fontSize: '0.875rem',
    color: '#666',
    fontStyle: 'italic',
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
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
  secondaryButton: {
    flex: '1',
    minWidth: '100px',
    padding: '14px 16px',
    fontSize: '1.1rem',
    backgroundColor: '#2196F3',
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

export default AddItemWizard;
