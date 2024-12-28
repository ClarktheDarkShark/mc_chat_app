// src/ChatApp.jsx
import React, { useState } from "react";

function ChatApp() {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("gpt-4o");  // default
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [assistantReply, setAssistantReply] = useState("");
  const [error, setError] = useState("");

  // Sends the user's message & parameters to your Flask API
  async function sendMessage() {
    setError("");
    setAssistantReply("");

    if (!message.trim()) {
      setError("Please enter a message first.");
      return;
    }

    // Build the request body
    const payload = {
      message: message.trim(),
      model,
      system_prompt: systemPrompt.trim(),
      temperature
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setAssistantReply(data.assistant_reply);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Check the console.");
    }
  }

  return (
    <div style={{ margin: "2rem auto", maxWidth: "600px" }}>
      <h1>Chat with OpenAI</h1>
      
      <div style={{ marginBottom: "1rem" }}>
        <label>System Prompt:</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={3}
          style={{ width: "100%", display: "block" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>Model: </label>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="gpt-4o">gpt-4o</option>
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="o1-mini">o1-mini</option>
          <option value="o1-preview">o1-preview</option>
        </select>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>Temperature: {temperature}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          style={{ width: "100%", display: "block" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>Message:</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      <button onClick={sendMessage} style={{ padding: "0.5rem 1rem" }}>
        Send
      </button>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>Error: {error}</p>}
      {assistantReply && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Assistant Reply:</h3>
          <p>{assistantReply}</p>
        </div>
      )}
    </div>
  );
}

export default ChatApp;
