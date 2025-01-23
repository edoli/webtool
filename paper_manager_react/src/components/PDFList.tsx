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
  const [lastCheckedIndex, setLastCheckedIndex] = useState<number | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
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
    const tagFilter = (selectedTags.length > 0) ? selectedTags.every(tag => tag === "None" ? pdf.tags?.size === 0 : pdf.tags?.has(tag)) : true;
    const searchQueryFilter = (searchQuery.length > 0) ? pdf.name.toLowerCase().includes(searchQuery) : true;
    return tagFilter && searchQueryFilter;
  });

  // filteredPdfFiles의 인덱스를 역으로 매핑
  const filteredIndices = pdfFiles.map((pdf) => 
    filteredPdfFiles.includes(pdf) ? filteredPdfFiles.indexOf(pdf) : -1
  );

  const handleSelect = (index: number, selected: boolean, shiftKey: boolean, ctrlKey: boolean) => {
    if (shiftKey && lastCheckedIndex !== undefined) {
      const start = Math.min(lastCheckedIndex, index);
      const end = Math.max(lastCheckedIndex, index);

      setPdfFiles(prev => 
        prev.map((pdf, i) => {
          const fi = filteredIndices[i];
          return fi !== -1 && fi >= start && fi <= end ? { ...pdf, selected } : pdf;
        })
      );
    } else if (ctrlKey) {
      setPdfFiles(prev => 
        prev.map((pdf, i) => {
          const fi = filteredIndices[i];
          return fi === index ? { ...pdf, selected } : pdf;
        })
      );
    } else {
      setPdfFiles(prev => 
        prev.map((pdf, i) => {
          const fi = filteredIndices[i];
          return fi === index ? { ...pdf, selected } : { ...pdf, selected: false };
        })
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
        <div className="pdf-list-controls-row">
          <div className="sort-controls">
            <select onChange={(e) => onSort(e.target.value as SortMethod)}>
              <option value="date">최신순</option>
              <option value="date_reverse">오래된순</option>
              <option value="name">이름순 (오름차순)</option>
              <option value="name_reverse">이름순 (내림차순)</option>
            </select>
          </div>
          <div className="search-controls">
            <input type="text" placeholder="검색" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="pdf-list-controls-row">
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
      </div>
      <div>
        {filteredPdfFiles.map((pdf, index) => (
          <PDFItem
            key={pdf.name}
            pdf={pdf}
            tags={tags}
            onSelect={(selected, shiftKey, ctrlKey) => handleSelect(index, selected, shiftKey, ctrlKey)}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
          />
        ))}
      </div>
    </div>
  );
};

export default PDFList;