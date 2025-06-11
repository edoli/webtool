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

const mathOptions = {
    'useDegree': false,
}


// degree/radian 변환 함수들
function degToRad(deg) {
    return deg * Math.PI / 180;
}
function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

// 삼각함수 래퍼 함수들 (degree 지원)
function sin(x) {
    return mathOptions.useDegree ? Math.sin(degToRad(x)) : Math.sin(x);
}
function cos(x) {
    return mathOptions.useDegree ? Math.cos(degToRad(x)) : Math.cos(x);
}
function tan(x) {
    return mathOptions.useDegree ? Math.tan(degToRad(x)) : Math.tan(x);
}
function asin(x) {
    const result = Math.asin(x);
    return mathOptions.useDegree ? radToDeg(result) : result;
}
function acos(x) {
    const result = Math.acos(x);
    return mathOptions.useDegree ? radToDeg(result) : result;
}
function atan(x) {
    const result = Math.atan(x);
    return mathOptions.useDegree ? radToDeg(result) : result;
}
function atan2(y, x) {
    const result = Math.atan2(y, x);
    return mathOptions.useDegree ? radToDeg(result) : result;
}

// mathFunctions에 래퍼 함수들로 덮어쓰기
Object.assign(mathFunctions, {
    sin: sin,
    cos: cos,
    tan: tan,
    asin: asin,
    acos: acos,
    atan: atan,
    atan2: atan2
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
        // TODO: varsInFormula 계산하는게 3군데에 있음. 나중에 통합해야할듯
        const varsInFormula = [...new Set(formulas.map(formula => extractVariables(formula.formulaTemplate)).flat())];
        const variablesInUse = {};
        varsInFormula.forEach(variable => {
            variablesInUse[variable] = variables[variable];
        });

        const context = {
            ...mathPredefined,
            ...tmpContext,
            ...Object.fromEntries(
                Object.entries(variablesInUse).map(([key, value]) => [key, Number(value)])
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