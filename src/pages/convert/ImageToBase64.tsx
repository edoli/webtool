import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { DropZone } from '../../components/DropZone';
import { ToolLayout } from '../../components/ToolLayout';

type CopyState = 'idle' | 'copied' | 'failed';

export function ImageToBase64() {
  const [dataUrl, setDataUrl] = useState('');
  const [fileInfo, setFileInfo] = useState('');
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [error, setError] = useState('');

  const copyToClipboard = useCallback(async (value: string) => {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopyState('copied');
      setError('');
    } catch {
      setCopyState('failed');
      setError('클립보드 복사에 실패했습니다. 버튼으로 다시 시도해 주세요.');
    }
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 변환할 수 있습니다.');
        return;
      }

      setError('');
      setCopyState('idle');
      setFileInfo(`${file.name} • ${formatFileSize(file.size)}`);

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        setDataUrl(result);
        if (result) {
          void copyToClipboard(result);
        }
      };
      reader.onerror = () => {
        setError('이미지를 읽는 중 오류가 발생했습니다.');
      };
      reader.readAsDataURL(file);
    },
    [copyToClipboard]
  );

  const handleFiles = useCallback(
    (files: FileList) => {
      const file = files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            handleFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFile]);

  return (
    <ToolLayout
      title="Image to Base64"
      description="Drop or paste an image to get a Base64 data URL instantly."
      badge="Converter"
    >
      <div className="image-base64">
        <DropZone
          label="Drag & drop an image or click to select"
          hint="Paste (Ctrl/Cmd + V) also works."
          accept="image/*"
          onFiles={handleFiles}
        />
        {fileInfo ? <div className="message-box">{fileInfo}</div> : null}
        {copyState === 'copied' ? <div className="message-box">클립보드에 복사되었습니다.</div> : null}
        {error ? <div className="error-box">{error}</div> : null}
        {dataUrl ? (
          <div className="image-base64-grid">
            <div className="image-base64-preview">
              <img src={dataUrl} alt="Preview" />
            </div>
            <div className="image-base64-output">
              <div className="image-base64-actions">
                <Button onClick={() => copyToClipboard(dataUrl)} variant="soft">
                  Copy Base64
                </Button>
              </div>
              <textarea readOnly value={dataUrl} />
            </div>
          </div>
        ) : (
          <div className="placeholder">
            <p>이미지를 올리면 Base64 결과가 자동으로 생성되고 클립보드에 복사됩니다.</p>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
