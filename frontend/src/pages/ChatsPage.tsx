import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Paper, Typography, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';

interface ChatMeta {
  chat_id: string;
  prompt: string;
  timestamp: string;
}

const ChatsPage: React.FC = () => {
  const [chats, setChats] = useState<ChatMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch('/api/chats', { credentials: 'include' });
        const data = await resp.json();
        if (data.chats) {
          setChats(data.chats);
        } else {
          setChats([]);
        }
      } catch (err) {
        setError('Failed to load chats.');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" minHeight="60vh" py={8}>
      <Paper elevation={6} sx={{ maxWidth: 600, width: '100%', p: 5, borderRadius: 3, border: '1px solid', borderColor: 'primary.light' }}>
        <Typography variant="h4" fontWeight={700} color="primary" align="center" mb={4}>
          Your Chats
        </Typography>
        {loading && <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!loading && !error && (
          <List>
            {chats.length === 0 && (
              <ListItem>
                <ListItemText primary={<Typography color="text.secondary">No chats found.</Typography>} />
              </ListItem>
            )}
            {chats.map(chat => (
              <ListItem key={chat.chat_id} divider secondaryAction={
                <Typography variant="caption" color="text.secondary">
                  {new Date(chat.timestamp).toLocaleString()}
                </Typography>
              }>
                <ListItemText
                  primary={
                    <Typography component={RouterLink} to={`/chats/${chat.chat_id}`} color="primary" sx={{ textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                      {chat.prompt.slice(0, 60)}{chat.prompt.length > 60 ? '...' : ''}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default ChatsPage; 