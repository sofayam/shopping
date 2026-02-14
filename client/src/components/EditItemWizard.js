import React, { useState, useEffect } from 'react';

function EditItemWizard({ item, appData, onSave, onCancel }) {
  const [nicknames, setNicknames] = useState('');
  const [preferredShop, setPreferredShop] = useState('');
  const [onlyShop, setOnlyShop] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setNicknames((item.nicknames || []).join(', '));
      setPreferredShop(item.preferred_shop || '');
      setOnlyShop(item.only_shop || '');
    }
    // Disable viewport scaling for a better mobile modal experience
    const viewport = document.querySelector('meta[name="viewport"]');
    const originalContent = viewport?.getAttribute('content');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    return () => {
      if (viewport && originalContent) {
        viewport.setAttribute('content', originalContent);
      }
    };
  }, [item]);

  const handleSave = async () => {
    if (onlyShop && preferredShop && onlyShop === preferredShop) {
        setError('An item cannot have the same shop for "Preferred" and "Only". Please choose one or the other.');
        return;
    }
    setError('');
    setLoading(true);

    const nicknameArray = nicknames.split(',').map(n => n.trim()).filter(Boolean);

    const updatedItem = {
      ...item,
      nicknames: nicknameArray,
      preferred_shop: preferredShop,
      only_shop: onlyShop,
    };

    try {
      const currentItems = appData.items || [];
      const updatedItems = currentItems.map(i => (i.name === item.name ? updatedItem : i));

      const response = await fetch('/api/data/items.yaml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItems),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes.');
      }

      setLoading(false);
      onSave(); // This will trigger a data refresh in the parent
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!item) return null;

  const allShops = appData.shops ? appData.shops.map(s => s.name) : [];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Edit Item: {item.name}</h2>
        <p style={styles.subtitle}>Type: {item.item_type}</p>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.form}>
          <div style={styles.section}>
            <label htmlFor="nicknames" style={styles.label}>Nicknames</label>
            <input
              id="nicknames"
              type="text"
              value={nicknames}
              onChange={(e) => setNicknames(e.target.value)}
              placeholder="e.g., bog roll, loo paper"
              style={styles.input}
            />
            <small style={styles.note}>Enter multiple names separated by commas.</small>
          </div>

          <div style={styles.section}>
            <label htmlFor="preferred_shop" style={styles.label}>Preferred Shop</label>
            <select
              id="preferred_shop"
              value={preferredShop}
              onChange={(e) => setPreferredShop(e.target.value)}
              style={styles.input}
            >
              <option value="">-- No Preference --</option>
              {allShops.map(shop => (
                <option key={shop} value={shop}>{shop}</option>
              ))}
            </select>
            <small style={styles.note}>This shop will be chosen if available.</small>
          </div>

          <div style={styles.section}>
            <label htmlFor="only_shop" style={styles.label}>Only Shop</label>
            <select
              id="only_shop"
              value={onlyShop}
              onChange={(e) => setOnlyShop(e.target.value)}
              style={styles.input}
            >
              <option value="">-- No Restriction --</option>
              {allShops.map(shop => (
                <option key={shop} value={shop}>{shop}</option>
              ))}
            </select>
            <small style={styles.note}>Item will ONLY be bought from this shop.</small>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={onCancel} style={styles.cancelButton} disabled={loading}>
            Cancel
          </button>
          <button onClick={handleSave} style={styles.primaryButton} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
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
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 2000,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px 12px 0 0',
      padding: '20px',
      width: '100%',
      maxWidth: '100vw',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 -5px 15px rgba(0, 0, 0, 0.2)',
      WebkitOverflowScrolling: 'touch',
      paddingTop: '60px', // Give space for the title
      position: 'relative',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '5px',
      textAlign: 'center',
    },
    subtitle: {
        fontSize: '1rem',
        color: '#666',
        textAlign: 'center',
        marginBottom: '25px',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    section: {
      display: 'flex',
      flexDirection: 'column',
    },
    label: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#444',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '14px',
      fontSize: '1rem',
      border: '2px solid #ddd',
      borderRadius: '8px',
      boxSizing: 'border-box',
      backgroundColor: '#f9f9f9',
    },
    note: {
      fontSize: '0.875rem',
      color: '#777',
      marginTop: '5px',
    },
    error: {
      color: '#d32f2f',
      padding: '12px',
      backgroundColor: '#ffebee',
      borderRadius: '8px',
      marginBottom: '15px',
      textAlign: 'center',
      fontWeight: '500',
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'space-between',
      marginTop: '30px',
    },
    primaryButton: {
      flex: '2',
      padding: '15px 20px',
      fontSize: '1.1rem',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
    cancelButton: {
      flex: '1',
      padding: '15px 20px',
      fontSize: '1.1rem',
      backgroundColor: '#f44336',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
  };

export default EditItemWizard;
