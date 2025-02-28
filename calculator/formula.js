// Get all functions and constants in Math
const mathFunctions = {
    rad: (deg) => deg * Math.PI / 180.0,
    deg: (rad) => rad * 180 / Math.PI,
};

const mathConstants = {};

Object.getOwnPropertyNames(Math).forEach(name => {
    if (typeof Math[name] === 'function') {
        mathFunctions[name] = Math[name];
    } else {
        mathConstants[name] = Math[name];
    }
});

const mathPredefined = { ...mathFunctions, ...mathConstants };

// 변수 추출 함수
function extractVariables(formula) {
    const predefinedNames = Object.keys(mathPredefined).join('|');
    const variableRegex = new RegExp(`(?<!(?:${predefinedNames}))\\b(?!r\\d)[a-zA-Z][a-zA-Z0-9_]*\\b`, 'g');
    const matches = formula.match(variableRegex) || [];
    // 함수명이나 상수명과 겹치지 않는 것만 변수로 추출
    const vars = new Set(matches.filter(match => !mathPredefined.hasOwnProperty(match)));
    return Array.from(vars);
}

// 결과 계산 함수
function calculateResult(formula, variables, tmpContext) {
    try {
        const context = {
            ...mathPredefined,
            ...tmpContext,
            ...Object.fromEntries(
                Object.entries(variables).map(([key, value]) => [key, Number(value)])
            )
        };

        const formulaT = formula.replace("×", "*").replace("÷", "/");
        const calculate = new Function(...Object.keys(context), `return ${formulaT}`);
        const result = calculate(...Object.values(context));
        return result;
    } catch (error) {
        return 'Error: ' + error.message;
    }
}