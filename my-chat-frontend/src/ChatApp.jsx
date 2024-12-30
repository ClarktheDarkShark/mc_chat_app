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
  TextField,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import MenuIcon from '@mui/icons-material/Menu';

// 1) Import react-markdown for assistant message rendering
import ReactMarkdown from 'react-markdown';

// 2) Minimal Error Boundary to catch rendering errors
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
  const [model, setModel] = useState("gpt-4");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("You are a USMC AI agent. Provide relevant responses.");
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversationsList, setConversationsList] = useState([]);

  // Ref for auto-scroll
  const conversationRef = useRef(null);
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  // Theme and Media Query for responsive Typography
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  // 1. Fetch chat history on component mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setConversationsList(data.conversations);
      } else {
        console.error("Failed to fetch conversations.");
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  // 2. Handle selecting a conversation
  const selectConversation = async (convo) => {
    try {
      const res = await fetch(`/api/conversations/${convo.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation_history);
        setDrawerOpen(false);
      } else {
        console.error("Failed to fetch conversation.");
      }
    } catch (err) {
      console.error("Error fetching conversation:", err);
    }
  };

  // 3. Handle starting a new conversation
  const startNewConversation = async () => {
    try {
      const res = await fetch("/api/conversations/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: "New Conversation" }),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        // Set current conversation to new one
        setConversation([]);
        setError("");
        // Optionally, fetch conversations list again
        fetchConversations();
      } else {
        console.error("Failed to create new conversation.");
      }
    } catch (err) {
      console.error("Error creating new conversation:", err);
    }
  };

  // 4) Send message logic
  const sendMessage = async () => {
    setError("");
    if (!message.trim()) {
      setError("Please enter a message first.");
      return;
    }
  
    const userMessage = {
      role: "user",
      content: message.trim(),
      id: Date.now(),
    };
  
    // Detect intent based on keywords in user message
    let loadingText = "Assistant is typing...";  // Default loading text
    if (message.toLowerCase().includes("search") || message.toLowerCase().includes("look up")) {
      loadingText = "Searching the internet...";
    } else if (message.toLowerCase().includes("generate image") || message.toLowerCase().includes("create image")) {
      loadingText = "Creating the image...";
    }
  
    // Placeholder for assistant response
    const assistantPlaceholder = {
      role: "assistant",
      content: loadingText,
      loading: true,
      id: Date.now() + 1,
    };
  
    setConversation((prev) => [...prev, userMessage, assistantPlaceholder]);
    setMessage("");
    setLoading(true);
  
    const payload = {
      message: userMessage.content,
      model,
      system_prompt: systemPrompt.trim(),
      temperature,
    };
  
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch.");
      }
  
      const data = await res.json();
  
      if (data.error) {
        setError(data.error);
        setConversation((prev) => {
          const updated = [...prev];
          updated.pop();
          updated.push({
            role: "assistant",
            content: `Error: ${data.error}`,
            loading: false,
            id: Date.now() + 2,
          });
          return updated;
        });
      } else {
        setConversation((prev) => {
          const updated = [...prev];
          updated.pop();
          updated.push({
            role: "assistant",
            content: data.assistant_reply || "No response.",
            loading: false,
            id: Date.now() + 3,
          });
          return updated;
        });
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Check the console.");
      setConversation((prev) => {
        const updated = [...prev];
        updated.pop();
        updated.push({
          role: "assistant",
          content: "Error: Something went wrong.",
          loading: false,
          id: Date.now() + 4,
        });
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };
  

  // 5) Handle Enter key in multiline TextField
  const handleKeyPress = (e) => {
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
          flexDirection: 'column',
          justifyContent: 'flex-start',
          border: 'none',
        }}
      >
        {/* Container Setup */}
        <Container
          maxWidth="lg"
          sx={{
            mb: { xs: 2, sm: 4 },
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            height: { xs: 'auto', sm: '80%' },
            border: 'none',
            width: { xs: '100%', sm: '80%', md: '70%' },
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {/* Drawer for Chat History */}
          <Drawer
            variant="persistent"
            anchor="left"
            open={drawerOpen}
            sx={{
              '& .MuiDrawer-paper': {
                width: 240,
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'space-between' }}>
              <Typography variant="h6">Chat History</Typography>
              <IconButton onClick={() => setDrawerOpen(false)} color="primary">
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />
            <List>
              {conversationsList.map((convo) => (
                <ListItem button key={convo.id} onClick={() => selectConversation(convo)}>
                  <ListItemText
                    primary={convo.title}
                    secondary={new Date(convo.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Button variant="contained" color="secondary" fullWidth onClick={startNewConversation}>
                New Conversation
              </Button>
            </Box>
          </Drawer>

          {/* Main Chat Area */}
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              borderRadius: 3,
              backgroundColor: 'background.paper',
              boxShadow: 'none',
              border: 'none',
              p: 2,
              ml: drawerOpen ? '240px' : 0,
              transition: 'margin 0.3s',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={() => setDrawerOpen(true)} color="primary">
                <MenuIcon />
              </IconButton>
              <Typography variant={isMobile ? "h6" : "h5"} color="primary">
                USMC AI Agent Demo
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
                      <MenuItem value="gpt-4">gpt-4</MenuItem>
                      <MenuItem value="gpt-4-mini">gpt-4-mini</MenuItem>
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
                {/* 6) Render each message as a simple Box (no <Fade> or <List>) */}
                {conversation.map((msg) => {
                  console.log(`Rendering message ${msg.id}:`, msg.content);

                  const isImage =
                    msg.role === "assistant" && msg.content.startsWith("![Generated Image](");
                  const isAssistant = msg.role === "assistant";

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
                      contentToRender = (
                        <Typography variant="body1" color="error">
                          Invalid image URL.
                        </Typography>
                      );
                    }
                  } else if (isAssistant) {
                    contentToRender = (
                      <ReactMarkdown>
                        {msg.content || "**(No content available)**"}
                      </ReactMarkdown>
                    );
                  } else {
                    contentToRender = (
                      <Typography variant="body1">
                        {msg.content || "No response available."}
                      </Typography>
                    );
                  }

                  return (
                    <Box
                      key={msg.id}
                      sx={{
                        backgroundColor: isImage
                          ? 'transparent'
                          : (msg.role === "user" ? 'primary.main' : (msg.loading ? 'grey.500' : 'grey.700')),
                        color: 'white',
                        borderRadius: 2,
                        p: isImage ? 0 : 1,
                        maxWidth: '80%',
                        ml: msg.role === "user" ? 'auto' : 0,
                        mb: 1,
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

            {/* Error Display */}
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                Error: {error}
              </Typography>
            )}

            {/* Footer */}
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              *This is a commercial non-government application and can produce incorrect responses. It is not authorized for CUI data.
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default ChatApp;
