// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import '../../../style.css';
import './PDFManager.css';
import DropZone from '../components/DropZone';
import TagsPanel from '../components/TagsPanel';
import PDFList from '../components/PDFList';
import PDFInfoPanel from '../components/PDFInfoPanel';

interface FileSystemPermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

interface FileSystemHandle {
  queryPermission: (descriptor: FileSystemPermissionDescriptor) => Promise<PermissionState>;
  requestPermission: (descriptor: FileSystemPermissionDescriptor) => Promise<PermissionState>;
}

type PermissionState = 'granted' | 'denied' | 'prompt';

const PDFManager: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [tags, setTags] = useState<Tags>({});
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [shouldSave, setShouldSave] = useState(0);
  const [sortMethod, setSortMethod] = useState<SortMethod>('date');
  const DB_FILE = '.epmg.json';

  const selectedPDFs = pdfFiles.filter(pdf => pdf.selected);

  const trySaveDatabase = useCallback(_.debounce(() => {
    setShouldSave(prev => prev + 1);
  }, 1000), []);

  const processDirectory = async (handle: FileSystemDirectoryHandle, depth: number = 0) => {
    const files: File[] = [];
    try {
      const entries = handle.values();
      for await (const entry of entries) {
        if (entry.kind === 'file') {
          if (entry.name.toLowerCase().endsWith('.pdf')) {
            const fileHandle = (entry as FileSystemFileHandle);
            const file = await fileHandle.getFile();
            files.push(file);
          }
        } else if (entry.kind === 'directory') {
          const sub_files = await processDirectory(entry as FileSystemDirectoryHandle, depth + 1);
          files.push(...sub_files);
        }
      }
    } catch (error) {
      console.error('디렉토리 처리 중 오류 발생:', error);
    }

    if (depth === 0) {
      addPDFFiles(files);
    }
    return files;
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
          note: data.pdfs[pdf.name]?.note || "",
          links: data.pdfs[pdf.name]?.links || [],
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
          links: pdf.links || []
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

  const addPDFFiles = (files: File[]) => {
    setPdfFiles(prev => [
      ...prev,
      ...files.map(file => ({
        name: file.name,
        path: file.webkitRelativePath || undefined,
        lastModified: file.lastModified,
        file: file,
        tags: new Set<string>(),
        links: []
      }))
    ]);
  };

  const verifyPermission = async (handle: FileSystemHandle) => {
    const options: FileSystemPermissionDescriptor = { mode: 'read' };
    if (await handle.queryPermission(options) === 'granted') {
      return true;
    }
    return await handle.requestPermission(options) === 'granted';
  };

  const loadDirectoryHandle = () => {
    const request = indexedDB.open('FileSystemDB', 1);
    
    request.onerror = () => {
      console.error('Database error:', request.error);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles', { keyPath: 'id' });
      }
    };

    request.onsuccess = async () => {
      const db = request.result;
      const transaction = db.transaction(['handles'], 'readonly');
      const store = transaction.objectStore('handles');
      
      const getRequest = store.get('mainFolder');
      getRequest.onsuccess = async () => {
        if (getRequest.result?.handle) {
          const handle = getRequest.result.handle;
          await verifyPermission(handle);
          setDirectoryHandle(handle);
        }
      };
    };
  };

  const saveDirectoryHandle = (handle: FileSystemHandle) => {
    const request = indexedDB.open('FileSystemDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['handles'], 'readwrite');
      const store = transaction.objectStore('handles');
      store.put({ id: 'mainFolder', handle });
    };
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    const items = e.dataTransfer.items;
    for (const item of items) {
      if (item.kind === 'file' && 'getAsFileSystemHandle' in item) {
        const handle = await (item as any).getAsFileSystemHandle();
        if (handle.kind === 'directory') {
          setDirectoryHandle(handle);

          saveDirectoryHandle(handle);
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

  const sortPDFs = () => {
    setPdfFiles(prev =>
      [...prev].sort((a, b) => {
        switch (sortMethod) {
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
  }

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
        sortPDFs();
        await loadDatabase();
      }
      init();
    }
  }, [directoryHandle]);

  useEffect(() => {
    saveDatabase();
  }, [shouldSave]);

  useEffect(() => {
    sortPDFs();
  }, [sortMethod]);

  return (
    <div className="container-full">
      <div className='button' onClick={loadDirectoryHandle}>{ directoryHandle ? '새로고침' : '이전폴더로드' }</div>
      { !directoryHandle ? <DropZone onDrop={handleDrop} onClick={handleDirectorySelect} /> : <div style={{ height: 16 }}></div> }
      
      <div className="container-column">
        <div className="main-panel">
          <PDFList
            pdfFiles={pdfFiles}
            tags={tags}
            setPdfFiles={setPdfFiles}
            onSort={setSortMethod}
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

export default PDFManager;