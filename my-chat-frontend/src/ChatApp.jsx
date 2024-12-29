// src/ChatApp.jsx
import React, { useState, useRef, useEffect } from "react";
import { Fade, IconButton, createTheme, ThemeProvider } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import ReactMarkdown from 'react-markdown';

import {
  TextField,
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

  // Ref for the conversation box
  const conversationRef = useRef(null);

  // Auto-scroll effect for the conversation box
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

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
      {/* Apply global styles for the body with flex column-reverse */}
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          padding: 0,
          display: 'flex',
          flexDirection: 'column-reverse', // Start content at the bottom
          justifyContent: 'flex-start',
        }}
      >
        <Container 
          maxWidth="lg"  // Use larger maxWidth for laptop screens
          sx={{
            mb: 4, 
            flexGrow:1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            height: '80%'
          }}>
          <Paper elevation={6} sx={{ 
            p: 2, 
            borderRadius: 3, 
            width: '100%',  // Use full width
            maxWidth: '1100px',  // Allow larger width on laptops
            margin: '0 auto', 
            backgroundColor: 'background.paper' 
          }}>
            {/* In-App Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" gutterBottom color="primary">
                USMC Agent Demo
              </Typography>
              <IconButton onClick={() => setSettingsOpen(!settingsOpen)} color="primary" size="small">
                {settingsOpen ? <CloseIcon /> : <SettingsIcon />}
              </IconButton>
            </Box>

            {/* Settings Panel */}
            {settingsOpen && (
              <Box sx={{ mb: 3 }}>
                {/* System Prompt */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="System Prompt"
                    multiline
                    rows={2}
                    fullWidth
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    sx={{ my: 1 }}
                    InputLabelProps={{ style: { color: '#ffffff' } }}
                    InputProps={{ style: { color: '#ffffff', backgroundColor: '#333333', borderRadius: '4px' } }}
                  />
                </Box>

                {/* Model Selection */}
                <Box sx={{ mb: 2 }}>
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
                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom color="secondary" variant="body2">
                    Temperature: {temperature}
                  </Typography>
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

            {/* Conversation Box */}
            {conversation.length > 0 && (
              <Box
                ref={conversationRef}
                sx={{
                  mb: 3,
                  maxHeight: { xs: '600px', sm: '800px' }, // Adjusted for mobile and larger screens
                  overflowY: 'auto',
                  paddingRight: 0, // Optional: Add some padding for scrollbar
                }}
              >
                <List>
                  {conversation.map((msg, index) => {
                    const isImage = msg.role === "assistant" && msg.content.startsWith("![Generated Image](");

                    return (
                      <Fade in={true} timeout={500} key={index}>
                        <ListItem sx={{ display: 'block' }}>
                          <Box
                            sx={{
                              backgroundColor: msg.role === "user" ? 'primary.main' : (msg.loading ? 'grey.500' : 'grey.700'),
                              color: 'white',
                              borderRadius: 2,
                              p: 1,
                              maxWidth: '80%',
                              ml: msg.role === "user" ? 'auto' : 0,
                            }}
                          >
                            {msg.role === "assistant" && msg.loading ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CircularProgress size={20} color="secondary" />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  Assistant is typing...
                                </Typography>
                              </Box>
                            ) : (
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            )}
                          </Box>
                        </ListItem>
                      </Fade>
                    );
                  })}
                </List>
              </Box>
            )}

            {/* Message Input and Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Your Message"
                variant="outlined"
                fullWidth
                multiline
                maxRows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                InputLabelProps={{ style: { color: '#ffffff' } }}
                InputProps={{
                  style: { color: '#ffffff', backgroundColor: '#333333', borderRadius: '4px' },
                }}
                sx={{ flexGrow: 1 }}
              />
              <IconButton
                color="primary"
                onClick={sendMessage}
                disabled={loading}
                sx={{ p: 1 }}
                aria-label="send"
              >
                <SendIcon />
              </IconButton>
              <IconButton
                color="secondary"
                onClick={() => setConversation([])}
                disabled={loading}
                sx={{ p: 1 }}
                aria-label="clear"
              >
                <ClearIcon />
              </IconButton>
            </Box>

            {/* Error Message */}
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                Error: {error}
              </Typography>
            )}

            {/* Footer */}
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
              *This application can produce incorrect responses.
            </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default ChatApp;
