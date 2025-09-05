function AppDebug() {
  console.log('AppDebug rendering...');
  
  return (
    <div style={{ 
      padding: '20px', 
      background: '#0f172a', 
      color: '#f8fafc', 
      minHeight: '100vh',
      fontFamily: 'system-ui'
    }}>
      <h1>Debug Mode - Extension Loaded Successfully!</h1>
      <p>If you can see this, React is working and the issue is with the main App component.</p>
      <div style={{ marginTop: '20px' }}>
        <button style={{ 
          background: '#8b5cf6', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Test Button
        </button>
      </div>
    </div>
  );
}

export default AppDebug;
