import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  Autocomplete,
  CircularProgress,
  IconButton,
  Checkbox,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  YouTube as YouTubeIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { styles } from './MainPage.styles';

interface Source {
  id: string;
  type: 'link' | 'file' | 'youtube' | 'image';
  content: string;
  useImageContent?: boolean;
}

interface NotionTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  thumbnailUrl: string;
}

interface FileSource {
  id: string;
  file: File;
  type: 'file';
}

interface ImageSource {
  id: string;
  file: File;
  preview: string;
  useImageContent: boolean;
}

const VALID_URL_PATTERN = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
};
const ALLOWED_IMAGE_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg'],
};

const MainPage: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [fileSources, setFileSources] = useState<FileSource[]>([]);
  const [imageSources, setImageSources] = useState<ImageSource[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotionTemplate | null>(null);
  const [templates, setTemplates] = useState<NotionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [useImageContent, setUseImageContent] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [urlError, setUrlError] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState('');

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const validFiles = acceptedFiles.filter(file => 
        Object.keys(ALLOWED_FILE_TYPES).includes(file.type)
      );
      
      if (validFiles.length !== acceptedFiles.length) {
        // You might want to show a notification here
        console.warn('Some files were rejected due to invalid type');
      }

      const newFileSources = validFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        type: 'file' as const,
        file,
      }));
      setFileSources((prev) => [...prev, ...newFileSources]);
    },
    accept: ALLOWED_FILE_TYPES,
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      if (searchQuery.length < 2) return;
      
      setLoading(true);
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/templates/search?q=${searchQuery}`);
        const data = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchTemplates, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    return VALID_URL_PATTERN.test(url);
  };

  const handleAddLink = () => {
    if (linkInput.trim()) {
      if (!validateUrl(linkInput.trim())) {
        setUrlError('Please enter a valid URL');
        return;
      }
      setUrlError('');
      const newSource: Source = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'link',
        content: linkInput.trim(),
      };
      setSources((prev) => [...prev, newSource]);
      setLinkInput('');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(file => 
        Object.keys(ALLOWED_IMAGE_TYPES).includes(file.type)
      );
      
      if (validFiles.length !== files.length) {
        // You might want to show a notification here
        console.warn('Some images were rejected due to invalid type');
      }

      const newImageSources = validFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        useImageContent,
      }));
      setImageSources((prev) => [...prev, ...newImageSources]);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImageSources((prev) => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleImageContentToggle = () => {
    setUseImageContent(!useImageContent);
    setImageSources(prev => prev.map(img => ({ ...img, useImageContent: !useImageContent })));
  };

  const handleRemoveSource = (id: string) => {
    setSources((prev) => prev.filter((source) => source.id !== id));
  };

  const handleRemoveFile = (id: string) => {
    setFileSources((prev) => prev.filter((file) => file.id !== id));
  };

  const getSourceIcon = (type: Source['type']) => {
    switch (type) {
      case 'link':
        return <LinkIcon />;
      case 'file':
        return <DescriptionIcon />;
      case 'youtube':
        return <YouTubeIcon />;
      case 'image':
        return <ImageIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) {
      alert('Please enter a prompt.');
      return;
    }
    const formData = new FormData();
    formData.append('user_query', userPrompt);
    formData.append('files', fileSources[0].file);
    formData.append('youtube_urls', JSON.stringify(sources.filter(source => source.type === 'youtube').map(source => source.content)));
    formData.append('use_image_content', useImageContent.toString());
    formData.append('web_search_query', enableWebSearch ? 'web search' : '');
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        // Save chat to backend
        const chatPayload = {
          prompt: userPrompt,
          files: fileSources.map(f => ({ name: f.file.name })), // Add url if available
          response: result.result,
        };
        try {
          await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chatPayload),
            credentials: 'include',
          });
          // Optionally show a toast or message
        } catch (err) {
          console.error('Error saving chat:', err);
        }
      }
      // ... existing code for handling result ...
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={styles.container}
    >
      <Typography variant="h3" component="h1" sx={styles.pageTitle}>
        Notion Agent
      </Typography>
      <Typography variant="h6" sx={styles.pageSubtitle}>
        Transform your sources into beautiful Notion notes
      </Typography>

      <Stack spacing={4} sx={styles.mainContent}>
        <Paper elevation={0} sx={styles.sourcePaper}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">Add Source</Typography>
            <InfoIcon color="action" fontSize="small" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add URLs to use as reference in your Notion notes. You can add multiple sources to combine their content.
          </Typography>
          <Stack spacing={2}>
            <Box sx={styles.sourceInputContainer}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter URLs one by one"
                value={linkInput}
                onChange={(e) => {
                  setLinkInput(e.target.value);
                  setUrlError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddLink();
                  }
                }}
                error={!!urlError}
                helperText={urlError}
              />
              <Button
                variant="contained"
                onClick={handleAddLink}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
            {sources.length > 0 && (
              <Box sx={styles.sourcesList}>
                {sources.map((source) => (
                  <Chip
                    key={source.id}
                    icon={getSourceIcon(source.type)}
                    label={source.content}
                    onDelete={() => handleRemoveSource(source.id)}
                    sx={styles.chip}
                  />
                ))}
              </Box>
            )}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={styles.sectionPaper}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">File Upload</Typography>
            <InfoIcon color="action" fontSize="small" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload files to include their content in your Notion notes. Supported formats: PDF, DOCX, XLSX, PPTX, TXT.
          </Typography>
          <Paper 
            elevation={0} 
            sx={{
              ...styles.dropzonePaper,
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
              },
            }} 
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <Box sx={styles.dropzoneContent}>
              <AddIcon sx={styles.addIcon} />
              <Typography variant="h6">Drop files here</Typography>
              <Typography variant="body2" color="text.secondary">
                or click to select files
              </Typography>
            </Box>
          </Paper>
          {fileSources.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Uploaded Files:
              </Typography>
              <Stack spacing={1}>
                {fileSources.map((fileSource) => (
                  <Paper
                    key={fileSource.id}
                    elevation={0}
                    sx={{
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon color="action" />
                      <Typography variant="body2" noWrap>
                        {fileSource.file.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFile(fileSource.id)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'error.main',
                        },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={styles.sectionPaper}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">Image Upload</Typography>
            <InfoIcon color="action" fontSize="small" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload images to include in your Notion notes. Supported formats: PNG, JPG, JPEG.
          </Typography>
          <Box sx={styles.imageUploadContainer}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<ImageIcon />}
              sx={{ cursor: 'pointer' }}
            >
              Upload Images
              <input
                type="file"
                hidden
                multiple
                accept=".png,.jpg,.jpeg"
                onChange={handleImageUpload}
              />
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={useImageContent}
                  onChange={handleImageContentToggle}
                />
              }
              label="Extract and Use Image Content"
            />
          </Box>
          {imageSources.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {imageSources.map((image, index) => (
                <Box
                  key={image.id}
                  sx={{
                    position: 'relative',
                    width: 100,
                    height: 100,
                    borderRadius: 1,
                    overflow: 'hidden',
                    boxShadow: 2,
                    transform: `translateY(${index * -10}px)`,
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: `translateY(${index * -10}px) scale(1.05)`,
                      zIndex: 1,
                    },
                  }}
                >
                  <img
                    src={image.preview}
                    alt={`Uploaded ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveImage(image.id)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={styles.sectionPaper}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">Web Search</Typography>
            <InfoIcon color="action" fontSize="small" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enable web search to automatically find and include relevant content from the internet based on your sources.
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={enableWebSearch}
                onChange={(e) => setEnableWebSearch(e.target.checked)}
              />
            }
            label="Enable Web Search"
          />
        </Paper>

        <Paper elevation={0} sx={styles.sectionPaper}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">Select Notion Template</Typography>
            <InfoIcon color="action" fontSize="small" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a template to structure your Notion notes. Templates help organize your content in a consistent and visually appealing way.
          </Typography>
          <Autocomplete
            options={templates}
            getOptionLabel={(option) => option.name}
            loading={loading}
            value={selectedTemplate}
            onChange={(_, newValue) => setSelectedTemplate(newValue)}
            onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search templates"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="subtitle1">{option.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                </Box>
              </Box>
            )}
          />
          {selectedTemplate && (
            <Box sx={styles.templatePreview}>
              <img
                src={selectedTemplate.thumbnailUrl}
                alt={selectedTemplate.name}
                style={{ maxWidth: '100%', borderRadius: '8px' }}
              />
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={styles.sectionPaper}>
          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <Link href="#" onClick={(e) => e.preventDefault()}>
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="#" onClick={(e) => e.preventDefault()}>
                  Privacy Policy
                </Link>
              </Typography>
            }
          />
        </Paper>

        <Box sx={styles.generateButtonContainer}>
          <Button
            variant="contained"
            size="large"
            disabled={sources.length === 0 || !acceptedTerms}
            sx={styles.generateButton}
          >
            Generate Notion Notes
          </Button>
        </Box>
      </Stack>
    </Container>
  );
};

export default MainPage; 