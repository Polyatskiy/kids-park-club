'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';

import {
  JIGSAW_IMAGES,
  DEFAULT_IMAGE_ID,
  DEFAULT_OPTION,
  JIGSAW_OPTIONS,
  type JigsawOption,
} from './jigsawConfig';
import { useContainerSize } from '@/lib/useContainerSize';

const IMAGES = JIGSAW_IMAGES;

// Layout constants
const MIN_CELL_SIZE = 16;
const MAX_CELL_SIZE = 100;
const MOBILE_BREAKPOINT = 768;

// Vertical space allocation (mobile-first)
const BOARD_HEIGHT_RATIO = 0.62; // Board gets ~62% of available height
const TRAY_HEIGHT_RATIO = 0.38;  // Tray gets ~38% of available height

// Margins and padding
const OUTER_PADDING = 8;
const BOARD_MARGIN = 8;
const TRAY_MARGIN = 8;
const TRAY_INNER_PADDING = 6; // Padding inside tray for pieces

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

type PieceState = {
  id: number;
  x: number;
  y: number;
  snapped: boolean;
};

type DragState = {
  activePieceId: number | null;
  pointerId: number | null;
  offsetX: number;
  offsetY: number;
  containerLeft: number;
  containerTop: number;
  workspaceWidth: number;
  workspaceHeight: number;
};

const createInitialDragState = (): DragState => ({
  activePieceId: null,
  pointerId: null,
  offsetX: 0,
  offsetY: 0,
  containerLeft: 0,
  containerTop: 0,
  workspaceWidth: 0,
  workspaceHeight: 0,
});

// ---------- PUZZLE GEOMETRY ----------

type EdgeType = 'flat' | 'tab' | 'blank';

interface PieceEdges {
  top: EdgeType;
  right: EdgeType;
  bottom: EdgeType;
  left: EdgeType;
}

const complementEdge = (e: EdgeType): EdgeType =>
  e === 'tab' ? 'blank' : e === 'blank' ? 'tab' : 'flat';

const generatePieceEdges = (rows: number, cols: number): PieceEdges[][] => {
  const edges: PieceEdges[][] = Array.from(
    { length: rows },
    () => Array.from({ length: cols }, () => ({
      top: 'flat' as EdgeType,
      right: 'flat' as EdgeType,
      bottom: 'flat' as EdgeType,
      left: 'flat' as EdgeType,
    })),
  );

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const piece = edges[r][c];
      if (r === 0) {
        piece.top = 'flat';
      } else {
        piece.top = complementEdge(edges[r - 1][c].bottom);
      }
      if (c === 0) {
        piece.left = 'flat';
      } else {
        piece.left = complementEdge(edges[r][c - 1].right);
      }
      if (r === rows - 1) {
        piece.bottom = 'flat';
      } else {
        piece.bottom = (r + c) % 2 === 0 ? 'tab' : 'blank';
      }
      if (c === cols - 1) {
        piece.right = 'flat';
      } else {
        piece.right = (r + c + 1) % 2 === 0 ? 'tab' : 'blank';
      }
    }
  }

  return edges;
};

const getPiecePath = (edges: PieceEdges, cellSize: number): string => {
  const s = cellSize;
  const r = s * 0.22;
  const notchW = s * 0.18;
  const mid = s / 2;
  const x1 = mid - notchW;
  const x2 = mid + notchW;
  const y1 = mid - notchW;
  const y2 = mid + notchW;
  const k = 0.4;

  const topSegment = (type: EdgeType): string => {
    if (type === 'flat') return `L ${s} 0 `;
    if (type === 'tab') {
      return [
        `L ${x1} 0`,
        `C ${x1 + notchW * k} 0 ${mid - r} ${-r} ${mid} ${-r}`,
        `C ${mid + r} ${-r} ${x2 - notchW * k} 0 ${x2} 0`,
        `L ${s} 0`,
      ].join(' ');
    }
    return [
      `L ${x1} 0`,
      `C ${x1 + notchW * k} 0 ${mid - r} ${r} ${mid} ${r}`,
      `C ${mid + r} ${r} ${x2 - notchW * k} 0 ${x2} 0`,
      `L ${s} 0`,
    ].join(' ');
  };

  const rightSegment = (type: EdgeType): string => {
    if (type === 'flat') return `L ${s} ${s} `;
    if (type === 'tab') {
      return [
        `L ${s} ${y1}`,
        `C ${s} ${y1 + notchW * k} ${s + r} ${mid - r} ${s + r} ${mid}`,
        `C ${s + r} ${mid + r} ${s} ${y2 - notchW * k} ${s} ${y2}`,
        `L ${s} ${s}`,
      ].join(' ');
    }
    return [
      `L ${s} ${y1}`,
      `C ${s} ${y1 + notchW * k} ${s - r} ${mid - r} ${s - r} ${mid}`,
      `C ${s - r} ${mid + r} ${s} ${y2 - notchW * k} ${s} ${y2}`,
      `L ${s} ${s}`,
    ].join(' ');
  };

  const bottomSegment = (type: EdgeType): string => {
    if (type === 'flat') return `L 0 ${s} `;
    if (type === 'tab') {
      return [
        `L ${x2} ${s}`,
        `C ${x2 - notchW * k} ${s} ${mid + r} ${s + r} ${mid} ${s + r}`,
        `C ${mid - r} ${s + r} ${x1 + notchW * k} ${s} ${x1} ${s}`,
        `L 0 ${s}`,
      ].join(' ');
    }
    return [
      `L ${x2} ${s}`,
      `C ${x2 - notchW * k} ${s} ${mid + r} ${s - r} ${mid} ${s - r}`,
      `C ${mid - r} ${s - r} ${x1 + notchW * k} ${s} ${x1} ${s}`,
      `L 0 ${s}`,
    ].join(' ');
  };

  const leftSegment = (type: EdgeType): string => {
    if (type === 'flat') return `L 0 0 `;
    if (type === 'tab') {
      return [
        `L 0 ${y2}`,
        `C 0 ${y2 - notchW * k} ${-r} ${mid + r} ${-r} ${mid}`,
        `C ${-r} ${mid - r} 0 ${y1 + notchW * k} 0 ${y1}`,
        `L 0 0`,
      ].join(' ');
    }
    return [
      `L 0 ${y2}`,
      `C 0 ${y2 - notchW * k} ${r} ${mid + r} ${r} ${mid}`,
      `C ${r} ${mid - r} 0 ${y1 + notchW * k} 0 ${y1}`,
      `L 0 0`,
    ].join(' ');
  };

  return [
    `M 0 0`,
    topSegment(edges.top),
    rightSegment(edges.right),
    bottomSegment(edges.bottom),
    leftSegment(edges.left),
    'Z',
  ].join(' ');
};

/**
 * Calculate the correct (snapped) position for a piece on the board.
 */
const getCorrectPosition = (
  pieceId: number,
  cols: number,
  boardOriginX: number,
  boardOriginY: number,
  cellSize: number,
  tabRadius: number,
): { x: number; y: number } => {
  const row = Math.floor(pieceId / cols);
  const col = pieceId % cols;
  return {
    x: boardOriginX + col * cellSize - tabRadius,
    y: boardOriginY + row * cellSize - tabRadius,
  };
};

/**
 * Calculate all layout dimensions based on available container space.
 * This is the SINGLE SOURCE OF TRUTH for all sizing.
 */
interface LayoutDimensions {
  // Overall workspace
  workspaceWidth: number;
  workspaceHeight: number;
  
  // Board zone (top area)
  boardZoneWidth: number;
  boardZoneHeight: number;
  boardZoneY: number;
  
  // Actual board (puzzle grid)
  cellSize: number;
  tabRadius: number;
  pieceVisualSize: number;
  boardWidth: number;
  boardHeight: number;
  boardOriginX: number;
  boardOriginY: number;
  
  // Tray zone (bottom area)
  trayZoneWidth: number;
  trayZoneHeight: number;
  trayZoneY: number;
  
  // Scatter area within tray (where pieces can be placed)
  scatterX: number;
  scatterY: number;
  scatterWidth: number;
  scatterHeight: number;
}

const calculateLayout = (
  containerWidth: number,
  containerHeight: number,
  rows: number,
  cols: number,
): LayoutDimensions => {
  // Available space after outer padding
  const availableWidth = containerWidth - OUTER_PADDING * 2;
  const availableHeight = containerHeight - OUTER_PADDING * 2;
  
  // Split vertical space: board zone (top) and tray zone (bottom)
  const boardZoneHeight = Math.floor(availableHeight * BOARD_HEIGHT_RATIO);
  const trayZoneHeight = availableHeight - boardZoneHeight;
  
  // Board zone positioning
  const boardZoneY = OUTER_PADDING;
  const boardZoneWidth = availableWidth;
  
  // Tray zone positioning
  const trayZoneY = boardZoneY + boardZoneHeight;
  const trayZoneWidth = availableWidth;
  
  // Calculate cell size to fit the board within the board zone
  // Account for margins and tab overflow
  const boardAvailableWidth = boardZoneWidth - BOARD_MARGIN * 2;
  const boardAvailableHeight = boardZoneHeight - BOARD_MARGIN * 2;
  
  // Cell size is limited by both width and height, plus min/max constraints
  const cellSizeByWidth = boardAvailableWidth / cols;
  const cellSizeByHeight = boardAvailableHeight / rows;
  const cellSize = clamp(
    Math.floor(Math.min(cellSizeByWidth, cellSizeByHeight)),
    MIN_CELL_SIZE,
    MAX_CELL_SIZE
  );
  
  // Derived piece dimensions
  const tabRadius = cellSize * 0.22;
  const pieceVisualSize = Math.ceil(cellSize + tabRadius * 2);
  
  // Actual board dimensions
  const boardWidth = cols * cellSize;
  const boardHeight = rows * cellSize;
  
  // Center the board within the board zone
  const boardOriginX = OUTER_PADDING + Math.floor((boardZoneWidth - boardWidth) / 2);
  const boardOriginY = boardZoneY + Math.floor((boardZoneHeight - boardHeight) / 2);
  
  // Scatter area: the area within the tray where pieces can be placed
  // Account for margins and ensure pieces stay fully inside
  const scatterX = OUTER_PADDING + TRAY_MARGIN + TRAY_INNER_PADDING;
  const scatterY = trayZoneY + TRAY_MARGIN + TRAY_INNER_PADDING;
  const scatterWidth = trayZoneWidth - TRAY_MARGIN * 2 - TRAY_INNER_PADDING * 2;
  const scatterHeight = trayZoneHeight - TRAY_MARGIN * 2 - TRAY_INNER_PADDING * 2;
  
  // Workspace dimensions (the visible game area)
  const workspaceWidth = containerWidth;
  const workspaceHeight = containerHeight;
  
  return {
    workspaceWidth,
    workspaceHeight,
    boardZoneWidth,
    boardZoneHeight,
    boardZoneY,
    cellSize,
    tabRadius,
    pieceVisualSize,
    boardWidth,
    boardHeight,
    boardOriginX,
    boardOriginY,
    trayZoneWidth,
    trayZoneHeight,
    trayZoneY,
    scatterX,
    scatterY,
    scatterWidth,
    scatterHeight,
  };
};

/**
 * Scatter pieces uniformly across the entire tray area.
 * Each piece is positioned randomly but clamped to stay fully inside.
 */
const scatterPiecesInTray = (
  total: number,
  scatterX: number,
  scatterY: number,
  scatterWidth: number,
  scatterHeight: number,
  pieceVisualSize: number,
): PieceState[] => {
  const pieces: PieceState[] = [];
  
  // Maximum valid position (so piece stays fully inside)
  const maxX = Math.max(0, scatterWidth - pieceVisualSize);
  const maxY = Math.max(0, scatterHeight - pieceVisualSize);
  
  for (let id = 0; id < total; id++) {
    // Random position within the valid range
    const localX = maxX > 0 ? Math.random() * maxX : 0;
    const localY = maxY > 0 ? Math.random() * maxY : 0;
    
    pieces.push({
      id,
      x: scatterX + localX,
      y: scatterY + localY,
      snapped: false,
    });
  }
  
  return pieces;
};

// ---------- COMPONENT ----------

export interface JigsawGameProps {
  initialImageId?: string;
  initialGridSize?: number;
  puzzleImageUrl?: string;
  puzzleTitle?: string;
}

export const JigsawGame: React.FC<JigsawGameProps> = ({
  initialImageId,
  initialGridSize,
  puzzleImageUrl,
  puzzleTitle,
}) => {
  const isSupabasePuzzle = Boolean(puzzleImageUrl);
  
  const normalizePieces = (value?: number): number => {
    if (!value) return DEFAULT_OPTION.pieces;
    if (value === 3) return 9;
    if (value === 4) return 16;
    if (value === 5) return 25;
    return value;
  };

  const getOptionByPieces = (pieces: number): JigsawOption =>
    JIGSAW_OPTIONS.find((opt) => opt.pieces === pieces) || DEFAULT_OPTION;

  const defaultImageId = !isSupabasePuzzle && initialImageId && IMAGES.some(img => img.id === initialImageId)
    ? initialImageId
    : DEFAULT_IMAGE_ID;
  const initialPieces = normalizePieces(initialGridSize);
  const defaultOption = getOptionByPieces(initialPieces);

  const [selectedOption, setSelectedOption] = useState<JigsawOption>(defaultOption);
  const [selectedImageId, setSelectedImageId] = useState<string>(
    isSupabasePuzzle ? (initialImageId || 'supabase') : defaultImageId,
  );
  const [customImageUrl] = useState<string | null>(puzzleImageUrl || null);
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [moves, setMoves] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const outerContainerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragStateRef = useRef<DragState>(createInitialDragState());

  const containerSize = useContainerSize(outerContainerRef);

  // Detect mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkViewport = () => {
      const width = window.innerWidth;
      const ua = navigator.userAgent.toLowerCase();
      const isRealMobileUA =
        ua.includes('iphone') ||
        ua.includes('android') ||
        ua.includes('ipad') ||
        ua.includes('ipod') ||
        ua.includes('mobile');
      const mobileByWidth =
        width <= MOBILE_BREAKPOINT ||
        window.matchMedia?.('(max-width: 768px)').matches;
      setIsMobile(mobileByWidth || isRealMobileUA);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const selectedImage = customImageUrl 
    ? { id: 'supabase', src: customImageUrl, label: puzzleTitle || 'Puzzle' }
    : (IMAGES.find((img) => img.id === selectedImageId) ?? IMAGES[0]);

  const isGameplayMode = Boolean(selectedImage);
  const MOBILE_GRID_COLUMNS = 3;

  const rows = selectedOption.rows;
  const cols = selectedOption.cols;
  const totalPieces = rows * cols;

  // Calculate layout based on container size
  const layout = useMemo(() => {
    const width = containerSize.width || (isMobile ? 360 : 800);
    const height = containerSize.height || (isMobile ? 600 : 700);
    return calculateLayout(width, height, rows, cols);
  }, [containerSize.width, containerSize.height, rows, cols, isMobile]);

  const {
    workspaceWidth,
    workspaceHeight,
    cellSize,
    tabRadius,
    pieceVisualSize,
    boardWidth,
    boardHeight,
    boardOriginX,
    boardOriginY,
    trayZoneY,
    trayZoneHeight,
    scatterX,
    scatterY,
    scatterWidth,
    scatterHeight,
  } = layout;

  // Toggle body flag for navbar
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (isGameplayMode) {
      body.dataset.jigsawGameplay = 'true';
    } else {
      delete body.dataset.jigsawGameplay;
    }
    return () => {
      delete body.dataset.jigsawGameplay;
    };
  }, [isMobile, isGameplayMode]);

  const pieceEdges = useMemo(
    () => generatePieceEdges(rows, cols),
    [rows, cols],
  );

  const setPieceRef = (id: number, el: HTMLDivElement | null) => {
    pieceRefs.current[id] = el;
  };

  // Start new game with given option
  const newGame = useCallback((opts?: { option?: JigsawOption; imageId?: string }) => {
    const nextOption = opts?.option ?? selectedOption;
    const total = nextOption.rows * nextOption.cols;
    
    // Calculate layout for the new option
    const width = containerSize.width || (isMobile ? 360 : 800);
    const height = containerSize.height || (isMobile ? 600 : 700);
    const nextLayout = calculateLayout(width, height, nextOption.rows, nextOption.cols);
    
    // Scatter pieces in the tray
    const nextPieces = scatterPiecesInTray(
      total,
      nextLayout.scatterX,
      nextLayout.scatterY,
      nextLayout.scatterWidth,
      nextLayout.scatterHeight,
      nextLayout.pieceVisualSize,
    );

    setSelectedOption(nextOption);
    if (opts?.imageId) setSelectedImageId(opts.imageId);
    setPieces(nextPieces);
    setMoves(0);
    setIsPanelOpen(true);
    setIsInitialized(true);
    dragStateRef.current = createInitialDragState();
  }, [selectedOption, containerSize.width, containerSize.height, isMobile]);

  // Initialize game when container is measured
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0 && !isInitialized) {
      newGame({ option: selectedOption });
    }
  }, [containerSize.width, containerSize.height, isInitialized, newGame, selectedOption]);

  // Re-scatter pieces when layout changes significantly
  const prevLayoutRef = useRef<{ scatterWidth: number; scatterHeight: number; pieceVisualSize: number } | null>(null);
  useEffect(() => {
    if (!isInitialized || pieces.length === 0) return;
    
    const prev = prevLayoutRef.current;
    if (prev && (
      Math.abs(prev.scatterWidth - scatterWidth) > 20 ||
      Math.abs(prev.scatterHeight - scatterHeight) > 20 ||
      Math.abs(prev.pieceVisualSize - pieceVisualSize) > 5
    )) {
      // Rescatter pieces on significant layout change
      setPieces(prevPieces => {
        return prevPieces.map(piece => {
          if (piece.snapped) {
            // Recalculate snapped position
            const correctPos = getCorrectPosition(
              piece.id,
              cols,
              boardOriginX,
              boardOriginY,
              cellSize,
              tabRadius,
            );
            return { ...piece, x: correctPos.x, y: correctPos.y };
          }
          
          // Re-scatter unsnapped pieces
          const maxX = Math.max(0, scatterWidth - pieceVisualSize);
          const maxY = Math.max(0, scatterHeight - pieceVisualSize);
          const localX = maxX > 0 ? Math.random() * maxX : 0;
          const localY = maxY > 0 ? Math.random() * maxY : 0;
          
          return {
            ...piece,
            x: scatterX + localX,
            y: scatterY + localY,
          };
        });
      });
    }
    
    prevLayoutRef.current = { scatterWidth, scatterHeight, pieceVisualSize };
  }, [scatterWidth, scatterHeight, pieceVisualSize, isInitialized, pieces.length, cols, boardOriginX, boardOriginY, cellSize, tabRadius, scatterX, scatterY]);

  // Handle piece count changes
  useEffect(() => {
    if (pieces.length !== totalPieces && isInitialized) {
      newGame({ option: selectedOption });
    }
  }, [totalPieces, pieces.length, isInitialized, newGame, selectedOption]);

  // Drag handlers
  const startDrag = (e: React.PointerEvent<HTMLDivElement>, pieceId: number) => {
    if (e.button !== 0 && e.pointerType !== 'touch') return;

    const containerEl = containerRef.current;
    const pieceEl = pieceRefs.current[pieceId];
    if (!containerEl || !pieceEl) return;

    const drag = dragStateRef.current;
    if (drag.activePieceId !== null) return;

    const containerRect = containerEl.getBoundingClientRect();
    const pieceRect = pieceEl.getBoundingClientRect();

    drag.activePieceId = pieceId;
    drag.pointerId = e.pointerId;
    drag.offsetX = e.clientX - pieceRect.left;
    drag.offsetY = e.clientY - pieceRect.top;
    drag.containerLeft = containerRect.left;
    drag.containerTop = containerRect.top;
    drag.workspaceWidth = containerRect.width;
    drag.workspaceHeight = containerRect.height;

    pieceEl.style.transition = 'none';
    pieceEl.style.zIndex = '1000';
    pieceEl.setPointerCapture(e.pointerId);

    e.preventDefault();
    e.stopPropagation();
  };

  const onDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (drag.activePieceId === null || drag.pointerId !== e.pointerId) return;

    const pieceEl = pieceRefs.current[drag.activePieceId];
    if (!pieceEl) return;

    const localX = e.clientX - drag.containerLeft;
    const localY = e.clientY - drag.containerTop;

    let newLeft = localX - drag.offsetX;
    let newTop = localY - drag.offsetY;

    const maxX = drag.workspaceWidth - pieceVisualSize;
    const maxY = drag.workspaceHeight - pieceVisualSize;

    newLeft = clamp(newLeft, 0, maxX);
    newTop = clamp(newTop, 0, maxY);

    pieceEl.style.left = `${newLeft}px`;
    pieceEl.style.top = `${newTop}px`;

    e.preventDefault();
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (drag.activePieceId === null || drag.pointerId !== e.pointerId) return;

    const pieceId = drag.activePieceId;
    const pieceEl = pieceRefs.current[pieceId];
    const containerEl = containerRef.current;

    if (!pieceEl || !containerEl) {
      dragStateRef.current = createInitialDragState();
      return;
    }

    try {
      pieceEl.releasePointerCapture(e.pointerId);
    } catch { /* ignore */ }

    pieceEl.style.transition = 'left 160ms ease-out, top 160ms ease-out';

    const currentLeft = parseFloat(pieceEl.style.left || '0');
    const currentTop = parseFloat(pieceEl.style.top || '0');

    // Center of base cell for snapping
    const centerX = currentLeft + tabRadius + cellSize / 2;
    const centerY = currentTop + tabRadius + cellSize / 2;

    const correctPos = getCorrectPosition(
      pieceId,
      cols,
      boardOriginX,
      boardOriginY,
      cellSize,
      tabRadius,
    );
    const correctCenterX = correctPos.x + tabRadius + cellSize / 2;
    const correctCenterY = correctPos.y + tabRadius + cellSize / 2;

    const dx = centerX - correctCenterX;
    const dy = centerY - correctCenterY;
    const distance = Math.hypot(dx, dy);

    const SNAP_THRESHOLD = cellSize * 0.45;

    let finalX = currentLeft;
    let finalY = currentTop;
    let snapped = false;

    if (distance <= SNAP_THRESHOLD) {
      finalX = correctPos.x;
      finalY = correctPos.y;
      snapped = true;
    } else {
      const rect = containerEl.getBoundingClientRect();
      const maxX = rect.width - pieceVisualSize;
      const maxY = rect.height - pieceVisualSize;
      finalX = clamp(currentLeft, 0, maxX);
      finalY = clamp(currentTop, 0, maxY);
    }

    pieceEl.style.left = `${finalX}px`;
    pieceEl.style.top = `${finalY}px`;
    pieceEl.style.zIndex = '';

    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId ? { ...p, x: finalX, y: finalY, snapped } : p,
      ),
    );

    setMoves((m) => m + 1);
    dragStateRef.current = createInitialDragState();
  };

  // ---------- CONTROLS PANEL ----------
  const controlsTopMargin = isMobile ? 64 : 72;
  const difficultyColumns = `repeat(${MOBILE_GRID_COLUMNS}, minmax(0, 1fr))`;

  const panelCardStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    background: 'linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))',
    border: '1px solid rgba(255,255,255,0.35)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
    backdropFilter: 'blur(16px)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  };

  const controlsContent = (
    <>
      <div style={{ marginBottom: 16, marginTop: controlsTopMargin, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Сложность</div>
        <div style={{ display: 'grid', gridTemplateColumns: difficultyColumns, gap: 14, justifyItems: 'center', width: '100%' }}>
          {JIGSAW_OPTIONS.map((opt) => {
            const active = opt.pieces === selectedOption.pieces;
            return (
              <button
                key={opt.pieces}
                type="button"
                onClick={() => newGame({ option: opt })}
                style={{
                  width: 'clamp(44px, 13vw, 58px)',
                  height: 'clamp(32px, 8.5vw, 40px)',
                  fontSize: 'clamp(12px, 2.7vw, 13px)',
                  borderRadius: 9999,
                  border: active ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.45)',
                  background: active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                  color: '#0f172a',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  backdropFilter: 'blur(12px)',
                  boxShadow: active ? '0 10px 26px rgba(0,0,0,0.2)' : '0 8px 20px rgba(0,0,0,0.14)',
                  transform: active ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ width: 'clamp(16px, 3.8vw, 20px)', height: 'clamp(16px, 3.8vw, 20px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))', position: 'relative', zIndex: 1 }}>
                  <img src="/assets/icon-puzzle.png" alt="puzzle" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(1.15)' }} />
                </span>
                <span style={{ position: 'relative', zIndex: 1 }}>{opt.pieces}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          type="button"
          onClick={() => setShowHint((v) => !v)}
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.35)',
            background: showHint ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.18)',
            cursor: 'pointer',
            fontSize: 14,
            width: '100%',
            color: '#0f172a',
            fontWeight: 600,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 18px rgba(0,0,0,0.16)',
          }}
        >
          {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
        </button>

        <button
          type="button"
          onClick={() => newGame()}
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.35)',
            background: 'rgba(255, 255, 255, 0.18)',
            cursor: 'pointer',
            fontSize: 14,
            width: '100%',
            color: '#0f172a',
            fontWeight: 600,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 18px rgba(0,0,0,0.16)',
          }}
        >
          Новая игра
        </button>
      </div>

      <div style={{ fontSize: 14, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(15,23,42,0.65)', color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <span style={{ opacity: 0.9 }}>Ходы:</span>
          <strong style={{ color: '#fff' }}>{moves}</strong>
        </span>
        <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(15,23,42,0.65)', color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <span style={{ opacity: 0.9 }}>Пазлов:</span>
          <strong style={{ color: '#fff' }}>{totalPieces}</strong>
        </span>
      </div>
    </>
  );

  // ---------- WORKSPACE (game area with board + tray) ----------
  const workspaceContent = (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: workspaceWidth,
        height: workspaceHeight,
        maxWidth: '100%',
        maxHeight: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'radial-gradient(circle at top left, #4b5563 0, #111827 55%, #020617 100%)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
        touchAction: 'none',
      }}
    >
      {/* Board zone indicator (dashed rectangle for assembly) */}
      <div
        style={{
          position: 'absolute',
          left: boardOriginX,
          top: boardOriginY,
          width: boardWidth,
          height: boardHeight,
          borderRadius: 12,
          border: '2px dashed rgba(241,245,249,0.4)',
          background: 'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,64,175,0.35))',
        }}
      />

      {/* Tray zone indicator */}
      <div
        style={{
          position: 'absolute',
          left: OUTER_PADDING + TRAY_MARGIN,
          top: trayZoneY + TRAY_MARGIN,
          width: workspaceWidth - OUTER_PADDING * 2 - TRAY_MARGIN * 2,
          height: trayZoneHeight - TRAY_MARGIN * 2,
          borderRadius: 12,
          border: '1px dashed rgba(148,163,184,0.3)',
          background: 'rgba(15,23,42,0.3)',
        }}
      />

      {/* Hint overlay */}
      {showHint && (
        <div
          style={{
            position: 'absolute',
            left: boardOriginX,
            top: boardOriginY,
            width: boardWidth,
            height: boardHeight,
            backgroundImage: `url(${selectedImage.src})`,
            backgroundSize: `${boardWidth}px ${boardHeight}px`,
            backgroundPosition: 'center',
            opacity: 0.4,
            pointerEvents: 'none',
            borderRadius: 12,
            zIndex: 5,
          }}
        />
      )}

      {/* Puzzle pieces */}
      {pieces.map((piece) => {
        const row = Math.floor(piece.id / cols);
        const col = piece.id % cols;
        const edges = pieceEdges[row]?.[col];
        if (!edges) return null;
        
        const path = getPiecePath(edges, cellSize);
        const clipId = `clip-${rows}x${cols}-${piece.id}-${cellSize}`;

        return (
          <div
            key={piece.id}
            ref={(el) => setPieceRef(piece.id, el)}
            onPointerDown={(e) => startDrag(e, piece.id)}
            onPointerMove={onDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{
              position: 'absolute',
              width: pieceVisualSize,
              height: pieceVisualSize,
              left: piece.x,
              top: piece.y,
              cursor: 'pointer',
              touchAction: 'none',
              userSelect: 'none',
              transition: 'left 160ms ease-out, top 160ms ease-out',
              filter: piece.snapped
                ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))'
                : 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
            }}
          >
            <svg
              width={pieceVisualSize}
              height={pieceVisualSize}
              viewBox={`${-tabRadius} ${-tabRadius} ${pieceVisualSize} ${pieceVisualSize}`}
            >
              <defs>
                <clipPath id={clipId}>
                  <path d={path} />
                </clipPath>
              </defs>
              <image
                href={selectedImage.src}
                x={-col * cellSize}
                y={-row * cellSize}
                width={boardWidth}
                height={boardHeight}
                clipPath={`url(#${clipId})`}
                preserveAspectRatio="xMidYMid slice"
              />
              <path
                d={path}
                fill="none"
                stroke="rgba(15,23,42,0.85)"
                strokeWidth={1.4}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );

  const burgerButton = (
    <button
      type="button"
      onClick={() => setIsPanelOpen((v) => !v)}
      aria-label={isPanelOpen ? 'Скрыть панель' : 'Показать панель'}
      style={{
        position: 'fixed',
        top: isMobile ? 68 : 76,
        left: isMobile ? 16 : 24,
        width: 40,
        height: 40,
        borderRadius: 9999,
        border: '1px solid rgba(255,255,255,0.35)',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.35), rgba(255,255,255,0.22))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(0,0,0,0.16)',
        padding: 0,
        zIndex: 60,
        cursor: 'pointer',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(31,41,55,0.9)" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );

  const controlsPanel = isPanelOpen ? (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', paddingTop: 8 }}>
      <div style={panelCardStyles}>{controlsContent}</div>
    </div>
  ) : null;

  // ---------- MOBILE LAYOUT ----------
  if (isMobile) {
    return (
      <div
        ref={outerContainerRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: '#020617',
          display: 'flex',
          flexDirection: 'column',
          padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 8px 8px 8px',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          gap: 8,
          overflow: 'hidden',
        }}
      >
        {burgerButton}
        {controlsPanel}

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {workspaceContent}
        </div>
      </div>
    );
  }

  // ---------- DESKTOP LAYOUT ----------
  return (
    <div
      ref={outerContainerRef}
      style={{
        position: 'relative',
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        paddingTop: 8,
        width: '100%',
        height: 'calc(100vh - 100px)',
        maxHeight: 'calc(100vh - 100px)',
        overflow: 'hidden',
      }}
    >
      {burgerButton}
      {controlsPanel && <div style={{ minWidth: 260, flexShrink: 0 }}>{controlsPanel}</div>}

      <div
        style={{
          display: 'flex',
          flex: 1,
          justifyContent: isPanelOpen ? 'flex-start' : 'center',
          alignItems: 'center',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        {workspaceContent}
      </div>
    </div>
  );
};

export default JigsawGame;
