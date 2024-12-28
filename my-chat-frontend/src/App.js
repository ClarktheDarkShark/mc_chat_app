import React from 'react';
import ChatApp from "./ChatApp";
import 'bootstrap/dist/css/bootstrap.min.css';


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
