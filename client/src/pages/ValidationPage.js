import React, { useState, useEffect, useCallback } from 'react';

function ValidationPage({ onValidationStatusChange }) {
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchValidation = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/validate')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setValidationResult(data);
        setLoading(false);
        // Notify parent component of validation status change
        if (onValidationStatusChange) {
          onValidationStatusChange(data);
        }
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, [setLoading, setError, setValidationResult, onValidationStatusChange]);

  useEffect(() => {
    fetchValidation();
  }, [fetchValidation]);

  const handleReload = () => {
    fetchValidation();
  };

  return (
    <div>
      <h2>Data Validation Report</h2>
      
      <button onClick={handleReload} disabled={loading} style={{ marginBottom: '20px' }}>
        {loading ? 'Validating...' : 'Reload & Validate'}
      </button>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {validationResult && (
        <div>
          <div style={{
            padding: '10px',
            marginBottom: '20px',
            backgroundColor: validationResult.valid ? '#d4edda' : '#f8d7da',
            border: `2px solid ${validationResult.valid ? '#28a745' : '#dc3545'}`,
            borderRadius: '4px'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>
              {validationResult.valid ? '✓ All Data Valid' : '✗ Validation Issues Found'}
            </h3>
            <p style={{ margin: '0' }}>
              <strong>Checked:</strong> {new Date(validationResult.timestamp).toLocaleString()}
            </p>
          </div>

          {validationResult.issues.length > 0 ? (
            <div>
              <h4>Issues ({validationResult.issues.length}):</h4>
              <ul style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
                {validationResult.issues.map((issue, index) => (
                  <li key={index} style={{ marginBottom: '8px', color: '#333' }}>
                    {issue}
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: '15px', color: '#666' }}>
                Please fix these issues by editing the corresponding data in the management pages.
              </p>
            </div>
          ) : (
            <div style={{ padding: '10px', backgroundColor: '#f0f9f0', borderRadius: '4px' }}>
              <p>No validation issues detected. Your data is consistent and properly configured.</p>
            </div>
          )}
        </div>
      )}

      {loading && !validationResult && (
        <p>Running validation...</p>
      )}
    </div>
  );
}

export default ValidationPage;
