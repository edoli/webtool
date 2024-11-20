// App.tsx
import React, { useState, useEffect } from 'react';
import { PDFFile, DatabaseStructure, SortMethod } from './types';
import './App.css';
import '../../style.css';

const App: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const DB_FILE = '.epmg.json';

  const processDirectory = async (handle: FileSystemDirectoryHandle) => {
    try {
      const entries = handle.values();
      for await (const entry of entries) {
        if (entry.kind === 'file') {
          if (entry.name.toLowerCase().endsWith('.pdf')) {
            const file = await entry.getFile();
            addPDFFile(file);
          }
        } else if (entry.kind === 'directory') {
          await processDirectory(entry);
        }
      }
    } catch (error) {
      console.error('디렉토리 처리 중 오류 발생:', error);
    }
  };

  const loadDatabase = async () => {
    if (!directoryHandle) {
      console.log('directoryHandle is null');
      return;
    }


    try {
      const fileHandle = await directoryHandle.getFileHandle(DB_FILE);
      const file = await fileHandle.getFile();
      const text = await file.text();
      const data: DatabaseStructure = JSON.parse(text);

      setTags(new Set(data.tags));

      setPdfFiles(prev => 
        prev.map(pdf => ({
          ...pdf,
          tags: new Set(data.pdfs[pdf.name]?.tags || [])
        }))
      );
    } catch (error) {
      console.log('새로운 데이터베이스를 생성합니다.', error);
      saveDatabase();
    }
  };

  const saveDatabase = async () => {
    if (!directoryHandle) return;

    try {
      const data: DatabaseStructure = {
        tags: Array.from(tags),
        pdfs: {}
      };

      pdfFiles.forEach(pdf => {
        data.pdfs[pdf.name] = {
          tags: Array.from(pdf.tags)
        };
      });

      let fileHandle: FileSystemFileHandle;
      try {
        fileHandle = await directoryHandle.getFileHandle(DB_FILE);
      } catch {
        fileHandle = await directoryHandle.getFileHandle(DB_FILE, { create: true });
      }

      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
    } catch (error) {
      console.error('데이터베이스 저장 중 오류 발생:', error);
    }
  };

  const addPDFFile = (file: File) => {
    setPdfFiles(prev => [
      ...prev,
      {
        name: file.name,
        path: file.webkitRelativePath || undefined,
        lastModified: file.lastModified,
        tags: new Set()
      }
    ]);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    const items = e.dataTransfer.items;
    for (let item of items) {
      if (item.kind === 'file' && 'getAsFileSystemHandle' in item) {
        const handle = await (item as any).getAsFileSystemHandle();
        if (handle.kind === 'directory') {
          setDirectoryHandle(handle);
        }
      }
    }
  };

  const handleDirectorySelect = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setDirectoryHandle(handle);
    } catch (error) {
      console.error('폴더 선택 중 오류 발생:', error);
    }
  };

  const sortPDFs = (method: SortMethod) => {
    setPdfFiles(prev => 
      [...prev].sort((a, b) => {
        if (method === 'date') {
          return b.lastModified - a.lastModified;
        }
        return a.name.localeCompare(b.name);
      })
    );
  };

  const addTagsToSelected = () => {
    const tag = prompt('추가할 태그를 입력하세요:');
    if (!tag) return;

    setTags(prev => new Set([...prev, tag]));

    setPdfFiles(prev =>
      prev.map(pdf => ({
        ...pdf,
        tags: pdf.selected ? new Set([...pdf.tags, tag]) : pdf.tags
      }))
    );

    saveDatabase();
  };

  const addTagToPDF = (pdfName: string, tag: string) => {
    setPdfFiles(prev =>
      prev.map(pdf => {
        if (pdf.name === pdfName) {
          return {
            ...pdf,
            tags: new Set([...pdf.tags, tag])
          };
        }
        return pdf;
      })
    );
    saveDatabase();
  };

  const removeTagFromPDF = (pdfName: string, tag: string) => {
    setPdfFiles(prev =>
      prev.map(pdf => {
        if (pdf.name === pdfName) {
          const newTags = new Set(pdf.tags);
          newTags.delete(tag);
          return {
            ...pdf,
            tags: newTags
          };
        }
        return pdf;
      })
    );
    saveDatabase();
  };

  const removeTagCompletely = (tagToRemove: string) => {
    // PDF들에서 해당 태그 제거
    setPdfFiles(prev =>
      prev.map(pdf => {
        const newTags = new Set(pdf.tags);
        newTags.delete(tagToRemove);
        return {
          ...pdf,
          tags: newTags
        };
      })
    );

    // 태그 목록에서 제거
    setTags(prev => {
      const newTags = new Set(prev);
      newTags.delete(tagToRemove);
      return newTags;
    });

    saveDatabase();
  };

  // 디렉토리가 설정되었을때 호출
  useEffect(() => {
    if (directoryHandle) {
      // clear previous data
      setPdfFiles([]);
      setTags(new Set());

      const init = async () => {
        await processDirectory(directoryHandle);
        await loadDatabase();
      }
      init();
    }
  }, [directoryHandle]);


  return (
    <div className="container">
      <DropZone onDrop={handleDrop} onClick={handleDirectorySelect} />
      <TagsPanel 
        tags={tags} 
        onRemoveTag={removeTagCompletely}
      />
      <PDFList
        pdfFiles={pdfFiles}
        setPdfFiles={setPdfFiles}
        onSort={sortPDFs}
        onAddTags={addTagsToSelected}
        onAddTag={addTagToPDF}
        onRemoveTag={removeTagFromPDF}
      />
    </div>
  );
};

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
  return (
    <div className="pdf-list">
      <div className="controls">
        <div className="sort-controls">
          <select onChange={(e) => onSort(e.target.value as SortMethod)}>
            <option value="date">날짜순</option>
            <option value="name">이름순</option>
          </select>
        </div>
        <button className="btn" onClick={onAddTags}>선택한 PDF에 태그 추가</button>
      </div>
      <div>
        {pdfFiles.map(pdf => (
          <PDFItem
            key={pdf.name}
            pdf={pdf}
            onSelect={(selected) => {
              setPdfFiles(prev =>
                prev.map(p =>
                  p.name === pdf.name ? { ...p, selected } : p
                )
              );
            }}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
          />
        ))}
      </div>
    </div>
  );
};

interface PDFItemProps {
  pdf: PDFFile;
  onSelect: (selected: boolean) => void;
  onAddTag: (pdfName: string, tag: string) => void;
  onRemoveTag: (pdfName: string, tag: string) => void;
}

const PDFItem: React.FC<PDFItemProps> = ({ pdf, onSelect, onAddTag, onRemoveTag }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
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
      <input
        type="checkbox"
        className="pdf-checkbox"
        checked={pdf.selected || false}
        onChange={(e) => onSelect(e.target.checked)}
      />
      <div className="pdf-info">
        <div>{pdf.name}</div>
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

export default App;