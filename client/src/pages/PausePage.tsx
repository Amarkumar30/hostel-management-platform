import React from 'react';

const PausePage: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#1c1c1c',
      color: '#e0e0e0',
      fontFamily: 'sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Project on Pause</h1>
      <p style={{ fontSize: '1.5rem', fontStyle: 'italic', maxWidth: '600px' }}>
        "The two most powerful warriors are patience and time."
      </p>
      <p style={{ fontSize: '1rem', marginTop: '0.5rem', color: '#a0a0a0' }}>- Leo Tolstoy</p>
    </div>
  );
};

export default PausePage;
