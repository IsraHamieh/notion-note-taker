import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, TextField, CircularProgress, Alert, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const KEY_FIELDS = [
  { id: 'anthropicKey', label: 'Anthropic API Key' },
  { id: 'tavilyKey', label: 'Tavily API Key' },
  { id: 'notionKey', label: 'Notion Integration Key' },
  { id: 'llamaKey', label: 'Llama Cloud API Key' },
];

const KeysPage: React.FC = () => {
  const [keys, setKeys] = useState<{ [key: string]: string }>({});
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visibleFields, setVisibleFields] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('/api/auth/keys', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        setKeys(data);
        setLoading(false);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeys({ ...keys, [e.target.name]: e.target.value });
  };

  const toggleVisibility = (fieldId: string) => {
    setVisibleFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/auth/keys', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(keys),
      });
      if (response.ok) {
        setStatus('Keys saved successfully!');
      } else {
        setStatus('Failed to save keys.');
      }
    } catch (err) {
      setStatus('Error saving keys.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" minHeight="60vh" py={8}>
      <Paper elevation={6} sx={{ maxWidth: 480, width: '100%', p: 5, borderRadius: 3, border: '1px solid', borderColor: 'primary.light' }}>
        <Typography variant="h4" fontWeight={700} color="primary" align="center" mb={4}>
          API & Integration Keys
        </Typography>
        <form onSubmit={handleSubmit}>
          {KEY_FIELDS.map(key => (
            <Box mb={3} key={key.id}>
              <TextField
                id={key.id}
                name={key.id}
                type={visibleFields[key.id] ? "text" : "password"}
                label={key.label}
                value={keys[key.id] || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                autoComplete="off"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => toggleVisibility(key.id)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                          } 
                        }}
                      >
                        {visibleFields[key.id] ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          ))}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={saving}
            sx={{ fontWeight: 600, mt: 2 }}
          >
            {saving ? 'Saving...' : 'Save Keys'}
          </Button>
          {status && <Alert severity={status.includes('success') ? 'success' : 'error'} sx={{ mt: 2 }}>{status}</Alert>}
        </form>
      </Paper>
    </Box>
  );
};

export default KeysPage; 