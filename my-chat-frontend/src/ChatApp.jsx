// src/ChatApp.jsx
import React, { useState, useRef, useEffect } from "react";
import { 
  createTheme, 
  ThemeProvider, 
  IconButton, 
  Container, 
  Typography, 
  Box,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  TextField
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';

// 1) Import react-markdown for assistant message rendering
import ReactMarkdown from 'react-markdown';

// 2) Import uuid for unique message IDs
import { v4 as uuidv4 } from 'uuid';

// 3) Minimal Error Boundary to catch rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Typography color="error">
          Something went wrong while rendering the messages: {this.state.error.toString()}
        </Typography>
      );
    }
    return this.props.children;
  }
}

const theme = createTheme({
  palette: {
    primary: { main: '#AF002A' },
    secondary: { main: '#FFD700' },
    background: {
      default: '#000000',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#FFD700',
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

  // Ref for auto-scroll
  const conversationRef = useRef(null);
  useEffect(() => {
    console.log("Conversation updated:", conversation);
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  // 4) Send message logic
  const sendMessage = async () => {
    setError("");
    if (!message.trim()) {
      setError("Please enter a message first.");
      return;
    }

    // Create user message
    const userMessage = {
      role: "user",
      content: message.trim(),
      id: uuidv4(), // unique key using uuid
    };

    console.log("User message created:", userMessage);

    // Placeholder for assistant
    const assistantPlaceholder = {
      role: "assistant",
      content: "Assistant is typing...",
      loading: true,
      id: uuidv4(), // unique key using uuid
    };

    console.log("Assistant placeholder created:", assistantPlaceholder);

    // Update conversation optimistically
    setConversation((prev) => [...prev, userMessage, assistantPlaceholder]);
    setMessage("");
    setLoading(true);

    // Prepare payload
    const payload = {
      message: userMessage.content,
      model,
      system_prompt: systemPrompt.trim(),
      temperature,
    };

    console.log("Payload sent to backend:", payload);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Backend response status:", res.status);

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Backend response data:", data);

      if (data.error) {
        // Replace placeholder with error
        setError(data.error);
        setConversation((prev) => {
          const updated = [...prev];
          updated.pop();
          const errorMessage = {
            role: "assistant",
            content: `Error: ${data.error}`,
            loading: false,
            id: uuidv4(),
          };
          console.log("Assistant error message to be added:", errorMessage);
          updated.push(errorMessage);
          console.log("Updated conversation with error message:", updated);
          return updated;
        });
      } else {
        // Replace placeholder with final assistant message
        const assistantMessage = {
          role: "assistant",
          content: data.assistant_reply || "No response.",
          loading: false,
          id: uuidv4(),
        };
        console.log("Assistant message to be added:", assistantMessage);

        setConversation((prev) => {
          const updated = [...prev];
          updated.pop();
          updated.push(assistantMessage);
          console.log("Updated conversation:", updated);
          return updated;
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Something went wrong. Check the console.");
      setConversation((prev) => {
        const updated = [...prev];
        updated.pop();
        const errorMessage = {
          role: "assistant",
          content: "Error: Something went wrong.",
          loading: false,
          id: uuidv4(),
        };
        console.log("Assistant error message to be added after catch:", errorMessage);
        updated.push(errorMessage);
        console.log("Updated conversation with catch error message:", updated);
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  // 5) Handle Enter key in multiline TextField using onKeyDown
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          p: { xs: 1, sm: 2 },
          display: 'flex',
          flexDirection: 'column-reverse',
          justifyContent: 'flex-start',
          border: 'none',
        }}
      >
        {/* 6) Container Setup */}
        <Container
          maxWidth={{ xs: 'xs', sm: 'md', lg: 'lg' }}
          sx={{
            mb: { xs: 2, sm: 4 },
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            height: { xs: 'auto', sm: '80%' },
            border: 'none',
          }}
        >
          <Paper
            elevation={6}
            sx={{
              p: { xs: 1, sm: 2 },
              borderRadius: 3,
              maxWidth: '100%',
              margin: '0 auto',
              backgroundColor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              boxShadow: 'none',
              border: 'none',
            }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant={{ xs: 'h6', sm: 'h5', md: 'h4' }} color="primary">
                USMC Agent Demo
              </Typography>
              <IconButton onClick={() => setSettingsOpen(!settingsOpen)} color="primary" size="small">
                {settingsOpen ? <CloseIcon /> : <SettingsIcon />}
              </IconButton>
            </Box>

            {/* Settings Panel */}
            {settingsOpen && (
              <Box sx={{ mb: 3 }}>
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
                      <MenuItem value="dalle-3">DALL-E 3</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

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
                    sx={{ color: '#FFD700' }}
                  />
                </Box>
              </Box>
            )}

            {/* Conversation Box */}
            <ErrorBoundary>
              <Box
                ref={conversationRef}
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  maxHeight: { xs: '50vh', sm: '70vh' },
                  mb: 1,
                  pr: { xs: 0, sm: 1 },
                }}
              >
                {/* 7) Render each message as a simple Box (no <Fade> or <List>) */}
                {conversation.map((msg) => {
                  console.log(`Rendering message ${msg.id}:`, msg);

                  // Check the type of msg.content
                  console.log(`Type of msg.content for ${msg.id}:`, typeof msg.content);

                  // Validate msg.content type
                  if (typeof msg.content !== 'string') {
                    console.error(`Invalid content type for message ${msg.id}:`, typeof msg.content);
                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          backgroundColor: 'error.main',
                          color: 'white',
                          borderRadius: 2,
                          p: 1,
                          maxWidth: '80%',
                          mb: 1,
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Typography variant="body1">
                          Invalid message content.
                        </Typography>
                      </Box>
                    );
                  }

                  const isImage =
                    msg.role === "assistant" && msg.content.startsWith("![Generated Image](");
                  const isAssistant = msg.role === "assistant";
                  const isSystem = msg.role === "system";

                  let contentToRender;

                  if (msg.loading) {
                    contentToRender = (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} color="secondary" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          Assistant is typing...
                        </Typography>
                      </Box>
                    );
                  } else if (isImage) {
                    // Use regex to safely parse the image URL
                    const match = msg.content.match(/^!\[Generated Image\]\((.+)\)$/);
                    const imageUrl = match ? match[1] : null;

                    if (imageUrl) {
                      contentToRender = (
                        <Box sx={{ maxWidth: '70%', borderRadius: '8px', overflow: 'hidden' }}>
                          <img
                            src={imageUrl}
                            alt="Generated"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                          />
                        </Box>
                      );
                    } else {
                      console.error(`Invalid image URL format for message ${msg.id}:`, msg.content);
                      contentToRender = (
                        <Typography variant="body1" color="error">
                          Invalid image URL.
                        </Typography>
                      );
                    }
                  } else if (isAssistant) {
                    try {
                      // Ensure msg.content is a string
                      const assistantContent = typeof msg.content === 'string' ? msg.content : "**(No content available)**";
                      console.log(`Rendering ReactMarkdown for message ${msg.id}:`, assistantContent);

                      contentToRender = (
                        <ReactMarkdown>
                          {assistantContent}
                        </ReactMarkdown>
                      );
                    } catch (markdownError) {
                      console.error(`Error rendering ReactMarkdown for message ${msg.id}:`, markdownError);
                      contentToRender = (
                        <Typography variant="body1" color="error">
                          Error rendering message.
                        </Typography>
                      );
                    }
                  } else if (isSystem) {
                    // Optionally, render system messages differently or skip rendering
                    contentToRender = (
                      <Typography variant="body2" color="secondary" fontStyle="italic">
                        {msg.content}
                      </Typography>
                    );
                  } else {
                    // Handle 'user' and any other roles
                    const userContent = typeof msg.content === 'string' ? msg.content : "No response available.";
                    contentToRender = (
                      <Typography variant="body1">
                        {userContent}
                      </Typography>
                    );
                  }

                  return (
                    <Box
                      key={msg.id}
                      sx={{
                        backgroundColor: isImage
                          ? 'transparent'
                          : (msg.role === "user" ? 'primary.main' : (msg.loading ? 'grey.500' : (isSystem ? 'grey.800' : 'grey.700'))),
                        color: 'white',
                        borderRadius: 2,
                        p: isImage ? 0 : 1,
                        maxWidth: '80%',
                        ml: msg.role === "user" ? 'auto' : (isSystem ? '0' : 0),
                        mb: 1,
                        alignSelf: msg.role === "user" ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {contentToRender}
                    </Box>
                  );
                })}
              </Box>
            </ErrorBoundary>

            {/* Message Input */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Your Message"
                variant="outlined"
                fullWidth
                multiline
                maxRows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
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

            {/* Error Display */}
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                Error: {error}
              </Typography>
            )}

            {/* Footer */}
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              *This application can produce incorrect responses.
            </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default ChatApp;
