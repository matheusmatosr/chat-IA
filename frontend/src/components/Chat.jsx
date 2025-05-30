import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  CircularProgress,
  IconButton,
  TextField,
  Typography,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
import { sendMessageToOllama, checkServerStatus } from '../services/ollamaService';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [modelStatus, setModelStatus] = useState('loading');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const messagesEndRef = useRef(null);

  // Verifica o status do servidor ao carregar
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkServerStatus();
        
        // Verifica tanto a conexão quanto o modelo
        const isReady = status.ollamaStatus === 'connected' && 
                      status.modelStatus === 'available';
        
        setModelStatus(isReady ? 'ready' : 'error');
        
        if (!isReady) {
          let errorMsg = 'O servidor de IA não está disponível';
          if (status.ollamaStatus === 'connected' && status.modelStatus !== 'available') {
            errorMsg = `Modelo não está disponível`;
          }
          showSnackbar(errorMsg, 'error');
        }
      } catch (error) {
        setModelStatus('error');
        showSnackbar('Erro ao conectar com o servidor', 'error');
      }
    };
    
    checkStatus();
    loadSavedMessages();
  }, []);

  // Carrega mensagens salvas
  const loadSavedMessages = () => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Failed to parse saved messages', e);
      }
    }
  };

  // Salva mensagens no localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Rolagem automática
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Snackbar (notificações)
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Envia mensagem para o Ollama
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || modelStatus !== 'ready') return;

    const userMessage = { 
      text: inputMessage, 
      sender: 'user',
      timestamp: new Date().toISOString(),
      metadata: null
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessageToOllama(inputMessage);
      
      const botMessage = { 
        text: response.text,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        metadata: response.metadata,
        error: response.error
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (response.error) {
        showSnackbar('Erro ao processar mensagem', 'error');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showSnackbar('Erro ao enviar mensagem', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Limpa o chat
  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
    showSnackbar('Conversa limpa', 'info');
  };

  // Copia mensagem
  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    showSnackbar('Mensagem copiada!', 'success');
  };

  // Tecla Enter para enviar
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Formatação do tempo
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Status do Modelo */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 1,
        p: 1,
        backgroundColor: modelStatus === 'ready' ? 'success.light' : 'error.light',
        color: 'white',
        borderRadius: 1
      }}>
        <InfoIcon sx={{ mr: 1 }} />
        <Typography variant="body2">
          {modelStatus === 'ready' 
            ? 'Conectado ao Qwen2.5:7b' 
            : modelStatus === 'loading' 
              ? 'Conectando...' 
              : 'Erro de conexão'}
        </Typography>
      </Box>

      {/* Área de Mensagens */}
      <Paper elevation={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <List sx={{ width: '100%' }}>
            {messages.length === 0 && (
              <ListItem sx={{ justifyContent: 'center' }}>
                <Typography color="text.secondary">
                  {modelStatus === 'ready' 
                    ? 'Envie uma mensagem para começar' 
                    : 'Aguardando conexão com o servidor...'}
                </Typography>
              </ListItem>
            )}

            {messages.map((msg, index) => (
              <ListItem 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  px: 0,
                  py: 1
                }}
              >
                <Box sx={{ 
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      backgroundColor: msg.sender === 'user' 
                        ? 'primary.main' 
                        : msg.error 
                          ? 'error.light' 
                          : 'background.paper',
                      color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                      borderRadius: msg.sender === 'user' 
                        ? '18px 18px 4px 18px' 
                        : '18px 18px 18px 4px',
                      position: 'relative'
                    }}
                  >
                    {msg.text.split('\n').map((paragraph, i) => (
                      <Typography key={i} paragraph sx={{ mb: 0, whiteSpace: 'pre-wrap' }}>
                        {paragraph || <br />}
                      </Typography>
                    ))}

                    {msg.sender === 'bot' && !msg.error && (
                      <Tooltip title="Copiar mensagem">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyMessage(msg.text)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            color: 'text.secondary'
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Paper>

                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ mt: 0.5, mx: 1 }}
                  >
                    {formatTime(msg.timestamp)}
                    {msg.metadata?.model && ` · ${msg.metadata.model}`}
                  </Typography>
                </Box>
              </ListItem>
            ))}

            {isLoading && (
              <ListItem sx={{ justifyContent: 'flex-start', px: 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: 'text.secondary',
                  px: 2,
                  py: 1
                }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2">Qwen2.5 está pensando...</Typography>
                </Box>
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        </Box>
        
        {/* Área de Input */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid', 
          borderColor: 'divider',
          backgroundColor: 'background.default'
        }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                modelStatus === 'ready' 
                  ? "Digite sua mensagem..." 
                  : "Aguardando conexão com o servidor..."
              }
              variant="outlined"
              size="small"
              disabled={modelStatus !== 'ready' || isLoading}
            />
            <Tooltip title="Enviar mensagem">
              <span>
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage} 
                  disabled={
                    !inputMessage.trim() || 
                    isLoading || 
                    modelStatus !== 'ready'
                  }
                >
                  <SendIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearChat}
            disabled={messages.length === 0}
          >
            Limpar Conversa
          </Button>
        </Box>
      </Paper>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Chat;