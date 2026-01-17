import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { FullToolLayout } from '../../components/FullToolLayout';
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

export function PythonEditor() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorRef = useRef<CodeMirrorEditor | null>(null);
  const pyodideRef = useRef<PyodideInstance | null>(null);
  const [status, setStatus] = useState('Loading editor...');
  const [output, setOutput] = useState('');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      images.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);

  const runPython = useCallback(async () => {
    const pyodide = pyodideRef.current;
    const editor = editorRef.current;
    if (!pyodide || !editor) {
      setStatus('Python environment not ready yet.');
      return;
    }

    const code = editor.getValue();
    setStatus('Running...');
    setOutput('');
    setImages(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
    });

    try {
      pyodide.globals.clear();

      await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = sys.stderr = output_buffer = StringIO()
      `);

      const result = await pyodide.runPythonAsync(code);
      const printedResult = await pyodide.runPythonAsync('output_buffer.getvalue()');
      let printed = typeof printedResult === 'string' ? printedResult : String(printedResult ?? '');
      if (result !== undefined) {
        printed += String(result);
      }
      setOutput(String(printed));

      const figCountResult = await pyodide.runPythonAsync(`
import sys
fig_count = 0
if "matplotlib" in sys.modules:
    import matplotlib.pyplot as plt
    fig_nums = plt.get_fignums()
    for i, fig_num in enumerate(fig_nums):
        plt.figure(fig_num)
        plt.savefig(f"/plot_{i}.png")
    fig_count = len(fig_nums)
    plt.close("all")
fig_count
      `);
      const figCount = typeof figCountResult === 'number' ? figCountResult : Number(figCountResult);

      if (Number.isFinite(figCount) && figCount > 0) {
        const urls: string[] = [];
        for (let index = 0; index < figCount; index += 1) {
          const data = pyodide.FS.readFile(`/plot_${index}.png`, { encoding: 'binary' });
          const blob = new Blob([data], { type: 'image/png' });
          urls.push(URL.createObjectURL(blob));
        }
        setImages(urls);
      }

      setStatus('Ready');
    } catch (error) {
      setOutput(`Error: ${String(error)}`);
      setStatus('Failed to run code.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
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
            'Ctrl-Enter': () => runPython(),
          });
        }

        setStatus('Loading Pyodide...');
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
        await pyodide.loadPackage(['numpy', 'matplotlib', 'pandas', 'micropip']);
        pyodideRef.current = pyodide;
        setStatus('Ready');
      } catch (error) {
        setStatus('Failed to initialize editor.');
        console.error(error);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (editorRef.current) {
        editorRef.current.toTextArea();
        editorRef.current = null;
      }
    };
  }, [runPython]);

  return (
    <FullToolLayout badge="Apps">
      <div className="code-layout python-editor">
        <div className="code-panel code-panel--editor">
          <div className="code-editor">
            <textarea
              ref={textareaRef}
              defaultValue={`import numpy as np\nimport matplotlib.pyplot as plt\n\nx = np.linspace(0, 10, 100)\ny = np.sin(x)\n\nprint(f'x: {x}')\nprint(f'y: {y}')\n\nplt.figure()\nplt.plot(x, y)\nplt.title("Sine Wave")\nplt.xlabel("X")\nplt.ylabel("Y")\nplt.grid(True)`}
            />
          </div>
          <div className="toolbar">
            <Button onClick={runPython}>실행 (Ctrl + Enter)</Button>
            <span className="muted">{status}</span>
          </div>
        </div>
        <div className="code-panel">
          <div className="muted">출력 결과:</div>
          <div className="output-box">{output}</div>
          <div className="muted">그래프 출력:</div>
          <div className="image-grid">
            {images.length === 0 ? <div className="message-box">그래프가 여기에 표시됩니다.</div> : null}
            {images.map(url => (
              <img key={url} src={url} alt="Plot" className="fill-parent-width" />
            ))}
          </div>
        </div>
      </div>
    </FullToolLayout>
  );
}
