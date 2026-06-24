import { loadScriptOnce } from './loadScript';

const MONACO_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min';
const MONACO_LOADER_URL = `${MONACO_BASE}/vs/loader.min.js`;

type MonacoDisposable = {
  dispose: () => void;
};

type MonacoRange = {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
};

type MonacoModel = {
  getValue: () => string;
  getWordUntilPosition: (position: MonacoPosition) => {
    word: string;
    startColumn: number;
    endColumn: number;
  };
};

type MonacoPosition = {
  lineNumber: number;
  column: number;
};

type MonacoEditorInstance = {
  getValue: () => string;
  dispose: () => void;
  addCommand: (keybinding: number, handler: () => void) => string | null;
  layout: () => void;
};

type MonacoCompletionItem = {
  label: string;
  kind: number;
  insertText: string;
  insertTextRules?: number;
  documentation?: string;
  detail?: string;
  range: MonacoRange;
};

type Monaco = {
  KeyMod: {
    CtrlCmd: number;
  };
  KeyCode: {
    Enter: number;
  };
  editor: {
    create: (container: HTMLElement, options: Record<string, unknown>) => MonacoEditorInstance;
    defineTheme: (name: string, theme: Record<string, unknown>) => void;
  };
  languages: {
    CompletionItemKind: {
      Function: number;
      Keyword: number;
      Module: number;
      Variable: number;
    };
    CompletionItemInsertTextRule: {
      InsertAsSnippet: number;
    };
    registerCompletionItemProvider: (
      language: string,
      provider: {
        triggerCharacters?: string[];
        provideCompletionItems: (
          model: MonacoModel,
          position: MonacoPosition,
        ) => { suggestions: MonacoCompletionItem[] };
      },
    ) => MonacoDisposable;
  };
};

type WindowWithMonaco = Window & {
  require?: {
    config: (options: { paths: Record<string, string> }) => void;
    (modules: string[], onLoad: (monaco: Monaco) => void, onError?: (error: unknown) => void): void;
  };
};

type PythonEditorOptions = {
  value: string;
  onRun?: () => void;
  minimap?: boolean;
  isCancelled?: () => boolean;
};

let monacoPromise: Promise<Monaco> | null = null;
let pythonCompletionsRegistered = false;

function loadMonaco() {
  if (monacoPromise) {
    return monacoPromise;
  }

  monacoPromise = loadScriptOnce(MONACO_LOADER_URL).then(
    () =>
      new Promise<Monaco>((resolve, reject) => {
        const amdRequire = (window as unknown as WindowWithMonaco).require;
        if (!amdRequire) {
          reject(new Error('Monaco loader failed to initialize.'));
          return;
        }

        amdRequire.config({ paths: { vs: `${MONACO_BASE}/vs` } });
        amdRequire(['vs/editor/editor.main'], resolve, reject);
      }),
  );

  return monacoPromise;
}

function createSuggestion(
  monaco: Monaco,
  range: MonacoRange,
  label: string,
  insertText: string,
  detail: string,
  documentation: string,
  kind = monaco.languages.CompletionItemKind.Function,
): MonacoCompletionItem {
  return {
    label,
    kind,
    insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    detail,
    documentation,
    range,
  };
}

function createVariableSuggestion(
  monaco: Monaco,
  range: MonacoRange,
  label: string,
  detail: string,
): MonacoCompletionItem {
  return {
    label,
    kind: monaco.languages.CompletionItemKind.Variable,
    insertText: label,
    detail,
    range,
  };
}

function extractLocalPythonNames(code: string) {
  const names = new Map<string, string>();
  const patterns: Array<[RegExp, string]> = [
    [/^\s*([A-Za-z_]\w*)\s*(?::[^=]+)?=\s*[^=]/, 'Local variable'],
    [/^\s*for\s+([A-Za-z_]\w*)\s+in\s+/, 'Loop variable'],
    [/^\s*with\s+.+\s+as\s+([A-Za-z_]\w*)\s*:/, 'Context variable'],
    [/^\s*except\s+.+\s+as\s+([A-Za-z_]\w*)\s*:/, 'Exception variable'],
    [/^\s*def\s+([A-Za-z_]\w*)\s*\(/, 'Function'],
    [/^\s*class\s+([A-Za-z_]\w*)\s*[(:]/, 'Class'],
    [/^\s*import\s+[\w.]+\s+as\s+([A-Za-z_]\w*)/, 'Import alias'],
    [/^\s*from\s+[\w.]+\s+import\s+[\w.]+\s+as\s+([A-Za-z_]\w*)/, 'Import alias'],
  ];

  for (const line of code.split(/\r?\n/)) {
    for (const [pattern, detail] of patterns) {
      const match = pattern.exec(line);
      const name = match?.[1];
      if (name && !names.has(name)) {
        names.set(name, detail);
      }
    }
  }

  return [...names.entries()];
}

function registerPythonCompletions(monaco: Monaco) {
  if (pythonCompletionsRegistered) {
    return;
  }

  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', '(', '[', '_'],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const keywordKind = monaco.languages.CompletionItemKind.Keyword;
      const variableKind = monaco.languages.CompletionItemKind.Variable;
      const moduleKind = monaco.languages.CompletionItemKind.Module;
      const localSuggestions = extractLocalPythonNames(model.getValue()).map(([name, detail]) =>
        createVariableSuggestion(monaco, range, name, detail),
      );

      return {
        suggestions: [
          createSuggestion(monaco, range, 'print', 'print(${1:value})', 'Python builtin', 'Write a value to stdout.'),
          createSuggestion(monaco, range, 'range', 'range(${1:stop})', 'Python builtin', 'Create an integer sequence.'),
          createSuggestion(monaco, range, 'len', 'len(${1:value})', 'Python builtin', 'Return the length of a collection.'),
          createSuggestion(monaco, range, 'enumerate', 'enumerate(${1:items})', 'Python builtin', 'Iterate with indexes.'),
          createSuggestion(monaco, range, 'list comprehension', '[${1:item} for ${1:item} in ${2:items}]', 'Snippet', 'Create a list from an iterable.'),
          createSuggestion(monaco, range, 'for', 'for ${1:item} in ${2:items}:\n    ${0:pass}', 'Snippet', 'Create a for loop.', keywordKind),
          createSuggestion(monaco, range, 'if', 'if ${1:condition}:\n    ${0:pass}', 'Snippet', 'Create an if block.', keywordKind),
          createSuggestion(monaco, range, 'try', 'try:\n    ${1:pass}\nexcept Exception as error:\n    ${0:print(error)}', 'Snippet', 'Handle Python exceptions.', keywordKind),
          createSuggestion(monaco, range, 'import numpy', 'import numpy as np', 'Pyodide package', 'Import NumPy.', moduleKind),
          createSuggestion(monaco, range, 'import pandas', 'import pandas as pd', 'Pyodide package', 'Import pandas.', moduleKind),
          createSuggestion(monaco, range, 'import matplotlib', 'import matplotlib.pyplot as plt', 'Pyodide package', 'Import matplotlib pyplot.', moduleKind),
          createSuggestion(monaco, range, 'np.linspace', 'np.linspace(${1:start}, ${2:stop}, ${3:num})', 'NumPy', 'Create evenly spaced values.'),
          createSuggestion(monaco, range, 'np.array', 'np.array(${1:values})', 'NumPy', 'Create a NumPy array.'),
          createSuggestion(monaco, range, 'plt.figure', 'plt.figure()\n${0}', 'matplotlib', 'Create a new figure.'),
          createSuggestion(monaco, range, 'plt.plot', 'plt.plot(${1:x}, ${2:y})', 'matplotlib', 'Plot x and y values.'),
          createSuggestion(monaco, range, 'plt.imshow', 'plt.imshow(${1:image})', 'matplotlib', 'Display an image array.'),
          createSuggestion(monaco, range, 'cv2.cvtColor', 'cv2.cvtColor(${1:image}, cv2.COLOR_${2:RGB2GRAY})', 'OpenCV', 'Convert image color space.'),
          createSuggestion(monaco, range, 'cv2.GaussianBlur', 'cv2.GaussianBlur(${1:image}, (${2:5}, ${2:5}), ${3:0})', 'OpenCV', 'Blur an image.'),
          createSuggestion(monaco, range, 'image', 'image', 'Image Batch variable', 'Current image as a NumPy array.', variableKind),
          createSuggestion(monaco, range, 'return image', 'image', 'Image Batch result', 'Return a processed image array.', variableKind),
          ...localSuggestions,
        ],
      };
    },
  });

  pythonCompletionsRegistered = true;
}

function definePythonTheme(monaco: Monaco) {
  monaco.editor.defineTheme('webtool-python', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'ffcb6b' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'string', foreground: 'c3e88d' },
      { token: 'comment', foreground: '7f8c98', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': '#161616',
      'editor.foreground': '#d6d2cc',
      'editorLineNumber.foreground': '#6f6a64',
      'editorCursor.foreground': '#f7c945',
      'editor.selectionBackground': '#34495e',
      'editor.lineHighlightBackground': '#202020',
    },
  });
}

export type PythonMonacoEditor = {
  getValue: () => string;
  dispose: () => void;
};

export async function createPythonMonacoEditor(
  container: HTMLElement,
  options: PythonEditorOptions,
): Promise<PythonMonacoEditor | null> {
  const monaco = await loadMonaco();
  registerPythonCompletions(monaco);
  definePythonTheme(monaco);

  if (options.isCancelled?.()) {
    return null;
  }

  const editor = monaco.editor.create(container, {
    value: options.value,
    language: 'python',
    theme: 'webtool-python',
    automaticLayout: true,
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: 14,
    lineHeight: 22,
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: false,
    minimap: { enabled: options.minimap ?? false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    bracketPairColorization: { enabled: true },
    guides: { indentation: true, bracketPairs: true },
    quickSuggestions: { other: true, comments: false, strings: false },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'smart',
    tabCompletion: 'on',
    parameterHints: { enabled: true },
    formatOnPaste: true,
    formatOnType: true,
    padding: { top: 12, bottom: 12 },
  });

  if (options.onRun) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, options.onRun);
  }

  const resizeObserver = new ResizeObserver(() => editor.layout());
  resizeObserver.observe(container);

  return {
    getValue: () => editor.getValue(),
    dispose: () => {
      resizeObserver.disconnect();
      editor.dispose();
    },
  };
}
