import React from 'react';
import { tagColors } from '../constants/color';

interface TagProps {
  tag: string;
  colorIndex: number;
  onRemove: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  draggable?: boolean;
}

const Tag: React.FC<TagProps> = ({ tag, colorIndex, onRemove, onDragStart, draggable }) => {
  const tagColor = tagColors[colorIndex || 0];

  return (
    <span 
      className={`tag ${draggable ? 'draggable' : ''}`}
      style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      {tag}
      <button
        className="remove-tag-btn"
        onClick={onRemove}
        title="태그 제거"
      >
        ×
      </button>
    </span>
  );
};

export default Tag; 