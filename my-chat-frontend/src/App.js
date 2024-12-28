import React from 'react';
import ChatApp from "./ChatApp";


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>USMC Demo Agent</h1>
      </header>
      
      <main>
        <ChatApp />
      </main>
      
      <footer>
        <p>*This application can produce incorrect responses.</p>
      </footer>
    </div>
  );
}

export default App;
