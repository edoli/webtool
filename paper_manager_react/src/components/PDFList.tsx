import React, { useState } from 'react';
import PDFItem from './PDFItem';

interface PDFListProps {
  pdfFiles: PDFFile[];
  tags: Tags;  // 전체 태그 정보를 props로 받음
  setPdfFiles: React.Dispatch<React.SetStateAction<PDFFile[]>>;
  onSort: (method: SortMethod) => void;
  onAddTags: () => void;
  onAddTag: (pdfName: string, tag: string) => void;
  onRemoveTag: (pdfName: string, tag: string) => void;
}

const PDFList: React.FC<PDFListProps> = ({ 
  pdfFiles, 
  tags,
  setPdfFiles, 
  onSort, 
  onAddTags, 
  onAddTag,
  onRemoveTag 
}) => {
  const [lastCheckedIndex, setLastCheckedIndex] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Get unique tags from all PDFs
  const allTags = [...new Set(
    pdfFiles.reduce<string[]>((acc, pdf) => {
      if (pdf.tags) {
        return [...acc, ...pdf.tags];
      }
      return acc;
    }, ["None"])
  )];

  const handleTagFilter = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }
      return [...prev, tag];
    });
  };

  const filteredPdfFiles = pdfFiles.filter(pdf => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every(tag => tag === "None" ? pdf.tags?.size === 0 : pdf.tags?.has(tag));
  });

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
      <div className="pdf-list-controls">
        <div className="sort-controls">
          <select onChange={(e) => onSort(e.target.value as SortMethod)}>
            <option value="date">날짜순 (오름차순)</option>
            <option value="date_reverse">날짜순 (내림차순)</option>
            <option value="name">이름순 (오름차순)</option>
            <option value="name_reverse">이름순 (내림차순)</option>
          </select>
        </div>
        <div className="tag-filters">
          {allTags.map(tag => (
            <button 
              key={tag}
              className={`tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
              onClick={() => handleTagFilter(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex-1"></div>
        <div className="pdf-list-control-buttons">
          <div className="button" onClick={onAddTags}>태그 추가</div>
          <div className="button" onClick={onDeselectAll}>선택 해제</div>
        </div>
      </div>
      <div>
        {filteredPdfFiles.map((pdf, index) => (
          <PDFItem
            key={pdf.name}
            pdf={pdf}
            tags={tags}
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