// src/components/chameleon-calc/GraphingPanel.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, RotateCcw, ZoomIn, ZoomOut, Info, Settings, ToggleLeft, ToggleRight, Eye, EyeOff } from "lucide-react";
import { tokenize, processUnary, shuntingYard, evaluateRPN, rpnToLaTeX, insertImplicitMultiplication } from "./MathEngine";

interface FunctionItem {
  id: string;
  expr: string;
  color: string;
  visible: boolean;
  rpn?: string[];
  latex?: string;
  error?: string;
}

const PRESET_COLORS = [
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EF4444", // Red
];

export default function GraphingPanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Math bounds state
  const [bounds, setBounds] = useState({
    xMin: -10,
    xMax: 10,
    yMin: -6,
    yMax: 6,
  });

  const [functions, setFunctions] = useState<FunctionItem[]>([
    { id: "1", expr: "sin(x)", color: PRESET_COLORS[0], visible: true },
    { id: "2", expr: "cos(2*x)", color: PRESET_COLORS[1], visible: true },
  ]);
  
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; py: number; px: number; color: string } | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showTrace, setShowTrace] = useState(true);

  useEffect(() => {
    const handlePreload = () => {
      const graphExpr = localStorage.getItem("chameleon_calc_preload_graph");
      if (graphExpr) {
        setFunctions((prev) => {
          const updated = [...prev];
          updated[0] = { ...updated[0], expr: graphExpr, visible: true };
          return updated;
        });
        localStorage.removeItem("chameleon_calc_preload_graph");
      }
    };
    handlePreload();
    window.addEventListener("chameleon_calc_preload", handlePreload);
    return () => window.removeEventListener("chameleon_calc_preload", handlePreload);
  }, []);

  // Mouse pan state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragBounds = useRef({ xMin: -10, xMax: 10, yMin: -6, yMax: 6 });

  // Update RPN & LaTeX whenever functions change
  const processedFunctions = functions.map(fn => {
    if (!fn.expr.trim()) {
      return { ...fn, rpn: [], latex: "", error: undefined };
    }
    try {
      const tokens = tokenize(fn.expr);
      const withImplicit = insertImplicitMultiplication(tokens);
      const processed = processUnary(withImplicit);
      const rpn = shuntingYard(processed);
      const latex = rpnToLaTeX(rpn);
      return { ...fn, rpn, latex, error: undefined };
    } catch (err: any) {
      return { ...fn, rpn: undefined, latex: "", error: err.message || "Parse Error" };
    }
  });

  // Calculate beautiful grid steps
  const getGridStep = (range: number): number => {
    const rough = range / 10;
    const power = Math.pow(10, Math.floor(Math.log10(rough)));
    const ratio = rough / power;
    if (ratio < 1.5) return power;
    if (ratio < 3.5) return 2 * power;
    if (ratio < 7.5) return 5 * power;
    return 10 * power;
  };

  // Redraw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const { xMin, xMax, yMin, yMax } = bounds;

    // Coordinate conversions
    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;
    const toMathX = (sx: number) => xMin + (sx / width) * (xMax - xMin);
    const toMathY = (sy: number) => yMax - (sy / height) * (yMax - yMin);

    // Style properties based on dark mode
    const bgColor = isDark ? "#0A0A0A" : "#FFFFFF";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.05)";
    const axisColor = isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)";
    const textColor = isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)";

    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const xStep = getGridStep(xRange);
    const yStep = getGridStep(yRange);

    // 1. Draw Grid Lines
    if (showGrid) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = gridColor;
      ctx.font = "10px monospace";
      ctx.fillStyle = textColor;

      // Vertical lines
      const startX = Math.ceil(xMin / xStep) * xStep;
      for (let x = startX; x <= xMax; x += xStep) {
        // Prevent floating point errors
        const cleanX = Number(x.toFixed(10));
        const sx = toScreenX(cleanX);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();

        // Draw label text near the horizontal axis
        if (cleanX !== 0) {
          const sy = Math.max(10, Math.min(height - 10, toScreenY(0) + 15));
          ctx.fillText(cleanX.toString(), sx - 8, sy);
        }
      }

      // Horizontal lines
      const startY = Math.ceil(yMin / yStep) * yStep;
      for (let y = startY; y <= yMax; y += yStep) {
        const cleanY = Number(y.toFixed(10));
        const sy = toScreenY(cleanY);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();

        // Draw label text near the vertical axis
        if (cleanY !== 0) {
          const sx = Math.max(10, Math.min(width - 25, toScreenX(0) + 5));
          ctx.fillText(cleanY.toString(), sx, sy + 3);
        }
      }
    }

    // 2. Draw Main Axes
    ctx.lineWidth = 2;
    ctx.strokeStyle = axisColor;
    
    // X Axis
    const xAxisY = toScreenY(0);
    ctx.beginPath();
    ctx.moveTo(0, xAxisY);
    ctx.lineTo(width, xAxisY);
    ctx.stroke();

    // Y Axis
    const yAxisX = toScreenX(0);
    ctx.beginPath();
    ctx.moveTo(yAxisX, 0);
    ctx.lineTo(yAxisX, height);
    ctx.stroke();

    // Zero label
    if (xMin < 0 && xMax > 0 && yMin < 0 && yMax > 0) {
      ctx.fillText("0", yAxisX - 10, xAxisY + 12);
    }

    // 3. Draw Functions
    processedFunctions.forEach((fn) => {
      if (!fn.visible || !fn.rpn || fn.rpn.length === 0) return;

      ctx.lineWidth = 3;
      ctx.strokeStyle = fn.color;
      ctx.beginPath();

      let lastValid = false;
      let lastMathY = 0;

      // Draw pixel by pixel
      for (let sx = 0; sx < width; sx++) {
        const x = toMathX(sx);
        try {
          const y = evaluateRPN(fn.rpn, { x });
          
          if (isNaN(y) || !isFinite(y)) {
            lastValid = false;
            continue;
          }

          const sy = toScreenY(y);

          // Asymptote / Discontinuity protection (e.g. for tan(x))
          // If the math distance is extremely large and sign changes, break line
          const diffY = Math.abs(y - lastMathY);
          const signChange = (y > 0 && lastMathY < 0) || (y < 0 && lastMathY > 0);
          
          if (lastValid && diffY > yRange * 1.5 && signChange) {
            ctx.stroke(); // Draw current segment
            ctx.beginPath(); // Start new segment
            ctx.moveTo(sx, sy);
          } else {
            if (!lastValid) {
              ctx.moveTo(sx, sy);
            } else {
              ctx.lineTo(sx, sy);
            }
          }

          lastMathY = y;
          lastValid = true;
        } catch {
          lastValid = false;
        }
      }
      ctx.stroke();
    });

    // 4. Draw Hover/Tracing point
    if (showTrace && hoverCoord) {
      ctx.beginPath();
      ctx.arc(hoverCoord.px, hoverCoord.py, 6, 0, 2 * Math.PI);
      ctx.fillStyle = hoverCoord.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isDark ? "#fff" : "#000";
      ctx.stroke();

      // Horizontal dashed guide line to Y axis
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = hoverCoord.color + "66"; // opacity
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(toScreenX(0), hoverCoord.py);
      ctx.lineTo(hoverCoord.px, hoverCoord.py);
      ctx.moveTo(hoverCoord.px, toScreenY(0));
      ctx.lineTo(hoverCoord.px, hoverCoord.py);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }
  }, [bounds, functions, showGrid, showTrace, hoverCoord, isDark]);

  // Handle Resize and Initial Draw
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Responsive sizing matching parent aspect ratio
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = Math.max(350, Math.min(parent.clientWidth * 0.6, 500));
      }
      draw();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    
    // Check system preference dark theme
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(darkThemeMq.matches);

    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  // Track hover coordinate
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isDragging.current) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const { xMin, xMax, yMin, yMax } = bounds;
    const mathX = xMin + (px / canvas.width) * (xMax - xMin);

    // Find nearest function value
    let bestFit: typeof hoverCoord = null;
    let minDistance = Infinity;

    processedFunctions.forEach((fn) => {
      if (!fn.visible || !fn.rpn || fn.rpn.length === 0) return;
      try {
        const valY = evaluateRPN(fn.rpn, { x: mathX });
        if (isNaN(valY) || !isFinite(valY)) return;

        const screenY = canvas.height - ((valY - yMin) / (yMax - yMin)) * canvas.height;
        const dist = Math.abs(screenY - py);
        
        if (dist < 40 && dist < minDistance) {
          minDistance = dist;
          bestFit = {
            x: mathX,
            y: valY,
            px: px,
            py: screenY,
            color: fn.color,
          };
        }
      } catch {}
    });

    setHoverCoord(bestFit);
  };

  // Drag (panning) handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Left click only
    const canvas = canvasRef.current;
    if (!canvas) return;

    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragBounds.current = { ...bounds };
    canvas.style.cursor = "grabbing";
  };

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    const width = canvas.width;
    const height = canvas.height;

    const b = dragBounds.current;
    const xSpan = b.xMax - b.xMin;
    const ySpan = b.yMax - b.yMin;

    const mathDx = (dx / width) * xSpan;
    const mathDy = (dy / height) * ySpan;

    setBounds({
      xMin: b.xMin - mathDx,
      xMax: b.xMax - mathDx,
      yMin: b.yMin + mathDy,
      yMax: b.yMax + mathDy,
    });
  }, []);

  const handleGlobalMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = "crosshair";
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  // Zooming via scroll wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const { xMin, xMax, yMin, yMax } = bounds;
    const mouseMathX = xMin + (px / canvas.width) * (xMax - xMin);
    const mouseMathY = yMax - (py / canvas.height) * (yMax - yMin);

    // Zoom multiplier (scroll up is negative = zoom in)
    const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;
    
    // Keep zoom within bounds to prevent numeric explosions
    const nextXSpan = (xMax - xMin) * zoomFactor;
    if (nextXSpan < 0.001 || nextXSpan > 100000) return;

    // Recenter zoom on mouse pointer
    const newXMin = mouseMathX - (px / canvas.width) * nextXSpan;
    const newXMax = newXMin + nextXSpan;

    const nextYSpan = (yMax - yMin) * zoomFactor;
    const newYMin = mouseMathY - ((canvas.height - py) / canvas.height) * nextYSpan;
    const newYMax = newYMin + nextYSpan;

    setBounds({
      xMin: newXMin,
      xMax: newXMax,
      yMin: newYMin,
      yMax: newYMax,
    });
  };

  // Add / Edit functions
  const addFunction = () => {
    const newId = (Date.now()).toString();
    const newColor = PRESET_COLORS[functions.length % PRESET_COLORS.length];
    setFunctions([...functions, { id: newId, expr: "", color: newColor, visible: true }]);
  };

  const removeFunction = (id: string) => {
    if (functions.length === 1) {
      setFunctions([{ id: "1", expr: "", color: PRESET_COLORS[0], visible: true }]);
      return;
    }
    setFunctions(functions.filter((f) => f.id !== id));
  };

  const updateExpression = (id: string, newExpr: string) => {
    setFunctions(functions.map((f) => (f.id === id ? { ...f, expr: newExpr } : f)));
  };

  const toggleVisibility = (id: string) => {
    setFunctions(functions.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)));
  };

  // Zoom Button controls
  const handleZoom = (zoomIn: boolean) => {
    const factor = zoomIn ? 0.7 : 1.4;
    const { xMin, xMax, yMin, yMax } = bounds;
    
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    
    const xSpan = (xMax - xMin) * factor;
    const ySpan = (yMax - yMin) * factor;

    setBounds({
      xMin: xCenter - xSpan / 2,
      xMax: xCenter + xSpan / 2,
      yMin: yCenter - ySpan / 2,
      yMax: yCenter + ySpan / 2,
    });
  };

  const resetView = () => {
    setBounds({ xMin: -10, xMax: 10, yMin: -6, yMax: 6 });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card border border-border/40 p-4 md:p-6 rounded-2xl shadow-xl backdrop-blur-xl">
      {/* List of functions (Left panel) */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Functions
          </h3>
          <Button onClick={addFunction} variant="outline" size="sm" className="h-8 rounded-full border-primary/20 hover:border-primary">
            <Plus className="w-4 h-4 mr-1 text-primary" /> Add
          </Button>
        </div>

        <div className="flex flex-col gap-3 max-h-[300px] lg:max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {processedFunctions.map((fn, index) => (
            <div
              key={fn.id}
              className="group flex flex-col gap-1.5 p-3 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                {/* Indicator block with color picker hint */}
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0 cursor-pointer border border-white/20"
                  style={{ backgroundColor: fn.color }}
                  title="Curve color"
                />
                
                {/* Function text input */}
                <div className="relative flex-grow flex items-center">
                  <span className="absolute left-2.5 text-xs text-muted-foreground font-mono">f{index+1}(x) =</span>
                  <Input
                    value={fn.expr}
                    onChange={(e) => updateExpression(fn.id, e.target.value)}
                    placeholder="x^2 - 3"
                    className="pl-14 pr-8 h-9 font-mono text-sm bg-background border-border/40 focus-visible:ring-primary/40 rounded-lg"
                  />
                </div>

                {/* Hide / Show */}
                <button
                  onClick={() => toggleVisibility(fn.id)}
                  className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title={fn.visible ? "Hide plot" : "Show plot"}
                >
                  {fn.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-destructive" />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeFunction(fn.id)}
                  className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  title="Remove function"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* LaTeX rendering output or error warnings */}
              {fn.error ? (
                <span className="text-[11px] text-destructive pl-6 font-medium">{fn.error}</span>
              ) : fn.latex ? (
                <div className="pl-6 text-xs text-muted-foreground font-mono bg-background/50 py-1 px-2 rounded border border-border/20 truncate">
                  LaTeX: <span className="text-foreground">{fn.latex}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* Tip section */}
        <div className="mt-auto border border-primary/10 bg-primary/5 p-3.5 rounded-xl text-xs flex gap-2.5 text-muted-foreground/90">
          <Info className="w-4.5 h-4.5 text-primary shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground">Interactive Tips:</span>
            <span>- Left-click and drag the graph to pan around.</span>
            <span>- Use the mouse wheel to zoom in/out at your cursor.</span>
            <span>- Hover over a line to trace precise coordinate values.</span>
          </div>
        </div>
      </div>

      {/* Graphing viewport (Right panel) */}
      <div className="lg:col-span-8 flex flex-col gap-4 relative">
        {/* Canvas container */}
        <div className="relative border border-border/40 rounded-2xl overflow-hidden shadow-inner bg-background select-none group/canvas">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
            className="w-full block bg-black"
            style={{ cursor: "crosshair", touchAction: "none" }}
          />

          {/* Tracer readout overlay (top right inside canvas) */}
          {hoverCoord && (
            <div className="absolute top-3 right-3 bg-background/95 border border-border/80 px-3 py-1.5 rounded-lg font-mono text-[11px] shadow-lg flex flex-col gap-0.5 pointer-events-none backdrop-blur-sm">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoverCoord.color }} />
                Coordinate
              </span>
              <span className="text-muted-foreground">X: <span className="text-foreground">{hoverCoord.x.toFixed(4)}</span></span>
              <span className="text-muted-foreground">Y: <span className="text-foreground">{hoverCoord.y.toFixed(4)}</span></span>
            </div>
          )}

          {/* Quick controls overlays */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <Button
              onClick={() => handleZoom(true)}
              variant="secondary"
              size="icon"
              className="w-8 h-8 rounded-lg bg-background/80 hover:bg-background border border-border/40 shadow"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-foreground" />
            </Button>
            <Button
              onClick={() => handleZoom(false)}
              variant="secondary"
              size="icon"
              className="w-8 h-8 rounded-lg bg-background/80 hover:bg-background border border-border/40 shadow"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-foreground" />
            </Button>
            <Button
              onClick={resetView}
              variant="secondary"
              size="icon"
              className="w-8 h-8 rounded-lg bg-background/80 hover:bg-background border border-border/40 shadow"
              title="Recenter"
            >
              <RotateCcw className="w-4 h-4 text-foreground" />
            </Button>
          </div>

          {/* Extra options bottom right */}
          <div className="absolute bottom-3 right-3 flex items-center gap-3 bg-background/85 px-3 py-1.5 rounded-full border border-border/40 shadow text-[10.5px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1 cursor-pointer select-none" onClick={() => setShowGrid(!showGrid)}>
              {showGrid ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />} Grid
            </span>
            <span className="flex items-center gap-1 cursor-pointer select-none" onClick={() => setShowTrace(!showTrace)}>
              {showTrace ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />} Trace
            </span>
            <span className="flex items-center gap-1 cursor-pointer select-none" onClick={() => setIsDark(!isDark)}>
              {isDark ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />} Dark
            </span>
          </div>
        </div>

        {/* Math bounds description bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono text-muted-foreground">
          <span>X: [{bounds.xMin.toFixed(2)}, {bounds.xMax.toFixed(2)}]</span>
          <span>Y: [{bounds.yMin.toFixed(2)}, {bounds.yMax.toFixed(2)}]</span>
          <span>Grid Step: X {getGridStep(bounds.xMax - bounds.xMin).toFixed(2)}, Y {getGridStep(bounds.yMax - bounds.yMin).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
