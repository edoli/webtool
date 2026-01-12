export type MathContext = {
  mathFunctions: Record<string, (...args: number[]) => number>;
  mathConstants: Record<string, number>;
  mathPredefined: Record<string, number | ((...args: number[]) => number)>;
};

export function createMathContext(useDegree: boolean): MathContext {
  const mathFunctions: Record<string, (...args: number[]) => number> = {
    rad: (deg: number) => deg * Math.PI / 180,
    deg: (rad: number) => rad * 180 / Math.PI,
  };
  const mathConstants: Record<string, number> = {};

  Object.getOwnPropertyNames(Math).forEach(name => {
    const value = (Math as Record<string, unknown>)[name];
    if (typeof value === 'function') {
      mathFunctions[name] = value as (...args: number[]) => number;
    } else if (typeof value === 'number') {
      mathConstants[name] = value;
    }
  });

  const toRad = (deg: number) => deg * Math.PI / 180;
  const toDeg = (rad: number) => rad * 180 / Math.PI;

  const sin = (x: number) => (useDegree ? Math.sin(toRad(x)) : Math.sin(x));
  const cos = (x: number) => (useDegree ? Math.cos(toRad(x)) : Math.cos(x));
  const tan = (x: number) => (useDegree ? Math.tan(toRad(x)) : Math.tan(x));
  const asin = (x: number) => (useDegree ? toDeg(Math.asin(x)) : Math.asin(x));
  const acos = (x: number) => (useDegree ? toDeg(Math.acos(x)) : Math.acos(x));
  const atan = (x: number) => (useDegree ? toDeg(Math.atan(x)) : Math.atan(x));
  const atan2 = (y: number, x: number) => (useDegree ? toDeg(Math.atan2(y, x)) : Math.atan2(y, x));

  Object.assign(mathFunctions, {
    sin,
    cos,
    tan,
    asin,
    acos,
    atan,
    atan2,
  });

  const mathPredefined = {
    ...mathFunctions,
    ...mathConstants,
  };

  return { mathFunctions, mathConstants, mathPredefined };
}

export function extractVariables(formula: string, mathPredefined: MathContext['mathPredefined']): string[] {
  const predefinedNames = Object.keys(mathPredefined);
  const pattern = predefinedNames.length
    ? new RegExp(`(?<!(?:${predefinedNames.join('|')}))\\b(?!r\\d)[a-zA-Z][a-zA-Z0-9_]*\\b`, 'g')
    : /\b(?!r\d)[a-zA-Z][a-zA-Z0-9_]*\b/g;
  const matches = formula.match(pattern) || [];
  const vars = new Set(matches.filter(match => !Object.prototype.hasOwnProperty.call(mathPredefined, match)));
  return Array.from(vars);
}

export function calculateExpression(formula: string, context: Record<string, number | ((...args: number[]) => number)>) {
  try {
    const normalized = formula.replace('×', '*').replace('÷', '/');
    const fn = new Function(...Object.keys(context), `return ${normalized}`);
    return fn(...Object.values(context));
  } catch (error) {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return `Error: ${String(error)}`;
  }
}

export function highlightFormula(
  formula: string,
  mathFunctions: MathContext['mathFunctions'],
  mathConstants: MathContext['mathConstants'],
  mathPredefined: MathContext['mathPredefined'],
  focusedVariable: string | null,
  focusedResult: string | null
) {
  let count = 0;
  const tokens: Array<{ token: string; value: string }> = [];
  let processed = formula;

  const functionNames = Object.keys(mathFunctions);
  if (functionNames.length) {
    const functionRegex = new RegExp(`\\b(${functionNames.join('|')})\\b`, 'g');
    processed = processed.replace(functionRegex, match => {
      const token = `__FUNCTION_${count}__`;
      tokens.push({ token, value: `<span class="highlight-function">${match}</span>` });
      count += 1;
      return token;
    });
  }

  const constantNames = Object.keys(mathConstants);
  if (constantNames.length) {
    const constantRegex = new RegExp(`\\b(${constantNames.join('|')})\\b`, 'g');
    processed = processed.replace(constantRegex, match => {
      const token = `__CONSTANT_${count}__`;
      tokens.push({ token, value: `<span class="highlight-constant">${match}</span>` });
      count += 1;
      return token;
    });
  }

  processed = processed.replace(/\br\d+\b/g, match => {
    const token = `__RESULT_${count}__`;
    tokens.push({ token, value: `<span class="highlight-result">${match}</span>` });
    count += 1;
    return token;
  });

  const predefinedNames = Object.keys(mathPredefined);
  const variableRegex = predefinedNames.length
    ? new RegExp(`(?<!(?:${predefinedNames.join('|')}))\\b(?!r\\d)[a-zA-Z][a-zA-Z0-9]*\\b`, 'g')
    : /\b(?!r\d)[a-zA-Z][a-zA-Z0-9]*\b/g;

  processed = processed.replace(variableRegex, match => {
    if (!Object.prototype.hasOwnProperty.call(mathPredefined, match)) {
      const highlightClass = focusedVariable === match ? 'highlight-variable-focused' : 'highlight-variable';
      return `<span class="${highlightClass}">${match}</span>`;
    }
    return match;
  });

  tokens.forEach(({ token, value }) => {
    processed = processed.replace(token, value);
  });

  if (focusedResult) {
    processed = processed.replace(
      new RegExp(`(<span class=\"highlight-result\">${focusedResult}<\\/span>)`, 'g'),
      `<span class="highlight-result-focused">${focusedResult}</span>`
    );
  }

  return processed;
}

export function getVariableAtCursor(value: string, cursorPos: number) {
  let start = cursorPos;
  let end = cursorPos;

  while (start > 0 && /[a-zA-Z0-9]/.test(value[start - 1])) {
    start -= 1;
  }

  while (end < value.length && /[a-zA-Z0-9]/.test(value[end])) {
    end += 1;
  }

  if (start < end) {
    return value.substring(start, end);
  }

  return null;
}
