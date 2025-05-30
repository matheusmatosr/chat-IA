import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const Message = ({ text, sender }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatText = (text) => {
    return text.split('\n').map((paragraph, i) => (
      <Typography key={i} paragraph sx={{ mb: 0 }}>
        {paragraph || <br />}
      </Typography>
    ));
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        maxWidth: '80%',
        backgroundColor: sender === 'user' ? 'primary.main' : 'background.paper',
        color: sender === 'user' ? 'primary.contrastText' : 'text.primary',
        borderRadius: sender === 'user' 
          ? '18px 18px 4px 18px' 
          : '18px 18px 18px 4px',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {formatText(text)}
        {sender === 'bot' && (
          <Tooltip title={copied ? 'Copiado!' : 'Copiar'} placement="top">
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{
                position: 'absolute',
                top: -16,
                right: -16,
                backgroundColor: 'background.paper',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};

export default Message;