// src/components/chameleon-calc/MathEngine.ts

export const SUPPORTED_FUNCTIONS = [
  "sin", "cos", "tan", "asin", "acos", "atan",
  "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
  "ln", "log", "exp", "sqrt", "abs"
] as const;

export const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
  E: Math.E,
};

const PRECEDENCE: Record<string, number> = {
  "+": 2,
  "-": 2,
  "*": 3,
  "/": 3,
  "%": 3,
  "^": 4,
  "u-": 5, // Unary minus
  "u+": 5, // Unary plus
};

const ASSOCIATIVITY: Record<string, "L" | "R"> = {
  "+": "L",
  "-": "L",
  "*": "L",
  "/": "L",
  "%": "L",
  "^": "R",
  "u-": "R",
  "u+": "R",
};

export function tokenize(str: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  
  // Remove whitespace
  str = str.replace(/\s+/g, "");
  
  const isDigit = (c: string) => /[0-9.]/.test(c);
  const isLetter = (c: string) => /[a-zA-Z_]/.test(c);
  
  while (i < str.length) {
    const char = str[i];
    
    // Number check (supports scientific notation like 1e-5 or 2.5e+3)
    if (isDigit(char)) {
      let numStr = "";
      while (i < str.length && (isDigit(str[i]) || str[i] === 'e' || str[i] === 'E' ||
            ((str[i] === '-' || str[i] === '+') && (numStr.endsWith('e') || numStr.endsWith('E'))))) {
        numStr += str[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }
    
    // Identifier check (functions, constants, variable x)
    if (isLetter(char)) {
      let word = "";
      while (i < str.length && (isLetter(str[i]) || /[0-9_]/.test(str[i]))) {
        word += str[i];
        i++;
      }
      tokens.push(word);
      continue;
    }
    
    // Operators & Brackets
    if ("+-*/^%(),".includes(char)) {
      tokens.push(char);
      i++;
      continue;
    }
    
    // If unknown character, skip
    i++;
  }
  return tokens;
}

export function processUnary(tokens: string[]): string[] {
  const processed: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prev = i > 0 ? tokens[i - 1] : null;
    
    if (token === "-" || token === "+") {
      const isUnary = !prev || "+-*/^%(,".includes(prev);
      if (isUnary) {
        processed.push(token === "-" ? "u-" : "u+");
      } else {
        processed.push(token);
      }
    } else {
      processed.push(token);
    }
  }
  return processed;
}

export function shuntingYard(tokens: string[]): string[] {
  const outputQueue: string[] = [];
  const operatorStack: string[] = [];
  
  const isFunction = (t: string) => SUPPORTED_FUNCTIONS.includes(t as any);
  const isOperator = (t: string) => t in PRECEDENCE;
  
  for (const token of tokens) {
    if (!isNaN(Number(token)) || token.toLowerCase() === "x" || token in CONSTANTS || token.toUpperCase() in CONSTANTS) {
      outputQueue.push(token);
    } else if (isFunction(token)) {
      operatorStack.push(token);
    } else if (token === ",") {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
        outputQueue.push(operatorStack.pop()!);
      }
      if (operatorStack.length === 0) {
        throw new Error("Misplaced comma or mismatched parentheses");
      }
    } else if (isOperator(token)) {
      const o1 = token;
      while (operatorStack.length > 0) {
        const o2 = operatorStack[operatorStack.length - 1];
        if (isOperator(o2)) {
          const p1 = PRECEDENCE[o1];
          const p2 = PRECEDENCE[o2];
          const assoc1 = ASSOCIATIVITY[o1];
          
          if ((assoc1 === "L" && p1 <= p2) || (assoc1 === "R" && p1 < p2)) {
            outputQueue.push(operatorStack.pop()!);
          } else {
            break;
          }
        } else {
          break;
        }
      }
      operatorStack.push(o1);
    } else if (token === "(") {
      operatorStack.push(token);
    } else if (token === ")") {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
        outputQueue.push(operatorStack.pop()!);
      }
      if (operatorStack.length === 0) {
        throw new Error("Mismatched parentheses");
      }
      operatorStack.pop(); // Pop the '('
      
      if (operatorStack.length > 0 && isFunction(operatorStack[operatorStack.length - 1])) {
        outputQueue.push(operatorStack.pop()!);
      }
    } else {
      // Treat unknown variables as variables (e.g. y) or throw error. We'll support 'x' specifically.
      outputQueue.push(token);
    }
  }
  
  while (operatorStack.length > 0) {
    const token = operatorStack.pop()!;
    if (token === "(" || token === ")") {
      throw new Error("Mismatched parentheses");
    }
    outputQueue.push(token);
  }
  
  return outputQueue;
}

export function evaluateRPN(rpn: string[], variables: Record<string, number> = {}): number {
  const stack: number[] = [];
  
  for (const token of rpn) {
    if (!isNaN(Number(token))) {
      stack.push(Number(token));
    } else if (token.toLowerCase() in CONSTANTS) {
      stack.push(CONSTANTS[token.toLowerCase()]);
    } else if (token.toUpperCase() in CONSTANTS) {
      stack.push(CONSTANTS[token.toUpperCase()]);
    } else if (token.toLowerCase() in variables) {
      stack.push(variables[token.toLowerCase()]);
    } else if (token in variables) {
      stack.push(variables[token]);
    } else if (token === "u-") {
      if (stack.length < 1) throw new Error("Invalid expression");
      const val = stack.pop()!;
      stack.push(-val);
    } else if (token === "u+") {
      if (stack.length < 1) throw new Error("Invalid expression");
      // Unary plus does nothing
    } else if (SUPPORTED_FUNCTIONS.includes(token as any)) {
      if (stack.length < 1) throw new Error("Invalid expression");
      const val = stack.pop()!;
      switch (token) {
        case "sin": stack.push(Math.sin(val)); break;
        case "cos": stack.push(Math.cos(val)); break;
        case "tan": stack.push(Math.tan(val)); break;
        case "asin": stack.push(Math.asin(val)); break;
        case "acos": stack.push(Math.acos(val)); break;
        case "atan": stack.push(Math.atan(val)); break;
        case "sinh": stack.push(Math.sinh(val)); break;
        case "cosh": stack.push(Math.cosh(val)); break;
        case "tanh": stack.push(Math.tanh(val)); break;
        case "asinh": stack.push(Math.asinh(val)); break;
        case "acosh": stack.push(Math.acosh(val)); break;
        case "atanh": stack.push(Math.atanh(val)); break;
        case "ln": stack.push(Math.log(val)); break;
        case "log": stack.push(Math.log10(val)); break;
        case "exp": stack.push(Math.exp(val)); break;
        case "sqrt": stack.push(Math.sqrt(val)); break;
        case "abs": stack.push(Math.abs(val)); break;
        default: throw new Error(`Unknown function: ${token}`);
      }
    } else {
      // Operators
      if (stack.length < 2) throw new Error("Invalid expression");
      const b = stack.pop()!;
      const a = stack.pop()!;
      switch (token) {
        case "+": stack.push(a + b); break;
        case "-": stack.push(a - b); break;
        case "*": stack.push(a * b); break;
        case "/": 
          if (b === 0) throw new Error("Division by zero");
          stack.push(a / b); 
          break;
        case "%": stack.push(a % b); break;
        case "^": stack.push(Math.pow(a, b)); break;
        default: throw new Error(`Unknown operator: ${token}`);
      }
    }
  }
  
  if (stack.length !== 1) {
    throw new Error("Invalid expression format");
  }
  
  return stack[0];
}

export function insertImplicitMultiplication(tokens: string[]): string[] {
  const result: string[] = [];
  const isNum = (t: string) => !isNaN(Number(t));
  const isIdentifier = (t: string) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t);
  const isFunc = (t: string) => SUPPORTED_FUNCTIONS.includes(t as any);
  const isVar = (t: string) => isIdentifier(t) && !isFunc(t);

  for (let i = 0; i < tokens.length; i++) {
    result.push(tokens[i]);
    if (i < tokens.length - 1) {
      const t1 = tokens[i];
      const t2 = tokens[i + 1];

      const cond1 = (isNum(t1) || isVar(t1)) && (isVar(t2) || isFunc(t2) || t2 === "(");
      const cond2 = t1 === ")" && (isNum(t2) || isVar(t2) || isFunc(t2) || t2 === "(");

      if (cond1 || cond2) {
        result.push("*");
      }
    }
  }
  return result;
}

export function evaluate(expr: string, variables: Record<string, number> = {}): number {
  if (!expr.trim()) return 0;
  const tokens = tokenize(expr);
  const withImplicit = insertImplicitMultiplication(tokens);
  const processed = processUnary(withImplicit);
  const rpn = shuntingYard(processed);
  return evaluateRPN(rpn, variables);
}

export function rpnToLaTeX(rpn: string[]): string {
  const stack: string[] = [];
  
  for (const token of rpn) {
    if (!isNaN(Number(token))) {
      stack.push(token);
    } else if (token === "pi" || token === "PI") {
      stack.push("\\pi");
    } else if (token === "e" || token === "E") {
      stack.push("e");
    } else if (token === "u-") {
      if (stack.length < 1) return "";
      const val = stack.pop()!;
      stack.push(`-${val}`);
    } else if (token === "u+") {
      if (stack.length < 1) return "";
      // Unary plus
    } else if (SUPPORTED_FUNCTIONS.includes(token as any)) {
      if (stack.length < 1) return "";
      const val = stack.pop()!;
      if (token === "sqrt") {
        stack.push(`\\sqrt{${val}}`);
      } else if (token === "ln") {
        stack.push(`\\ln\\left(${val}\\right)`);
      } else if (token === "log") {
        stack.push(`\\log\\left(${val}\\right)`);
      } else if (token === "abs") {
        stack.push(`\\left|${val}\\right|`);
      } else {
        stack.push(`\\${token}\\left(${val}\\right)`);
      }
    } else {
      // Binary Operators
      if (stack.length < 2) return "";
      const b = stack.pop()!;
      const a = stack.pop()!;
      switch (token) {
        case "+": stack.push(`${a} + ${b}`); break;
        case "-": stack.push(`${a} - ${b}`); break;
        case "*": 
          // If a or b has spaces (contains operators), wrap in parens or format nicely
          const factorA = a.includes("+") || a.includes("-") ? `\\left(${a}\\right)` : a;
          const factorB = b.includes("+") || b.includes("-") ? `\\left(${b}\\right)` : b;
          stack.push(`${factorA} \\cdot ${factorB}`); 
          break;
        case "/": 
          stack.push(`\\frac{${a}}{${b}}`); 
          break;
        case "%": stack.push(`${a} \\pmod{${b}}`); break;
        case "^": 
          const base = a.includes("+") || a.includes("-") || a.includes("*") || a.includes("/") ? `\\left(${a}\\right)` : a;
          stack.push(`${base}^{${b}}`); 
          break;
        default: return "";
      }
    }
  }
  
  if (stack.length !== 1) return "";
  return stack[0];
}

export function toLaTeX(expr: string): string {
  try {
    if (!expr.trim()) return "";
    const tokens = tokenize(expr);
    const withImplicit = insertImplicitMultiplication(tokens);
    const processed = processUnary(withImplicit);
    const rpn = shuntingYard(processed);
    return rpnToLaTeX(rpn);
  } catch {
    return expr; // Fallback to raw expression on error
  }
}
