import React from 'react';
import ChatApp from "./ChatApp";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>OpenAI Chat Interface</h1>
      </header>
      
      <main>
        <ChatApp />
      </main>
      
      <footer>
        <p>Built with React & Flask</p>
      </footer>
    </div>
  );
}

export default App;
