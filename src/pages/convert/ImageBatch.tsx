import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { DropZone } from '../../components/DropZone';
import { Toggle } from '../../components/Toggle';
import { ToolLayout } from '../../components/ToolLayout';
import { loadScriptOnce } from '../../utils/loadScript';
import { loadStyleOnce } from '../../utils/loadStyle';

const CODEMIRROR_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5';

type CodeMirrorEditor = {
  getValue: () => string;
  setOption: (key: string, value: unknown) => void;
  toTextArea: () => void;
};
type CodeMirrorGlobal = {
  fromTextArea: (textarea: HTMLTextAreaElement, options: Record<string, unknown>) => CodeMirrorEditor;
};
type PyodideGlobals = {
  clear: () => void;
  set: (key: string, value: unknown) => void;
  get: (key: string) => unknown;
};
type PyodideInstance = {
  loadPackage: (packages: string[]) => Promise<void>;
  loadPackagesFromImports: (code: string) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: PyodideGlobals;
  FS: { readFile: (path: string, options: { encoding: 'binary' }) => Uint8Array };
};
type LoadPyodide = () => Promise<PyodideInstance>;
type WindowWithPyodide = Window & {
  CodeMirror?: CodeMirrorGlobal;
  loadPyodide?: LoadPyodide;
};

type PreviewItem = {
  id: string;
  name: string;
  url: string;
};

export function ImageBatch() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorRef = useRef<CodeMirrorEditor | null>(null);
  const pyodideRef = useRef<PyodideInstance | null>(null);
  const runPythonRef = useRef<() => void>(() => {});
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState('');
  const [autoDownload, setAutoDownload] = useState(false);
  const [logs, setLogs] = useState('');
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  useEffect(() => {
    return () => {
      previews.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items ? Array.from(event.clipboardData.items) : [];
      let added = false;
      for (const item of items) {
        if (item.kind === 'file') {
          const blob = item.getAsFile();
          if (blob && blob.type.startsWith('image/')) {
            const file = new File([blob], blob.name || `clipboard-image-${Date.now()}.png`, { type: blob.type });
            setFiles(prev => [...prev, file]);
            added = true;
          }
        } else if (item.kind === 'string' && item.type === 'text/plain') {
          item.getAsString(text => {
            if (text.startsWith('data:image/')) {
              try {
                const parts = text.split(',');
                if (parts.length < 2) {
                  return;
                }
                const meta = parts[0];
                const data = parts[1];
                if (!meta || !data) {
                  return;
                }
                const mime = /:(.*?);/.exec(meta)?.[1] ?? 'image/png';
                const bstr = atob(data);
                const u8arr = new Uint8Array(bstr.length);
                for (let i = 0; i < bstr.length; i += 1) {
                  u8arr[i] = bstr.charCodeAt(i);
                }
                const blob = new Blob([u8arr], { type: mime });
                const file = new File([blob], `clipboard-image-${Date.now()}.png`, { type: mime });
                setFiles(prev => [...prev, file]);
                added = true;
              } catch (error) {
                console.warn('Clipboard image conversion failed', error);
              }
            }
          });
        }
      }

      if (added) {
        setStatus('Image pasted from clipboard');
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFiles = useCallback((fileList: FileList) => {
    setFiles(prev => [...prev, ...Array.from(fileList)]);
  }, []);

  const runPython = useCallback(async () => {
    const pyodide = pyodideRef.current;
    const editor = editorRef.current;
    if (!pyodide || !editor) {
      setStatus('Python environment not ready yet.');
      return;
    }
    if (files.length === 0) {
      setStatus('No files to process. Please add files first.');
      return;
    }

    const code = editor.getValue();
    if (!code.trim()) {
      setStatus('Please enter Python code to run.');
      return;
    }

    setStatus('Processing...');
    setLogs('');
    setPreviews(prev => {
      prev.forEach(item => URL.revokeObjectURL(item.url));
      return [];
    });

    let outputLog = '';

    pyodide.globals.set('_console_output', '');
    await pyodide.runPythonAsync(`
import sys
class StdoutCatcher:
    def write(self, text):
        global _console_output
        _console_output += text
    def flush(self):
        pass
sys.stdout = StdoutCatcher()
    `);

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (!file) {
        continue;
      }
      setStatus(`Processing ${i + 1}/${files.length}: ${file.name}`);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        pyodide.globals.set('file_bytes', uint8Array);

        await pyodide.runPythonAsync(`
file_bytes = bytes(file_bytes)

import numpy as np
import cv2
import io
import base64

is_heif = False
if file_bytes[4:8] == b'ftyp':
    brand = file_bytes[8:12].decode(errors="ignore")
    if brand in ("heic", "heif", "mif1", "msf1", "avif", "avis"):
        is_heif = True

if is_heif:
    import micropip
    await micropip.install("pyheif")
    import pyheif
    heif_file = pyheif.read(file_bytes)
    stride = heif_file.stride
    image = np.frombuffer(heif_file.data, dtype=np.uint8).reshape((heif_file.size[1], stride))
    image = image[:, :heif_file.size[0] * 3].reshape((heif_file.size[1], heif_file.size[0], -1))
else:
    nparr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(nparr, -1)
    if image.ndim == 3:
        if image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_BGRA2RGBA)
        `);

    const codeResult = await pyodide.runPythonAsync(code);
    const consoleOutput = pyodide.globals.get('_console_output');
    if (typeof consoleOutput === 'string') {
      outputLog += consoleOutput;
    }
    pyodide.globals.set('_console_output', '');

    if (codeResult !== undefined) {
      pyodide.globals.set('direct_result', codeResult);
          await pyodide.runPythonAsync(`
import numpy as np
import cv2
import io
import base64

is_array = isinstance(direct_result, np.ndarray)
result_b64 = None

if is_array:
    if direct_result.dtype != np.uint8:
        np.clip(direct_result, 0, 255, out=direct_result)
        direct_result = direct_result.astype(np.uint8)
    if direct_result.ndim == 3:
        if direct_result.shape[2] == 3:
            direct_result = cv2.cvtColor(direct_result, cv2.COLOR_RGB2BGR)
        elif direct_result.shape[2] == 4:
            direct_result = cv2.cvtColor(direct_result, cv2.COLOR_RGBA2BGRA)
    try:
        _, buffer = cv2.imencode('.png', direct_result)
        img_base64_str = base64.b64encode(buffer).decode('utf-8')
        result_b64 = f"data:image/png;base64,{img_base64_str}"
    except Exception as e:
        print(f"Error converting result to image: {str(e)}")
else:
    print(f"Result is not a numpy array: {type(direct_result)}")
          `);

          const resultB64 = pyodide.globals.get('result_b64');
          const isArray = pyodide.globals.get('is_array');

          if (typeof resultB64 === 'string' && resultB64) {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            setPreviews(prev => [
              ...prev,
              {
                id,
                name: file.name,
                url: resultB64,
              },
            ]);
            if (autoDownload) {
              const link = document.createElement('a');
              link.href = resultB64;
              link.download = `processed_${file.name.split('.')[0]}.png`;
              link.click();
            }
          } else if (isArray === true) {
            outputLog += `\nCouldn't render numpy array as image. Check the shape and dtype.\n`;
          } else {
            outputLog += `\nResult: ${String(codeResult)}\n`;
          }
        }
      } catch (error) {
        outputLog += `\nError processing ${file.name}: ${error}\n`;
      }
    }

    setLogs(outputLog);
    setStatus('Processing complete');
  }, [autoDownload, files]);

  useEffect(() => {
    runPythonRef.current = runPython;
  }, [runPython]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await loadStyleOnce(`${CODEMIRROR_BASE}/codemirror.min.css`);
      await loadStyleOnce(`${CODEMIRROR_BASE}/theme/material-palenight.min.css`);
      await loadScriptOnce(`${CODEMIRROR_BASE}/codemirror.min.js`);
      await loadScriptOnce(`${CODEMIRROR_BASE}/mode/python/python.min.js`);
      await loadScriptOnce(`${CODEMIRROR_BASE}/addon/edit/matchbrackets.min.js`);

      if (cancelled) {
        return;
      }

      const codeMirror = (window as WindowWithPyodide).CodeMirror;
      if (textareaRef.current && codeMirror && !editorRef.current) {
        editorRef.current = codeMirror.fromTextArea(textareaRef.current, {
          mode: 'python',
          lineNumbers: true,
          matchBrackets: true,
          indentUnit: 4,
          theme: 'material-palenight',
        });
        editorRef.current.setOption('extraKeys', {
          'Ctrl-Enter': () => runPythonRef.current(),
        });
      }

      setStatus('Loading Python environment...');
      await loadScriptOnce('https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.js');
      if (cancelled) {
        return;
      }
      const loadPyodide = (window as WindowWithPyodide).loadPyodide;
      if (!loadPyodide) {
        throw new Error('Pyodide failed to load.');
      }
      const pyodide = await loadPyodide();
      if (cancelled) {
        return;
      }
      await pyodide.loadPackagesFromImports(`
import numpy as np
import cv2
import io
import base64
import micropip
      `);
      pyodideRef.current = pyodide;
      setStatus('Python environment ready');
    };

    init().catch(error => {
      console.error(error);
      setStatus('Failed to initialize Python.');
    });
    return () => {
      cancelled = true;
      if (editorRef.current) {
        editorRef.current.toTextArea();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <ToolLayout title="Image Batch Process" description="Run Python scripts on batches of images." badge="Converter">
      <div className="stack">
        <Toggle
          checked={autoDownload}
          onChange={event => setAutoDownload(event.target.checked)}
          label="Automatically download processed files"
        />
        <DropZone
          label="Drag and drop images here, paste from clipboard, or click to select files"
          hint="Tip: Try Ctrl+V to paste an image from your clipboard."
          accept="image/*"
          multiple
          onFiles={handleFiles}
        />
        <div className="message-box">파이썬 코드로 이미지 처리를 할 수 있습니다. (입력 이미지: image 변수 사용)</div>
        <textarea ref={textareaRef} defaultValue="image" />
        <div className="toolbar">
          <Button onClick={runPython}>Run Script (Ctrl+Enter)</Button>
          <span className="muted">{status}</span>
        </div>
        {files.length ? (
          <div className="file-list">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="file-row">
                <span>{file.name}</span>
                <span className="meta">{Math.round(file.size / 1024)} KB</span>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : null}
        {logs ? <div className="output-box">{logs}</div> : null}
        <div className="preview-grid">
          {previews.map(item => (
            <div key={item.id} className="file-item">
              <div className="file-info">
                <div className="file-name">{item.name}</div>
                <a href={item.url} download={`processed_${item.name}`} className="button">
                  Download
                </a>
              </div>
              <img src={item.url} alt={item.name} className="fill-parent-width" />
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
