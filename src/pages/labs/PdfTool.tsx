import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { DropZone } from '../../components/DropZone';
import { ToolLayout } from '../../components/ToolLayout';

type FileItem = {
  id: number;
  file: File;
  url: string;
};

type Operation = 'compress' | 'merge' | 'split';

export function PdfTool() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [operation, setOperation] = useState<Operation>('compress');
  const [pdfSetting, setPdfSetting] = useState('/ebook');
  const [splitStart, setSplitStart] = useState('1');
  const [splitEnd, setSplitEnd] = useState('1');
  const [compatibilityLevel, setCompatibilityLevel] = useState('1.4');
  const [colorDownsample, setColorDownsample] = useState(false);
  const [colorResolution, setColorResolution] = useState('144');
  const [customCommand, setCustomCommand] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [terminal, setTerminal] = useState<string[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const gsRef = useRef<((data: any, response?: any, progress?: any) => Promise<any>) | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const loadGhostscript = useCallback(async () => {
    if (gsRef.current) {
      return gsRef.current;
    }
    const mod = await import('../../pdf/worker-init.js');
    gsRef.current = mod._GSPS2PDF;
    return gsRef.current;
  }, []);

  const addFiles = useCallback((fileList: FileList) => {
    const nextFiles: FileItem[] = [];
    Array.from(fileList).forEach(file => {
      if (file.type !== 'application/pdf') {
        return;
      }
      nextFiles.push({ id: Date.now() + Math.random(), file, url: URL.createObjectURL(file) });
    });
    if (!nextFiles.length) {
      setStatus('No PDF files added.');
      return;
    }
    setFiles(prev => [...prev, ...nextFiles]);
  }, []);

  const clearFiles = useCallback(() => {
    files.forEach(item => URL.revokeObjectURL(item.url));
    setFiles([]);
  }, [files]);

  const removeFile = useCallback(
    (id: number) => {
      setFiles(prev => {
        const next = prev.filter(item => item.id !== id);
        const removed = prev.find(item => item.id === id);
        if (removed) {
          URL.revokeObjectURL(removed.url);
        }
        return next;
      });
    },
    []
  );

  const sortedFiles = useMemo(() => {
    return [...files];
  }, [files]);

  const opEnabled = useMemo(() => {
    if (processing) return false;
    if (operation === 'compress') return files.length === 1;
    if (operation === 'merge') return files.length >= 2;
    if (operation === 'split') return files.length === 1;
    return false;
  }, [files.length, operation, processing]);

  const run = useCallback(async () => {
    if (!opEnabled) {
      return;
    }
    const gs = await loadGhostscript();
    setProcessing(true);
    setTerminal([]);
    setStatus('Working in WebAssembly...');

    const advancedSettings = {
      compatibilityLevel,
      colorImageSettings: {
        downsample: colorDownsample,
        resolution: Number(colorResolution) || 144,
      },
    };

    const config: Record<string, any> = {
      pdfSetting,
      customCommand: customCommand.trim() || undefined,
      advancedSettings,
      showTerminalOutput: showTerminal,
      showProgressBar: showProgress,
    };

    if (operation === 'merge') {
      config.operation = 'merge';
      config.files = files.map(item => item.url);
    } else if (operation === 'compress') {
      config.operation = 'compress';
      config.psDataURL = files[0]?.url;
    } else {
      config.operation = 'split';
      config.psDataURL = files[0]?.url;
      config.splitRange = { startPage: splitStart, endPage: splitEnd };
    }

    const appendTerminal = (line: string) => {
      if (!line) return;
      setTerminal(prev => [...prev, line]);
    };

    try {
      const result = await gs(config, undefined, appendTerminal);
      if (result?.error) {
        throw new Error(result.error);
      }
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
      setResultUrl(result.pdfDataURL);
      setStatus('Done');
      if (autoDownload) {
        const fileNameBase = operation === 'merge' ? 'merged' : files[0].file.name.replace(/\.pdf$/i, '');
        const suffix =
          operation === 'split'
            ? `_${splitStart}-${splitEnd}`
            : operation === 'compress'
              ? '_compressed'
              : '';
        const link = document.createElement('a');
        link.href = result.pdfDataURL;
        link.download = `${fileNameBase}${suffix}.pdf`;
        link.click();
      }
    } catch (error: any) {
      console.error(error);
      setStatus(error.message || 'Error');
    } finally {
      setProcessing(false);
    }
  }, [
    autoDownload,
    colorDownsample,
    colorResolution,
    compatibilityLevel,
    customCommand,
    files,
    loadGhostscript,
    opEnabled,
    operation,
    pdfSetting,
    resultUrl,
    showProgress,
    showTerminal,
    splitEnd,
    splitStart,
  ]);

  return (
    <ToolLayout title="PDF Tool" description="Compress, merge, and split PDF files locally." badge="Labs">
      <div className="pdf-layout">
        <div className="pdf-panel">
          <DropZone label="Drag & drop PDF files" hint="Click to choose files" accept="application/pdf" multiple onFiles={addFiles} />
          <div className="file-list">
            {sortedFiles.map((item, index) => (
              <div
                key={item.id}
                className="file-row"
                draggable
                onDragStart={() => {
                  dragIndexRef.current = index;
                }}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  const source = dragIndexRef.current;
                  if (source === null || source === index) {
                    return;
                  }
                  setFiles(prev => {
                    const next = [...prev];
                    const [moved] = next.splice(source, 1);
                    next.splice(index, 0, moved);
                    return next;
                  });
                  dragIndexRef.current = null;
                }}
              >
                <span className="handle">≡</span>
                <span>{item.file.name}</span>
                <span className="meta">{bytes(item.file.size)}</span>
                <Button variant="ghost" onClick={() => removeFile(item.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="toolbar">
            <Button variant="outline" onClick={clearFiles}>
              Clear
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setFiles(prev => [...prev].sort((a, b) => a.file.name.localeCompare(b.file.name)))
              }
              disabled={files.length < 2}
            >
              Sort A-Z
            </Button>
          </div>
        </div>
        <div className="pdf-panel">
          <div className="pdf-ops">
            {(['compress', 'merge', 'split'] as Operation[]).map(op => (
              <label key={op}>
                <input
                  type="radio"
                  name="operation"
                  value={op}
                  checked={operation === op}
                  onChange={() => setOperation(op)}
                />
                <span>{op}</span>
              </label>
            ))}
          </div>
          {operation !== 'split' ? (
            <label>
              Quality
              <select value={pdfSetting} onChange={event => setPdfSetting(event.target.value)}>
                <option value="/screen">Smallest (Screen)</option>
                <option value="/ebook">Small (eBook)</option>
                <option value="/printer">Medium (Printer)</option>
                <option value="/prepress">High (Prepress)</option>
                <option value="/default">Default</option>
              </select>
            </label>
          ) : null}
          {operation === 'split' ? (
            <div className="toolbar">
              <label>
                Start Page
                <input value={splitStart} onChange={event => setSplitStart(event.target.value)} />
              </label>
              <label>
                End Page
                <input value={splitEnd} onChange={event => setSplitEnd(event.target.value)} />
              </label>
            </div>
          ) : null}
          <details>
            <summary>Advanced Options</summary>
            <div className="stack">
              <label>
                Compatibility Level
                <select value={compatibilityLevel} onChange={event => setCompatibilityLevel(event.target.value)}>
                  <option value="1.3">1.3</option>
                  <option value="1.4">1.4</option>
                  <option value="1.5">1.5</option>
                  <option value="1.6">1.6</option>
                  <option value="1.7">1.7</option>
                  <option value="2.0">2.0</option>
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={colorDownsample}
                  onChange={event => setColorDownsample(event.target.checked)}
                />
                Enable Color Downsample
              </label>
              <label>
                Color Resolution (dpi)
                <input value={colorResolution} onChange={event => setColorResolution(event.target.value)} />
              </label>
              <label>
                Custom Command
                <input
                  type="text"
                  placeholder="gs args (omit 'gs')"
                  value={customCommand}
                  onChange={event => setCustomCommand(event.target.value)}
                />
              </label>
            </div>
          </details>
          <label>
            <input
              type="checkbox"
              checked={showTerminal}
              onChange={event => setShowTerminal(event.target.checked)}
            />
            Show terminal output
          </label>
          <label>
            <input
              type="checkbox"
              checked={showProgress}
              onChange={event => setShowProgress(event.target.checked)}
            />
            Show live progress bar
          </label>
          <label>
            <input
              type="checkbox"
              checked={autoDownload}
              onChange={event => setAutoDownload(event.target.checked)}
            />
            Auto-download result
          </label>
          <div className="toolbar">
            <Button onClick={run} disabled={!opEnabled}>
              {processing ? 'Processing...' : 'Run'}
            </Button>
            <span className="muted">{status}</span>
          </div>
          {showProgress && processing ? <div className="progress-bar" /> : null}
          {resultUrl ? (
            <div>
              <a href={resultUrl} download className="button">
                Download PDF
              </a>
            </div>
          ) : null}
          {showTerminal && terminal.length ? (
            <div className="terminal">
              {terminal.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </ToolLayout>
  );
}

function bytes(size: number) {
  if (size < 1024) return `${size} B`;
  const units = ['KB', 'MB', 'GB'];
  let i = -1;
  let next = size;
  do {
    next /= 1024;
    i += 1;
  } while (next >= 1024 && i < units.length - 1);
  return `${next.toFixed(next < 10 ? 2 : 1)} ${units[i]}`;
}
