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
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

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
  const [model, setModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("You are a USMC AI agent. Provide relevant responses.");
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ref for auto-scroll
  const conversationRef = useRef(null);
  useEffect(() => setIsClient(true), []);
  
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  // 3) Send message logic
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

    const assistantPlaceholder = {
      role: "assistant",
      content: "Assistant is typing...",
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
      });
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
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Check the console.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', p: 2 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" color="primary">
              USMC Agent Demo
            </Typography>

            <ErrorBoundary>
              <Box ref={conversationRef} sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {conversation.map((msg) => (
                  <Box key={msg.id} sx={{ p: 2 }}>
                    {msg.loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      isClient && (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw, rehypeSanitize]}
                        >
                          {msg.content || "**(No content available)**"}
                        </ReactMarkdown>
                      )
                    )}
                  </Box>
                ))}
              </Box>
            </ErrorBoundary>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default ChatApp;
