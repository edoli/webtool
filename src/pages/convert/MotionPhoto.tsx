import { useCallback, useEffect, useMemo, useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { Toggle } from '../../components/Toggle';
import { ToolLayout } from '../../components/ToolLayout';
import { ButtonLink } from '../../components/Button';
import { readFileAsArrayBuffer } from '../../utils/file';

type MotionItem = {
  id: string;
  name: string;
  url: string;
  downloadName: string;
  error?: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function MotionPhoto() {
  const [items, setItems] = useState<MotionItem[]>([]);
  const [status, setStatus] = useState<string>('');
  const [autoDownload, setAutoDownload] = useState<boolean>(false);

  const clearUrls = useCallback((list: MotionItem[]) => {
    list.forEach(item => {
      if (item.url) {
        URL.revokeObjectURL(item.url);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      clearUrls(items);
    };
  }, [clearUrls, items]);

  const extractMotionPhoto = useCallback(
    async (file: File) => {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const blob = bufferToMp4Blob(arrayBuffer);
      if (!blob) {
        return {
          id: createId(),
          name: file.name,
          url: '',
          downloadName: '',
          error: 'No motion photo data found.',
        };
      }
      const url = URL.createObjectURL(blob);
      const downloadName = `${file.name.replace(/\.[^/.]+$/, '')}.mp4`;
      return {
        id: createId(),
        name: file.name,
        url,
        downloadName,
      };
    },
    []
  );

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const files = Array.from(fileList);
      if (!files.length) {
        return;
      }

      setStatus(`Processing ${files.length} file(s)...`);
      const results = await Promise.all(files.map(file => extractMotionPhoto(file)));

      setItems(current => {
        clearUrls(current);
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
    [autoDownload, clearUrls, extractMotionPhoto]
  );

  const statusMessage = useMemo(() => status || 'Drop motion photos to extract MP4 clips.', [status]);

  return (
    <ToolLayout
      title="Motion Photo Extractor"
      description="Extract MP4 clips from motion photos locally in your browser."
      badge="Converter"
    >
      <div className="stack">
        <Toggle
          checked={autoDownload}
          onChange={event => setAutoDownload(event.target.checked)}
          label="Automatically download converted files"
        />
        <DropZone
          label="Drag and drop motion photos here or click to select files"
          hint="Supports multiple files at once."
          accept="image/*"
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
                    Download MP4
                  </ButtonLink>
                )}
              </div>
              {item.url ? (
                <video src={item.url} controls className="fill-parent-width" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}

function bufferToMp4Blob(arrayBuffer: ArrayBuffer) {
  const array = new Uint8Array(arrayBuffer);
  let start = -1;
  for (let i = 8; i < array.length - 8; i += 1) {
    if (array[i + 4] === 0x66 && array[i + 5] === 0x74 && array[i + 6] === 0x79 && array[i + 7] === 0x70) {
      start = i;
      break;
    }
  }
  if (start === -1) {
    return null;
  }
  return new Blob([array.subarray(start)], { type: 'video/mp4' });
}
