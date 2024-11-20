import React from 'react';

interface TagsPanelProps {
  tags: Set<string>;
  onRemoveTag: (tag: string) => void;
}

const TagsPanel: React.FC<TagsPanelProps> = ({ tags, onRemoveTag }) => {
  const handleDragStart = (e: React.DragEvent, tag: string) => {
    e.dataTransfer.setData('text/plain', tag);
  };

  const handleRemoveClick = (tag: string) => {
    if (window.confirm(`정말로 "${tag}" 태그를 완전히 삭제하시겠습니까? 이 작업은 모든 PDF에서 해당 태그를 제거합니다.`)) {
      onRemoveTag(tag);
    }
  };

  return (
    <div className="tags-panel">
      <h3>태그</h3>
      <div className="tags-container">
        {Array.from(tags).map(tag => (
          <div
            key={tag}
            className="draggable-tag"
            draggable
            onDragStart={(e) => handleDragStart(e, tag)}
          >
            <span>{tag}</span>
            <button
              className="remove-tag-btn"
              onClick={() => handleRemoveClick(tag)}
              title="태그 삭제"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagsPanel; 