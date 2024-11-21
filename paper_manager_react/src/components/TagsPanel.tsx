import React from 'react';
import Tag from './Tag';

interface TagsPanelProps {
  tags: Tags;
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
        {Object.keys(tags).map(tag => (
          <Tag 
            key={tag}
            tag={tag}
            colorIndex={tags[tag]?.colorIndex}
            onRemove={() => handleRemoveClick(tag)}
            onDragStart={(e) => handleDragStart(e, tag)}
            draggable={true}
          />
        ))}
      </div>
    </div>
  );
};

export default TagsPanel; 