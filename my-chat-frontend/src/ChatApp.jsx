// src/ChatApp.jsx
import React, { useState } from "react";
import { Fade, IconButton, createTheme, ThemeProvider } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';

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
  CircularProgress,
} from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: '#AF002A', // USMC Scarlet
    },
    secondary: {
      main: '#FFD700', // Gold
    },
    background: {
      default: '#000000', // Black Background
      paper: '#1a1a1a',    // Dark Paper Background for contrast
    },
    text: {
      primary: '#ffffff', // White text for contrast
      secondary: '#FFD700', // Gold text if needed
    },
  },
});

function ChatApp() {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("You are a USMC AI agent. Provide relevant responses.");
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setError("");

    if (!message.trim()) {
      setError("Please enter a message first.");
      return;
    }

    // Create a new message object for the user
    const userMessage = { role: "user", content: message.trim() };

    // Create a placeholder for the assistant's response
    const assistantPlaceholder = { role: "assistant", content: "Assistant is typing...", loading: true };

    // Update the conversation state optimistically
    setConversation((prev) => [...prev, userMessage, assistantPlaceholder]);

    // Clear the input field and set loading to true
    setMessage("");
    setLoading(true);

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
        // Update the placeholder with the error message
        setConversation((prev) => {
          const updated = [...prev];
          updated.pop(); // Remove the placeholder
          updated.push({ role: "assistant", content: `Error: ${data.error}`, loading: false });
          return updated;
        });
      } else {
        // Replace the placeholder with the actual assistant reply
        setConversation((prev) => {
          const updated = [...prev];
          updated.pop(); // Remove the placeholder
          updated.push({ role: "assistant", content: data.assistant_reply, loading: false });
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Check the console.");
      // Update the placeholder with the error message
      setConversation((prev) => {
        const updated = [...prev];
        updated.pop(); // Remove the placeholder
        updated.push({ role: "assistant", content: "Error: Something went wrong.", loading: false });
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      {/* Apply global styles for the body */}
      <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', padding: 2 }}>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Paper elevation={6} sx={{ p: 4, borderRadius: 3, maxWidth: '800px', margin: '0 auto', backgroundColor: 'background.paper' }}>
            {/* In-App Header */}
            <Typography variant="h4" gutterBottom color="primary">
              USMC Demo Agent
            </Typography>

            {/* Conversation Box at the Top */}
            {conversation.length > 0 && (
              <Box sx={{ mb: 3, maxHeight: '500px', overflowY: 'auto' }}>
                <Typography variant="h6" gutterBottom color="secondary">
                  Conversation:
                </Typography>
                <List>
                  {conversation.map((msg, index) => (
                    <Fade in={true} timeout={500} key={index}>
                      <ListItem>
                        <Box
                          sx={{
                            backgroundColor: msg.role === "user" ? 'primary.main' : (msg.loading ? 'grey.500' : 'grey.700'),
                            color: 'white',
                            borderRadius: 2,
                            p: 1,
                            maxWidth: '80%',
                            ml: msg.role === "user" ? 'auto' : 0,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {msg.role === "assistant" && msg.loading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CircularProgress size={20} color="secondary" />
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                Assistant is typing...
                              </Typography>
                            </Box>
                          ) : msg.role === "assistant" && msg.content.startsWith("![Generated Image](") ? (
                            <img
                              src={msg.content.slice(19, -1)} // Corrected slice
                              alt="Generated"
                              style={{ maxWidth: '70%', borderRadius: '8px', overflow: 'hidden' }}
                            />
                          ) : (
                            <Typography variant="body1">{msg.content}</Typography>
                          )}
                        </Box>
                      </ListItem>
                    </Fade>
                  ))}
                </List>
              </Box>
            )}

            {/* Message Input */}
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Your Message"
                fullWidth
                multiline
                maxRows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                InputLabelProps={{ style: { color: '#ffffff' } }}
                InputProps={{ style: { color: '#ffffff', backgroundColor: '#333333', borderRadius: '4px' } }}
              />
            </Box>

            {/* Send and Clear Buttons */}
            <Button 
              variant="contained" 
              color="primary" 
              onClick={sendMessage} 
              fullWidth 
              sx={{ mb: 2 }}
              disabled={loading} // Disable button when loading
            >
              {loading ? "Sending..." : "Send"} {/* Change button text based on loading state */}
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => setConversation([])} fullWidth sx={{ mb: 2 }}>
              Clear Conversation
            </Button>

            {/* Settings Button */}
            <Box sx={{ position: 'relative', mt: 2 }}>
              <IconButton onClick={() => setSettingsOpen(!settingsOpen)} color="primary">
                {settingsOpen ? <CloseIcon /> : <SettingsIcon />}
              </IconButton>
              {settingsOpen && (
                <Box sx={{ mt: 2 }}>
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
                      InputLabelProps={{ style: { color: '#ffffff' } }}
                      InputProps={{ style: { color: '#ffffff', backgroundColor: '#333333', borderRadius: '4px' } }}
                    />
                  </Box>

                  {/* Model Selection */}
                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel id="model-select-label" sx={{ color: '#ffffff' }}>Model</InputLabel>
                      <Select
                        labelId="model-select-label"
                        value={model}
                        label="Model"
                        onChange={(e) => setModel(e.target.value)}
                        sx={{ color: '#ffffff', backgroundColor: '#333333', borderRadius: '4px' }}
                      >
                        <MenuItem value="gpt-4o">gpt-4o</MenuItem>
                        <MenuItem value="gpt-4o-mini">gpt-4o-mini</MenuItem>
                        <MenuItem value="o1-mini">o1-mini</MenuItem>
                        <MenuItem value="o1-preview">o1-preview</MenuItem>
                        <MenuItem value="dalle-3">DALL-E 3</MenuItem> {/* Add DALL-E 3 option */}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Temperature Slider */}
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom color="secondary">Temperature: {temperature}</Typography>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={temperature}
                      onChange={(e, val) => setTemperature(val)}
                      sx={{
                        color: '#FFD700', // Gold color for slider
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>

            {/* Error Message */}
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                Error: {error}
              </Typography>
            )}

            {/* Footer */}
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
              *This application can produce incorrect responses.
            </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default ChatApp;
