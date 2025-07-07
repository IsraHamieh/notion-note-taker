import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Paper, Typography, CircularProgress, Alert, List, ListItem, ListItemText, Button } from '@mui/material';

interface Chat {
  chat_id: string;
  prompt: string;
  files: { name: string; url?: string }[];
  response: string;
  timestamp: string;
}

const ChatViewPage: React.FC = () => {
  const { chat_id } = useParams<{ chat_id: string }>();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChat = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/chats/${chat_id}`, { credentials: 'include' });
        const data = await resp.json();
        if (data.error) {
          setError(data.error);
        } else {
          setChat(data);
        }
      } catch (err) {
        setError('Failed to load chat.');
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
  }, [chat_id]);

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" minHeight="60vh" py={8}>
      <Paper elevation={6} sx={{ maxWidth: 600, width: '100%', p: 5, borderRadius: 3, border: '1px solid', borderColor: 'primary.light' }}>
        <Button component={RouterLink} to="/chats" size="small" sx={{ mb: 2, textTransform: 'none' }}>
          &larr; Back to Chats
        </Button>
        {loading && <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {chat && !loading && !error && (
          <Box>
            <Typography variant="h5" fontWeight={700} mb={2}>Prompt</Typography>
            <Typography mb={3} sx={{ whiteSpace: 'pre-line' }}>{chat.prompt}</Typography>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>Files</Typography>
            <List sx={{ mb: 3 }}>
              {chat.files && chat.files.length > 0 ? (
                chat.files.map((file, idx) => (
                  <ListItem key={idx} disablePadding>
                    <ListItemText
                      primary={file.url ? (
                        <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline' }}>{file.name}</a>
                      ) : (
                        <span>{file.name}</span>
                      )}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary={<Typography color="text.secondary">No files uploaded.</Typography>} />
                </ListItem>
              )}
            </List>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>Response</Typography>
            <Typography sx={{ whiteSpace: 'pre-line', bgcolor: 'grey.100', p: 2, borderRadius: 1, color: 'grey.900' }}>{chat.response}</Typography>
            <Typography mt={4} variant="caption" color="text.secondary">{new Date(chat.timestamp).toLocaleString()}</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ChatViewPage; 