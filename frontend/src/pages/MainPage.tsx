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
import { useTheme } from '@mui/material/styles';

interface Source {
  id: string;
  type: 'link' | 'file' | 'youtube' | 'image';
  content: string;
  useImageContent?: boolean;
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

interface NotionSearchResult {
  object: string;
  id: string;
  properties?: any;
  cover?: any;
  icon?: any;
  url?: string;
}

const VALID_URL_PATTERN = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w.~:?#[\]@!$&'()*+,;=%-]*)*\/?$/i;
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
};
const ALLOWED_IMAGE_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg'],
};

const MainPage: React.FC = () => {
  console.log('MainPage rendered');
  const [sources, setSources] = useState<Source[]>([]);
  const [fileSources, setFileSources] = useState<FileSource[]>([]);
  const [imageSources, setImageSources] = useState<ImageSource[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [useImageContent, setUseImageContent] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [urlError, setUrlError] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState('');
  const [notionSearch, setNotionSearch] = useState('');
  const [notionResults, setNotionResults] = useState<NotionSearchResult[]>([]);
  const [selectedNotion, setSelectedNotion] = useState<NotionSearchResult | null>(null);
  const [notionLoading, setNotionLoading] = useState(false);
  const [webSearchInput, setWebSearchInput] = useState('');
  const [webSearchQueries, setWebSearchQueries] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const theme = useTheme();

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


  // Notion search effect
  useEffect(() => {
    if (notionSearch.length < 2) return;
    setNotionLoading(true);
    const fetchNotionResults = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/notion/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query: notionSearch }),
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch Notion results');
        const data = await response.json();
        setNotionResults(data.results || []);
      } catch (err) {
        setNotionResults([]);
      } finally {
        setNotionLoading(false);
      }
    };
    const debounce = setTimeout(fetchNotionResults, 300);
    return () => clearTimeout(debounce);
  }, [notionSearch]);

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

  const handleAddWebSearch = () => {
    if (webSearchInput.trim()) {
      setWebSearchQueries(prev => [...prev, webSearchInput.trim()]);
      setWebSearchInput('');
    }
  };
  const handleRemoveWebSearch = (query: string) => {
    setWebSearchQueries(prev => prev.filter(q => q !== query));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setProgress("Starting processing...");
    setResult("");
    setError("");
    try {
      if (!userPrompt.trim()) {
        alert('Please enter a prompt.');
        return;
      }
      if (!selectedNotion) {
        alert('Please select a Notion page or database.');
        return;
      }
      const formData = new FormData();
      formData.append('user_query', userPrompt);
      formData.append('notion_object', selectedNotion.object);
      formData.append('notion_id', selectedNotion.id);
      // Append all files
      fileSources.forEach(f => formData.append('files', f.file));
      // Append all images
      imageSources.forEach(img => formData.append('images', img.file));
      // Send all sources (links, youtube, etc)
      formData.append('sources', JSON.stringify(sources.map(s => ({ type: s.type, content: s.content }))));
      // Send web search queries
      formData.append('web_search_queries', JSON.stringify(webSearchQueries));
      formData.append('use_image_content', useImageContent.toString());
      const token = localStorage.getItem('token');
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.body) {
        setError('No response from server.');
        setIsSubmitting(false);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullText = "";
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setProgress(fullText);
        }
      }
      setResult(fullText);
      setProgress("Done.");
    } catch (err) {
      setError('Error submitting form: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !!userPrompt.trim() &&
    !!selectedNotion &&
    acceptedTerms &&
    (
      sources.length > 0 ||
      fileSources.length > 0 ||
      imageSources.length > 0 ||
      webSearchQueries.length > 0
    ) &&
    !isSubmitting;

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

      <form onSubmit={handleSubmit}>
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
              Upload files to include their content in your Notion notes. Supported formats: PDF, DOCX, XLSX, and PPTX.
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

          {/* --- User Prompt Input --- */}
          <Paper elevation={0} sx={styles.sectionPaper}>
            <Typography variant="h6" mb={2}>Describe how you want your content to be used to generate notes <span style={{ color: theme.palette.error.main }}>*</span></Typography>
            <TextField
              required
              fullWidth
              multiline
              minRows={2}
              placeholder="e.g. Summarize these sources into a study guide, highlight key points, etc."
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
            />
          </Paper>

          {/* --- Notion Search Autocomplete --- */}
          <Paper elevation={0} sx={styles.sectionPaper}>
            <Typography variant="h6" mb={2}>Select a Notion page or database <span style={{ color: theme.palette.error.main }}>*</span></Typography>
            <Autocomplete
              options={notionResults}
              getOptionLabel={option => {
                // Try to get the title from properties.Name or properties.title
                const titleProp = option.properties?.Name || option.properties?.title;
                if (titleProp && Array.isArray(titleProp.title)) {
                  return titleProp.title.map((t: any) => t.plain_text).join(' ');
                }
                if (titleProp && Array.isArray(titleProp)) {
                  return titleProp.map((t: any) => t.plain_text).join(' ');
                }
                return option.id;
              }}
              filterOptions={x => x} // Don't filter client-side
              loading={notionLoading}
              value={selectedNotion}
              onChange={(_, value) => setSelectedNotion(value)}
              onInputChange={(_, value) => setNotionSearch(value)}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderOption={(props, option) => {
                // Remove key from props and pass it directly
                const { key, ...restProps } = props;
                const titleProp = option.properties?.Name || option.properties?.title;
                let title = option.id;
                if (titleProp && Array.isArray(titleProp.title)) {
                  title = titleProp.title.map((t: any) => t.plain_text).join(' ');
                }
                if (titleProp && Array.isArray(titleProp)) {
                  title = titleProp.map((t: any) => t.plain_text).join(' ');
                }
                return (
                  <Box component="li" key={option.id} {...restProps} display="flex" alignItems="center" gap={2}>
                    {option.cover?.external?.url && (
                      <img src={option.cover.external.url} alt="cover" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    )}
                    <Typography>{title}</Typography>
                    <Typography variant="caption" color="text.secondary" ml={1}>
                      ({option.object})
                    </Typography>
                  </Box>
                );
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Search Notion pages/databases"
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {notionLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Paper>

          {/* --- Web Search Queries --- */}
          <Paper elevation={0} sx={styles.sectionPaper}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6">Web Search Queries</Typography>
              <InfoIcon color="action" fontSize="small" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add web search queries to include relevant content from the internet. You can add multiple queries.
            </Typography>
            <Stack spacing={2} direction="row" alignItems="center">
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter web search query"
                value={webSearchInput}
                onChange={e => setWebSearchInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddWebSearch();
                }}
              />
              <Button variant="contained" onClick={handleAddWebSearch} startIcon={<AddIcon />}>Add</Button>
            </Stack>
            {webSearchQueries.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {webSearchQueries.map(query => (
                  <Chip
                    key={query}
                    label={query}
                    onDelete={() => handleRemoveWebSearch(query)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </Paper>

          {/* --- Terms and Conditions --- */}
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
              type="submit"
              disabled={!canSubmit}
              sx={styles.generateButton}
            >
              Generate Notion Notes
            </Button>
          </Box>
        </Stack>
      </form>
      {/* Progress and result UI */}
      {progress && (
        <Box sx={{ my: 2 }}>
          <Typography variant="body2" color="primary">{progress}</Typography>
        </Box>
      )}
      {result && (
        <Box sx={{ my: 2 }}>
          <Typography variant="body1" color="success.main">{result}</Typography>
        </Box>
      )}
      {error && (
        <Box sx={{ my: 2 }}>
          <Typography variant="body2" color="error">{error}</Typography>
        </Box>
      )}
    </Container>
  );
};

export default MainPage; 