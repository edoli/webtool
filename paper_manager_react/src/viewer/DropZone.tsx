import React, { useCallback, useState } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.exr,.png,.jpg,.jpeg,.gif,.webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileSelect(file);
    };
    input.click();
  }, [onFileSelect]);

  return (
    <div 
      className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      Drop your file here or click to select
    </div>
  );
};