import React, { useState } from 'react';

interface PDFItemProps {
  pdf: PDFFile;
  onSelect: (selected: boolean, shiftKey: boolean) => void;
  onAddTag: (pdfName: string, tag: string) => void;
  onRemoveTag: (pdfName: string, tag: string) => void;
}

const PDFItem: React.FC<PDFItemProps> = ({ pdf, onSelect, onAddTag, onRemoveTag }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const tag = e.dataTransfer.getData('text/plain');
    if (tag && !pdf.tags.has(tag)) {
      onAddTag(pdf.name, tag);
    }
  };

  return (
    <div 
      className={`pdf-item ${isDragOver ? 'dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="custom-checkbox-wrapper pdf-checkbox">
        <input
          type="checkbox"
          className="custom-checkbox"
          checked={pdf.selected || false}
          onChange={(e) => onSelect(e.target.checked, (e.nativeEvent as MouseEvent).shiftKey)}
        />
        <div className="custom-checkbox-mark"></div>
      </div>
      <div className="pdf-info">
        <div className="pdf-name">{pdf.name}</div>
        <div className="pdf-tags">
          {Array.from(pdf.tags).map(tag => (
            <span key={tag} className="tag">
              {tag}
              <button
                className="remove-tag-btn"
                onClick={() => onRemoveTag(pdf.name, tag)}
                title="태그 제거"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDFItem; 