// types.ts
export interface PDFFile {
    name: string;
    path?: string;
    lastModified: number;
    tags: Set<string>;
    selected?: boolean;
  }
  
  export interface DatabaseStructure {
    tags: string[];
    pdfs: {
      [name: string]: {
        tags: string[];
      };
    };
  }
  
  export type SortMethod = 'date' | 'name';