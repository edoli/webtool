import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import BasePage from './BasePage';

interface Variables {
  [key: string]: string;
}

// Math 함수들을 전역 스코프에 매핑
const mathFunctions: { [key: string]: any } = {
  rad: (deg: number) => deg * Math.PI / 180.0,
  deg: (rad: number) => rad * 180 / Math.PI,
};

// Get all functions in Math
const mathFunctionNames = Object.getOwnPropertyNames(Math);

mathFunctionNames.forEach((name: string) => {
  const value = (Math as any)[name];
  mathFunctions[name] = value;
});




const FormulaCalculator = () => {
  BasePage({ title: "Formula Calculator" });

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
      const context = {
        ...mathFunctions,
        ...Object.fromEntries(
          Object.entries(variables).map(([key, value]) => [key, Number(value)])
        )
      };

      const formula = formulaTemplate;

      const calculate = new Function(...Object.keys(context), `return ${formula}`);
      
      // 계산 실행
      const result = calculate(...Object.values(context));
      return typeof result === 'number' ? result.toFixed(4) : result;
    } catch (error) {
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
                  <span className='pr-4 leading-9 text-lg'>{name} :</span>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleVariableChange(name, e.target.value)}
                    className="w-auto flex-1"
                  />
                </div>
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