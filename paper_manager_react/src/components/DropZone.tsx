import React, { useState } from 'react';

interface DropZoneProps {
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onDrop, onClick }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`drop-area ${isDragOver ? 'dragover' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e);
      }}
      onClick={onClick}
    >
      <h2 style={{margin: 0}}>PDF 파일이 있는 폴더를 여기에 드래그하거나 폴더를 선택하세요</h2>
    </div>
  );
};

export default DropZone; 