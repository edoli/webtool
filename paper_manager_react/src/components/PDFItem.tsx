import React, { useState } from 'react';
import Tag from './Tag'; // Tag 컴포넌트 임포트

interface PDFItemProps {
  pdf: PDFFile;
  tags: Tags;
  onSelect: (selected: boolean, shiftKey: boolean) => void;
  onAddTag: (pdfName: string, tag: string) => void;
  onRemoveTag: (pdfName: string, tag: string) => void;
}

const PDFItem: React.FC<PDFItemProps> = ({ pdf, tags, onSelect, onAddTag, onRemoveTag }) => {
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
        <div className="pdf-name">
          <a href={URL.createObjectURL(pdf.file)} target="_blank" rel="noopener noreferrer">
            {pdf.name}
          </a>
        </div>
        <div className="pdf-tags">
          {Array.from(pdf.tags).sort().map(tag => (
            <Tag 
              key={tag}
              tag={tag}
              colorIndex={tags[tag]?.colorIndex}
              onRemove={() => onRemoveTag(pdf.name, tag)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDFItem; 