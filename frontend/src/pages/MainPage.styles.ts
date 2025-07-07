import { Margin } from '@mui/icons-material';
import { alpha, Theme } from '@mui/material/styles';

export const styles = {
  container: {
    py: 6,
    marginTop: '4rem',
    background: (theme: Theme) => theme.palette.background.default,
  },
  mainContent: {
    mt: 4,
    maxWidth: '1200px',
    mx: 'auto',
  },
  dropzonePaper: {
    p: 4,
    border: '2px dashed',
    borderColor: 'primary.main',
    borderRadius: 3,
    bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.05),
    flex: 1,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      borderColor: 'primary.dark',
      bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.08),
    },
  },
  dropzoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    py: 2,
  },
  addIcon: {
    fontSize: 48,
    color: 'primary.main',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'scale(1.1)',
    },
  },
  sourcePaper: {
    p: 4,
    border: '1px solid',
    borderColor: (theme: Theme) => alpha(theme.palette.divider, 0.1),
    borderRadius: 3,
    flex: 1,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.2),
    },
  },
  sourcesContainer: {
    p: 4,
    border: '1px solid',
    borderColor: (theme: Theme) => alpha(theme.palette.divider, 0.1),
    borderRadius: 3,
    transition: 'all 0.2s ease-in-out',
  },
  sectionPaper: {
    p: 4,
    border: '1px solid',
    borderColor: (theme: Theme) => alpha(theme.palette.divider, 0.1),
    borderRadius: 3,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.2),
    },
  },
  chip: {
    m: 0.5,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-1px)',
    },
  },
  generateButton: {
    px: 6,
    py: 1.5,
    fontSize: '1.1rem',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-1px)',
    },
  },
  templateSelect: {
    '& .MuiSelect-select': {
      py: 1,
    },
  },
  templateMenuItem: {
    py: 1,
  },
  sourceControls: {
    display: 'flex',
    gap: 4,
    flexDirection: { xs: 'column', md: 'row' },
  },
  sourceInputContainer: {
    display: 'flex',
    gap: 2,
  },
  imageUploadContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    mt: 2,
  },
  sourcesList: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1.5,
    mt: 2,
  },
  generateButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    mt: 2,
  },
  pageTitle: {
    textAlign: 'center',
    mb: 2,
    background: (theme: Theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    fontWeight: 800,
  },
  pageSubtitle: {
    textAlign: 'center',
    mb: 4,
    color: 'text.secondary',
    maxWidth: '600px',
    mx: 'auto',
  },
  templatePreview: {
    mt: 3,
    p: 3,
    border: '1px solid',
    borderColor: (theme: Theme) => alpha(theme.palette.divider, 0.1),
    borderRadius: 3,
    bgcolor: (theme: Theme) => theme.palette.background.paper,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.2),
    },
  },
} as const;

export type Styles = typeof styles; 