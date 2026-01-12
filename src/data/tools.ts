export type ToolCategory = 'convert' | 'apps' | 'labs';

export type Tool = {
  id: string;
  title: string;
  description: string;
  path: string;
  category: ToolCategory;
  status: 'ready' | 'planned';
};

export const tools: Tool[] = [
  {
    id: 'motion-photo',
    title: 'Motion Photo Extractor',
    description: 'Extract MP4 clips from motion photos.',
    path: '/convert/motion-photo',
    category: 'convert',
    status: 'ready',
  },
  {
    id: 'heic-to-jpg',
    title: 'HEIC to JPG',
    description: 'Convert HEIC images into JPG previews.',
    path: '/convert/heic-to-jpg',
    category: 'convert',
    status: 'ready',
  },
  {
    id: 'mov-to-mp4',
    title: 'MOV to MP4',
    description: 'Batch convert MOV files with FFmpeg WASM.',
    path: '/convert/mov-to-mp4',
    category: 'convert',
    status: 'ready',
  },
  {
    id: 'image-batch',
    title: 'Image Batch Process',
    description: 'Run Python scripts on image batches.',
    path: '/convert/image-batch',
    category: 'convert',
    status: 'planned',
  },
  {
    id: 'camera',
    title: 'Camera',
    description: 'Live camera with GPU filters.',
    path: '/apps/camera',
    category: 'apps',
    status: 'planned',
  },
  {
    id: 'calculator',
    title: 'Formula Calculator',
    description: 'Formula-driven calculator with variables.',
    path: '/apps/calculator',
    category: 'apps',
    status: 'planned',
  },
  {
    id: 'special-calculator',
    title: 'Special Calculator',
    description: 'Advanced calculator variant.',
    path: '/apps/special-calculator',
    category: 'apps',
    status: 'planned',
  },
  {
    id: 'csv-viewer',
    title: 'CSV Viewer',
    description: 'Inspect CSV tables with column tools.',
    path: '/apps/csv-viewer',
    category: 'apps',
    status: 'planned',
  },
  {
    id: 'python-editor',
    title: 'Python Editor',
    description: 'Run Python in-browser with Pyodide.',
    path: '/apps/python-editor',
    category: 'apps',
    status: 'planned',
  },
  {
    id: 'equation',
    title: 'Scribble to LaTeX',
    description: 'Convert handwritten math to LaTeX.',
    path: '/labs/equation',
    category: 'labs',
    status: 'planned',
  },
  {
    id: 'pdf',
    title: 'PDF Tool',
    description: 'Compress, merge, split PDF files.',
    path: '/labs/pdf',
    category: 'labs',
    status: 'planned',
  },
  {
    id: 'mega',
    title: 'Mega Parser',
    description: 'Parse and inspect mega files.',
    path: '/labs/mega',
    category: 'labs',
    status: 'planned',
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
