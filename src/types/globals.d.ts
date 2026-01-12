export {};

declare global {
  interface Window {
    CodeMirror?: any;
    loadPyodide?: (options?: Record<string, unknown>) => Promise<any>;
    pyodide?: any;
    MathJax?: {
      typesetPromise: (elements?: Element[]) => Promise<void>;
    };
    GPU?: any;
  }
}
