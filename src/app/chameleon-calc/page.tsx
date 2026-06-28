// src/app/chameleon-calc/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  Delete,
  CornerDownLeft,
  Settings,
  Grid3X3,
  TrendingUp,
  Sliders,
  History,
  Info,
  Maximize2,
  Minimize2,
  Trash2,
  Brain,
  Sparkles,
  ArrowRight,
  TrendingDown,
  BarChart4
} from "lucide-react";
import ChameleonLogo from "@/components/chameleon-calc/ChameleonLogo";
import GraphingPanel from "@/components/chameleon-calc/GraphingPanel";
import { evaluate, toLaTeX } from "@/components/chameleon-calc/MathEngine";
import * as MatrixEngine from "@/components/chameleon-calc/MatrixEngine";

// Safe KaTeX renderer for Next.js SSR
import katex from "katex";
import "katex/dist/katex.min.css";

function Latex({ math, block = false }: { math: string; block?: boolean }) {
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (containerRef.current && math) {
      try {
        katex.render(math, containerRef.current, {
          displayMode: block,
          throwOnError: false,
        });
      } catch (err) {
        containerRef.current.textContent = math;
      }
    }
  }, [math, block]);

  return <span ref={containerRef} className="font-sans" />;
}

// History Item interface
interface CalcHistoryItem {
  id: string;
  expr: string;
  latex: string;
  result: string;
}

// AI Message interface
interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  latex?: string;
  action?: {
    label: string;
    tab: keyof typeof MODE_THEMES;
    data: any;
  };
}

// Mode style definitions matching Chameleon aesthetic (High contrast & inverted hover)
const MODE_THEMES = {
  basic: {
    accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    accentHover: "hover:bg-emerald-500/20",
    bgGradient: "from-emerald-950/10 via-background to-background",
    badge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    btn: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-300 dark:hover:text-emerald-950 transition-all duration-300",
    ring: "focus-visible:ring-emerald-500/40",
    primary: "emerald-500"
  },
  advanced: {
    accent: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/30",
    accentHover: "hover:bg-violet-500/20",
    bgGradient: "from-violet-950/10 via-background to-background",
    badge: "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
    btn: "bg-violet-500/15 border-violet-500/30 text-violet-700 dark:text-violet-300 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-300 dark:hover:text-violet-950 transition-all duration-300",
    ring: "focus-visible:ring-violet-500/40",
    primary: "violet-500"
  },
  matrix: {
    accent: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    accentHover: "hover:bg-cyan-500/20",
    bgGradient: "from-cyan-950/10 via-background to-background",
    badge: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    btn: "bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-600 hover:text-white dark:hover:bg-cyan-300 dark:hover:text-cyan-950 transition-all duration-300",
    ring: "focus-visible:ring-cyan-500/40",
    primary: "cyan-500"
  },
  decomposition: {
    accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    accentHover: "hover:bg-amber-500/20",
    bgGradient: "from-amber-950/10 via-background to-background",
    badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    btn: "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-300 dark:hover:text-amber-950 transition-all duration-300",
    ring: "focus-visible:ring-amber-500/40",
    primary: "amber-500"
  },
  stats: {
    accent: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30",
    accentHover: "hover:bg-orange-500/20",
    bgGradient: "from-orange-950/10 via-background to-background",
    badge: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
    btn: "bg-orange-500/15 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-300 dark:hover:text-orange-950 transition-all duration-300",
    ring: "focus-visible:ring-orange-500/40",
    primary: "orange-500"
  },
  graphing: {
    accent: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
    accentHover: "hover:bg-rose-500/20",
    bgGradient: "from-rose-950/10 via-background to-background",
    badge: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
    btn: "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-300 dark:hover:text-rose-950 transition-all duration-300",
    ring: "focus-visible:ring-rose-500/40",
    primary: "rose-500"
  },
  ai: {
    accent: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    accentHover: "hover:bg-indigo-500/20",
    bgGradient: "from-indigo-950/10 via-background to-background",
    badge: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    btn: "bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-300 dark:hover:text-indigo-950 transition-all duration-300",
    ring: "focus-visible:ring-indigo-500/40",
    primary: "indigo-500"
  }
};

export default function ChameleonCalcPage() {
  const [activeTab, setActiveTab] = useState<keyof typeof MODE_THEMES>("basic");
  const theme = MODE_THEMES[activeTab];

  // ==========================================
  // Basic & Advanced Math Calculator State
  // ==========================================
  const [expression, setExpression] = useState("");
  const [calcResult, setCalcResult] = useState<string>("");
  const [latexExpr, setLatexExpr] = useState("");
  const [mathHistory, setMathHistory] = useState<CalcHistoryItem[]>([]);
  const [isHyperbolic, setIsHyperbolic] = useState(false);

  // Sync LaTeX translation in real-time
  useEffect(() => {
    if (expression.trim()) {
      setLatexExpr(toLaTeX(expression));
    } else {
      setLatexExpr("");
    }
  }, [expression]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chameleon_calc_history");
    if (saved) {
      try {
        setMathHistory(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleKeypadPress = (val: string) => {
    setExpression((prev) => prev + val);
  };

  const handleClear = () => {
    setExpression("");
    setCalcResult("");
    setLatexExpr("");
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleEvaluate = () => {
    if (!expression.trim()) return;
    try {
      const res = evaluate(expression);
      const formattedRes = Number(res.toFixed(10)).toString(); 
      setCalcResult(formattedRes);

      const latex = toLaTeX(expression);
      const newItem: CalcHistoryItem = {
        id: Date.now().toString(),
        expr: expression,
        latex: latex || expression,
        result: formattedRes,
      };
      const updatedHistory = [newItem, ...mathHistory].slice(0, 15);
      setMathHistory(updatedHistory);
      localStorage.setItem("chameleon_calc_history", JSON.stringify(updatedHistory));
    } catch (err: any) {
      setCalcResult(`Error: ${err.message || "Invalid syntax"}`);
    }
  };

  const clearHistory = () => {
    setMathHistory([]);
    localStorage.removeItem("chameleon_calc_history");
  };

  // ==========================================
  // Linear Algebra State
  // ==========================================
  const [matrixDimA, setMatrixDimA] = useState({ rows: 2, cols: 2 });
  const [matrixDimB, setMatrixDimB] = useState({ rows: 2, cols: 2 });
  const [matrixA, setMatrixA] = useState<MatrixEngine.Matrix>([
    [1, 2],
    [3, 4]
  ]);
  const [matrixB, setMatrixB] = useState<MatrixEngine.Matrix>([
    [5, 6],
    [7, 8]
  ]);
  const [scalarK, setScalarK] = useState("2");
  const [matrixResult, setMatrixResult] = useState<{
    type: "matrix" | "scalar" | "string";
    val: MatrixEngine.Matrix | number | string;
    latex?: string;
  } | null>(null);

  useEffect(() => {
    const { rows, cols } = matrixDimA;
    const newMatrix = MatrixEngine.createZeroMatrix(rows, cols);
    for (let r = 0; r < Math.min(rows, matrixA.length); r++) {
      for (let c = 0; c < Math.min(cols, matrixA[0].length); c++) {
        newMatrix[r][c] = matrixA[r][c] || 0;
      }
    }
    setMatrixA(newMatrix);
  }, [matrixDimA.rows, matrixDimA.cols]);

  useEffect(() => {
    const { rows, cols } = matrixDimB;
    const newMatrix = MatrixEngine.createZeroMatrix(rows, cols);
    for (let r = 0; r < Math.min(rows, matrixB.length); r++) {
      for (let c = 0; c < Math.min(cols, matrixB[0].length); c++) {
        newMatrix[r][c] = matrixB[r][c] || 0;
      }
    }
    setMatrixB(newMatrix);
  }, [matrixDimB.rows, matrixDimB.cols]);

  const updateMatrixValue = (target: "A" | "B", r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0;
    if (target === "A") {
      const copy = matrixA.map((row) => [...row]);
      copy[r][c] = num;
      setMatrixA(copy);
    } else {
      const copy = matrixB.map((row) => [...row]);
      copy[r][c] = num;
      setMatrixB(copy);
    }
  };

  const handleMatrixAdd = () => {
    try {
      const res = MatrixEngine.add(matrixA, matrixB);
      setMatrixResult({ type: "matrix", val: res });
    } catch (e: any) {
      setMatrixResult({ type: "string", val: `Error: ${e.message}` });
    }
  };

  const handleMatrixSub = () => {
    try {
      const res = MatrixEngine.subtract(matrixA, matrixB);
      setMatrixResult({ type: "matrix", val: res });
    } catch (e: any) {
      setMatrixResult({ type: "string", val: `Error: ${e.message}` });
    }
  };

  const handleMatrixMul = () => {
    try {
      const res = MatrixEngine.multiply(matrixA, matrixB);
      setMatrixResult({ type: "matrix", val: res });
    } catch (e: any) {
      setMatrixResult({ type: "string", val: `Error: ${e.message}` });
    }
  };

  const handleMatrixScalarMul = () => {
    try {
      const k = parseFloat(scalarK) || 0;
      const res = MatrixEngine.multiplyScalar(matrixA, k);
      setMatrixResult({ type: "matrix", val: res });
    } catch (e: any) {
      setMatrixResult({ type: "string", val: `Error: ${e.message}` });
    }
  };

  const handleMatrixDet = (target: "A" | "B") => {
    try {
      const targetMat = target === "A" ? matrixA : matrixB;
      const res = MatrixEngine.determinant(targetMat);
      setMatrixResult({ type: "scalar", val: res, latex: `\\det(${target}) = ${res.toFixed(6)}` });
    } catch (e: any) {
      setMatrixResult({ type: "string", val: `Error: ${e.message}` });
    }
  };

  const handleMatrixInv = (target: "A" | "B") => {
    try {
      const targetMat = target === "A" ? matrixA : matrixB;
      const res = MatrixEngine.inverse(targetMat);
      if (res) {
        setMatrixResult({ type: "matrix", val: res });
      } else {
        setMatrixResult({ type: "string", val: `Matrix ${target} is singular (determinant is 0) and has no inverse.` });
      }
    } catch (e: any) {
      setMatrixResult({ type: "string", val: `Error: ${e.message}` });
    }
  };

  const handleMatrixTranspose = (target: "A" | "B") => {
    const targetMat = target === "A" ? matrixA : matrixB;
    const res = MatrixEngine.transpose(targetMat);
    setMatrixResult({ type: "matrix", val: res });
  };

  const handleMatrixTrace = (target: "A" | "B") => {
    try {
      const targetMat = target === "A" ? matrixA : matrixB;
      const res = MatrixEngine.trace(targetMat);
      setMatrixResult({ type: "scalar", val: res, latex: `\\text{Tr}(${target}) = ${res}` });
    } catch (e: any) {
      setMatrixResult({ type: "string", val: `Error: ${e.message}` });
    }
  };

  // ==========================================
  // Decomposition Matrix State
  // ==========================================
  const [decompDim, setDecompDim] = useState(3);
  const [decompMatrix, setDecompMatrix] = useState<MatrixEngine.Matrix>([
    [4, 3, 2],
    [3, 6, 3],
    [2, 3, 5]
  ]);
  const [decompResult, setDecompResult] = useState<{
    type: "LU" | "QR" | "Eigen";
    data: any;
    steps: string[];
  } | null>(null);

  useEffect(() => {
    const newMatrix = MatrixEngine.createZeroMatrix(decompDim, decompDim);
    for (let r = 0; r < Math.min(decompDim, decompMatrix.length); r++) {
      for (let c = 0; c < Math.min(decompDim, decompMatrix[0].length); c++) {
        newMatrix[r][c] = decompMatrix[r][c] || 0;
      }
    }
    for (let i = 0; i < decompDim; i++) {
      if (newMatrix[i][i] === 0) newMatrix[i][i] = 1;
    }
    setDecompMatrix(newMatrix);
  }, [decompDim]);

  const updateDecompMatrixValue = (r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0;
    const copy = decompMatrix.map((row) => [...row]);
    copy[r][c] = num;
    setDecompMatrix(copy);
  };

  const handleLUDecomp = () => {
    try {
      const res = MatrixEngine.luDecomposition(decompMatrix);
      setDecompResult({ type: "LU", data: res, steps: res.steps });
    } catch (e: any) {
      setDecompResult({ type: "LU", data: null, steps: [`Error: ${e.message}`] });
    }
  };

  const handleQRDecomp = () => {
    try {
      const res = MatrixEngine.qrDecomposition(decompMatrix);
      setDecompResult({ type: "QR", data: res, steps: res.steps });
    } catch (e: any) {
      setDecompResult({ type: "QR", data: null, steps: [`Error: ${e.message}`] });
    }
  };

  const handleEigenvalues = () => {
    try {
      const steps = ["Starting Eigenvalue Computation using QR Algorithm...", "Running QR shifting iterations..."];
      const res = MatrixEngine.computeEigenvalues(decompMatrix, 80);
      steps.push("Iterations finished.", `Eigenvalues spectrum approximated: [${res.map(x=>x.toFixed(6)).join(", ")}]`);
      setDecompResult({ type: "Eigen", data: res, steps });
    } catch (e: any) {
      setDecompResult({ type: "Eigen", data: null, steps: [`Error: ${e.message}`] });
    }
  };

  // Matrix display formatter helper
  const renderLaTeXMatrix = (matrix: MatrixEngine.Matrix): string => {
    const rows = matrix.map(r => r.map(val => Number(val.toFixed(4)).toString()).join(" & "));
    return `\\begin{pmatrix} ${rows.join(" \\\\ ")} \\end{pmatrix}`;
  };

  // ==========================================
  // NEW TAB: Multivariate Statistics & SVD State
  // ==========================================
  const [statsDim, setStatsDim] = useState({ rows: 4, cols: 2 });
  const [statsMatrix, setStatsMatrix] = useState<MatrixEngine.Matrix>([
    [10, 2],
    [15, 4],
    [20, 5],
    [30, 9]
  ]);
  const [statsResult, setStatsResult] = useState<{
    type: "STATS" | "SVD";
    data: any;
    steps: string[];
  } | null>(null);

  useEffect(() => {
    const { rows, cols } = statsDim;
    const newMatrix = MatrixEngine.createZeroMatrix(rows, cols);
    for (let r = 0; r < Math.min(rows, statsMatrix.length); r++) {
      for (let c = 0; c < Math.min(cols, statsMatrix[0].length); c++) {
        newMatrix[r][c] = statsMatrix[r][c] || 0;
      }
    }
    setStatsMatrix(newMatrix);
  }, [statsDim.rows, statsDim.cols]);

  const updateStatsValue = (r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0;
    const copy = statsMatrix.map((row) => [...row]);
    copy[r][c] = num;
    setStatsMatrix(copy);
  };

  const handleComputeStats = () => {
    try {
      const res = MatrixEngine.computeMultivariateStats(statsMatrix);
      setStatsResult({ type: "STATS", data: res, steps: res.steps });
    } catch (e: any) {
      setStatsResult({ type: "STATS", data: null, steps: [`Error: ${e.message}`] });
    }
  };

  const handleComputeSVD = () => {
    try {
      // SVD works on square matrices in this solver
      if (statsMatrix.length !== statsMatrix[0].length) {
        throw new Error("Matrix must be square (Equal rows and columns) for SVD solver");
      }
      const res = MatrixEngine.svd(statsMatrix);
      setStatsResult({ type: "SVD", data: res, steps: res.steps });
    } catch (e: any) {
      setStatsResult({ type: "SVD", data: null, steps: [`Error: ${e.message}`] });
    }
  };

  // Re-multiply U * S * V^T to demonstrate SVD reconstruction
  const getSVDReconstruction = (data: any): MatrixEngine.Matrix => {
    if (!data) return [];
    const n = data.U.length;
    // Build Sigma matrix from S vector
    const Sigma = MatrixEngine.createZeroMatrix(n, n);
    for (let i = 0; i < n; i++) {
      Sigma[i][i] = data.S[i];
    }
    // U * Sigma * V^T
    const USigma = MatrixEngine.multiply(data.U, Sigma);
    return MatrixEngine.multiply(USigma, data.VT);
  };

  // ==========================================
  // NEW TAB: Chameleon AI Mind Assistant
  // ==========================================
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "ai",
      text: "Greetings. I am the Chameleon AI Mathematical Assistant. I can graph functions, solve equations, factor matrices, or compute statistics locally. Type a prompt like:\n\n- 'solve 2x^2 + 5x - 3 = 0'\n- 'plot x^2 - 4x + 3'\n- 'SVD of [[4,0],[0,3]]'\n- 'SD of [10, 20, 30, 45]'"
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isAiThinking]);

  const handleSendAi = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiInput.trim()) return;

    const userText = aiInput.trim();
    const userMsg: Message = { id: Date.now().toString(), sender: "user", text: userText };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setIsAiThinking(true);

    setTimeout(() => {
      let aiText = "I'm sorry, I couldn't interpret your prompt mathematically. Please check your syntax or try one of the preset prompts.";
      let aiLatex: string | undefined;
      let aiAction: Message["action"];

      try {
        const clean = userText.toLowerCase().replace(/\s+/g, "");

        // 1. Plot command (e.g. plot sin(x) + cos(2x))
        if (clean.startsWith("plot") || clean.startsWith("graph") || clean.startsWith("draw")) {
          const rawExpr = userText.replace(/plot|graph|draw/i, "").trim();
          if (rawExpr) {
            aiText = `I've successfully parsed your graphing expression. I can plot the curve for you on the coordinate plane. Click the action button below to load it into the Graphing Board.`;
            aiLatex = `f(x) = ${toLaTeX(rawExpr)}`;
            aiAction = {
              label: "Load into Graphing Board",
              tab: "graphing",
              data: rawExpr
            };
          }
        }
        
        // 2. Solve quadratic equations (e.g. solve 2x^2 + 5x - 3 = 0)
        else if (clean.startsWith("solve")) {
          // Regex for ax^2 + bx + c = 0
          const match = clean.match(/solve([+-]?\d*(?:\.\d+)?)x\^2([+-]?\d*(?:\.\d+)?)x([+-]?\d*(?:\.\d+)?)=0/);
          if (match) {
            const aStr = match[1];
            const bStr = match[2];
            const cStr = match[3];

            const a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseFloat(aStr);
            const b = bStr === "" || bStr === "+" ? 1 : bStr === "-" ? -1 : parseFloat(bStr);
            const c = parseFloat(cStr);

            if (!isNaN(a) && !isNaN(b) && !isNaN(c)) {
              const D = b * b - 4 * a * c;
              aiText = `Identified quadratic coefficients:\n- a = ${a}\n- b = ${b}\n- c = ${c}\n\nCalculating discriminant:\n  D = b² - 4ac = (${b})² - 4(${a})(${c}) = ${D}\n\n`;
              
              if (D > 0) {
                const r1 = (-b + Math.sqrt(D)) / (2 * a);
                const r2 = (-b - Math.sqrt(D)) / (2 * a);
                aiText += `Since D > 0, we have two distinct real roots:\n- x₁ = ${r1.toFixed(5)}\n- x₂ = ${r2.toFixed(5)}`;
                aiLatex = `x = \\frac{-${b} \\pm \\sqrt{${D}}}{2(${a})} \\implies x_1 = ${r1.toFixed(4)},\\; x_2 = ${r2.toFixed(4)}`;
              } else if (D === 0) {
                const r = -b / (2 * a);
                aiText += `Since D = 0, we have one double real root:\n- x = ${r.toFixed(5)}`;
                aiLatex = `x = \\frac{-${b}}{2(${a})} = ${r.toFixed(4)}`;
              } else {
                const realPart = -b / (2 * a);
                const imagPart = Math.sqrt(-D) / (2 * a);
                aiText += `Since D < 0, we have two complex conjugate roots:\n- x₁ = ${realPart.toFixed(5)} + ${imagPart.toFixed(5)}i\n- x₂ = ${realPart.toFixed(5)} - ${imagPart.toFixed(5)}i`;
                aiLatex = `x = ${realPart.toFixed(4)} \\pm ${imagPart.toFixed(4)} i`;
              }
              
              aiAction = {
                label: "Solve as Expression",
                tab: "advanced",
                data: `${a}*x^2 + ${b}*x + ${c}`
              };
            }
          } else {
            // General equation fallback (try evaluating as standard expression)
            const expr = userText.replace(/solve/i, "").trim();
            const res = evaluate(expr);
            aiText = `Solved algebraic expression directly:\nAnswer: ${res}`;
            aiLatex = `${toLaTeX(expr)} = ${res}`;
          }
        }

        // 3. SVD decomposition (e.g. SVD of [[4,0],[0,3]])
        else if (clean.includes("svd")) {
          // Try to parse matrix, e.g. [[4,0],[0,3]]
          const matrixMatch = userText.match(/\[\s*\[(.*?)\]\s*,\s*\[(.*?)\]\s*\]/); // 2x2 fallback
          let matrix: number[][] = [[4, 0], [0, 3]]; // Preset default
          
          if (matrixMatch) {
            try {
              matrix = JSON.parse(userText.match(/\[\s*\[.*\]\s*\]/)?.[0] || "");
            } catch {}
          }
          
          if (matrix && matrix.length === matrix[0].length) {
            const res = MatrixEngine.svd(matrix);
            aiText = `Computed Singular Value Decomposition (SVD) for matrix A:\n- Singular values: [${res.S.map(x=>x.toFixed(4)).join(", ")}]\n\nLoad this matrix into the Multivariate & SVD tab to see full orthogonal matrices U and V^T, walkthrough trace steps, and verification checks.`;
            aiLatex = `A = U \\Sigma V^T,\\; S = \\text{diag}(${res.S.map(x=>x.toFixed(4)).join(",")})`;
            aiAction = {
              label: "Load Matrix into SVD Board",
              tab: "stats",
              data: { matrix, dim: matrix.length }
            };
          } else {
            aiText = "SVD solver requires a square matrix. E.g. 'SVD of [[2,1],[1,2]]'.";
          }
        }

        // 4. LU decomposition
        else if (clean.includes("lu")) {
          let matrix = [[4, 3], [6, 3]];
          try {
            matrix = JSON.parse(userText.match(/\[\s*\[.*\]\s*\]/)?.[0] || "");
          } catch {}
          const res = MatrixEngine.luDecomposition(matrix);
          aiText = `Computed LU Decomposition for matrix A. L has diagonal 1s, U is upper triangular.\n\nClick below to load this matrix into the matrix decomposition board for full logs.`;
          aiLatex = `A = LU`;
          aiAction = {
            label: "Load into Decomposition Board",
            tab: "decomposition",
            data: { matrix, dim: matrix.length }
          };
        }

        // 5. Standard Deviation & Stats
        else if (clean.includes("sd") || clean.includes("stats") || clean.includes("standarddeviation")) {
          const listMatch = userText.match(/\[(.*?)\]/);
          if (listMatch) {
            const arr = listMatch[1].split(",").map(x => parseFloat(x.trim()) || 0);
            if (arr.length > 0) {
              // Convert list to 1-column matrix for multivariate stats
              const matrix = arr.map(x => [x]);
              const stats = MatrixEngine.computeMultivariateStats(matrix);
              aiText = `Computed Statistics for dataset list:\n- Mean (Average): ${stats.means[0].toFixed(5)}\n- Standard Deviation (SD): ${stats.stdevs[0].toFixed(5)}\n- Sample Variance: ${(stats.stdevs[0] * stats.stdevs[0]).toFixed(5)}`;
              aiLatex = `\\mu = ${stats.means[0].toFixed(4)},\\; \\sigma = ${stats.stdevs[0].toFixed(4)}`;
              aiAction = {
                label: "Load as Column into Stats Matrix",
                tab: "stats",
                data: { matrix, rows: arr.length, cols: 1 }
              };
            }
          } else {
            aiText = "Could not parse dataset array list. Make sure to enclose numbers in brackets, e.g. 'SD of [10, 20, 30]'.";
          }
        }
      } catch (err: any) {
        aiText = `Error evaluating prompt: ${err.message || "Math parser error"}`;
      }

      const responseMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiText,
        latex: aiLatex,
        action: aiAction
      };
      setAiMessages((prev) => [...prev, responseMsg]);
      setIsAiThinking(false);
    }, 700);
  };

  const handleAiAction = (action: Message["action"]) => {
    if (!action) return;
    const { tab, data } = action;
    setActiveTab(tab);

    // Route action payloads to correct tab states
    if (tab === "graphing" && typeof data === "string") {
      // In Graphing tab, we'll replace the first equation
      // Trigger event or wait for state. Graphing is sub-component. We'll alert/pass down.
      // But we can also set localStorage which Graphing reads, or let's reload.
      // We'll write to localStorage and trigger an update.
      localStorage.setItem("chameleon_calc_preload_graph", data);
      window.dispatchEvent(new Event("chameleon_calc_preload"));
    } else if (tab === "stats") {
      if (data.matrix) {
        setStatsDim({ rows: data.rows || data.dim, cols: data.cols || data.dim });
        setStatsMatrix(data.matrix);
      }
    } else if (tab === "decomposition") {
      if (data.matrix) {
        setDecompDim(data.dim);
        setDecompMatrix(data.matrix);
      }
    } else if (tab === "advanced" && typeof data === "string") {
      setExpression(data);
    }
  };

  // Custom visual triggers for preset prompt clicks
  const sendPresetPrompt = (txt: string) => {
    setAiInput(txt);
  };

  return (
    <main className={`min-h-screen bg-gradient-to-b ${theme.bgGradient} transition-all duration-700 ease-in-out py-8 px-4 md:px-8 relative overflow-hidden`}>
      {/* Decorative Blur Backgrounds */}
      <div className={`absolute top-1/4 left-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-${theme.primary}/10 rounded-full blur-[80px] -z-10 pointer-events-none transition-colors duration-700`} />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-indigo-500/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Title Header with Logo */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-4">
            <ChameleonLogo size={70} />
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-indigo-400 to-purple-400 bg-clip-text text-transparent font-sans">
                Chameleon Calc
              </h1>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Advanced Mathematical Sandbox & Decomposition Board
              </p>
            </div>
          </div>
          
          {/* Mode Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className={`px-3 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold ${theme.badge} transition-all duration-300`}>
              Mode: {activeTab}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold bg-muted/30 border-border/40">
              Prec: Float64
            </Badge>
          </div>
        </header>

        {/* Primary Tabs selector */}
        <Tabs
          defaultValue="basic"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-7 gap-1.5 bg-muted/40 border border-border/30 p-1.5 rounded-xl h-auto backdrop-blur">
            <TabsTrigger value="basic" className="rounded-lg py-2.5 font-semibold text-[11px] data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 border border-transparent data-[state=active]:border-emerald-500/30">
              Basic Math
            </TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-lg py-2.5 font-semibold text-[11px] data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300 border border-transparent data-[state=active]:border-violet-500/30">
              Advanced Math
            </TabsTrigger>
            <TabsTrigger value="matrix" className="rounded-lg py-2.5 font-semibold text-[11px] data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 border border-transparent data-[state=active]:border-cyan-500/30">
              Linear Algebra
            </TabsTrigger>
            <TabsTrigger value="decomposition" className="rounded-lg py-2.5 font-semibold text-[11px] data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 border border-transparent data-[state=active]:border-amber-500/30">
              LU/QR Factor
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg py-2.5 font-semibold text-[11px] data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300 border border-transparent data-[state=active]:border-orange-500/30">
              SVD & Stats
            </TabsTrigger>
            <TabsTrigger value="graphing" className="rounded-lg py-2.5 font-semibold text-[11px] data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300 border border-transparent data-[state=active]:border-rose-500/30">
              Graphing
            </TabsTrigger>
            <TabsTrigger value="ai" className="rounded-lg py-2.5 font-semibold text-[11px] col-span-2 md:col-span-1 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 border border-transparent data-[state=active]:border-indigo-500/30">
              Chameleon AI
            </TabsTrigger>
          </TabsList>

          {/* ========================================================
              TAB: BASIC MATH & ADVANCED MATH
              ======================================================== */}
          <TabsContent value="basic" className="mt-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Display & Keypad */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between text-muted-foreground font-mono">
                      <span>Standard Math Input</span>
                      <span className="text-[10px] text-muted-foreground/50">Supports keyboard input</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4">
                    {/* Screen / Readout */}
                    <div className="bg-background/90 border border-border/50 rounded-xl p-4 min-h-[110px] flex flex-col justify-between relative shadow-inner">
                      {/* Active formula display (Raw) */}
                      <Input
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        placeholder="Type mathematical expression (e.g. 2x + 10 or 3(x+4))..."
                        className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xl font-mono p-0 h-8"
                      />
                      
                      {/* LaTeX formatted representation */}
                      {latexExpr && (
                        <div className="text-muted-foreground overflow-x-auto text-sm py-1 border-t border-dashed border-border/30 mt-1 max-w-full custom-scrollbar">
                          <Latex math={latexExpr} />
                        </div>
                      )}

                      {/* Evaluated result readout */}
                      {calcResult && (
                        <div className={`text-right text-2xl font-bold font-mono mt-2 truncate ${calcResult.startsWith("Error") ? "text-destructive" : "text-emerald-500 dark:text-emerald-400 animate-pulse-glow"}`}>
                          {calcResult}
                        </div>
                      )}
                    </div>

                    {/* Keypads layout with Inverted Hover transitions */}
                    <div className="grid grid-cols-4 gap-2.5">
                      {/* Action Row */}
                      <Button onClick={handleClear} variant="secondary" className="font-bold text-sm bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white dark:hover:bg-red-400 dark:hover:text-red-950 rounded-xl py-6 transition-all duration-300">
                        C
                      </Button>
                      <Button onClick={() => handleKeypadPress("(")} className="font-bold text-sm bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">
                        {"("}
                      </Button>
                      <Button onClick={() => handleKeypadPress(")")} className="font-bold text-sm bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">
                        {")"}
                      </Button>
                      <Button onClick={handleBackspace} className="font-bold text-sm bg-muted/20 border border-border/40 text-foreground hover:bg-destructive hover:text-white dark:hover:bg-red-400 dark:hover:text-red-950 rounded-xl py-6 transition-all duration-300 flex items-center justify-center">
                        <Delete className="w-5 h-5" />
                      </Button>

                      {/* Numbers and Basic Operators */}
                      <Button onClick={() => handleKeypadPress("7")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">7</Button>
                      <Button onClick={() => handleKeypadPress("8")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">8</Button>
                      <Button onClick={() => handleKeypadPress("9")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">9</Button>
                      <Button onClick={() => handleKeypadPress(" / ")} className={`font-bold text-lg ${theme.btn} rounded-xl py-6`}>/</Button>

                      <Button onClick={() => handleKeypadPress("4")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">4</Button>
                      <Button onClick={() => handleKeypadPress("5")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">5</Button>
                      <Button onClick={() => handleKeypadPress("6")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">6</Button>
                      <Button onClick={() => handleKeypadPress(" * ")} className={`font-bold text-lg ${theme.btn} rounded-xl py-6`}>×</Button>

                      <Button onClick={() => handleKeypadPress("1")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">1</Button>
                      <Button onClick={() => handleKeypadPress("2")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">2</Button>
                      <Button onClick={() => handleKeypadPress("3")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">3</Button>
                      <Button onClick={() => handleKeypadPress(" - ")} className={`font-bold text-lg ${theme.btn} rounded-xl py-6`}>-</Button>

                      <Button onClick={() => handleKeypadPress("0")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">0</Button>
                      <Button onClick={() => handleKeypadPress(".")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">.</Button>
                      <Button onClick={() => handleKeypadPress(" % ")} className="font-bold text-lg bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300" title="Modulo (remainder)">%</Button>
                      <Button onClick={() => handleKeypadPress(" + ")} className={`font-bold text-lg ${theme.btn} rounded-xl py-6`}>+</Button>

                      {/* Advanced operators row */}
                      <Button onClick={() => handleKeypadPress("^")} className="font-bold text-sm bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300" title="Power (A^B)">x<sup>y</sup></Button>
                      <Button onClick={() => handleKeypadPress("pi")} className="font-semibold text-sm bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">π</Button>
                      <Button onClick={() => handleKeypadPress("e")} className="font-semibold text-sm bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-6 transition-all duration-300">e</Button>
                      <Button onClick={handleEvaluate} className="col-span-1 font-bold text-lg bg-emerald-600 hover:bg-emerald-500 text-white hover:bg-foreground hover:text-emerald-600 dark:hover:bg-white dark:hover:text-emerald-950 border-0 shadow-lg rounded-xl py-6 transition-all duration-300 flex items-center justify-center">
                        <CornerDownLeft className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* History Sidebar */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl h-full flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <History className="w-4.5 h-4.5 text-primary" />
                        Math History
                      </CardTitle>
                      {mathHistory.length > 0 && (
                        <Button onClick={clearHistory} variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive">
                          Clear
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="pt-4 flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {mathHistory.length === 0 ? (
                        <div className="text-center text-xs text-muted-foreground/80 py-8 flex flex-col items-center gap-1.5">
                          <Info className="w-5 h-5 text-muted-foreground/45" />
                          No history yet. Evaluate expressions to log calculation history.
                        </div>
                      ) : (
                        mathHistory.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setExpression(item.expr);
                              setCalcResult(item.result);
                            }}
                            className="p-2.5 rounded-lg bg-background/50 border border-border/30 cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-xs font-mono flex flex-col gap-1 select-none animate-fadeIn"
                          >
                            <div className="text-muted-foreground truncate"><Latex math={item.latex} /></div>
                            <div className="text-emerald-500 dark:text-emerald-400 font-bold text-right">= {item.result}</div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </div>
                  <div className="p-4 border-t border-border/20 bg-muted/10 text-[10.5px] text-muted-foreground/80 flex gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span>Click on any history item to load it back into the active screen buffer. Supports implicit multiplication like `2pi` or `3(4+x)`.</span>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================
              TAB: ADVANCED MATH (SCIENTIFIC / HYPERBOLIC)
              ======================================================== */}
          <TabsContent value="advanced" className="mt-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Display & Keypad */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between text-muted-foreground font-mono">
                      <span>Scientific / Hyperbolic Math Input</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]">Hyperbolic Mode</span>
                        <Button
                          onClick={() => setIsHyperbolic(!isHyperbolic)}
                          variant={isHyperbolic ? "default" : "outline"}
                          size="sm"
                          className={`h-7 px-2.5 rounded-full text-[10.5px] ${isHyperbolic ? "bg-violet-600 hover:bg-violet-500 text-white" : ""}`}
                        >
                          {isHyperbolic ? "ON (sinh)" : "OFF (sin)"}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4">
                    {/* Screen / Readout */}
                    <div className="bg-background/90 border border-border/50 rounded-xl p-4 min-h-[110px] flex flex-col justify-between relative shadow-inner">
                      <Input
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        placeholder="Enter expression (e.g. 2sinh(pi/2) or 5sqrt(abs(-16)))..."
                        className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xl font-mono p-0 h-8"
                      />
                      {latexExpr && (
                        <div className="text-muted-foreground overflow-x-auto text-sm py-1 border-t border-dashed border-border/30 mt-1 max-w-full custom-scrollbar">
                          <Latex math={latexExpr} />
                        </div>
                      )}
                      {calcResult && (
                        <div className={`text-right text-2xl font-bold font-mono mt-2 truncate ${calcResult.startsWith("Error") ? "text-destructive" : "text-violet-500 dark:text-violet-400 animate-pulse-glow"}`}>
                          {calcResult}
                        </div>
                      )}
                    </div>

                    {/* Scientific Keypad Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {/* Action buttons */}
                      <Button onClick={handleClear} variant="secondary" className="font-bold text-xs bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white dark:hover:bg-red-400 dark:hover:text-red-950 rounded-xl py-5 transition-all duration-300">C</Button>
                      <Button onClick={handleBackspace} className="font-bold text-xs bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-5 transition-all duration-300 flex items-center justify-center"><Delete className="w-4 h-4" /></Button>
                      <Button onClick={() => handleKeypadPress("(")} className="font-bold text-xs bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-5 transition-all duration-300">{"("}</Button>
                      <Button onClick={() => handleKeypadPress(")")} className="font-bold text-xs bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-5 transition-all duration-300">{")"}</Button>
                      <Button onClick={() => handleKeypadPress(",")} className="font-bold text-xs bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-5 transition-all duration-300" title="Argument separator">,</Button>
                      <Button onClick={() => handleKeypadPress("^")} className="font-bold text-xs bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-5 transition-all duration-300">x<sup>y</sup></Button>

                      {/* Scientific Functions */}
                      {!isHyperbolic ? (
                        <>
                          <Button onClick={() => handleKeypadPress("sin(")} className={`font-semibold text-xs rounded-xl py-5 ${theme.btn}`}>sin</Button>
                          <Button onClick={() => handleKeypadPress("cos(")} className={`font-semibold text-xs rounded-xl py-5 ${theme.btn}`}>cos</Button>
                          <Button onClick={() => handleKeypadPress("tan(")} className={`font-semibold text-xs rounded-xl py-5 ${theme.btn}`}>tan</Button>
                          <Button onClick={() => handleKeypadPress("asin(")} className={`font-semibold text-[10px] rounded-xl py-5 ${theme.btn}`}>asin</Button>
                          <Button onClick={() => handleKeypadPress("acos(")} className={`font-semibold text-[10px] rounded-xl py-5 ${theme.btn}`}>acos</Button>
                          <Button onClick={() => handleKeypadPress("atan(")} className={`font-semibold text-[10px] rounded-xl py-5 ${theme.btn}`}>atan</Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => handleKeypadPress("sinh(")} className={`font-semibold text-xs rounded-xl py-5 ${theme.btn}`}>sinh</Button>
                          <Button onClick={() => handleKeypadPress("cosh(")} className={`font-semibold text-xs rounded-xl py-5 ${theme.btn}`}>cosh</Button>
                          <Button onClick={() => handleKeypadPress("tanh(")} className={`font-semibold text-xs rounded-xl py-5 ${theme.btn}`}>tanh</Button>
                          <Button onClick={() => handleKeypadPress("asinh(")} className={`font-semibold text-[10px] rounded-xl py-5 ${theme.btn}`}>asinh</Button>
                          <Button onClick={() => handleKeypadPress("acosh(")} className={`font-semibold text-[10px] rounded-xl py-5 ${theme.btn}`}>acosh</Button>
                          <Button onClick={() => handleKeypadPress("atanh(")} className={`font-semibold text-[10px] rounded-xl py-5 ${theme.btn}`}>atanh</Button>
                        </>
                      )}

                      {/* Common math functions */}
                      <Button onClick={() => handleKeypadPress("sqrt(")} className={`font-semibold text-xs rounded-xl py-5 ${theme.btn}`}>√x</Button>
                      <Button onClick={() => handleKeypadPress("ln(")} className={`font-semibold text-xs rounded-xl py-5 ${theme.btn}`}>ln</Button>
                      <Button onClick={() => handleKeypadPress("log(")} className={`font-semibold text-xs rounded-xl py-5 ${theme.btn}`}>log<sub>10</sub></Button>
                      <Button onClick={() => handleKeypadPress("exp(")} className={`font-semibold text-xs rounded-xl py-5 ${theme.btn}`}>e<sup>x</sup></Button>
                      <Button onClick={() => handleKeypadPress("abs(")} className={`font-semibold text-xs rounded-xl py-5 ${theme.btn}`}>|x|</Button>
                      <Button onClick={() => handleKeypadPress("pi")} className="font-semibold text-xs bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-5 transition-all duration-300">π</Button>

                      {/* Constants and variables */}
                      <Button onClick={() => handleKeypadPress("e")} className="font-semibold text-xs bg-muted/20 border border-border/40 text-foreground hover:bg-foreground hover:text-background rounded-xl py-5 transition-all duration-300">e</Button>
                      <Button onClick={() => handleKeypadPress("x")} className="font-bold text-xs bg-muted/20 border border-border/40 text-indigo-500 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-300 dark:hover:text-indigo-950 rounded-xl py-5 transition-all duration-300">x</Button>
                      <div className="col-span-2 hidden sm:block" />
                      <Button onClick={handleEvaluate} className="col-span-2 font-bold text-xs bg-violet-600 hover:bg-violet-500 hover:bg-foreground hover:text-violet-600 dark:hover:bg-white dark:hover:text-violet-950 text-white border-0 shadow-lg rounded-xl py-5 transition-all duration-300">
                        Calculate Result
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced info panel */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl h-full flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-3 border-b border-border/20">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Info className="w-4.5 h-4.5 text-primary" />
                        Scientific Guidelines
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 text-xs flex flex-col gap-3 text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground">Hyperbolic Functions:</span>
                        <span>- `sinh(x) = (e^x - e^-x) / 2`</span>
                        <span>- `cosh(x) = (e^x + e^-x) / 2`</span>
                        <span>- `tanh(x) = sinh(x) / cosh(x)`</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-border/20 pt-2.5">
                        <span className="font-semibold text-foreground">Implicit Products:</span>
                        <span>- Type `2x` instead of `2*x`</span>
                        <span>- Type `2pi` or `4(x+5)` directly</span>
                        <span>- Mappings automatically process multiplications</span>
                      </div>
                    </CardContent>
                  </div>
                  <div className="p-4 border-t border-border/20 bg-muted/10 text-[10.5px] text-muted-foreground/80 flex gap-2">
                    <Sliders className="w-4 h-4 text-violet-400 shrink-0" />
                    <span>To view the plotted version of these equations, click the **Graphing** tab.</span>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================
              TAB: LINEAR ALGEBRA
              ======================================================== */}
          <TabsContent value="matrix" className="mt-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Matrix A Card */}
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                  <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Grid3X3 className="w-4.5 h-4.5 text-cyan-400" />
                      Matrix A
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <span>Dimensions:</span>
                      <Input
                        type="number"
                        min="1"
                        max="4"
                        value={matrixDimA.rows}
                        onChange={(e) => setMatrixDimA({ ...matrixDimA, rows: Math.min(4, Math.max(1, parseInt(e.target.value) || 1)) })}
                        className="w-12 h-7 px-1.5 text-center font-semibold bg-background border-border/40 focus-visible:ring-cyan-500/40 rounded"
                      />
                      <span>×</span>
                      <Input
                        type="number"
                        min="1"
                        max="4"
                        value={matrixDimA.cols}
                        onChange={(e) => setMatrixDimA({ ...matrixDimA, cols: Math.min(4, Math.max(1, parseInt(e.target.value) || 1)) })}
                        className="w-12 h-7 px-1.5 text-center font-semibold bg-background border-border/40 focus-visible:ring-cyan-500/40 rounded"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div
                      className="grid gap-2.5 max-w-[320px] mx-auto p-4 border border-border/20 rounded-xl bg-background/40"
                      style={{ gridTemplateColumns: `repeat(${matrixDimA.cols}, minmax(0, 1fr))` }}
                    >
                      {matrixA.map((row, r) =>
                        row.map((val, c) => (
                          <Input
                            key={`a-${r}-${c}`}
                            type="number"
                            value={val || ""}
                            onChange={(e) => updateMatrixValue("A", r, c, e.target.value)}
                            className="h-9 px-2 text-center font-mono text-sm bg-background border-border/50 focus-visible:ring-cyan-500/40 rounded-lg shadow-sm"
                            placeholder="0"
                          />
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Matrix B Card */}
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                  <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Grid3X3 className="w-4.5 h-4.5 text-cyan-400" />
                      Matrix B
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <span>Dimensions:</span>
                      <Input
                        type="number"
                        min="1"
                        max="4"
                        value={matrixDimB.rows}
                        onChange={(e) => setMatrixDimB({ ...matrixDimB, rows: Math.min(4, Math.max(1, parseInt(e.target.value) || 1)) })}
                        className="w-12 h-7 px-1.5 text-center font-semibold bg-background border-border/40 focus-visible:ring-cyan-500/40 rounded"
                      />
                      <span>×</span>
                      <Input
                        type="number"
                        min="1"
                        max="4"
                        value={matrixDimB.cols}
                        onChange={(e) => setMatrixDimB({ ...matrixDimB, cols: Math.min(4, Math.max(1, parseInt(e.target.value) || 1)) })}
                        className="w-12 h-7 px-1.5 text-center font-semibold bg-background border-border/40 focus-visible:ring-cyan-500/40 rounded"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div
                      className="grid gap-2.5 max-w-[320px] mx-auto p-4 border border-border/20 rounded-xl bg-background/40"
                      style={{ gridTemplateColumns: `repeat(${matrixDimB.cols}, minmax(0, 1fr))` }}
                    >
                      {matrixB.map((row, r) =>
                        row.map((val, c) => (
                          <Input
                            key={`b-${r}-${c}`}
                            type="number"
                            value={val || ""}
                            onChange={(e) => updateMatrixValue("B", r, c, e.target.value)}
                            className="h-9 px-2 text-center font-mono text-sm bg-background border-border/50 focus-visible:ring-cyan-500/40 rounded-lg shadow-sm"
                            placeholder="0"
                          />
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl flex flex-col h-full justify-between">
                  <div>
                    <CardHeader className="pb-3 border-b border-border/20">
                      <CardTitle className="text-sm font-semibold">Matrix Operations</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Button onClick={handleMatrixAdd} className={theme.btn + " h-9 rounded-lg font-semibold"}>A + B</Button>
                        <Button onClick={handleMatrixSub} className={theme.btn + " h-9 rounded-lg font-semibold"}>A - B</Button>
                        <Button onClick={handleMatrixMul} className={theme.btn + " h-9 rounded-lg font-semibold col-span-2"}>A × B</Button>
                        
                        <Button onClick={() => handleMatrixDet("A")} className={theme.btn + " h-9 rounded-lg font-semibold"}>Det(A)</Button>
                        <Button onClick={() => handleMatrixDet("B")} className={theme.btn + " h-9 rounded-lg font-semibold"}>Det(B)</Button>

                        <Button onClick={() => handleMatrixInv("A")} className={theme.btn + " h-9 rounded-lg font-semibold"}>Inv(A)</Button>
                        <Button onClick={() => handleMatrixInv("B")} className={theme.btn + " h-9 rounded-lg font-semibold"}>Inv(B)</Button>

                        <Button onClick={() => handleMatrixTranspose("A")} className={theme.btn + " h-9 rounded-lg font-semibold"}>Transpose(A)</Button>
                        <Button onClick={() => handleMatrixTranspose("B")} className={theme.btn + " h-9 rounded-lg font-semibold"}>Transpose(B)</Button>

                        <Button onClick={() => handleMatrixTrace("A")} className={theme.btn + " h-9 rounded-lg font-semibold"}>Trace(A)</Button>
                        <Button onClick={() => handleMatrixTrace("B")} className={theme.btn + " h-9 rounded-lg font-semibold"}>Trace(B)</Button>
                      </div>

                      <div className="flex gap-2 items-center border-t border-border/20 pt-3">
                        <Input
                          type="number"
                          value={scalarK}
                          onChange={(e) => setScalarK(e.target.value)}
                          className="w-16 h-8 text-center bg-background border-border/40 focus-visible:ring-cyan-500/40 rounded"
                          placeholder="k"
                        />
                        <Button onClick={handleMatrixScalarMul} className="flex-grow h-8 bg-cyan-600 hover:bg-cyan-500 hover:bg-foreground hover:text-cyan-600 dark:hover:bg-white dark:hover:text-cyan-950 text-white rounded-lg text-xs transition-all duration-300 font-semibold">
                          Scalar Multiply k × A
                        </Button>
                      </div>

                      {matrixResult && (
                        <div className="border border-cyan-500/20 bg-cyan-500/5 p-4 rounded-xl flex flex-col gap-2 mt-2 select-all overflow-x-auto custom-scrollbar animate-fadeIn">
                          <span className="text-[11px] font-bold uppercase text-cyan-400">Result</span>
                          {matrixResult.type === "matrix" && (
                            <div className="flex justify-center py-2 text-base">
                              <Latex math={renderLaTeXMatrix(matrixResult.val as MatrixEngine.Matrix)} block />
                            </div>
                          )}
                          {matrixResult.type === "scalar" && (
                            <div className="text-center font-mono py-2 text-sm font-semibold text-cyan-200">
                              <Latex math={matrixResult.latex || ""} />
                            </div>
                          )}
                          {matrixResult.type === "string" && (
                            <div className="text-xs text-destructive font-mono py-2 leading-relaxed">
                              {matrixResult.val}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </div>
                  <div className="p-4 border-t border-border/20 bg-muted/10 text-[10.5px] text-muted-foreground/80 flex gap-2">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Linear algebra results print as KaTeX matrix renderings.</span>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================
              TAB: LU/QR DECOMPOSITION
              ======================================================== */}
          <TabsContent value="decomposition" className="mt-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 flex flex-col gap-6">
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl h-full">
                  <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Grid3X3 className="w-4.5 h-4.5 text-amber-400" />
                      Decomp Matrix A
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <span>Dimension:</span>
                      <Input
                        type="number"
                        min="2"
                        max="4"
                        value={decompDim}
                        onChange={(e) => setDecompDim(Math.min(4, Math.max(2, parseInt(e.target.value) || 2)))}
                        className="w-12 h-7 px-1.5 text-center font-semibold bg-background border-border/40 focus-visible:ring-amber-500/40 rounded"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 flex flex-col gap-6 h-[calc(100%-60px)] justify-between">
                    <div
                      className="grid gap-2.5 max-w-[280px] mx-auto p-4 border border-border/20 rounded-xl bg-background/40"
                      style={{ gridTemplateColumns: `repeat(${decompDim}, minmax(0, 1fr))` }}
                    >
                      {decompMatrix.map((row, r) =>
                        row.map((val, c) => (
                          <Input
                            key={`decomp-${r}-${c}`}
                            type="number"
                            value={val || ""}
                            onChange={(e) => updateDecompMatrixValue(r, c, e.target.value)}
                            className="h-9 px-2 text-center font-mono text-sm bg-background border-border/50 focus-visible:ring-amber-500/40 rounded-lg shadow-sm"
                            placeholder="0"
                          />
                        ))
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs mt-4">
                      <Button onClick={handleLUDecomp} className="bg-amber-600 hover:bg-amber-500 hover:bg-foreground hover:text-amber-600 dark:hover:bg-white dark:hover:text-amber-950 text-white rounded-lg h-9 transition-all duration-300 font-semibold">
                        LU Factor
                      </Button>
                      <Button onClick={handleQRDecomp} className="bg-amber-600 hover:bg-amber-500 hover:bg-foreground hover:text-amber-600 dark:hover:bg-white dark:hover:text-amber-950 text-white rounded-lg h-9 transition-all duration-300 font-semibold">
                        QR Factor
                      </Button>
                      <Button onClick={handleEigenvalues} className="bg-amber-600 hover:bg-amber-500 hover:bg-foreground hover:text-amber-600 dark:hover:bg-white dark:hover:text-amber-950 text-white rounded-lg h-9 transition-all duration-300 font-semibold">
                        Eigen Spectrum
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-6 flex flex-col gap-4">
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl flex flex-col h-full">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-sm font-semibold">Factorization Step-by-Step Solver</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4 flex-grow overflow-hidden">
                    {decompResult && decompResult.data ? (
                      <div className="border border-amber-500/20 bg-amber-500/5 p-4 rounded-xl flex flex-col gap-3 select-all overflow-x-auto custom-scrollbar animate-fadeIn">
                        <span className="text-[11px] font-bold uppercase text-amber-400">Output Matrices</span>
                        
                        {decompResult.type === "LU" && (
                          <div className="flex flex-col gap-4 items-center py-2 text-sm justify-center">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground mb-1">Lower Matrix L:</span>
                              <Latex math={renderLaTeXMatrix(decompResult.data.L)} block />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground mb-1">Upper Matrix U:</span>
                              <Latex math={renderLaTeXMatrix(decompResult.data.U)} block />
                            </div>
                          </div>
                        )}

                        {decompResult.type === "QR" && (
                          <div className="flex flex-col gap-4 items-center py-2 text-sm justify-center">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground mb-1">Orthogonal Q:</span>
                              <Latex math={renderLaTeXMatrix(decompResult.data.Q)} block />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground mb-1">Upper Triangular R:</span>
                              <Latex math={renderLaTeXMatrix(decompResult.data.R)} block />
                            </div>
                          </div>
                        )}

                        {decompResult.type === "Eigen" && (
                          <div className="flex flex-col gap-2 py-2 font-mono text-xs">
                            <span className="font-semibold text-amber-200">Eigenvalues Spectrum:</span>
                            {decompResult.data.map((val: number, idx: number) => (
                              <div key={`eigen-${idx}`} className="flex justify-between border-b border-border/20 py-1">
                                <span>λ_{idx+1}:</span>
                                <span className="font-bold text-amber-300">{val.toFixed(8)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : decompResult ? (
                      <div className="text-center text-xs text-destructive py-6 font-mono">
                        Computation failed. Check matrix elements.
                      </div>
                    ) : (
                      <div className="text-center text-xs text-muted-foreground py-8">
                        Factorize the matrix on the left to see analytical matrix outputs.
                      </div>
                    )}

                    {decompResult && (
                      <div className="flex-grow flex flex-col gap-2 mt-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Trace Log</span>
                        <div className="bg-background/80 border border-border/50 rounded-xl p-3.5 max-h-[220px] overflow-y-auto font-mono text-[10.5px] leading-relaxed text-muted-foreground custom-scrollbar">
                          {decompResult.steps.map((step, idx) => (
                            <div key={`step-${idx}`} className={`py-0.5 ${step.includes("Error") ? "text-destructive" : step.includes("Warning") ? "text-amber-400" : "text-muted-foreground"}`}>
                              &gt; {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================
              NEW TAB: MULTIVARIATE STATISTICS & SVD
              ======================================================== */}
          <TabsContent value="stats" className="mt-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Matrix Dataset entry grid */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl h-full">
                  <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart4 className="w-4.5 h-4.5 text-orange-400" />
                      Multivariate Dataset A
                    </CardTitle>
                    {/* Dimension selectors */}
                    <div className="flex items-center gap-2 text-xs">
                      <span>Samples:</span>
                      <Input
                        type="number"
                        min="2"
                        max="8"
                        value={statsDim.rows}
                        onChange={(e) => setStatsDim({ ...statsDim, rows: Math.min(8, Math.max(2, parseInt(e.target.value) || 2)) })}
                        className="w-12 h-7 px-1.5 text-center font-semibold bg-background border-border/40 focus-visible:ring-orange-500/40 rounded"
                      />
                      <span>Vars:</span>
                      <Input
                        type="number"
                        min="1"
                        max="4"
                        value={statsDim.cols}
                        onChange={(e) => setStatsDim({ ...statsDim, cols: Math.min(4, Math.max(1, parseInt(e.target.value) || 1)) })}
                        className="w-12 h-7 px-1.5 text-center font-semibold bg-background border-border/40 focus-visible:ring-orange-500/40 rounded"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 flex flex-col gap-6 h-[calc(100%-60px)] justify-between">
                    {/* Entry Grid */}
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                      <div
                        className="grid gap-2.5 p-4 border border-border/20 rounded-xl bg-background/40"
                        style={{ gridTemplateColumns: `repeat(${statsDim.cols}, minmax(0, 1fr))` }}
                      >
                        {statsMatrix.map((row, r) =>
                          row.map((val, c) => (
                            <Input
                              key={`stats-${r}-${c}`}
                              type="number"
                              value={val || ""}
                              onChange={(e) => updateStatsValue(r, c, e.target.value)}
                              className="h-9 px-2 text-center font-mono text-sm bg-background border-border/50 focus-visible:ring-orange-500/40 rounded-lg shadow-sm"
                              placeholder={`r${r+1}c${c+1}`}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {/* Solve stats buttons */}
                    <div className="grid grid-cols-2 gap-2 text-xs mt-4">
                      <Button onClick={handleComputeStats} className="bg-orange-600 hover:bg-orange-500 hover:bg-foreground hover:text-orange-600 dark:hover:bg-white dark:hover:text-orange-950 text-white rounded-lg h-9 transition-all duration-300 font-semibold">
                        Compute SD & Covariance
                      </Button>
                      <Button onClick={handleComputeSVD} className="bg-orange-600 hover:bg-orange-500 hover:bg-foreground hover:text-orange-600 dark:hover:bg-white dark:hover:text-orange-950 text-white rounded-lg h-9 transition-all duration-300 font-semibold" title="Requires Square Matrix">
                        Singular Value Decomp (SVD)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Output Results */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl flex flex-col h-full">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-sm font-semibold">Statistics & SVD Spectrum Results</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4 flex-grow overflow-y-auto custom-scrollbar">
                    {statsResult && statsResult.data ? (
                      <div className="border border-orange-500/20 bg-orange-500/5 p-4 rounded-xl flex flex-col gap-4 select-all animate-fadeIn">
                        <span className="text-[11px] font-bold uppercase text-orange-400">Solution Report</span>
                        
                        {statsResult.type === "STATS" && (
                          <div className="flex flex-col gap-3.5 text-xs">
                            <div className="flex justify-between border-b border-border/20 pb-1">
                              <span className="font-semibold text-orange-200">Means:</span>
                              <span className="font-mono text-orange-300">[{statsResult.data.means.map((m:number)=>m.toFixed(4)).join(", ")}]</span>
                            </div>
                            <div className="flex justify-between border-b border-border/20 pb-1">
                              <span className="font-semibold text-orange-200">Standard Deviations (SD):</span>
                              <span className="font-mono text-orange-300">[{statsResult.data.stdevs.map((s:number)=>s.toFixed(4)).join(", ")}]</span>
                            </div>
                            
                            <div className="flex flex-col items-center mt-2.5">
                              <span className="text-[10px] text-muted-foreground mb-1">Covariance Matrix:</span>
                              <Latex math={renderLaTeXMatrix(statsResult.data.covariance)} block />
                            </div>
                            
                            <div className="flex flex-col items-center mt-2">
                              <span className="text-[10px] text-muted-foreground mb-1">Correlation Matrix (R):</span>
                              <Latex math={renderLaTeXMatrix(statsResult.data.correlation)} block />
                            </div>
                          </div>
                        )}

                        {statsResult.type === "SVD" && (
                          <div className="flex flex-col gap-4 items-center text-xs">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground mb-0.5">U Matrix (Orthogonal):</span>
                              <Latex math={renderLaTeXMatrix(statsResult.data.U)} block />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground mb-0.5">Singular Values S:</span>
                              <span className="font-mono text-orange-300 font-bold">[{statsResult.data.S.map((s:number)=>s.toFixed(6)).join(", ")}]</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground mb-0.5">V^T Matrix (Orthogonal):</span>
                              <Latex math={renderLaTeXMatrix(statsResult.data.VT)} block />
                            </div>

                            {/* SVD RECONSTRUCTION VERIFICATION TEST */}
                            <div className="border-t border-dashed border-orange-500/20 pt-4 w-full flex flex-col items-center">
                              <span className="text-[10px] text-orange-300 font-bold mb-2 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                Reconstruction Verification (U * S * V^T)
                              </span>
                              <div className="flex justify-center select-all">
                                <Latex math={renderLaTeXMatrix(getSVDReconstruction(statsResult.data))} block />
                              </div>
                              <span className="text-[9px] text-muted-foreground mt-2 text-center">
                                Matches input matrix A (verifies decomposition accuracy).
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : statsResult ? (
                      <div className="text-center text-xs text-destructive py-6 font-mono">
                        Error solving dataset. See trace steps below.
                      </div>
                    ) : (
                      <div className="text-center text-xs text-muted-foreground py-8">
                        Select an action to calculate multivariate mean/SD or perform SVD.
                      </div>
                    )}

                    {statsResult && (
                      <div className="flex-grow flex flex-col gap-2 mt-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Trace Steps</span>
                        <div className="bg-background/80 border border-border/50 rounded-xl p-3.5 max-h-[180px] overflow-y-auto font-mono text-[10.5px] leading-relaxed text-muted-foreground custom-scrollbar">
                          {statsResult.steps.map((step, idx) => (
                            <div key={`step-${idx}`} className="py-0.5">
                              &gt; {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================
              TAB: GRAPHING
              ======================================================== */}
          <TabsContent value="graphing" className="mt-6">
            <GraphingPanel />
          </TabsContent>

          {/* ========================================================
              NEW TAB: CHAMELEON AI MIND ASSISTANT
              ======================================================== */}
          <TabsContent value="ai" className="mt-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Chat Viewport */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl h-[450px] md:h-[500px] flex flex-col justify-between overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
                      Chameleon AI Mind
                    </CardTitle>
                    <Badge className="bg-indigo-600/25 border-indigo-500/35 text-indigo-300 font-mono text-[9px] uppercase tracking-wide">
                      Local Agent V2
                    </Badge>
                  </CardHeader>
                  
                  {/* Message Stream */}
                  <div className="flex-grow p-4 overflow-y-auto custom-scrollbar space-y-4">
                    {aiMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"} animate-fadeIn`}
                      >
                        <span className="text-[10px] text-muted-foreground mb-1 font-mono">
                          {msg.sender === "user" ? "User Query" : "CHAM-AI Agent"}
                        </span>
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-indigo-600 text-white rounded-tr-none shadow"
                              : "bg-muted/40 border border-border/40 text-foreground rounded-tl-none whitespace-pre-line"
                          }`}
                        >
                          {msg.text}
                          
                          {/* LaTeX renderer block inside AI chat bubble */}
                          {msg.latex && (
                            <div className="mt-3 p-2 bg-background/50 rounded-xl border border-border/30 overflow-x-auto custom-scrollbar flex justify-center text-sm font-semibold">
                              <Latex math={msg.latex} block />
                            </div>
                          )}

                          {/* Quick action execution triggers */}
                          {msg.action && (
                            <div className="mt-3.5 border-t border-border/20 pt-3 flex justify-end">
                              <Button
                                onClick={() => handleAiAction(msg.action)}
                                className="h-7 text-[10px] font-bold bg-indigo-500 hover:bg-white hover:text-indigo-950 text-white rounded-full transition-all duration-300 flex items-center gap-1 shadow"
                              >
                                {msg.action.label}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* AI thinking indicator */}
                    {isAiThinking && (
                      <div className="flex flex-col items-start mr-auto animate-pulse">
                        <span className="text-[10px] text-muted-foreground mb-1 font-mono">CHAM-AI Agent</span>
                        <div className="bg-muted/40 border border-border/40 p-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          <span className="font-mono text-muted-foreground text-[10px]">Evaluating mathematical bounds...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Message Input bar */}
                  <form onSubmit={handleSendAi} className="p-3 border-t border-border/20 bg-muted/10 flex gap-2">
                    <Input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Ask the AI (e.g. solve 3x^2 - x - 2 = 0, plot cos(x), SVD)..."
                      className="bg-background border-border/40 focus-visible:ring-indigo-500/40 rounded-xl text-xs font-mono"
                    />
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 hover:bg-foreground hover:text-indigo-600 dark:hover:bg-white dark:hover:text-indigo-950 text-white rounded-xl text-xs font-bold transition-all duration-300">
                      Query AI
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Heuristics guidelines / Presets */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl h-full flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-3 border-b border-border/20">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="w-4.5 h-4.5 text-primary" />
                        AI Agent Preset Prompts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 flex flex-col gap-3 text-xs">
                      <span className="text-[10px] text-muted-foreground font-mono">Click to load query prompt:</span>
                      
                      <button
                        onClick={() => sendPresetPrompt("solve 3x^2 - x - 2 = 0")}
                        className="w-full text-left p-2.5 rounded-lg border border-border/20 bg-background/50 hover:border-indigo-500/35 hover:bg-indigo-500/5 font-mono text-[10.5px] transition-colors truncate"
                      >
                        &gt; solve 3x^2 - x - 2 = 0
                      </button>

                      <button
                        onClick={() => sendPresetPrompt("plot 2x^2 + sin(x)")}
                        className="w-full text-left p-2.5 rounded-lg border border-border/20 bg-background/50 hover:border-indigo-500/35 hover:bg-indigo-500/5 font-mono text-[10.5px] transition-colors truncate"
                      >
                        &gt; plot 2x^2 + sin(x)
                      </button>

                      <button
                        onClick={() => sendPresetPrompt("SVD of [[4,0],[0,3]]")}
                        className="w-full text-left p-2.5 rounded-lg border border-border/20 bg-background/50 hover:border-indigo-500/35 hover:bg-indigo-500/5 font-mono text-[10.5px] transition-colors truncate"
                      >
                        &gt; SVD of [[4,0],[0,3]]
                      </button>

                      <button
                        onClick={() => sendPresetPrompt("SD of [12, 16, 20, 24, 30]")}
                        className="w-full text-left p-2.5 rounded-lg border border-border/20 bg-background/50 hover:border-indigo-500/35 hover:bg-indigo-500/5 font-mono text-[10.5px] transition-colors truncate"
                      >
                        &gt; SD of [12, 16, 20, 24, 30]
                      </button>
                    </CardContent>
                  </div>
                  <div className="p-4 border-t border-border/20 bg-muted/10 text-[10.5px] text-muted-foreground/80 flex gap-2">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>The assistant compiles prompts locally, using the calculator engines directly to solve natural language queries.</span>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
