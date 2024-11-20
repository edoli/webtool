import React, { useState } from 'react';
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
  // Add state to track last checked item index
  const [lastCheckedIndex, setLastCheckedIndex] = useState<number | null>(null);

  const handleSelect = (index: number, selected: boolean, shiftKey: boolean) => {
    if (shiftKey && lastCheckedIndex !== null) {
      const start = Math.min(lastCheckedIndex, index);
      const end = Math.max(lastCheckedIndex, index);
      
      setPdfFiles(prev => 
        prev.map((pdf, i) => 
          i >= start && i <= end ? { ...pdf, selected } : pdf
        )
      );
    } else {
      setPdfFiles(prev =>
        prev.map((p, i) =>
          i === index ? { ...p, selected } : p
        )
      );
    }
    setLastCheckedIndex(index);
  };
    
  const onDeselectAll = () => {
    setPdfFiles(prev =>
      prev.map(pdf => ({
        ...pdf,
        selected: false
      }))
    );
  };

  return (
    <div className="pdf-list">
      <div className="controls">
        <div className="sort-controls">
          <select onChange={(e) => onSort(e.target.value as SortMethod)}>
            <option value="date">날짜순 (오름차순)</option>
            <option value="date_reverse">날짜순 (내림차순)</option>
            <option value="name">이름순 (오름차순)</option>
            <option value="name_reverse">이름순 (내림차순)</option>
          </select>
        </div>
        <button className="btn" onClick={onAddTags}>선택한 PDF에 태그 추가</button>
        <button className="btn" onClick={onDeselectAll}>모두 선택 해제</button>
      </div>
      <div>
        {pdfFiles.map((pdf, index) => (
          <PDFItem
            key={pdf.name}
            pdf={pdf}
            onSelect={(selected, shiftKey) => handleSelect(index, selected, shiftKey)}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
          />
        ))}
      </div>
    </div>
  );
};

export default PDFList;