interface TagInfo {
  colorIndex: number;
}

interface Tags {
  [tag_name: string]: TagInfo;
}

interface PDFInfo {
  tags: string[];
}

interface PDFs {
  [pdf_name: string]: PDFInfo;
}

interface PDFFile {
  name: string;
  path?: string;
  file: File;
  lastModified: number;
  tags: Set<string>;
  selected?: boolean;
}

interface DatabaseStructure {
  tags: Tags;
  pdfs: PDFs;
}

type SortMethod = 'date' | 'name' | 'date_reverse' | 'name_reverse';