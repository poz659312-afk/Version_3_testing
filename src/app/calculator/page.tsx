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

// Mode style definitions matching Chameleon aesthetic
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
  }
};

export default function ChameleonCalcPage() {
  const [activeTab, setActiveTab] = useState<keyof typeof MODE_THEMES>("basic");
  const theme = MODE_THEMES[activeTab] || MODE_THEMES.basic;

  // Lock body scrolling when graphing tab is active to allow smooth canvas panning/zooming
  useEffect(() => {
    if (activeTab === "graphing") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeTab]);

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
      if (isNaN(res)) {
        setCalcResult("Error: Invalid Math Expression");
        return;
      }
      if (!isFinite(res)) {
        setCalcResult("Undefined (Division by Zero)");
        return;
      }
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
      for (let c = 0; c < Math.min(cols, matrixA[0]?.length || 0); c++) {
        newMatrix[r][c] = matrixA[r][c] || 0;
      }
    }
    setMatrixA(newMatrix);
  }, [matrixDimA.rows, matrixDimA.cols]);

  useEffect(() => {
    const { rows, cols } = matrixDimB;
    const newMatrix = MatrixEngine.createZeroMatrix(rows, cols);
    for (let r = 0; r < Math.min(rows, matrixB.length); r++) {
      for (let c = 0; c < Math.min(cols, matrixB[0]?.length || 0); c++) {
        newMatrix[r][c] = matrixB[r][c] || 0;
      }
    }
    setMatrixB(newMatrix);
  }, [matrixDimB.rows, matrixDimB.cols]);

  const updateMatrixValue = (target: "A" | "B", r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0;
    if (target === "A") {
      const updated = matrixA.map((rowArr, rowIndex) =>
        rowIndex === r ? rowArr.map((colVal, colIndex) => (colIndex === c ? num : colVal)) : rowArr
      );
      setMatrixA(updated);
    } else {
      const updated = matrixB.map((rowArr, rowIndex) =>
        rowIndex === r ? rowArr.map((colVal, colIndex) => (colIndex === c ? num : colVal)) : rowArr
      );
      setMatrixB(updated);
    }
  };

  const handleMatrixAdd = () => {
    try {
      const res = MatrixEngine.add(matrixA, matrixB);
      setMatrixResult({ type: "matrix", val: res, latex: renderLaTeXMatrix(res) });
    } catch (err: any) {
      setMatrixResult({ type: "string", val: err.message });
    }
  };

  const handleMatrixSub = () => {
    try {
      const res = MatrixEngine.subtract(matrixA, matrixB);
      setMatrixResult({ type: "matrix", val: res, latex: renderLaTeXMatrix(res) });
    } catch (err: any) {
      setMatrixResult({ type: "string", val: err.message });
    }
  };

  const handleMatrixMul = () => {
    try {
      const res = MatrixEngine.multiply(matrixA, matrixB);
      setMatrixResult({ type: "matrix", val: res, latex: renderLaTeXMatrix(res) });
    } catch (err: any) {
      setMatrixResult({ type: "string", val: err.message });
    }
  };

  const handleMatrixScalarMul = () => {
    try {
      const k = parseFloat(scalarK) || 1;
      const res = MatrixEngine.multiplyScalar(matrixA, k);
      setMatrixResult({ type: "matrix", val: res, latex: renderLaTeXMatrix(res) });
    } catch (err: any) {
      setMatrixResult({ type: "string", val: err.message });
    }
  };

  const handleMatrixDet = (target: "A" | "B") => {
    try {
      const targetMat = target === "A" ? matrixA : matrixB;
      const res = MatrixEngine.determinant(targetMat);
      setMatrixResult({ type: "scalar", val: res, latex: `\\det(${target}) = ${res}` });
    } catch (err: any) {
      setMatrixResult({ type: "string", val: err.message });
    }
  };

  const handleMatrixInv = (target: "A" | "B") => {
    try {
      const targetMat = target === "A" ? matrixA : matrixB;
      const res = MatrixEngine.inverse(targetMat);
      if (!res) {
        setMatrixResult({ type: "string", val: "Matrix is singular (non-invertible, det = 0)" });
        return;
      }
      setMatrixResult({ type: "matrix", val: res, latex: renderLaTeXMatrix(res) });
    } catch (err: any) {
      setMatrixResult({ type: "string", val: err.message });
    }
  };

  const handleMatrixTranspose = (target: "A" | "B") => {
    const targetMat = target === "A" ? matrixA : matrixB;
    const res = MatrixEngine.transpose(targetMat);
    setMatrixResult({ type: "matrix", val: res, latex: renderLaTeXMatrix(res) });
  };

  const handleMatrixTrace = (target: "A" | "B") => {
    try {
      const targetMat = target === "A" ? matrixA : matrixB;
      const res = MatrixEngine.trace(targetMat);
      setMatrixResult({ type: "scalar", val: res, latex: `\\text{tr}(${target}) = ${res}` });
    } catch (err: any) {
      setMatrixResult({ type: "string", val: err.message });
    }
  };

  // ==========================================
  // Matrix Decomposition (LU, QR, Eigen) State
  // ==========================================
  const [decompDim, setDecompDim] = useState(2);
  const [decompMatrix, setDecompMatrix] = useState<MatrixEngine.Matrix>([
    [4, 3],
    [6, 3]
  ]);
  const [decompResult, setDecompResult] = useState<{
    type: "LU" | "QR" | "EIGEN";
    data: any;
    steps: string[];
  } | null>(null);

  useEffect(() => {
    const newMatrix = MatrixEngine.createZeroMatrix(decompDim, decompDim);
    for (let r = 0; r < Math.min(decompDim, decompMatrix.length); r++) {
      for (let c = 0; c < Math.min(decompDim, decompMatrix[0]?.length || 0); c++) {
        newMatrix[r][c] = decompMatrix[r][c] || 0;
      }
    }
    setDecompMatrix(newMatrix);
  }, [decompDim]);

  const updateDecompMatrixValue = (r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0;
    const updated = decompMatrix.map((rowArr, rowIndex) =>
      rowIndex === r ? rowArr.map((colVal, colIndex) => (colIndex === c ? num : colVal)) : rowArr
    );
    setDecompMatrix(updated);
  };

  const handleLUDecomp = () => {
    try {
      const res = MatrixEngine.luDecomposition(decompMatrix);
      setDecompResult({ type: "LU", data: res, steps: res.steps });
    } catch (err: any) {
      setDecompResult({ type: "LU", data: null, steps: [err.message] });
    }
  };

  const handleQRDecomp = () => {
    try {
      const res = MatrixEngine.qrDecomposition(decompMatrix);
      setDecompResult({ type: "QR", data: res, steps: res.steps });
    } catch (err: any) {
      setDecompResult({ type: "QR", data: null, steps: [err.message] });
    }
  };

  const handleEigenvalues = () => {
    try {
      const res = MatrixEngine.computeEigenvalues(decompMatrix);
      setDecompResult({ type: "EIGEN", data: res, steps: ["Computed QR Algorithm Eigenvalues spectrum"] });
    } catch (err: any) {
      setDecompResult({ type: "EIGEN", data: null, steps: [err.message] });
    }
  };

  const renderLaTeXMatrix = (matrix: MatrixEngine.Matrix): string => {
    if (!matrix || matrix.length === 0) return "";
    const rowsStr = matrix.map((row) => row.map((cell) => cell.toFixed(4).replace(/\.?0+$/, "")).join(" & ")).join(" \\\\ ");
    return `\\begin{bmatrix} ${rowsStr} \\end{bmatrix}`;
  };

  // ==========================================
  // Multivariate Statistics & SVD State
  // ==========================================
  const [statsDim, setStatsDim] = useState({ rows: 3, cols: 2 });
  const [statsMatrix, setStatsMatrix] = useState<MatrixEngine.Matrix>([
    [1, 2],
    [3, 4],
    [5, 6]
  ]);
  const [statsResult, setStatsResult] = useState<{
    type: "STATS" | "SVD";
    data: any;
    steps: string[];
  } | null>(null);

  useEffect(() => {
    const newMatrix = MatrixEngine.createZeroMatrix(statsDim.rows, statsDim.cols);
    for (let r = 0; r < Math.min(statsDim.rows, statsMatrix.length); r++) {
      for (let c = 0; c < Math.min(statsDim.cols, statsMatrix[0]?.length || 0); c++) {
        newMatrix[r][c] = statsMatrix[r][c] || 0;
      }
    }
    setStatsMatrix(newMatrix);
  }, [statsDim.rows, statsDim.cols]);

  const updateStatsValue = (r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0;
    const updated = statsMatrix.map((rowArr, rowIndex) =>
      rowIndex === r ? rowArr.map((colVal, colIndex) => (colIndex === c ? num : colVal)) : rowArr
    );
    setStatsMatrix(updated);
  };

  const handleComputeStats = () => {
    try {
      const res = MatrixEngine.computeMultivariateStats(statsMatrix);
      setStatsResult({ type: "STATS", data: res, steps: res.steps });
    } catch (err: any) {
      setStatsResult({ type: "STATS", data: null, steps: [err.message] });
    }
  };

  const handleComputeSVD = () => {
    try {
      const res = MatrixEngine.svd(statsMatrix);
      setStatsResult({ type: "SVD", data: res, steps: res.steps });
    } catch (err: any) {
      setStatsResult({ type: "SVD", data: null, steps: [err.message] });
    }
  };

  const getSVDReconstruction = (data: any): MatrixEngine.Matrix => {
    if (!data || !data.U || !data.S || !data.VT) return [];
    const { U, S, VT } = data;
    const Sigma = MatrixEngine.createZeroMatrix(U.length, VT.length);
    for (let i = 0; i < Math.min(U.length, VT.length, S.length); i++) {
      Sigma[i][i] = S[i];
    }
    const US = MatrixEngine.multiply(U, Sigma);
    return MatrixEngine.multiply(US, VT);
  };

  return (
    <main className={`min-h-screen bg-gradient-to-b ${theme.bgGradient} transition-all duration-700 ease-in-out py-8 px-4 md:px-8 relative overflow-hidden`}>
      {/* Decorative Blur Backgrounds */}
      <div className={`absolute top-1/4 left-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-${theme.primary}/10 rounded-full blur-[80px] -z-10 pointer-events-none transition-colors duration-700`} />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-purple-500/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Title Header with Logo */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-4">
            <ChameleonLogo size={58} />
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
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-1.5 bg-muted/40 border border-border/30 p-1.5 rounded-xl h-auto backdrop-blur">
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
          </TabsList>

          {/* ========================================================
              TAB: BASIC MATH
              ======================================================== */}
          <TabsContent value="basic" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Display & Keypad */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span>Interactive Expression Sandbox</span>
                      <span className="text-[10px] text-muted-foreground font-mono">KaTeX Live Preview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4">
                    {/* Expression Input */}
                    <div className="relative">
                      <Input
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        placeholder="Type math expression (e.g. 25 * (4 + 3)^2 - sqrt(144))..."
                        className="bg-background/80 border-border/40 focus-visible:ring-emerald-500/40 text-base md:text-lg font-mono tracking-wide h-12 pr-10 rounded-xl"
                      />
                      {expression && (
                        <button
                          onClick={handleClear}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <Delete className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* KaTeX Live Math Preview & Output */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-background/60 border border-border/30 rounded-xl p-4 min-h-[90px] flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">LaTeX Render</span>
                        <div className="text-sm md:text-base overflow-x-auto custom-scrollbar font-serif text-emerald-400 py-1">
                          {latexExpr ? <Latex math={latexExpr} block /> : <span className="text-muted-foreground/40 italic">Live math formatting...</span>}
                        </div>
                      </div>

                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 min-h-[90px] flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-400">Result</span>
                        <div className="text-xl md:text-2xl font-bold font-mono text-emerald-300 overflow-x-auto custom-scrollbar">
                          {calcResult !== "" ? calcResult : <span className="text-muted-foreground/40 text-base">Press = or Enter</span>}
                        </div>
                      </div>
                    </div>

                    {/* Standard Keypad Grid */}
                    <div className="grid grid-cols-4 gap-2.5 pt-2">
                      {["C", "(", ")", "/"].map((btn) => (
                        <Button
                          key={btn}
                          onClick={() => (btn === "C" ? handleClear() : handleKeypadPress(btn))}
                          className={
                            btn === "C"
                              ? "bg-red-500/25 hover:bg-red-500/40 text-red-300 border border-red-500/40 text-lg font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all"
                              : btn === "/"
                              ? "bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 text-xl font-black shadow-md hover:scale-105 active:scale-95 transition-all"
                              : "bg-zinc-800/90 hover:bg-emerald-500/20 text-emerald-300 border border-zinc-700/60 text-lg font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all"
                          }
                        >
                          {btn}
                        </Button>
                      ))}
                      {["7", "8", "9", "*"].map((btn) => (
                        <Button
                          key={btn}
                          onClick={() => handleKeypadPress(btn)}
                          className={
                            btn === "*"
                              ? "bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 text-xl font-black shadow-md hover:scale-105 active:scale-95 transition-all"
                              : "bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-700/60 text-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                          }
                        >
                          {btn}
                        </Button>
                      ))}
                      {["4", "5", "6", "-"].map((btn) => (
                        <Button
                          key={btn}
                          onClick={() => handleKeypadPress(btn)}
                          className={
                            btn === "-"
                              ? "bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 text-xl font-black shadow-md hover:scale-105 active:scale-95 transition-all"
                              : "bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-700/60 text-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                          }
                        >
                          {btn}
                        </Button>
                      ))}
                      {["1", "2", "3", "+"].map((btn) => (
                        <Button
                          key={btn}
                          onClick={() => handleKeypadPress(btn)}
                          className={
                            btn === "+"
                              ? "bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 text-xl font-black shadow-md hover:scale-105 active:scale-95 transition-all"
                              : "bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-700/60 text-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                          }
                        >
                          {btn}
                        </Button>
                      ))}
                      {["0", ".", "^", "="].map((btn) => (
                        <Button
                          key={btn}
                          onClick={() => (btn === "=" ? handleEvaluate() : handleKeypadPress(btn))}
                          className={
                            btn === "="
                              ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-2xl font-black shadow-lg shadow-emerald-500/25 border border-emerald-400 hover:scale-105 active:scale-95 transition-all"
                              : btn === "^"
                              ? "bg-zinc-800/90 hover:bg-emerald-500/20 text-emerald-300 border border-zinc-700/60 text-lg font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all"
                              : "bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-700/60 text-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                          }
                        >
                          {btn}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Math History Panel */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl flex flex-col h-full">
                  <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-400" />
                      Session History
                    </CardTitle>
                    {mathHistory.length > 0 && (
                      <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-red-400 flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-2 flex-grow overflow-y-auto max-h-[400px] custom-scrollbar">
                    {mathHistory.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-8">
                        No calculations performed yet.
                      </div>
                    ) : (
                      mathHistory.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setExpression(item.expr);
                            setCalcResult(item.result);
                          }}
                          className="p-3 bg-background/50 border border-border/30 rounded-xl hover:border-emerald-500/40 cursor-pointer transition-all flex flex-col gap-1 text-xs"
                        >
                          <div className="flex justify-between text-muted-foreground font-mono text-[10px]">
                            <span>{item.expr}</span>
                            <span className="text-emerald-400 font-bold">{item.result}</span>
                          </div>
                          <div className="text-foreground font-serif pt-1">
                            <Latex math={`${item.latex} = ${item.result}`} />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================
              TAB: ADVANCED MATH
              ======================================================== */}
          <TabsContent value="advanced" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Input & Scientific Pad */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span>Scientific & Transcendental Functions</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsHyperbolic(!isHyperbolic)}
                        className={`text-[10px] h-7 px-2.5 rounded-lg border-violet-500/30 ${isHyperbolic ? "bg-violet-500/20 text-violet-300" : ""}`}
                      >
                        {isHyperbolic ? "Hyperbolic (sinh, cosh)" : "Trig (sin, cos)"}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4">
                    {/* Expression Bar */}
                    <div className="relative">
                      <Input
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        placeholder="Type function (e.g. sin(pi/4) + ln(e^2) + sqrt(16))..."
                        className="bg-background/80 border-border/40 focus-visible:ring-violet-500/40 text-base md:text-lg font-mono tracking-wide h-12 pr-10 rounded-xl"
                      />
                      {expression && (
                        <button
                          onClick={handleClear}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <Delete className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Preview / Result cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-background/60 border border-border/30 rounded-xl p-4 min-h-[90px] flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">LaTeX Expression</span>
                        <div className="text-sm md:text-base overflow-x-auto custom-scrollbar font-serif text-violet-400 py-1">
                          {latexExpr ? <Latex math={latexExpr} block /> : <span className="text-muted-foreground/40 italic">Transcendental math preview...</span>}
                        </div>
                      </div>

                      <div className="bg-violet-950/20 border border-violet-500/30 rounded-xl p-4 min-h-[90px] flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-bold text-violet-400">Calculated Value</span>
                        <div className="text-xl md:text-2xl font-bold font-mono text-violet-300 overflow-x-auto custom-scrollbar">
                          {calcResult !== "" ? calcResult : <span className="text-muted-foreground/40 text-base">Press Evaluate</span>}
                        </div>
                      </div>
                    </div>

                    {/* Scientific Functions Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-2">
                      {(isHyperbolic
                        ? ["sinh(", "cosh(", "tanh(", "asinh(", "acosh(", "atanh("]
                        : ["sin(", "cos(", "tan(", "asin(", "acos(", "atan("]
                      ).map((fnName) => (
                        <Button
                          key={fnName}
                          onClick={() => handleKeypadPress(fnName)}
                          className="bg-violet-500/20 hover:bg-violet-500/35 text-violet-300 border border-violet-500/40 font-mono text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all py-2.5"
                        >
                          {fnName.replace("(", "")}
                        </Button>
                      ))}

                      {["sqrt(", "ln(", "log(", "exp(", "abs(", "^"].map((fnName) => (
                        <Button
                          key={fnName}
                          onClick={() => handleKeypadPress(fnName)}
                          className="bg-zinc-800/90 hover:bg-violet-500/20 text-zinc-100 hover:text-violet-300 border border-zinc-700/60 font-mono text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all py-2.5"
                        >
                          {fnName.replace("(", "")}
                        </Button>
                      ))}

                      {["pi", "e", "(", ")", "%", "C"].map((item) => (
                        <Button
                          key={item}
                          onClick={() => (item === "C" ? handleClear() : handleKeypadPress(item))}
                          className={
                            item === "C"
                              ? "bg-red-500/25 hover:bg-red-500/40 text-red-300 border border-red-500/40 font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all"
                              : "bg-zinc-800/90 hover:bg-violet-500/20 text-zinc-100 hover:text-violet-300 border border-zinc-700/60 font-mono text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                          }
                        >
                          {item}
                        </Button>
                      ))}
                    </div>

                    <Button
                      onClick={handleEvaluate}
                      className="bg-violet-600 hover:bg-violet-500 hover:bg-foreground hover:text-violet-600 dark:hover:bg-white dark:hover:text-violet-950 text-white font-extrabold border border-violet-400 h-11 text-base rounded-xl mt-2"
                    >
                      Compute Advanced Result
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Side Reference Info */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl flex flex-col h-full justify-between">
                  <div>
                    <CardHeader className="pb-3 border-b border-border/20">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Info className="w-4 h-4 text-violet-400" />
                        Supported Syntax Reference
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 flex flex-col gap-3 text-xs leading-relaxed text-muted-foreground">
                      <p>
                        Chameleon Math Engine uses full Shunting-Yard tokenization with precedence matching.
                      </p>
                      <ul className="space-y-2 list-disc list-inside font-mono text-[11px]">
                        <li>Trig: <span className="text-violet-300">sin(x), cos(x), tan(x)</span></li>
                        <li>Inverse: <span className="text-violet-300">asin(x), acos(x), atan(x)</span></li>
                        <li>Logarithms: <span className="text-violet-300">ln(x) [base e], log(x) [base 10]</span></li>
                        <li>Constants: <span className="text-violet-300">pi = 3.14159..., e = 2.71828...</span></li>
                      </ul>
                    </CardContent>
                  </div>
                  <div className="p-4 border-t border-border/20 bg-muted/10 text-[10.5px] text-muted-foreground/80 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                    <span>Real-time KaTeX rendering converts your expressions to academic typesetting.</span>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================
              TAB: LINEAR ALGEBRA
              ======================================================== */}
          <TabsContent value="matrix" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Matrix Controllers A & B */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                {/* Matrix A */}
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl">
                  <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-cyan-400">Matrix A</CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-mono">Dim:</span>
                      <select
                        value={matrixDimA.rows}
                        onChange={(e) => setMatrixDimA({ ...matrixDimA, rows: parseInt(e.target.value) })}
                        className="bg-background border border-border/40 rounded px-1.5 py-0.5 font-mono"
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <span>x</span>
                      <select
                        value={matrixDimA.cols}
                        onChange={(e) => setMatrixDimA({ ...matrixDimA, cols: parseInt(e.target.value) })}
                        className="bg-background border border-border/40 rounded px-1.5 py-0.5 font-mono"
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4">
                    {/* Input Grid */}
                    <div
                      className="grid gap-2 justify-center"
                      style={{ gridTemplateColumns: `repeat(${matrixDimA.cols}, minmax(0, 1fr))` }}
                    >
                      {matrixA.map((rowArr, r) =>
                        rowArr.map((val, c) => (
                          <Input
                            key={`A-${r}-${c}`}
                            type="number"
                            value={val}
                            onChange={(e) => updateMatrixValue("A", r, c, e.target.value)}
                            className="bg-background border-cyan-500/30 text-center font-mono text-sm h-10 focus-visible:ring-cyan-500/40 rounded-lg"
                          />
                        ))
                      )}
                    </div>
                    {/* Quick Single Operations */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button onClick={() => handleMatrixDet("A")} variant="outline" size="sm" className="text-xs h-8 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20">
                        det(A)
                      </Button>
                      <Button onClick={() => handleMatrixInv("A")} variant="outline" size="sm" className="text-xs h-8 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20">
                        A⁻¹ (Inverse)
                      </Button>
                      <Button onClick={() => handleMatrixTranspose("A")} variant="outline" size="sm" className="text-xs h-8 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20">
                        Aᵀ (Transpose)
                      </Button>
                      <Button onClick={() => handleMatrixTrace("A")} variant="outline" size="sm" className="text-xs h-8 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20">
                        tr(A)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Matrix B */}
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl">
                  <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-cyan-400">Matrix B</CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-mono">Dim:</span>
                      <select
                        value={matrixDimB.rows}
                        onChange={(e) => setMatrixDimB({ ...matrixDimB, rows: parseInt(e.target.value) })}
                        className="bg-background border border-border/40 rounded px-1.5 py-0.5 font-mono"
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <span>x</span>
                      <select
                        value={matrixDimB.cols}
                        onChange={(e) => setMatrixDimB({ ...matrixDimB, cols: parseInt(e.target.value) })}
                        className="bg-background border border-border/40 rounded px-1.5 py-0.5 font-mono"
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4">
                    {/* Input Grid */}
                    <div
                      className="grid gap-2 justify-center"
                      style={{ gridTemplateColumns: `repeat(${matrixDimB.cols}, minmax(0, 1fr))` }}
                    >
                      {matrixB.map((rowArr, r) =>
                        rowArr.map((val, c) => (
                          <Input
                            key={`B-${r}-${c}`}
                            type="number"
                            value={val}
                            onChange={(e) => updateMatrixValue("B", r, c, e.target.value)}
                            className="bg-background border-cyan-500/30 text-center font-mono text-sm h-10 focus-visible:ring-cyan-500/40 rounded-lg"
                          />
                        ))
                      )}
                    </div>
                    {/* Binary Operations Controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/20">
                      <Button onClick={handleMatrixAdd} size="sm" className="bg-cyan-600 hover:bg-cyan-500 hover:bg-foreground hover:text-cyan-600 dark:hover:bg-white dark:hover:text-cyan-950 text-white font-bold h-8 text-xs">
                        A + B
                      </Button>
                      <Button onClick={handleMatrixSub} size="sm" className="bg-cyan-600 hover:bg-cyan-500 hover:bg-foreground hover:text-cyan-600 dark:hover:bg-white dark:hover:text-cyan-950 text-white font-bold h-8 text-xs">
                        A - B
                      </Button>
                      <Button onClick={handleMatrixMul} size="sm" className="bg-cyan-600 hover:bg-cyan-500 hover:bg-foreground hover:text-cyan-600 dark:hover:bg-white dark:hover:text-cyan-950 text-white font-bold h-8 text-xs">
                        A × B
                      </Button>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <Input
                          type="number"
                          value={scalarK}
                          onChange={(e) => setScalarK(e.target.value)}
                          className="w-14 h-8 bg-background text-center font-mono text-xs rounded"
                        />
                        <Button onClick={handleMatrixScalarMul} variant="outline" size="sm" className="text-xs h-8 border-cyan-500/30 text-cyan-300">
                          k × A
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Output Display */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl flex flex-col h-full">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-sm font-semibold">Matrix Engine Output</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col justify-center items-center flex-grow min-h-[250px]">
                    {matrixResult ? (
                      <div className="flex flex-col items-center gap-4 w-full select-all">
                        <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">Evaluation Solution</span>
                        {matrixResult.latex ? (
                          <div className="text-xl overflow-x-auto custom-scrollbar py-4 max-w-full text-center">
                            <Latex math={matrixResult.latex} block />
                          </div>
                        ) : (
                          <div className="font-mono text-lg text-cyan-300">{String(matrixResult.val)}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-xs text-muted-foreground py-12">
                        Perform a matrix operation to see the KaTeX formatted output.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================
              TAB: MATRIX DECOMPOSITION
              ======================================================== */}
          <TabsContent value="decomposition" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Input Matrix Setup */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl">
                  <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-amber-400">Square Matrix A (n × n)</CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-mono">Dimension n:</span>
                      <select
                        value={decompDim}
                        onChange={(e) => setDecompDim(parseInt(e.target.value))}
                        className="bg-background border border-border/40 rounded px-1.5 py-0.5 font-mono"
                      >
                        {[2, 3, 4].map((n) => (
                          <option key={n} value={n}>{n}x{n}</option>
                        ))}
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4">
                    {/* Matrix Grid */}
                    <div
                      className="grid gap-2 justify-center"
                      style={{ gridTemplateColumns: `repeat(${decompDim}, minmax(0, 1fr))` }}
                    >
                      {decompMatrix.map((rowArr, r) =>
                        rowArr.map((val, c) => (
                          <Input
                            key={`D-${r}-${c}`}
                            type="number"
                            value={val}
                            onChange={(e) => updateDecompMatrixValue(r, c, e.target.value)}
                            className="bg-background border-amber-500/30 text-center font-mono text-sm h-11 focus-visible:ring-amber-500/40 rounded-lg"
                          />
                        ))
                      )}
                    </div>

                    {/* Decomposition triggers */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <Button onClick={handleLUDecomp} className="bg-amber-600 hover:bg-amber-500 hover:bg-foreground hover:text-amber-600 dark:hover:bg-white dark:hover:text-amber-950 text-white rounded-lg h-9 transition-all duration-300 font-semibold">
                        LU Factorization
                      </Button>
                      <Button onClick={handleQRDecomp} className="bg-amber-600 hover:bg-amber-500 hover:bg-foreground hover:text-amber-600 dark:hover:bg-white dark:hover:text-amber-950 text-white rounded-lg h-9 transition-all duration-300 font-semibold">
                        Gram-Schmidt QR
                      </Button>
                      <Button onClick={handleEigenvalues} className="bg-amber-600 hover:bg-amber-500 hover:bg-foreground hover:text-amber-600 dark:hover:bg-white dark:hover:text-amber-950 text-white rounded-lg h-9 transition-all duration-300 font-semibold">
                        QR Eigenvalues
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Step-by-Step walkthrough log & Factor Output */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl flex flex-col h-full">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-sm font-semibold">Decomposition Solution & Trace Log</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4 flex-grow overflow-y-auto custom-scrollbar">
                    {decompResult && decompResult.data ? (
                      <div className="border border-amber-500/20 bg-amber-500/5 p-4 rounded-xl flex flex-col gap-4 select-all animate-fadeIn">
                        <span className="text-[10px] font-bold uppercase text-amber-400">Result Matrices</span>
                        
                        {decompResult.type === "LU" && (
                          <div className="flex flex-col md:flex-row justify-around items-center gap-4">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground mb-1">Lower Triangular (L):</span>
                              <Latex math={renderLaTeXMatrix(decompResult.data.L)} block />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground mb-1">Upper Triangular (U):</span>
                              <Latex math={renderLaTeXMatrix(decompResult.data.U)} block />
                            </div>
                          </div>
                        )}

                        {decompResult.type === "QR" && (
                          <div className="flex flex-col md:flex-row justify-around items-center gap-4">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground mb-1">Orthogonal (Q):</span>
                              <Latex math={renderLaTeXMatrix(decompResult.data.Q)} block />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground mb-1">Upper Triangular (R):</span>
                              <Latex math={renderLaTeXMatrix(decompResult.data.R)} block />
                            </div>
                          </div>
                        )}

                        {decompResult.type === "EIGEN" && (
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">Computed Real Eigenvalues:</span>
                            <div className="font-mono text-base font-bold text-amber-300">
                              λ = [{decompResult.data.map((x: number) => x.toFixed(5)).join(", ")}]
                            </div>
                          </div>
                        )}
                      </div>
                    ) : decompResult ? (
                      <div className="text-center text-xs text-destructive py-6 font-mono">
                        Error performing decomposition. See log below.
                      </div>
                    ) : (
                      <div className="text-center text-xs text-muted-foreground py-8">
                        Select a decomposition algorithm above to view step-by-step trace logs.
                      </div>
                    )}

                    {decompResult && (
                      <div className="flex-grow flex flex-col gap-2 mt-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Algorithm Step Log</span>
                        <div className="bg-background/80 border border-border/50 rounded-xl p-3.5 max-h-[220px] overflow-y-auto font-mono text-[10.5px] leading-relaxed text-muted-foreground custom-scrollbar">
                          {decompResult.steps.map((step, idx) => (
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
              TAB: MULTIVARIATE STATS & SVD
              ======================================================== */}
          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Data Matrix Configuration */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl">
                  <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-orange-400">Dataset Matrix X (n × p)</CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-mono">Size:</span>
                      <select
                        value={statsDim.rows}
                        onChange={(e) => setStatsDim({ ...statsDim, rows: parseInt(e.target.value) })}
                        className="bg-background border border-border/40 rounded px-1.5 py-0.5 font-mono"
                      >
                        {[2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n} rows</option>
                        ))}
                      </select>
                      <span>x</span>
                      <select
                        value={statsDim.cols}
                        onChange={(e) => setStatsDim({ ...statsDim, cols: parseInt(e.target.value) })}
                        className="bg-background border border-border/40 rounded px-1.5 py-0.5 font-mono"
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>{n} vars</option>
                        ))}
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4">
                    {/* Dataset Input Grid */}
                    <div
                      className="grid gap-2 justify-center"
                      style={{ gridTemplateColumns: `repeat(${statsDim.cols}, minmax(0, 1fr))` }}
                    >
                      {statsMatrix.map((rowArr, r) =>
                        rowArr.map((val, c) => (
                          <Input
                            key={`S-${r}-${c}`}
                            type="number"
                            value={val}
                            onChange={(e) => updateStatsValue(r, c, e.target.value)}
                            className="bg-background border-orange-500/30 text-center font-mono text-sm h-10 focus-visible:ring-orange-500/40 rounded-lg"
                          />
                        ))
                      )}
                    </div>

                    {/* Stat buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button onClick={handleComputeStats} className="bg-orange-600 hover:bg-orange-500 hover:bg-foreground hover:text-orange-600 dark:hover:bg-white dark:hover:text-orange-950 text-white rounded-lg h-9 transition-all duration-300 font-semibold">
                        Multivariate Stats (Mean/SD/Cov)
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
                <Card className="border border-border/40 shadow-lg bg-card/60 backdrop-blur-xl flex flex-col h-full">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-sm font-semibold">Statistics & SVD Spectrum Results</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-4 flex-grow overflow-y-auto custom-scrollbar">
                    {statsResult && statsResult.data ? (
                      <div className="border border-orange-500/20 bg-orange-500/5 p-4 rounded-xl flex flex-col gap-4 select-all animate-fadeIn">
                        <span className="text-[10px] font-bold uppercase text-orange-400">Solution Report</span>
                        
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
        </Tabs>
      </div>
    </main>
  );
}
