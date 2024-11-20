interface PDFFile {
  name: string;
  path?: string;
  file: File,
  lastModified: number;
  tags: Set<string>;
  selected?: boolean;
}

interface DatabaseStructure {
  tags: string[];
  pdfs: {
    [name: string]: {
      tags: string[];
    };
  };
}

type SortMethod = 'date' | 'name' | 'date_reverse' | 'name_reverse';