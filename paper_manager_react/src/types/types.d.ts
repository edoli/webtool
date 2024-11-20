interface PDFFile {
  name: string;
  path?: string;
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

type SortMethod = 'date' | 'name';