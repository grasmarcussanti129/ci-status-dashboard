import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    fetch('/api/statuses')
      .then((response) => response.json())
      .then((data) => setStatuses(data));
  }, []);

  return (
    <div className="App">
      <h1>CI Status Dashboard</h1>
      <div>
        {/* Render pipeline statuses here */}
        {statuses.map((status, index) => (
          <div key={index}>{status.message}</div>
        ))}
      </div>
    </div>
  );
}

export default App;
