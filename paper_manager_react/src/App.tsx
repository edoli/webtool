// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import './App.css';
import '../../style.css';
import DropZone from './components/DropZone';
import TagsPanel from './components/TagsPanel';
import PDFList from './components/PDFList';
import PDFInfoPanel from './components/PDFInfoPanel';

const App: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [tags, setTags] = useState<Tags>({});
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [shouldSave, setShouldSave] = useState(0);
  const DB_FILE = '.epmg.json';

  const selectedPDFs = pdfFiles.filter(pdf => pdf.selected);

  const trySaveDatabase = useCallback(_.debounce(() => {
    setShouldSave(prev => prev + 1);
  }, 1000), []);

  const processDirectory = async (handle: FileSystemDirectoryHandle) => {
    try {
      const entries = handle.values();
      for await (const entry of entries) {
        if (entry.kind === 'file') {
          if (entry.name.toLowerCase().endsWith('.pdf')) {
            const fileHandle = (entry as FileSystemFileHandle);
            const file = await fileHandle.getFile();
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

      setTags(data.tags);

      setPdfFiles(prev =>
        prev.map(pdf => ({
          ...pdf,
          tags: new Set(data.pdfs[pdf.name]?.tags || []),
          note: data.pdfs[pdf.name].note || ""
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
        tags: tags,
        pdfs: {}
      };

      pdfFiles.forEach(pdf => {
        data.pdfs[pdf.name] = {
          tags: Array.from(pdf.tags),
          note: pdf.note || "",
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
        file: file,
        tags: new Set()
      }
    ]);
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
        switch (method) {
          case 'date':
            return b.lastModified - a.lastModified;
          case 'date_reverse':
            return a.lastModified - b.lastModified;
          case 'name':
            return a.name.localeCompare(b.name);
          case 'name_reverse':
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      })
    );
    trySaveDatabase();
  };

  const addTagsToSelected = () => {
    const tag = prompt('추가할 태그를 입력하세요:');
    if (!tag) return;

    // 새로운 태그인 경우 태그 정보 추가
    if (!tags[tag]) {
      setTags(prev => ({
        ...prev,
        [tag]: { colorIndex: Object.keys(tags).length }
      }));
    }

    setPdfFiles(prev =>
      prev.map(pdf => ({
        ...pdf,
        tags: pdf.selected ? new Set([...pdf.tags, tag]) : pdf.tags
      }))
    );
    trySaveDatabase();
  };

  const addTagToPDF = (pdfName: string, tag: string) => {
    // 존재하지 않는 태그인 경우 무시
    if (!tags[tag]) {
      return;
    }

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
      const newTags = { ...prev };
      delete newTags[tagToRemove];
      return newTags;
    });

    trySaveDatabase();
  };

  useEffect(() => {
    if (directoryHandle) {
      setPdfFiles([]);
      setTags({});

      const init = async () => {
        await processDirectory(directoryHandle);
        await loadDatabase();
      }
      init();
    }
  }, [directoryHandle]);

  useEffect(() => {
    saveDatabase();
  }, [shouldSave]);

  return (
    <div className="container-full">
      <DropZone onDrop={handleDrop} onClick={handleDirectorySelect} />
      <div className="container-column">
        <div className="main-panel">
          <PDFList
            pdfFiles={pdfFiles}
            tags={tags}
            setPdfFiles={setPdfFiles}
            onSort={sortPDFs}
            onAddTags={addTagsToSelected}
            onAddTag={addTagToPDF}
            onRemoveTag={removeTagFromPDF}
          />
        </div>
        <div className="side-panel">
          <TagsPanel
            tags={tags}
            onRemoveTag={removeTagCompletely}
          />
          {selectedPDFs.length === 1 && 
            <PDFInfoPanel 
              pdfFile={selectedPDFs[0]}
              onChange={trySaveDatabase} />}
        </div>
      </div>
    </div>
  );
};

export default App;