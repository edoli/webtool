import { useMemo, useState } from 'react';
import { ToolLayout } from '../../components/ToolLayout';
import { calculateExpression, createMathContext, extractVariables } from '../../utils/formula';

const formulas = {
  data_between: {
    name: '기간 계산기',
    formula: 'boolIncludeStartDate * 1000 * 60 * 60 * 24 - (date1 - date2)',
    variables: {
      boolIncludeStartDate: '초일 산입',
      date1: '시작일',
      date2: '마지막일',
    },
    output: 'date',
  },
  area_of_circle: {
    name: '원의 넓이',
    formula: 'PI * radius * radius',
  },
} as const;

type FormulaKey = keyof typeof formulas;

type VariableInput = {
  name: string;
  label: string;
  type: 'number' | 'date' | 'checkbox' | 'text';
};

export function SpecialCalculator() {
  const [selectedKey, setSelectedKey] = useState<FormulaKey>('data_between');
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const mathContext = useMemo(() => createMathContext(false), []);

  const formula = formulas[selectedKey];

  const inputs = useMemo<VariableInput[]>(() => {
    const extracted = extractVariables(formula.formula, mathContext.mathPredefined);
    const variableInfo = 'variables' in formula ? (formula.variables as Record<string, string>) : undefined;
    return extracted.map(variable => {
      const label = variableInfo?.[variable] ?? variable;
      const type = variable.startsWith('number')
        ? 'number'
        : variable.startsWith('date')
          ? 'date'
          : variable.startsWith('bool')
            ? 'checkbox'
            : 'text';
      return { name: variable, label, type };
    });
  }, [formula, mathContext]);

  const result = useMemo(() => {
    const context: Record<string, number> = {};
    inputs.forEach(input => {
      const rawValue = values[input.name];
      if (input.type === 'date') {
        context[input.name] = rawValue ? new Date(String(rawValue)).getTime() : 0;
      } else if (input.type === 'checkbox') {
        context[input.name] = rawValue ? 1 : 0;
      } else {
        context[input.name] = Number(rawValue) || 0;
      }
    });

    const value = calculateExpression(formula.formula, {
      ...mathContext.mathPredefined,
      ...context,
    });

    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 'Error';
    }

    const output = 'output' in formula ? formula.output : undefined;
    if (output === 'date') {
      return formatDuration(value);
    }

    return value.toString();
  }, [formula, inputs, mathContext, values]);

  return (
    <ToolLayout title="Special Calculator" description="Quick calculators with predefined formulas." badge="Apps">
      <div className="special-calculator">
        <div>
          <label htmlFor="formula-select">수식 선택</label>
          <select
            id="formula-select"
            value={selectedKey}
            onChange={event => {
              const nextKey = event.target.value as FormulaKey;
              setSelectedKey(nextKey);
              setValues({});
            }}
          >
            {Object.entries(formulas).map(([key, item]) => (
              <option key={key} value={key}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="special-fields">
          {inputs.map(input => (
            <div key={input.name} className="special-field">
              <label htmlFor={input.name}>{input.label}</label>
              {input.type === 'checkbox' ? (
                <input
                  id={input.name}
                  type="checkbox"
                  checked={Boolean(values[input.name])}
                  onChange={event =>
                    setValues(prev => ({
                      ...prev,
                      [input.name]: event.target.checked,
                    }))
                  }
                />
              ) : (
                <input
                  id={input.name}
                  type={input.type}
                  value={String(values[input.name] ?? '')}
                  onChange={event =>
                    setValues(prev => ({
                      ...prev,
                      [input.name]: event.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>
        <div className="special-result">결과: {result}</div>
      </div>
    </ToolLayout>
  );
}

function formatDuration(milliseconds: number) {
  let totalDays = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  totalDays %= 365;

  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;

  return `${years}년 ${months}개월 ${days}일, 총 ${totalDays}일`;
}
