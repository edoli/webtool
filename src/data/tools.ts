export type ToolCategory = 'convert' | 'apps' | 'labs';

export type Tool = {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  category: ToolCategory;
  status: 'ready' | 'planned';
};

export const tools: Tool[] = [
  {
    id: 'motion-photo',
    title: 'Motion Photo Extractor',
    description: 'Extract MP4 clips from motion photos',
    icon: 'directions_run',
    path: '/convert/motion-photo',
    category: 'convert',
    status: 'ready',
  },
  {
    id: 'heic-to-jpg',
    title: 'HEIC to JPG',
    description: 'Convert HEIC images into JPG',
    icon: 'image',
    path: '/convert/heic-to-jpg',
    category: 'convert',
    status: 'ready',
  },
  {
    id: 'mov-to-mp4',
    title: 'MOV to MP4',
    description: 'Convert MOV files to MP4',
    icon: 'movie',
    path: '/convert/mov-to-mp4',
    category: 'convert',
    status: 'ready',
  },
  {
    id: 'image-batch',
    title: 'Image Batch Process',
    description: 'Run Python scripts on image batches',
    icon: 'photo_library',
    path: '/convert/image-batch',
    category: 'convert',
    status: 'ready',
  },
  {
    id: 'image-to-base64',
    title: 'Image to Base64',
    description: 'Convert images into Base64 data URLs',
    icon: 'data_object',
    path: '/convert/image-to-base64',
    category: 'convert',
    status: 'ready',
  },
  {
    id: 'camera',
    title: 'Camera',
    description: 'Live camera viewer',
    icon: 'photo_camera',
    path: '/apps/camera',
    category: 'apps',
    status: 'ready',
  },
  {
    id: 'calculator',
    title: 'Formula Calculator',
    description: 'Formula-driven calculator with variables',
    icon: 'calculate',
    path: '/apps/calculator',
    category: 'apps',
    status: 'ready',
  },
  {
    id: 'special-calculator',
    title: 'Special Calculator',
    description: 'Variant calculators',
    icon: 'functions',
    path: '/apps/special-calculator',
    category: 'apps',
    status: 'ready',
  },
  {
    id: 'csv-viewer',
    title: 'CSV Viewer',
    description: 'Inspect CSV tables with column tools',
    icon: 'table_view',
    path: '/apps/csv-viewer',
    category: 'apps',
    status: 'ready',
  },
  {
    id: 'web-collection',
    title: 'Web Collection',
    description: 'Save and open favorite web pages',
    icon: 'bookmarks',
    path: '/apps/web-collection',
    category: 'apps',
    status: 'ready',
  },
  {
    id: 'python-editor',
    title: 'Python Editor',
    description: 'Run Python in-browser with Pyodide',
    icon: 'code_blocks',
    path: '/apps/python-editor',
    category: 'apps',
    status: 'ready',
  },
  {
    id: 'equation',
    title: 'Scribble to LaTeX',
    description: 'Convert handwritten math to LaTeX',
    icon: 'draw',
    path: '/labs/equation',
    category: 'labs',
    status: 'ready',
  },
  {
    id: 'pdf',
    title: 'PDF Tool',
    description: 'Compress, merge, split PDF files',
    icon: 'picture_as_pdf',
    path: '/labs/pdf',
    category: 'labs',
    status: 'ready',
  },
];

export const toolCategories: Record<ToolCategory, { label: string; blurb: string }> = {
  convert: {
    label: 'Converter',
    blurb: 'Fast, local file conversions without uploads.',
  },
  apps: {
    label: 'Apps',
    blurb: 'Interactive utilities for daily workflow.',
  },
  labs: {
    label: 'Labs',
    blurb: 'Experimental tools and prototypes.',
  },
};
