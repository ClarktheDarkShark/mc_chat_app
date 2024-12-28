// src/ChatApp.jsx
import React, { useState } from "react";
import { Fade } from '@mui/material';

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
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

function ChatApp() {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("You are a USMC AI agent. Provide relevant responses.");
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState("");

  async function sendMessage() {
    setError("");

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
        // Append user message and assistant reply to conversation
        setConversation((prev) => [
          ...prev,
          { role: "user", content: message.trim() },
          { role: "assistant", content: data.assistant_reply },
        ]);
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Check the console.");
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 3 }}>
        {/* Conversation Box at the Top */}
        {conversation.length > 0 && (
          <Box sx={{ mb: 3, maxHeight: '400px', overflowY: 'auto' }}>
            <Typography variant="h6">Conversation:</Typography>
            <List>
              {conversation.map((msg, index) => (
                <Fade in={true} timeout={500} key={index}>
                  <ListItem>
                    <Box
                      sx={{
                        backgroundColor: msg.role === "user" ? 'primary.main' : 'grey.300',
                        color: msg.role === "user" ? 'white' : 'black',
                        borderRadius: 2,
                        p: 1,
                        maxWidth: '80%',
                        ml: msg.role === "user" ? 'auto' : 0,
                      }}
                    >
                      <Typography variant="body1">{msg.content}</Typography>
                    </Box>
                  </ListItem>
                </Fade>
              ))}
            </List>
          </Box>
        )}

        {/* Header */}
        <Typography variant="h4" gutterBottom>
          USMC Demo Agent
        </Typography>

        {/* System Prompt */}
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

        {/* Model Selection */}
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

        {/* Temperature Slider */}
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

        {/* Message Input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Your Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Box>

        {/* Send and Clear Buttons */}
        <Button variant="contained" onClick={sendMessage} fullWidth>
          Send
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => setConversation([])} fullWidth sx={{ mt: 2 }}>
          Clear Conversation
        </Button>

        {/* Error Message */}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            Error: {error}
          </Typography>
        )}
      </Paper>
    </Container>
  );
}

export default ChatApp;
