import React from 'react';
import PDFItem from './PDFItem';

interface PDFListProps {
  pdfFiles: PDFFile[];
  setPdfFiles: React.Dispatch<React.SetStateAction<PDFFile[]>>;
  onSort: (method: SortMethod) => void;
  onAddTags: () => void;
  onAddTag: (pdfName: string, tag: string) => void;
  onRemoveTag: (pdfName: string, tag: string) => void;
}

const PDFList: React.FC<PDFListProps> = ({ 
  pdfFiles, 
  setPdfFiles, 
  onSort, 
  onAddTags, 
  onAddTag,
  onRemoveTag 
}) => {
  return (
    <div className="pdf-list">
      <div className="controls">
        <div className="sort-controls">
          <select onChange={(e) => onSort(e.target.value as SortMethod)}>
            <option value="date">날짜순</option>
            <option value="name">이름순</option>
          </select>
        </div>
        <button className="btn" onClick={onAddTags}>선택한 PDF에 태그 추가</button>
      </div>
      <div>
        {pdfFiles.map(pdf => (
          <PDFItem
            key={pdf.name}
            pdf={pdf}
            onSelect={(selected) => {
              setPdfFiles(prev =>
                prev.map(p =>
                  p.name === pdf.name ? { ...p, selected } : p
                )
              );
            }}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
          />
        ))}
      </div>
    </div>
  );
};

export default PDFList; 