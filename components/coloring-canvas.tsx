"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import Link from "next/link";

/* ============================================================
    COLORING TOOLBAR COMPONENT
============================================================ */
function ColoringToolbar({
  tool,
  setTool,
  color,
  setColor,
  opacity,
  setOpacity,
  brushSize,
  setBrushSize,
  zoom,
  onZoomIn,
  onZoomOut,
  undo,
  onClear,
  onDownload,
  isMobile,
}: {
  tool: "brush" | "eraser" | "fill";
  setTool: (t: "brush" | "eraser" | "fill") => void;
  color: string;
  setColor: (c: string) => void;
  opacity: number;
  setOpacity: (o: number) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  undo: () => void;
  onClear: () => void;
  onDownload: () => void;
  isMobile: boolean;
}) {
  // Handle color selection: switch from eraser to brush if needed
  const handleColorSelect = (selectedColor: string) => {
    // If eraser is active, switch to brush
    if (tool === "eraser") {
      setTool("brush");
    }
    // Always apply the chosen color
    setColor(selectedColor);
  };

  // Desktop: vertical sidebar layout
  if (!isMobile) {
    return (
      <aside
        className="flex-shrink-0"
        style={{
          width: '240px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'sticky',
          top: '20px',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
        }}
      >
        <div className="flex flex-col gap-3">
          {/* Tools */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ToolButton icon="brush" active={tool === "brush"} onClick={() => setTool("brush")} />
              <ToolButton icon="eraser" active={tool === "eraser"} onClick={() => setTool("eraser")} />
              <ToolButton icon="fill" active={tool === "fill"} onClick={() => setTool("fill")} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ActionButton type="undo" onClick={undo} />
              <ActionButton type="trash" onClick={onClear} />
              <ActionButton type="download" onClick={onDownload} />
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex flex-col gap-2">
            <ZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
          </div>

          {/* Color Indicator */}
          <div className="flex flex-col gap-2">
            <div 
              className="w-10 h-10 rounded-full border-2 border-gray-400 shadow-md"
              style={{ background: color }} 
            />
          </div>

          {/* Brush Settings */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-600 whitespace-nowrap">Толщина</label>
              <input
                type="range"
                min={5}
                max={120}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-600 whitespace-nowrap">Прозрачность</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Full Color Palette (Desktop) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Палитра</label>
            <FullColorPalette
              color={color}
              setColor={handleColorSelect}
            />
          </div>
        </div>
      </aside>
    );
  }

  // Mobile: horizontal bottom toolbar (unchanged)
  return (
    <div className="bg-white border-t border-gray-300 flex-shrink-0 overflow-x-auto shadow-sm">
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 p-2 md:p-3 max-w-full">
        {/* Tools Row */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ToolButton icon="brush" active={tool === "brush"} onClick={() => setTool("brush")} />
          <ToolButton icon="eraser" active={tool === "eraser"} onClick={() => setTool("eraser")} />
          <ToolButton icon="fill" active={tool === "fill"} onClick={() => setTool("fill")} />
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ActionButton type="undo" onClick={undo} />
          <ActionButton type="trash" onClick={onClear} />
          <ActionButton type="download" onClick={onDownload} />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
        </div>

        {/* Color Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div 
            className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-gray-400 shadow-md"
            style={{ background: color }} 
          />
        </div>

        {/* Brush Settings */}
        <div className={`flex ${isMobile ? "flex-col" : "flex-row"} items-center gap-2 md:gap-3 flex-shrink-0`}>
          <div className="flex items-center gap-1.5 md:gap-2">
            <label className="text-xs md:text-sm text-gray-600 whitespace-nowrap">Толщина</label>
            <input
              type="range"
              min={5}
              max={120}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-16 md:w-24"
            />
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <label className="text-xs md:text-sm text-gray-600 whitespace-nowrap">Прозрачность</label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-16 md:w-24"
            />
          </div>
        </div>

        {/* Compact Color Palette */}
        <div className="flex-shrink-0">
          <CompactColorPalette
            color={color}
            setColor={handleColorSelect}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
    CONFIRM MODAL
============================================================ */
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 rounded-lg"
          >
            {cancelText}
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 bg-red-500 rounded-lg text-white"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
    ANIMATED TOOL BUTTONS
============================================================ */
function ToolButton({ icon, active, onClick }: {
  icon: "brush" | "eraser" | "fill";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center shadow-sm
        transition-all duration-150 hover:scale-105 active:scale-95
        ${active 
          ? "bg-pink-500 text-white border-pink-600 shadow-md ring-2 ring-pink-200" 
          : "bg-white border-gray-300 hover:border-gray-400"
        }
      `}
    >
      <img src={`/icons/${icon}.svg`} className="w-6 h-6 md:w-7 md:h-7" alt={icon} />
    </button>
  );
}

function ActionButton({ type, onClick }: {
  type: "undo" | "trash" | "download";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 hover:border-gray-400"
    >
      <img src={`/icons/${type}.svg`} className="w-5 h-5 md:w-6 md:h-6" alt={type} />
    </button>
  );
}

/* ============================================================
    ZOOM CONTROL
============================================================ */
function ZoomControls({ zoom, onZoomIn, onZoomOut }: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onZoomOut}
        className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
      >
        -
      </button>

      <div className="text-sm md:text-lg font-semibold min-w-[3rem] text-center">{Math.round(zoom * 100)}%</div>

      <button
        onClick={onZoomIn}
        className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
      >
        +
      </button>
    </div>
  );
}

/* ============================================================
    COLOR SHADE POPUP
============================================================ */
function ColorShadePopup({ 
  baseColor, 
  shades, 
  onSelect, 
  onClose, 
  position 
}: {
  baseColor: string;
  shades: string[];
  onSelect: (color: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl p-2 flex gap-1.5 border border-gray-200 transition-all duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y - 50}px`,
          transform: 'translateX(-50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {shades.map((shade, idx) => (
          <button
            key={idx}
            onClick={() => {
              onSelect(shade);
              onClose();
            }}
            className="w-7 h-7 rounded-full border-2 border-gray-300 hover:scale-110 active:scale-95 transition-transform duration-150"
            style={{ background: shade }}
          />
        ))}
      </div>
    </>
  );
}

/* ============================================================
    FULL COLOR PALETTE (DESKTOP - ALL COLORS)
============================================================ */
function FullColorPalette({ 
  color, 
  setColor
}: {
  color: string;
  setColor: (v: string) => void;
}) {
  const BASE_COLORS = [
    { name: "red", base: "#FF1744" },
    { name: "orange", base: "#FF6F00" },
    { name: "yellow", base: "#FFD600" },
    { name: "green", base: "#4CAF50" },
    { name: "blue", base: "#2196F3" },
    { name: "purple", base: "#9C27B0" },
    { name: "brown", base: "#8B4513" },
  ];

  const getShades = (baseHex: string): string[] => {
    const r = parseInt(baseHex.slice(1, 3), 16);
    const g = parseInt(baseHex.slice(3, 5), 16);
    const b = parseInt(baseHex.slice(5, 7), 16);

    const mix = (c: number, factor: number) =>
      Math.max(0, Math.min(255, Math.round(c * factor)));

    return [
      `#${mix(r, 0.5).toString(16).padStart(2, "0")}${mix(g, 0.5).toString(16).padStart(2, "0")}${mix(b, 0.5).toString(16).padStart(2, "0")}`,
      `#${mix(r, 0.75).toString(16).padStart(2, "0")}${mix(g, 0.75).toString(16).padStart(2, "0")}${mix(b, 0.75).toString(16).padStart(2, "0")}`,
      baseHex,
      `#${mix(r, 1.25).toString(16).padStart(2, "0")}${mix(g, 1.25).toString(16).padStart(2, "0")}${mix(b, 1.25).toString(16).padStart(2, "0")}`,
      `#${mix(r, 1.5).toString(16).padStart(2, "0")}${mix(g, 1.5).toString(16).padStart(2, "0")}${mix(b, 1.5).toString(16).padStart(2, "0")}`,
    ];
  };

  // Get all colors (all shades of all base colors)
  const allColors: string[] = [];
  BASE_COLORS.forEach(({ base }) => {
    allColors.push(...getShades(base));
  });

  return (
    <div className="flex flex-wrap gap-2">
      {allColors.map((shade, idx) => (
        <button
          key={idx}
          onClick={() => setColor(shade)}
          className={`w-8 h-8 rounded-full border-2 transition-all duration-150 hover:scale-110 active:scale-95 ${
            color === shade
              ? "border-gray-800 shadow-md scale-110"
              : "border-gray-300"
          }`}
          style={{ background: shade }}
          aria-label={`Color ${idx + 1}`}
        />
      ))}
    </div>
  );
}

/* ============================================================
    COMPACT COLOR PALETTE (MOBILE - 7 BASE COLORS WITH POPUP)
============================================================ */
function CompactColorPalette({ 
  color, 
  setColor,
  isMobile 
}: {
  color: string;
  setColor: (v: string) => void;
  isMobile: boolean;
}) {
  const [expandedColor, setExpandedColor] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const colorRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const BASE_COLORS = [
    { name: "red", base: "#FF1744" },
    { name: "orange", base: "#FF6F00" },
    { name: "yellow", base: "#FFD600" },
    { name: "green", base: "#4CAF50" },
    { name: "blue", base: "#2196F3" },
    { name: "purple", base: "#9C27B0" },
    { name: "brown", base: "#8B4513" },
  ];

  const getShades = (baseHex: string): string[] => {
    const r = parseInt(baseHex.slice(1, 3), 16);
    const g = parseInt(baseHex.slice(3, 5), 16);
    const b = parseInt(baseHex.slice(5, 7), 16);

    const mix = (c: number, factor: number) =>
      Math.max(0, Math.min(255, Math.round(c * factor)));

    return [
      `#${mix(r, 0.5).toString(16).padStart(2, "0")}${mix(g, 0.5).toString(16).padStart(2, "0")}${mix(b, 0.5).toString(16).padStart(2, "0")}`,
      `#${mix(r, 0.75).toString(16).padStart(2, "0")}${mix(g, 0.75).toString(16).padStart(2, "0")}${mix(b, 0.75).toString(16).padStart(2, "0")}`,
      baseHex,
      `#${mix(r, 1.25).toString(16).padStart(2, "0")}${mix(g, 1.25).toString(16).padStart(2, "0")}${mix(b, 1.25).toString(16).padStart(2, "0")}`,
      `#${mix(r, 1.5).toString(16).padStart(2, "0")}${mix(g, 1.5).toString(16).padStart(2, "0")}${mix(b, 1.5).toString(16).padStart(2, "0")}`,
    ];
  };

  const handleColorClick = (baseColor: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const button = colorRefs.current[baseColor];
    if (button) {
      const rect = button.getBoundingClientRect();
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setExpandedColor(baseColor);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {BASE_COLORS.map(({ name, base }) => (
          <button
            key={name}
            ref={(el) => {
              colorRefs.current[base] = el;
            }}
            onClick={(e) => handleColorClick(base, e)}
            className={`w-8 h-8 md:w-9 md:h-9 rounded-full border-2 transition-all duration-150 hover:scale-110 active:scale-95 ${
              color === base || getShades(base).includes(color)
                ? "border-gray-800 shadow-md scale-110"
                : "border-gray-300"
            }`}
            style={{ background: base }}
            aria-label={name}
          />
        ))}
      </div>

      {expandedColor && (
        <ColorShadePopup
          baseColor={expandedColor}
          shades={getShades(expandedColor)}
          onSelect={setColor}
          onClose={() => setExpandedColor(null)}
          position={popupPosition}
        />
      )}
    </>
  );
}

/* ============================================================
    MAIN COMPONENT
============================================================ */

interface ColoringCanvasProps {
  src: string;
  closeHref?: string;
}

export default function ColoringCanvas({ src, closeHref }: ColoringCanvasProps) {
  const [color, setColor] = useState("#FF1744");
  const [opacity, setOpacity] = useState(1);
  const [brushSize, setBrushSize] = useState(40);
  const [zoom, setZoom] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<"brush" | "eraser" | "fill">("brush");
  const [showClearModal, setShowClearModal] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const undoStack = useRef<ImageData[]>([]);
  const MAX_UNDO = 40;

  /* Drawing state */
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const touchPanRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDist = useRef<number | null>(null);

  /* ============================================================
      UTILITY FUNCTIONS
  ============================================================= */

  const hexToRgb = (hex: string) => {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  };

  /* Get canvas coordinates from screen coordinates */
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return null;

    const rect = wrapper.getBoundingClientRect();
    // Account for wrapper scroll position and page scroll
    const x = (clientX - rect.left + wrapper.scrollLeft - translate.x) / zoom;
    const y = (clientY - rect.top + wrapper.scrollTop - translate.y) / zoom;

    return { x, y };
  };

  /* ============================================================
      UNDO SYSTEM
  ============================================================= */

  const saveUndo = () => {
    const draw = drawCanvasRef.current;
    if (!draw) return;
    const ctx = draw.getContext("2d");
    if (!ctx) return;
    const img = ctx.getImageData(0, 0, draw.width, draw.height);

    undoStack.current.push(img);
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
  };

  const undo = () => {
    const draw = drawCanvasRef.current;
    if (!draw) return;
    if (undoStack.current.length <= 1) return;

    undoStack.current.pop();
    const prev = undoStack.current[undoStack.current.length - 1];
    const ctx = draw.getContext("2d");
    if (ctx) ctx.putImageData(prev, 0, 0);
  };

  const clearCanvas = () => {
    const draw = drawCanvasRef.current;
    const temp = tempCanvasRef.current;
    if (!draw) return;
    const ctx = draw.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, draw.width, draw.height);
    
    if (temp) {
      const tempCtx = temp.getContext("2d");
      if (tempCtx) tempCtx.clearRect(0, 0, temp.width, temp.height);
    }

    undoStack.current = [
      ctx.getImageData(0, 0, draw.width, draw.height),
    ];
  };

  /* ============================================================
      CATMULL-ROM SPLINE
  ============================================================= */

  const catmullRom = (
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
  ) => {
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: 0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
    };
  };

  /* ============================================================
      DRAW SPLINE ON TEMP CANVAS
  ============================================================= */

  const drawSpline = () => {
    const temp = tempCanvasRef.current;
    if (!temp) return;
    const ctx = temp.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, temp.width, temp.height);

    const pts = pointsRef.current;
    if (pts.length < 4) {
      // Draw single point if less than 4 points
      if (pts.length > 0) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = brushSize;
        
        if (tool === "brush") {
      ctx.globalCompositeOperation = "source-over";
          const rgb = hexToRgb(color);
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
          ctx.globalAlpha = 1;
        } else if (tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          ctx.globalAlpha = 1;
        }

        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (tool === "brush") {
      ctx.globalCompositeOperation = "source-over";
      const rgb = hexToRgb(color);
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      ctx.globalAlpha = 1;
    } else if (tool === "eraser") {
      // For eraser, draw a solid stroke on tempCanvas
      // This will be used with destination-out when merging to drawCanvas
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(0, 0, 0, 1)";
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();

    for (let i = 0; i < pts.length - 3; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const p2 = pts[i + 2];
      const p3 = pts[i + 3];

      for (let t = 0; t <= 1; t += 0.15) {
        const p = catmullRom(p0, p1, p2, p3, t);

        if (i === 0 && t === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
    }

    ctx.stroke();
  };

  /* ============================================================
      COMMIT STROKE (TEMP → DRAW)
  ============================================================= */

  const commitStroke = () => {
    const temp = tempCanvasRef.current;
    const draw = drawCanvasRef.current;
    if (!temp || !draw) return;

    const ctx = draw.getContext("2d");
    if (!ctx) return;

    // For eraser, we need to apply destination-out when merging
    if (tool === "eraser") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(temp, 0, 0);
      ctx.restore();
    } else {
      // For brush, use normal source-over
      ctx.drawImage(temp, 0, 0);
    }

    const tctx = temp.getContext("2d");
    if (tctx) tctx.clearRect(0, 0, temp.width, temp.height);

    // Save undo snapshot AFTER the stroke is committed
    // This ensures each completed stroke (brush or eraser) is one undo action
    saveUndo();
  };

  /* ============================================================
      FLOOD FILL
  ============================================================= */

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const base = baseCanvasRef.current;
      const draw = drawCanvasRef.current;
    if (!base || !draw) return;

    const w = draw.width;
    const h = draw.height;

    // Create merged image (base + draw)
    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.width = w;
    mergedCanvas.height = h;
    const mergedCtx = mergedCanvas.getContext("2d");
    if (!mergedCtx) return;

    mergedCtx.drawImage(base, 0, 0);
    mergedCtx.drawImage(draw, 0, 0);

    const mergedData = mergedCtx.getImageData(0, 0, w, h);
    const data = mergedData.data;

    // Get target color
    const ix = Math.floor(startX);
    const iy = Math.floor(startY);
    if (ix < 0 || ix >= w || iy < 0 || iy >= h) return;

    const targetIdx = (iy * w + ix) * 4;
    const tr = data[targetIdx];
    const tg = data[targetIdx + 1];
    const tb = data[targetIdx + 2];

    // Fill color
    const fillR = parseInt(fillColor.slice(1, 3), 16);
    const fillG = parseInt(fillColor.slice(3, 5), 16);
    const fillB = parseInt(fillColor.slice(5, 7), 16);

    // Queue-based flood fill
    const queue: { x: number; y: number }[] = [{ x: ix, y: iy }];
    const visited = new Uint8Array(w * h);
    const TOLERANCE = 15;

    const match = (idx: number) => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
    return (
        Math.abs(r - tr) < TOLERANCE &&
        Math.abs(g - tg) < TOLERANCE &&
        Math.abs(b - tb) < TOLERANCE
      );
    };

    // Get base canvas data to detect outline boundaries
    const baseCtx = base.getContext("2d");
    if (!baseCtx) return;
    const baseData = baseCtx.getImageData(0, 0, w, h);
    const basePixels = baseData.data;

    // Get draw canvas data for writing absolute RGBA values
    const drawCtx = draw.getContext("2d");
    if (!drawCtx) return;
    const drawData = drawCtx.getImageData(0, 0, w, h);

    // Calculate final RGBA values with opacity applied (same as brush)
    const finalR = fillR;
    const finalG = fillG;
    const finalB = fillB;
    const finalA = Math.round(opacity * 255);

    // Perform flood fill
    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const idx = y * w + x;

      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      if (visited[idx]) continue;

      const pixelIdx = idx * 4;
      if (!match(pixelIdx)) continue;

      visited[idx] = 1;

      // Write absolute RGBA values (no blending) - matches brush behavior
      // This ensures the fill color is exactly correct on first click
      drawData.data[pixelIdx] = finalR;
      drawData.data[pixelIdx + 1] = finalG;
      drawData.data[pixelIdx + 2] = finalB;
      drawData.data[pixelIdx + 3] = finalA;

      // Add neighbors
      if (x > 0) queue.push({ x: x - 1, y });
      if (x < w - 1) queue.push({ x: x + 1, y });
      if (y > 0) queue.push({ x, y: y - 1 });
      if (y < h - 1) queue.push({ x, y: y + 1 });
    }

    // OVERPAINT EXPANSION: Paint 1-2 pixels beyond filled region to cover anti-aliased edges
    const EXPANSION_RADIUS = 1; // 1 pixel expansion (can be increased to 2 if needed)
    const BLACK_LINE_THRESHOLD = 30; // Brightness threshold for black lines
    const BLACK_LINE_ALPHA_THRESHOLD = 200; // Alpha threshold for black lines

    // Helper function to check if a pixel is a black outline
    const isBlackLine = (idx: number): boolean => {
      const baseIdx = idx;
      const r = basePixels[baseIdx];
      const g = basePixels[baseIdx + 1];
      const b = basePixels[baseIdx + 2];
      const a = basePixels[baseIdx + 3];
      
      const brightness = (r + g + b) / 3;
      return brightness < BLACK_LINE_THRESHOLD && a > BLACK_LINE_ALPHA_THRESHOLD;
    };

    // Helper function to check if a pixel is an edge (has at least one neighbor outside fill)
    const isEdgePixel = (x: number, y: number): boolean => {
      if (x < 0 || x >= w || y < 0 || y >= h) return false;
      const idx = y * w + x;
      if (!visited[idx]) return false; // Not part of fill

      // Check 8-directional neighbors
      const neighbors = [
        { x: x - 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x + 1, y: y - 1 },
        { x: x - 1, y: y },                           { x: x + 1, y: y },
        { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 },
      ];

      for (const n of neighbors) {
        if (n.x < 0 || n.x >= w || n.y < 0 || n.y >= h) continue;
        const nIdx = n.y * w + n.x;
        if (!visited[nIdx]) {
          return true; // Has at least one neighbor outside fill
        }
      }
      return false;
    };

    // Collect edge pixels
    const edgePixels: { x: number; y: number }[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (isEdgePixel(x, y)) {
          edgePixels.push({ x, y });
        }
      }
    }

    // Expand outward from edge pixels
    for (let radius = 1; radius <= EXPANSION_RADIUS; radius++) {
      const expansionPixels: { x: number; y: number }[] = [];

      for (const edge of edgePixels) {
        // Check 8-directional neighbors
        const neighbors = [
          { x: edge.x - 1, y: edge.y - 1 }, { x: edge.x, y: edge.y - 1 }, { x: edge.x + 1, y: edge.y - 1 },
          { x: edge.x - 1, y: edge.y },                           { x: edge.x + 1, y: edge.y },
          { x: edge.x - 1, y: edge.y + 1 }, { x: edge.x, y: edge.y + 1 }, { x: edge.x + 1, y: edge.y + 1 },
        ];

        for (const n of neighbors) {
          if (n.x < 0 || n.x >= w || n.y < 0 || n.y >= h) continue;
          const nIdx = n.y * w + n.x;
          
          // Skip if already filled or already marked for expansion
          if (visited[nIdx]) continue;
          
          // Skip if it's a black outline pixel
          const pixelIdx = nIdx * 4;
          if (isBlackLine(pixelIdx)) continue;

          // Mark for expansion
          visited[nIdx] = 1;
          expansionPixels.push({ x: n.x, y: n.y });

          // Paint the expansion pixel
          drawData.data[pixelIdx] = finalR;
          drawData.data[pixelIdx + 1] = finalG;
          drawData.data[pixelIdx + 2] = finalB;
          drawData.data[pixelIdx + 3] = finalA;
        }
      }

      // Use expansion pixels as new edge for next radius iteration
      edgePixels.length = 0;
      edgePixels.push(...expansionPixels);
    }

    // EDGE SMOOTHING: Apply anti-aliasing to border pixels for smooth edges
    // Create a copy of drawData for smoothing
    const smoothedData = new ImageData(new Uint8ClampedArray(drawData.data), w, h);
    
    // Gaussian-like weights for smooth edge transition (3x3 kernel)
    const kernel = [
      [0.0625, 0.125, 0.0625],
      [0.125,  0.25,  0.125],
      [0.0625, 0.125, 0.0625]
    ];
    
    // Apply smoothing only to border pixels
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        
        // Only smooth pixels that are part of the fill
        if (!visited[idx]) continue;
        
        // Skip if it's a black outline pixel
        if (isBlackLine(idx * 4)) continue;
        
        // Check if this is a border pixel (has at least one neighbor outside fill)
        let isBorder = false;
        let neighborOutsideCount = 0;
        
        const neighbors = [
          { x: x - 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x + 1, y: y - 1 },
          { x: x - 1, y: y },                           { x: x + 1, y: y },
          { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 },
        ];
        
        for (const n of neighbors) {
          if (n.x < 0 || n.x >= w || n.y < 0 || n.y >= h) {
            neighborOutsideCount++;
            continue;
          }
          const nIdx = n.y * w + n.x;
          if (!visited[nIdx] && !isBlackLine(nIdx * 4)) {
            isBorder = true;
            neighborOutsideCount++;
          }
        }
        
        // Only smooth border pixels (pixels with neighbors outside fill)
        if (!isBorder || neighborOutsideCount === 0) continue;
        
        // Calculate distance from center (for feathering)
        const pixelIdx = idx * 4;
        
        // Apply blur to border pixel - keep color solid, only smooth alpha
        let sumA = 0;
        let weightSum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = x + kx;
            const py = y + ky;
            
            if (px < 0 || px >= w || py < 0 || py >= h) {
              // Edge of canvas: contribute transparency
              weightSum += kernel[ky + 1][kx + 1];
              continue;
            }
            
            const pIdx = (py * w + px) * 4;
            const weight = kernel[ky + 1][kx + 1];
            const pVisited = visited[py * w + px];
            
            if (pVisited && !isBlackLine(pIdx)) {
              // Inside fill: use full alpha
              sumA += drawData.data[pIdx + 3] * weight;
            } else {
              // Outside fill or black line: contribute transparency
              sumA += 0 * weight;
            }
            weightSum += weight;
          }
        }
        
        // Apply smoothed alpha while keeping color solid
        if (weightSum > 0) {
          const smoothedAlpha = Math.round(sumA / weightSum);
          // Keep original RGB, only smooth alpha for soft edge
          smoothedData.data[pixelIdx] = finalR;
          smoothedData.data[pixelIdx + 1] = finalG;
          smoothedData.data[pixelIdx + 2] = finalB;
          smoothedData.data[pixelIdx + 3] = smoothedAlpha;
        }
      }
    }
    
    // Apply smoothed data to draw canvas
    drawCtx.putImageData(smoothedData, 0, 0);

    // Save undo snapshot AFTER the fill is completed
    // This ensures each fill operation is one independent undo action
    saveUndo();
  };

  /* ============================================================
      EVENT HANDLERS - MOUSE
  ============================================================= */

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle mouse button - pan
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button === 0) {
      // Left mouse button - draw/fill
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (!coords) return;

      if (tool === "fill") {
    saveUndo();
        floodFill(coords.x, coords.y, color);
        return;
      }

      if (tool === "brush" || tool === "eraser") {
        // Don't save undo here - it will be saved after commitStroke()
        isDrawingRef.current = true;
        pointsRef.current = [];
        pointsRef.current.push(coords);
        drawSpline();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;

      panStart.current = { x: e.clientX, y: e.clientY };
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
      return;
    }

    if (isDrawingRef.current && (tool === "brush" || tool === "eraser")) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (!coords) return;

      pointsRef.current.push(coords);
      drawSpline();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning.current && e.button === 1) {
      isPanning.current = false;
      return;
    }

    if (isDrawingRef.current) {
      commitStroke();
      isDrawingRef.current = false;
      pointsRef.current = [];
    }
  };

  /* ============================================================
      ANIMATED ZOOM FUNCTION
  ============================================================= */

  const animateZoom = useCallback((targetScale: number) => {
    const startScale = zoom;
    const startTime = performance.now();
    const duration = 200; // milliseconds

    // Clamp target scale
    const clampedTarget = Math.max(0.5, Math.min(4.0, targetScale));

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-in-out)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;

      const currentScale = startScale + (clampedTarget - startScale) * eased;

      // Zoom relative to top-left: keep translate at 0,0
      // The transform wrapper will handle the scaling
      setZoom(currentScale);
      setTranslate({ x: 0, y: 0 });

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, [zoom]);

  /* Zoom button handlers */
  const handleZoomIn = useCallback(() => {
    animateZoom(zoom * 1.1);
  }, [zoom, animateZoom]);

  const handleZoomOut = useCallback(() => {
    animateZoom(zoom / 1.1);
  }, [zoom, animateZoom]);

  /* ============================================================
      EVENT HANDLERS - TOUCH
  ============================================================= */

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const coords = getCanvasCoords(t.clientX, t.clientY);
      if (!coords) return;

      if (tool === "fill") {
        // Don't save undo here - it will be saved after floodFill() completes
        floodFill(coords.x, coords.y, color);
      return;
    }

      if (tool === "brush" || tool === "eraser") {
        // Don't save undo here - it will be saved after commitStroke()
        isDrawingRef.current = true;
        pointsRef.current = [];
        pointsRef.current.push(coords);
        drawSpline();

        touchPanRef.current = { x: t.clientX, y: t.clientY };
      }
    }

    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
      isDrawingRef.current = false;
    }

    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && isDrawingRef.current && (tool === "brush" || tool === "eraser")) {
      const t = e.touches[0];
      const coords = getCanvasCoords(t.clientX, t.clientY);
      if (coords) {
        pointsRef.current.push(coords);
        drawSpline();
      }
      return;
    }

    if (e.touches.length === 1 && !isDrawingRef.current) {
      const t = e.touches[0];

      if (touchPanRef.current) {
        const dx = t.clientX - touchPanRef.current.x;
        const dy = t.clientY - touchPanRef.current.y;

        touchPanRef.current = { x: t.clientX, y: t.clientY };
        setTranslate((tr) => ({ x: tr.x + dx, y: tr.y + dy }));
      }
      return;
    }

    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (lastTouchDist.current) {
        const delta = dist - lastTouchDist.current;
        let newScale = zoom + delta * 0.003;
        newScale = Math.max(0.5, Math.min(3, newScale));
        setZoom(newScale);
      }

      lastTouchDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    if (isDrawingRef.current) {
      commitStroke();
      isDrawingRef.current = false;
      pointsRef.current = [];
    }

    touchPanRef.current = null;
    lastTouchDist.current = null;
  };

  /* ============================================================
      CLAMP PAN (PREVENT CANVAS FROM GOING OUT OF BOUNDS)
  ============================================================= */

  const clampPan = useCallback(() => {
    const wrapper = wrapperRef.current;
    const base = baseCanvasRef.current;
    if (!wrapper || !base) return;

    const viewW = wrapper.clientWidth;
    const viewH = wrapper.clientHeight;

    const canvasW = base.width * zoom;
    const canvasH = base.height * zoom;

    let minX = viewW - canvasW;
    let minY = viewH - canvasH;

    // If canvas is smaller than view, anchor to top-left
    if (canvasW <= viewW) minX = 0;
    if (canvasH <= viewH) minY = 0;

    setTranslate((t) => {
      let x = t.x;
      let y = t.y;

      if (x > 0) x = 0;
      if (y > 0) y = 0;
      if (x < minX) x = minX;
      if (y < minY) y = minY;

      return { x, y };
    });
  }, [zoom]);

  useEffect(() => {
    clampPan();
  }, [zoom, clampPan]);

  useEffect(() => {
    const onResize = () => clampPan();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampPan]);

  useEffect(() => {
    clampPan();
  }, [translate.x, translate.y, clampPan]);

  /* ============================================================
      LOAD IMAGE AND INITIALIZE CANVASES
  ============================================================= */

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const base = baseCanvasRef.current;
      const draw = drawCanvasRef.current;
      const temp = tempCanvasRef.current;
      if (!base || !draw || !temp) return;

      // Use image dimensions directly
      base.width = img.width;
      base.height = img.height;
      draw.width = img.width;
      draw.height = img.height;
      temp.width = img.width;
      temp.height = img.height;

      setCanvasSize({ width: img.width, height: img.height });

      const ctx = base.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, base.width, base.height);
        ctx.drawImage(img, 0, 0);
      }

      const drawCtx = draw.getContext("2d");
      if (drawCtx) {
        drawCtx.clearRect(0, 0, draw.width, draw.height);
        undoStack.current = [drawCtx.getImageData(0, 0, draw.width, draw.height)];
      }

      setImageLoaded(true);
    };

    img.onerror = () => {
      console.error("Failed to load image:", src);
    };

    img.src = src;
  }, [src]);

  /* ============================================================
      RESPONSIVE DETECTION
  ============================================================= */

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* ============================================================
      DOWNLOAD RESULT
  ============================================================= */

  const downloadResult = () => {
    const base = baseCanvasRef.current;
    const draw = drawCanvasRef.current;
    if (!base || !draw) return;

    const merged = document.createElement("canvas");
    merged.width = base.width;
    merged.height = base.height;

    const ctx = merged.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(base, 0, 0);
    ctx.drawImage(draw, 0, 0);

    const a = document.createElement("a");
    a.download = "coloring.png";
    a.href = merged.toDataURL();
    a.click();
  };

  /* ============================================================
      RENDER
  ============================================================= */

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#f7f7f7] select-none">
      {/* CONFIRM MODAL */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={clearCanvas}
        title="Очистить рисунок?"
        message="Вы уверены, что хотите очистить весь рисунок?"
        confirmText="Очистить"
        cancelText="Отмена"
      />

      {/* MAIN LAYOUT */}
      {!isMobile ? (
        /* DESKTOP LAYOUT (>= 900px) */
        <div 
          className="flex flex-1 overflow-hidden"
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '100%',
            alignItems: 'flex-start',
          }}
        >
          {/* CANVAS AREA - Desktop */}
          <div
            ref={containerRef}
            className="relative bg-white"
            style={{
              flex: '1',
              flexGrow: '1',
              minWidth: 0,
              touchAction: "none"
            }}
          >
            {closeHref && (
              <Link
                href={closeHref}
                className="absolute top-2 left-2 z-40 flex items-center justify-center 
                           w-9 h-9 rounded-full border border-gray-300 text-lg leading-none 
                           hover:bg-gray-100 bg-white shadow-sm transition-all duration-150 hover:scale-105 active:scale-95"
                aria-label="Закрыть"
              >
                <img src="../icons/close.svg" alt="Закрыть" className="w-9 h-9" />
              </Link>
            )}

            {/* SCROLL WRAPPER - Desktop */}
            <div
              ref={wrapperRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative"
              style={{
                overflow: "auto",
                flexGrow: 1,
                width: "100%",
                height: "calc(100vh - 0px)",
                position: "relative",
                touchAction: "none"
              }}
            >
              {/* SCALE WRAPPER - Desktop */}
              <div
                className="relative"
                style={{
                  display: "inline-block",
                  transformOrigin: "top left",
                  minWidth: `${canvasSize.width * zoom}px`,
                  minHeight: `${canvasSize.height * zoom}px`,
                  width: `${canvasSize.width * zoom}px`,
                  height: `${canvasSize.height * zoom}px`,
                  position: "relative",
                }}
              >
                {/* Canvas container with scale and translate */}
                <div
                  style={{
                    transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom})`,
                    transformOrigin: "top left",
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
                    position: "relative",
                  }}
                >
                  <canvas ref={baseCanvasRef} className="absolute top-0 left-0" />
                  <canvas ref={drawCanvasRef} className="absolute top-0 left-0" />
                  <canvas ref={tempCanvasRef} className="absolute top-0 left-0 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* TOOLBAR - Desktop sidebar */}
          <ColoringToolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            opacity={opacity}
            setOpacity={setOpacity}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            undo={undo}
            onClear={() => setShowClearModal(true)}
            onDownload={downloadResult}
            isMobile={false}
          />
        </div>
      ) : (
        /* MOBILE LAYOUT (< 900px) - UNCHANGED */
        <div className="flex flex-1 overflow-hidden flex-col">
          {/* CANVAS AREA - Mobile */}
          <div
            ref={containerRef}
            className="flex-1 relative bg-white overflow-hidden"
            style={{
              width: "100%",
              touchAction: "none"
            }}
          >
            {closeHref && (
              <Link
                href={closeHref}
                className="absolute top-2 left-2 z-40 flex items-center justify-center 
                           w-9 h-9 rounded-full border border-gray-300 text-lg leading-none 
                           hover:bg-gray-100 bg-white shadow-sm transition-all duration-150 hover:scale-105 active:scale-95"
                aria-label="Закрыть"
              >
                ×
              </Link>
            )}

            {/* CANVAS WRAPPER - Mobile */}
            <div
              ref={wrapperRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-full overflow-auto"
              style={{
                touchAction: "none"
              }}
            >
              <div
                className="relative"
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom})`,
                  transformOrigin: "top left",
                  width: `${canvasSize.width}px`,
                  height: `${canvasSize.height}px`,
                }}
              >
                <canvas ref={baseCanvasRef} className="absolute top-0 left-0" />
                <canvas ref={drawCanvasRef} className="absolute top-0 left-0" />
                <canvas ref={tempCanvasRef} className="absolute top-0 left-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* TOOLBAR - Mobile bottom */}
          <ColoringToolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            opacity={opacity}
            setOpacity={setOpacity}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            undo={undo}
            onClear={() => setShowClearModal(true)}
            onDownload={downloadResult}
            isMobile={true}
          />
        </div>
      )}
    </div>
  );
}
