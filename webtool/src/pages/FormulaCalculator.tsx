import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Variables {
  [key: string]: string;
}

// Math 함수들을 전역 스코프에 매핑
const mathFunctions = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  abs: Math.abs,
  sqrt: Math.sqrt,
  exp: Math.exp,
  log: Math.log,
  log10: Math.log10,
  pow: Math.pow,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  PI: Math.PI,
  E: Math.E
};

const FormulaCalculator = () => {
  const [formulaTemplate, setFormulaTemplate] = useState('sin(x) + cos(y)');
  const [variables, setVariables] = useState<Variables>({});

  const extractVariables = (formula: string) => {
    // 함수 이름을 제외한 알파벳 변수만 추출
    const functionNames = Object.keys(mathFunctions).join('|');
    const regex = new RegExp(`(?<!(?:${functionNames}))\\b[a-zA-Z]\\b`, 'g');
    const vars = new Set(formula.match(regex) || []);
    return Array.from(vars);
  };

  useEffect(() => {
    const varsInFormula = extractVariables(formulaTemplate);
    const newVariables: Variables = {};
    
    varsInFormula.forEach(variable => {
      newVariables[variable] = variables[variable] || "1";
    });

    setVariables(newVariables);
  }, [formulaTemplate]);

  const calculateResult = () => {
    try {
      // Math 함수들을 전역 스코프에 추가
      const context = {
        ...mathFunctions,
        ...Object.fromEntries(
          Object.entries(variables).map(([key, value]) => [key, Number(value)])
        )
      };

      // Function 생성자를 사용하여 동적으로 함수 생성
      const formula = formulaTemplate
        .replace(/([a-zA-Z_][a-zA-Z0-9_]*)/g, (match) => {
          return context[match] !== undefined ? String(context[match]) : match;
        });

      // 수식 계산을 위한 함수 생성
      const calculate = new Function(...Object.keys(context), `return ${formula}`);
      
      // 계산 실행
      const result = calculate(...Object.values(context));
      return typeof result === 'number' ? result.toFixed(4) : result;
    } catch (error) {
      console.error('Error calculating formula:', error);
      return 'Error: ' + (error instanceof Error ? error.message : String(error));
    }
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl p-6">
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">수식 입력</label>
            <Input
              value={formulaTemplate}
              onChange={(e) => setFormulaTemplate(e.target.value)}
              placeholder="예: sin(x) + cos(y)"
              className="font-mono"
            />
          </div>
          
          <div className="flex items-center justify-between text-xl font-semibold bg-gray-100 p-4 rounded-lg">
            <span>{formulaTemplate}</span>
            <span>= {calculateResult()}</span>
          </div>
          
          <div className="space-y-4">
            {Object.entries(variables).sort().map(([name, value]) => (
              <div key={name} className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">
                    {name} = {value}
                  </label>
                </div>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleVariableChange(name, e.target.value)}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-500">
            <p>사용 가능한 함수들:</p>
            <p className="font-mono">
              {Object.keys(mathFunctions).join(', ')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormulaCalculator;