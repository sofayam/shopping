import React from 'react';
import { Alert, ListGroup } from 'react-bootstrap';

const IntegrityReport = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <Alert variant="success">
        <Alert.Heading>All Checks Passed!</Alert.Heading>
        <p>No data integrity issues were found.</p>
      </Alert>
    );
  }

  const getVariant = (level) => {
    switch (level) {
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <>
      <h2>Data Integrity Status Report</h2>
      <p>The following issues were found during the startup check:</p>
      <ListGroup>
        {messages.map((msg, index) => (
          <ListGroup.Item key={index} variant={getVariant(msg.level)}>
            {msg.message}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  );
};

export default IntegrityReport;
