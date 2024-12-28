// src/ChatApp.jsx
import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

function ChatApp() {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [assistantReply, setAssistantReply] = useState("");
  const [error, setError] = useState("");

  async function sendMessage() {
    setError("");
    setAssistantReply("");

    if (!message.trim()) {
      setError("Please enter a message first.");
      return;
    }

    const payload = {
      message: message.trim(),
      model,
      system_prompt: systemPrompt.trim(),
      temperature,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Chat with OpenAI
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="System Prompt"
          multiline
          rows={3}
          fullWidth
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          sx={{ my: 1 }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="model-select-label">Model</InputLabel>
          <Select
            labelId="model-select-label"
            value={model}
            label="Model"
            onChange={(e) => setModel(e.target.value)}
          >
            <MenuItem value="gpt-4o">gpt-4o</MenuItem>
            <MenuItem value="gpt-4o-mini">gpt-4o-mini</MenuItem>
            <MenuItem value="o1-mini">o1-mini</MenuItem>
            <MenuItem value="o1-preview">o1-preview</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Temperature: {temperature}</Typography>
        <Slider
          min={0}
          max={1}
          step={0.1}
          value={temperature}
          onChange={(e, val) => setTemperature(val)}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="Your Message"
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Box>

      <Button variant="contained" onClick={sendMessage}>
        Send
      </Button>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error: {error}
        </Typography>
      )}
      {assistantReply && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Assistant Reply:</Typography>
          <Typography>{assistantReply}</Typography>
        </Box>
      )}
    </Container>
  );
}

export default ChatApp;
