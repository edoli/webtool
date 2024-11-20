// App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import '../../style.css';
import DropZone from './components/DropZone';
import TagsPanel from './components/TagsPanel';
import PDFList from './components/PDFList';

const App: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [saveTime, setSaveTime] = useState('');
  const DB_FILE = '.epmg.json';

  const trySaveDatabase = () => {
    const now = new Date();
    setSaveTime(now.toLocaleTimeString());
  };

  const processDirectory = async (handle: FileSystemDirectoryHandle) => {
    try {
      const entries = handle.values();
      for await (const entry of entries) {
        if (entry.kind === 'file') {
          if (entry.name.toLowerCase().endsWith('.pdf')) {
            const file = await (entry as FileSystemFileHandle).getFile();
            addPDFFile(file);
          }
        } else if (entry.kind === 'directory') {
          await processDirectory(entry as FileSystemDirectoryHandle);
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
      trySaveDatabase();
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
    trySaveDatabase();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    const items = e.dataTransfer.items;
    for (const item of items) {
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
    trySaveDatabase();
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
    trySaveDatabase();
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
    trySaveDatabase();
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
    trySaveDatabase();
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

    trySaveDatabase();
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

  useEffect(() => {
    saveDatabase();
  }, [saveTime]);

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

export default App;