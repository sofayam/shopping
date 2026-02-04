import React, { useState, useEffect } from 'react';

function GlobalReplaceForm() {
  const [oldIdentifier, setOldIdentifier] = useState('');
  const [newIdentifier, setNewIdentifier] = useState('');
  const [allIdentifiers, setAllIdentifiers] = useState([]);
  const [filteredIdentifiers, setFilteredIdentifiers] = useState([]);
  const [previewResults, setPreviewResults] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/all-identifiers')
      .then(res => res.json())
      .then(data => setAllIdentifiers(data))
      .catch(err => console.error('Failed to fetch all identifiers:', err));
  }, []);

  const handleOldIdentifierChange = (e) => {
    const value = e.target.value;
    setOldIdentifier(value);
    if (value) {
      setFilteredIdentifiers(
        allIdentifiers.filter(id => id.toLowerCase().includes(value.toLowerCase()))
      );
    } else {
      setFilteredIdentifiers([]);
    }
  };

  const validateInputs = () => {
    if (!oldIdentifier.trim() || !newIdentifier.trim()) {
      setError('Both "Old Identifier" and "New Identifier" fields are required.');
      return false;
    }
    if (oldIdentifier === newIdentifier) {
      setError('"Old Identifier" and "New Identifier" cannot be the same.');
      return false;
    }
    if (allIdentifiers.some(id => id.toLowerCase() === newIdentifier.toLowerCase())) {
      setError(`"${newIdentifier}" already exists as an identifier. Please choose a unique new identifier.`);
      return false;
    }
    setError('');
    return true;
  };

  const handlePreview = async () => {
    if (!validateInputs()) return;
    setIsLoading(true);
    setMessage('');
    setPreviewResults(null);
    try {
      const response = await fetch('/api/global-replace-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldIdentifier, newIdentifier }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get preview.');
      }
      setPreviewResults(data);
      setMessage(`Preview complete. Found ${data.totalOccurrences} occurrences.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplace = async () => {
    if (!validateInputs()) return;
    if (!window.confirm(`Are you sure you want to replace all occurrences of "${oldIdentifier}" with "${newIdentifier}"? This action will create a backup.`)) {
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/global-replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldIdentifier, newIdentifier }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Global replacement failed.');
      }
      setMessage(`Global replacement successful! Replaced in: ${Object.keys(data.replacedFiles).join(', ')}. Validation: ${data.validationResult.valid ? 'Passed' : 'Failed'}.`);
      if (!data.validationResult.valid) {
        setError('Validation failed after replacement. Check server logs for details.');
      }
      setPreviewResults(null); // Clear preview after replacement
      setOldIdentifier('');
      setNewIdentifier('');
      // Re-fetch identifiers in case newIdentifier is now part of the system
      fetch('/api/all-identifiers')
        .then(res => res.json())
        .then(ids => setAllIdentifiers(ids))
        .catch(err => console.error('Failed to re-fetch all identifiers:', err));

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!window.confirm('Are you sure you want to roll back to the last backup? All changes since then will be lost.')) {
      return;
    }
    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/rollback-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Rollback failed.');
      }
      setMessage(`Rollback successful: ${data.message}`);
      // Re-fetch all data and identifiers after rollback
      // This would typically involve a full page reload or re-fetching all appData
      window.location.reload(); 
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Global Identifier Replacement</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="oldIdentifier" style={{ display: 'block', marginBottom: '5px' }}>Old Identifier (case-sensitive):</label>
        <input
          id="oldIdentifier"
          type="text"
          value={oldIdentifier}
          onChange={handleOldIdentifierChange}
          list="identifiers-list"
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          disabled={isLoading}
        />
        <datalist id="identifiers-list">
          {filteredIdentifiers.map((id, index) => (
            <option key={index} value={id} />
          ))}
        </datalist>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="newIdentifier" style={{ display: 'block', marginBottom: '5px' }}>New Identifier:</label>
        <input
          id="newIdentifier"
          type="text"
          value={newIdentifier}
          onChange={(e) => setNewIdentifier(e.target.value)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          disabled={isLoading}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={handlePreview} disabled={isLoading || !oldIdentifier || !newIdentifier}>
          {isLoading ? 'Loading Preview...' : 'Preview Changes'}
        </button>
        <button onClick={handleReplace} disabled={isLoading || !previewResults || previewResults.totalOccurrences === 0}>
          {isLoading ? 'Replacing...' : 'Perform Replacement'}
        </button>
        <button onClick={handleRollback} disabled={isLoading} style={{ backgroundColor: '#f44336', color: 'white' }}>
          {isLoading ? 'Rolling Back...' : 'Rollback to Last Backup'}
        </button>
      </div>

      {previewResults && previewResults.totalOccurrences > 0 && (
        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <h3>Preview Details:</h3>
          <p>Total occurrences: {previewResults.totalOccurrences}</p>
          <ul>
            {Object.entries(previewResults.previewResults).map(([file, count]) => (
              <li key={file}>{file}: {count} occurrences</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default GlobalReplaceForm;
