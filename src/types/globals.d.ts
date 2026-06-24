export {};

declare global {
  interface Window {
    loadPyodide?: (options?: Record<string, unknown>) => Promise<any>;
    pyodide?: any;
    MathJax?: {
      typesetPromise: (elements?: Element[]) => Promise<void>;
    };
    GPU?: any;
  }
}
