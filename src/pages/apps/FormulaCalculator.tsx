import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { Toggle } from '../../components/Toggle';
import { ToolLayout } from '../../components/ToolLayout';
import {
  calculateExpression,
  createMathContext,
  extractVariables,
  getVariableAtCursor,
  highlightFormula,
} from '../../utils/formula';

type FormulaItem = {
  id: string;
  template: string;
};

type FormulaResult = {
  value: number | null;
  error?: string;
};

const createFormula = (template = ''): FormulaItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  template,
});

export function FormulaCalculator() {
  const [formulas, setFormulas] = useState<FormulaItem[]>([createFormula('')]);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [useDegree, setUseDegree] = useState(false);
  const [focusedVariable, setFocusedVariable] = useState<string | null>(null);
  const [cursorVariable, setCursorVariable] = useState<string | null>(null);
  const [focusedResult, setFocusedResult] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const mathContext = useMemo(() => createMathContext(useDegree), [useDegree]);

  const variablesInUse = useMemo(() => {
    const vars = formulas.flatMap(formula => extractVariables(formula.template, mathContext.mathPredefined));
    return Array.from(new Set(vars));
  }, [formulas, mathContext]);

  useEffect(() => {
    setVariables(prev => {
      const next = { ...prev };
      variablesInUse.forEach(name => {
        if (!(name in next)) {
          next[name] = '1';
        }
      });
      Object.keys(next).forEach(key => {
        if (!variablesInUse.includes(key)) {
          delete next[key];
        }
      });
      return next;
    });
  }, [variablesInUse]);

  const { results, errors } = useMemo(() => {
    const nextResults: FormulaResult[] = [];
    const nextErrors: string[] = [];
    const tmpContext: Record<string, number> = {};

    formulas.forEach((formula, index) => {
      const vars = extractVariables(formula.template, mathContext.mathPredefined);
      const localVars: Record<string, number> = {};
      vars.forEach(name => {
        localVars[name] = Number(variables[name] ?? 0);
      });

      const context = {
        ...mathContext.mathPredefined,
        ...tmpContext,
        ...localVars,
      };

      const value = calculateExpression(formula.template, context);

      if (typeof value === 'number' && !Number.isNaN(value)) {
        tmpContext[`r${index + 1}`] = value;
        nextResults.push({ value });
      } else if (typeof value === 'string' && value.startsWith('Error')) {
        nextErrors.push(value);
        nextResults.push({ value: null, error: value });
      } else {
        nextResults.push({ value: null });
      }
    });

    return { results: nextResults, errors: nextErrors };
  }, [formulas, mathContext, variables]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const formulaParam = params.get('f');
    const variablesParam = params.get('v');
    const optionParam = params.get('o');

    if (formulaParam) {
      try {
        const templates = atob(decodeURIComponent(formulaParam)).split(',');
        if (templates.length) {
          setFormulas(templates.map(template => createFormula(template)));
        }
      } catch {
        // ignore
      }
    }

    if (variablesParam) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(variablesParam)));
        if (decoded && typeof decoded === 'object') {
          setVariables(decoded as Record<string, string>);
        }
      } catch {
        // ignore
      }
    }

    if (optionParam) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(optionParam)));
        if (decoded && typeof decoded.useDegree === 'boolean') {
          setUseDegree(decoded.useDegree);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const encodedFormula = encodeURIComponent(btoa(formulas.map(formula => formula.template).join(',')));
    const encodedVariables = encodeURIComponent(btoa(JSON.stringify(variables)));
    const encodedOptions = encodeURIComponent(btoa(JSON.stringify({ useDegree })));
    const url = `${window.location.pathname}?f=${encodedFormula}&v=${encodedVariables}&o=${encodedOptions}`;
    window.history.replaceState(null, '', url);
  }, [formulas, useDegree, variables]);

  const updateFormula = useCallback((id: string, template: string) => {
    setFormulas(prev => prev.map(formula => (formula.id === id ? { ...formula, template } : formula)));
  }, []);

  const addFormula = useCallback(() => {
    setFormulas(prev => [...prev, createFormula('')]);
  }, []);

  const removeFormula = useCallback(() => {
    setFormulas(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const handleCursorUpdate = useCallback(
    (value: string, cursorPos: number) => {
      const variable = getVariableAtCursor(value, cursorPos);
      if (variable !== cursorVariable) {
        setCursorVariable(variable);
      }
    },
    [cursorVariable]
  );

  const functionsList = Object.keys(mathContext.mathFunctions).join(', ');
  const constantsList = Object.keys(mathContext.mathConstants).join(', ');

  return (
    <ToolLayout
      badge="Apps"
    >
      <div className="formula-panel">
        <div className="formula-options">
          <Toggle
            checked={useDegree}
            onChange={event => setUseDegree(event.target.checked)}
            label="Use degree (instead of radian)"
          />
        </div>
        <div className="formula-list">
          {formulas.map((formula, index) => {
            const result = results[index];
            const resultLabel = `r${index + 1}`;
            return (
              <div key={formula.id} className="formula-block" data-index={resultLabel}>
                <div className="formula-input-wrapper">
                  <div
                    className="formula-display"
                    dangerouslySetInnerHTML={{
                      __html: highlightFormula(
                        formula.template,
                        mathContext.mathFunctions,
                        mathContext.mathConstants,
                        mathContext.mathPredefined,
                        focusedVariable,
                        focusedResult === resultLabel ? resultLabel : null
                      ),
                    }}
                  />
                  <input
                    ref={el => {
                      inputRefs.current[formula.id] = el;
                    }}
                    className="formula-input"
                    value={formula.template}
                    onChange={event => updateFormula(formula.id, event.target.value)}
                    onFocus={() => setFocusedResult(resultLabel)}
                    onBlur={() => {
                      setFocusedResult(null);
                      setCursorVariable(null);
                    }}
                    onSelect={event => {
                      const target = event.currentTarget;
                      handleCursorUpdate(target.value, target.selectionStart || 0);
                    }}
                    onClick={event => {
                      const target = event.currentTarget;
                      handleCursorUpdate(target.value, target.selectionStart || 0);
                    }}
                    onKeyUp={event => {
                      const target = event.currentTarget;
                      handleCursorUpdate(target.value, target.selectionStart || 0);
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const next = formulas[index + 1];
                        if (next) {
                          inputRefs.current[next.id]?.focus();
                        } else {
                          addFormula();
                        }
                      }
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        const next = formulas[index + 1];
                        if (next) {
                          inputRefs.current[next.id]?.focus();
                        }
                      }
                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        const prev = formulas[index - 1];
                        if (prev) {
                          inputRefs.current[prev.id]?.focus();
                        }
                      }
                    }}
                  />
                </div>
                <div>{result?.value !== null && result?.value !== undefined ? result.value.toFixed(4) : ''}</div>
              </div>
            );
          })}
        </div>
        <div className="formula-actions">
          <Button className="icon-button" variant="soft" onClick={addFormula} aria-label="Add formula">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </Button>
          <Button
            className="icon-button"
            variant="ghost"
            onClick={removeFormula}
            aria-label="Remove formula"
            disabled={formulas.length === 1}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          </Button>
        </div>
        {errors.length ? <pre className="error-box">{errors.join('\n')}</pre> : null}
        <div className="variable-grid">
          {variablesInUse.map(name => (
            <div key={name} className="variable-item">
              <span className={`variable-label ${cursorVariable === name ? 'focused' : ''}`}>{name}</span>
              <input
                type="number"
                value={variables[name] ?? ''}
                className={`variable-input ${cursorVariable === name ? 'focused' : ''}`}
                onFocus={() => setFocusedVariable(name)}
                onBlur={() => setFocusedVariable(null)}
                onChange={event =>
                  setVariables(prev => ({
                    ...prev,
                    [name]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>
        <div className="formula-info">
          <p>Available functions: {functionsList}</p>
          <p>Available constants: {constantsList}</p>
        </div>
      </div>
    </ToolLayout>
  );
}
