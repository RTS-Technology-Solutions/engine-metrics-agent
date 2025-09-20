import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🏆 Chess Engine Metrics Agent</h1>
        <p>AI-powered chess engine performance analysis platform</p>
        
        <div style={{ margin: '20px 0' }}>
          <h2>🚀 System Status</h2>
          <div style={{ color: '#4caf50' }}>✅ Frontend: Running</div>
          <div style={{ color: '#ff9800' }}>⏳ Backend: Starting...</div>
          <div style={{ color: '#ff9800' }}>⏳ AI Service: Starting...</div>
        </div>
        
        <div style={{ margin: '20px 0' }}>
          <h3>📊 Quick Start</h3>
          <ol style={{ textAlign: 'left', maxWidth: '400px' }}>
            <li>Upload PGN files from your chess engine tournaments</li>
            <li>Add JSON performance data from engine-tester</li>
            <li>Include analysis reports in Markdown format</li>
            <li>Ask AI questions about your engines' performance</li>
          </ol>
        </div>
        
        <div style={{ margin: '20px 0' }}>
          <h3>🤖 Example AI Questions</h3>
          <ul style={{ textAlign: 'left', maxWidth: '500px' }}>
            <li>"How has V7P3R improved since v10.8?"</li>
            <li>"Which engine performs best in blitz?"</li>
            <li>"Compare SlowMate vs C0BR4 performance"</li>
            <li>"What caused the recent performance drop?"</li>
          </ul>
        </div>
        
        <p style={{ fontSize: '14px', opacity: 0.7 }}>
          Once all services are running, the full interface will be available
        </p>
      </header>
    </div>
  );
}

export default App;