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
  getLineContent: (lineNumber: number) => string;
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
  getModel: () => MonacoModel | null;
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

export type PythonCompletionKind = 'function' | 'keyword' | 'module' | 'variable';

export type PythonCompletionSpec = {
  label: string;
  insertText: string;
  detail: string;
  documentation: string;
  kind?: PythonCompletionKind;
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
        ) => { suggestions: MonacoCompletionItem[] } | Promise<{ suggestions: MonacoCompletionItem[] }>;
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
  completions?: PythonCompletionSpec[];
};

const PYTHON_COMPLETIONS: PythonCompletionSpec[] = [
  {
    label: 'print',
    insertText: 'print(${1:value})',
    detail: 'Python builtin',
    documentation: 'Write a value to stdout.',
  },
  {
    label: 'range',
    insertText: 'range(${1:stop})',
    detail: 'Python builtin',
    documentation: 'Create an integer sequence.',
  },
  {
    label: 'len',
    insertText: 'len(${1:value})',
    detail: 'Python builtin',
    documentation: 'Return the length of a collection.',
  },
  {
    label: 'enumerate',
    insertText: 'enumerate(${1:items})',
    detail: 'Python builtin',
    documentation: 'Iterate with indexes.',
  },
  {
    label: 'list comprehension',
    insertText: '[${1:item} for ${1:item} in ${2:items}]',
    detail: 'Snippet',
    documentation: 'Create a list from an iterable.',
  },
  {
    label: 'for',
    insertText: 'for ${1:item} in ${2:items}:\n    ${0:pass}',
    detail: 'Snippet',
    documentation: 'Create a for loop.',
    kind: 'keyword',
  },
  {
    label: 'if',
    insertText: 'if ${1:condition}:\n    ${0:pass}',
    detail: 'Snippet',
    documentation: 'Create an if block.',
    kind: 'keyword',
  },
  {
    label: 'try',
    insertText: 'try:\n    ${1:pass}\nexcept Exception as error:\n    ${0:print(error)}',
    detail: 'Snippet',
    documentation: 'Handle Python exceptions.',
    kind: 'keyword',
  },
  {
    label: 'import numpy',
    insertText: 'import numpy as np',
    detail: 'Pyodide package',
    documentation: 'Import NumPy.',
    kind: 'module',
  },
  {
    label: 'import pandas',
    insertText: 'import pandas as pd',
    detail: 'Pyodide package',
    documentation: 'Import pandas.',
    kind: 'module',
  },
  {
    label: 'import matplotlib',
    insertText: 'import matplotlib.pyplot as plt',
    detail: 'Pyodide package',
    documentation: 'Import matplotlib pyplot.',
    kind: 'module',
  },
  {
    label: 'import cv2',
    insertText: 'import cv2',
    detail: 'Pyodide package',
    documentation: 'Import OpenCV.',
    kind: 'module',
  },
];

let monacoPromise: Promise<Monaco> | null = null;
let pythonCompletionsRegistered = false;
const customCompletionsByModel = new WeakMap<MonacoModel, PythonCompletionSpec[]>();
let moduleCompletionManifestPromise: Promise<Record<string, string>> | null = null;
const moduleCompletionCache = new Map<string, Promise<PythonCompletionSpec[]>>();

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
  completion: PythonCompletionSpec,
  alias?: string,
): MonacoCompletionItem {
  return {
    label: completion.label,
    kind: getCompletionKind(monaco, completion.kind),
    insertText: alias ? completion.insertText.split('{alias}').join(alias) : completion.insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    detail: completion.detail,
    documentation: completion.documentation,
    range,
  };
}

function getCompletionKind(monaco: Monaco, kind: PythonCompletionKind = 'function') {
  const kinds = monaco.languages.CompletionItemKind;
  switch (kind) {
    case 'keyword':
      return kinds.Keyword;
    case 'module':
      return kinds.Module;
    case 'variable':
      return kinds.Variable;
    case 'function':
    default:
      return kinds.Function;
  }
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

function extractImportedModules(code: string) {
  const aliases = new Map<string, string>();
  const supportedModules = new Set(['cv2', 'numpy', 'matplotlib.pyplot', 'pandas']);

  for (const line of code.split(/\r?\n/)) {
    const importMatch = /^\s*import\s+([\w.]+)(?:\s+as\s+([A-Za-z_]\w*))?/.exec(line);
    if (importMatch) {
      const moduleName = importMatch[1];
      if (moduleName && supportedModules.has(moduleName)) {
        const alias = importMatch[2] ?? moduleName;
        aliases.set(alias, moduleName);
      }
      continue;
    }

    const fromImportMatch = /^\s*from\s+([\w.]+)\s+import\s+([A-Za-z_]\w*)(?:\s+as\s+([A-Za-z_]\w*))?/.exec(line);
    if (fromImportMatch) {
      const parentModule = fromImportMatch[1];
      const importedName = fromImportMatch[2];
      if (!parentModule || !importedName) {
        continue;
      }
      const alias = fromImportMatch[3] ?? importedName;
      const moduleName = `${parentModule}.${importedName}`;
      if (supportedModules.has(moduleName)) {
        aliases.set(alias, moduleName);
      }
    }
  }

  return aliases;
}

function getMemberAccessAlias(model: MonacoModel, position: MonacoPosition) {
  const linePrefix = model.getLineContent(position.lineNumber).slice(0, Math.max(0, position.column - 1));
  return /([A-Za-z_]\w*)\.$/.exec(linePrefix)?.[1] ?? null;
}

function loadModuleCompletionManifest() {
  if (!moduleCompletionManifestPromise) {
    moduleCompletionManifestPromise = fetch('/python-completions/manifest.json').then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load Python completion manifest: ${response.status}`);
      }
      return response.json() as Promise<Record<string, string>>;
    });
  }

  return moduleCompletionManifestPromise;
}

async function loadModuleCompletions(moduleName: string) {
  if (!moduleCompletionCache.has(moduleName)) {
    moduleCompletionCache.set(
      moduleName,
      loadModuleCompletionManifest().then(async manifest => {
        const fileName = manifest[moduleName];
        if (!fileName) {
          return [];
        }

        const response = await fetch(`/python-completions/${fileName}`);
        if (!response.ok) {
          throw new Error(`Failed to load Python completions for ${moduleName}: ${response.status}`);
        }

        return response.json() as Promise<PythonCompletionSpec[]>;
      }),
    );
  }

  return moduleCompletionCache.get(moduleName) as Promise<PythonCompletionSpec[]>;
}

function registerPythonCompletions(monaco: Monaco) {
  if (pythonCompletionsRegistered) {
    return;
  }

  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', '(', '[', '_'],
    provideCompletionItems: async (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const memberAlias = getMemberAccessAlias(model, position);
      const importedModules = extractImportedModules(model.getValue());

      if (memberAlias) {
        const moduleName = importedModules.get(memberAlias);
        if (moduleName) {
          const moduleCompletions = await loadModuleCompletions(moduleName).catch(error => {
            console.warn(error);
            return [];
          });
          return {
            suggestions: moduleCompletions.map(completion =>
              createSuggestion(monaco, range, completion, memberAlias),
            ),
          };
        }
      }

      const localSuggestions = extractLocalPythonNames(model.getValue()).map(([name, detail]) =>
        createVariableSuggestion(monaco, range, name, detail),
      );
      const modelCompletions = customCompletionsByModel.get(model) ?? [];
      const configuredCompletions = [...PYTHON_COMPLETIONS, ...modelCompletions];

      return {
        suggestions: [
          ...configuredCompletions.map(completion => createSuggestion(monaco, range, completion)),
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

  const model = editor.getModel();
  if (model && options.completions?.length) {
    customCompletionsByModel.set(model, options.completions);
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
