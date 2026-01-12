import { useCallback, useEffect, useMemo, useState } from 'react';
import heic2any from 'heic2any';
import { DropZone } from '../../components/DropZone';
import { Toggle } from '../../components/Toggle';
import { ToolLayout } from '../../components/ToolLayout';
import { ButtonLink } from '../../components/Button';

type HeicItem = {
  id: string;
  name: string;
  url: string;
  downloadName: string;
  error?: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function HeicToJpg() {
  const [items, setItems] = useState<HeicItem[]>([]);
  const [status, setStatus] = useState<string>('');
  const [autoDownload, setAutoDownload] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      items.forEach(item => {
        if (item.url) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [items]);

  const convertFile = useCallback(async (file: File) => {
    try {
      const result = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.82,
      });

      const blob = Array.isArray(result) ? result[0] : result;
      const url = URL.createObjectURL(blob as Blob);
      const downloadName = file.name.replace(/\.heic$/i, '.jpg');

      return {
        id: createId(),
        name: file.name,
        url,
        downloadName,
      };
    } catch (_error) {
      return {
        id: createId(),
        name: file.name,
        url: '',
        downloadName: '',
        error: 'Error converting the file.',
      };
    }
  }, []);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const files = Array.from(fileList);
      if (!files.length) {
        return;
      }

      setStatus(`Processing ${files.length} file(s)...`);
      const results = await Promise.all(files.map(file => convertFile(file)));

      setItems(current => {
        current.forEach(item => {
          if (item.url) {
            URL.revokeObjectURL(item.url);
          }
        });
        return results;
      });
      setStatus('Done processing.');

      if (autoDownload) {
        results.forEach(item => {
          if (item.url) {
            const link = document.createElement('a');
            link.href = item.url;
            link.download = item.downloadName;
            link.click();
          }
        });
      }
    },
    [autoDownload, convertFile]
  );

  const statusMessage = useMemo(() => status || 'Drop HEIC files to convert them.', [status]);

  return (
    <ToolLayout title="HEIC to JPG" description="Convert HEIC images to JPG without uploads." badge="Converter">
      <div className="stack">
        <Toggle
          checked={autoDownload}
          onChange={event => setAutoDownload(event.target.checked)}
          label="Automatically download converted files"
        />
        <DropZone
          label="Drag and drop HEIC files here or click to select files"
          hint="Multiple files are supported."
          accept=".heic"
          multiple
          onFiles={handleFiles}
        />
        <div className="message-box">{statusMessage}</div>
        <div className="preview-grid">
          {items.map(item => (
            <div key={item.id} className="file-item">
              <div className="file-info">
                <div className="file-name">{item.name}</div>
                {item.error ? (
                  <div className="error-box">{item.error}</div>
                ) : (
                  <ButtonLink href={item.url} download={item.downloadName}>
                    Download JPG
                  </ButtonLink>
                )}
              </div>
              {item.url ? <img src={item.url} className="fill-parent-width" alt={item.name} /> : null}
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
