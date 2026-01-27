import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Alert, Badge, Spinner } from 'react-bootstrap';

const ValidationReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/validation-report');
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch validation report', err);
      setError('Failed to fetch validation report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-4">Data Validation Report</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {report && (
        <>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="mb-2">Status</Card.Title>
                  <p className="mb-0">
                    {report.valid ? (
                      <Badge bg="success">All systems nominal</Badge>
                    ) : (
                      <Badge bg="warning">Issues detected</Badge>
                    )}
                  </p>
                </div>
                <div className="text-end">
                  <small className="text-muted d-block mb-2">Last checked</small>
                  <p className="mb-0">
                    {report.timestamp ? new Date(report.timestamp).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {report.modified && (
            <Alert variant="info" className="mb-4">
              <strong>Note:</strong> Invalid data was automatically removed and files were corrected during the last validation.
            </Alert>
          )}

          {report.issues && report.issues.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <Card.Title className="mb-0">Issues Found ({report.issues.length})</Card.Title>
              </Card.Header>
              <Card.Body>
                <ul className="mb-0">
                  {report.issues.map((issue, index) => (
                    <li key={index} className="mb-3">
                      <code className="text-danger">{issue}</code>
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}

          {report.valid && (
            <Card className="mb-4">
              <Card.Body>
                <p className="mb-0 text-success">
                  <strong>✓</strong> All data files are consistent and valid. No issues found.
                </p>
              </Card.Body>
            </Card>
          )}

          <Card>
            <Card.Header>
              <Card.Title className="mb-0">What is validated?</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>Catalog Validation</h6>
                <ul className="mb-0 small">
                  <li>Each item has a name and type</li>
                  <li>All assigned shops exist in the shops configuration</li>
                  <li>Item types are supported by the assigned shops</li>
                </ul>
              </div>
              <div>
                <h6>Shopping List Validation</h6>
                <ul className="mb-0 small">
                  <li>All items exist in the catalog</li>
                  <li>All assigned shops exist in the shops configuration</li>
                  <li>Items match their catalog definitions</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </>
  );
};

export default ValidationReport;
