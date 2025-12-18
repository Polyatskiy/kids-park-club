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
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

const IMAGES = JIGSAW_IMAGES;

// Layout constants
const MIN_CELL_SIZE = 16;
const MOBILE_BREAKPOINT = 640; // Changed to 640px to include small tablets in desktop layout

// Vertical space allocation (mobile-first)
const BOARD_HEIGHT_RATIO = 0.62;

// Margins and padding
const OUTER_PADDING = 8;
const BOARD_MARGIN = 4; // Reduced from 8 to maximize board size
const TRAY_MARGIN = 8;
const TRAY_INNER_PADDING = 6;

// Board should fill at least this much of its allocated zone
const MIN_BOARD_FILL_RATIO = 0.85;

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

interface LayoutDimensions {
  workspaceWidth: number;
  workspaceHeight: number;
  boardZoneWidth: number;
  boardZoneHeight: number;
  boardZoneY: number;
  cellSize: number;
  tabRadius: number;
  pieceVisualSize: number;
  boardWidth: number;
  boardHeight: number;
  boardOriginX: number;
  boardOriginY: number;
  trayZoneWidth: number;
  trayZoneHeight: number;
  trayZoneY: number;
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
  isMobile: boolean,
  imageAspectRatio: number | null, // width / height
): LayoutDimensions => {
  const availableWidth = containerWidth - OUTER_PADDING * 2;
  const availableHeight = containerHeight - OUTER_PADDING * 2;
  
  let boardZoneWidth: number;
  let boardZoneHeight: number;
  let boardZoneY: number;
  let trayZoneWidth: number;
  let trayZoneHeight: number;
  let trayZoneY: number;
  let scatterX: number;
  let scatterY: number;
  let scatterWidth: number;
  let scatterHeight: number;
  
  if (isMobile) {
    // Mobile: vertical layout (board top, tray bottom)
    boardZoneHeight = Math.floor(availableHeight * BOARD_HEIGHT_RATIO);
    trayZoneHeight = availableHeight - boardZoneHeight;
    
    boardZoneY = OUTER_PADDING;
    boardZoneWidth = availableWidth;
    
    trayZoneY = boardZoneY + boardZoneHeight;
    trayZoneWidth = availableWidth;
    
    scatterX = OUTER_PADDING + TRAY_MARGIN + TRAY_INNER_PADDING;
    scatterY = trayZoneY + TRAY_MARGIN + TRAY_INNER_PADDING;
    scatterWidth = trayZoneWidth - TRAY_MARGIN * 2 - TRAY_INNER_PADDING * 2;
    scatterHeight = trayZoneHeight - TRAY_MARGIN * 2 - TRAY_INNER_PADDING * 2;
  } else {
    // Desktop/Tablet: two-column layout (tray left, board right full-height)
    const TRAY_WIDTH = 280; // Fixed width for tray on desktop
    const GAP = 16; // Gap between tray and board
    
    trayZoneWidth = TRAY_WIDTH;
    trayZoneHeight = availableHeight;
    trayZoneY = OUTER_PADDING;
    
    boardZoneWidth = availableWidth - TRAY_WIDTH - GAP;
    boardZoneHeight = availableHeight;
    boardZoneY = OUTER_PADDING;
    
    scatterX = OUTER_PADDING + TRAY_MARGIN + TRAY_INNER_PADDING;
    scatterY = trayZoneY + TRAY_MARGIN + TRAY_INNER_PADDING;
    scatterWidth = trayZoneWidth - TRAY_MARGIN * 2 - TRAY_INNER_PADDING * 2;
    scatterHeight = trayZoneHeight - TRAY_MARGIN * 2 - TRAY_INNER_PADDING * 2;
  }
  
  // Available space for the board - use maximum available space
  // Minimize margins to maximize board size and image scale
  const boardAvailableWidth = boardZoneWidth - BOARD_MARGIN * 2;
  const boardAvailableHeight = boardZoneHeight - BOARD_MARGIN * 2;
  
  // Ensure we have positive dimensions
  const effectiveBoardWidth = Math.max(1, boardAvailableWidth);
  const effectiveBoardHeight = Math.max(1, boardAvailableHeight);
  
  // Calculate board dimensions preserving IMAGE aspect ratio (not puzzle grid)
  // The board must maintain the original image's aspect ratio to prevent stretching
  let boardWidth: number;
  let boardHeight: number;
  let cellSize: number;
  
  // Calculate puzzle grid aspect ratio
  const puzzleAspectRatio = cols / rows;
  
  if (imageAspectRatio && imageAspectRatio > 0) {
    // Step 1: Calculate MAXIMUM board size that uses ALL available space
    // Board must use IMAGE aspect ratio to adapt to the image, not force image to fit fixed board
    // Priority: use full available HEIGHT if image is portrait, full WIDTH if image is landscape
    
    // Calculate what size board would be if we use full available height
    const boardHeightByHeight = effectiveBoardHeight;
    const boardWidthByHeight = boardHeightByHeight * imageAspectRatio;
    
    // Calculate what size board would be if we use full available width
    const boardWidthByWidth = effectiveBoardWidth;
    const boardHeightByWidth = boardWidthByWidth / imageAspectRatio;
    
    // Choose the dimension that maximizes board size while ensuring it fits
    // This adapts board to image aspect ratio, not vice versa
    if (boardWidthByHeight <= effectiveBoardWidth) {
      // Height is the limiting factor - use full available height (portrait image)
      boardHeight = boardHeightByHeight;
      boardWidth = boardWidthByHeight;
    } else {
      // Width is the limiting factor - use full available width (landscape image)
      boardWidth = boardWidthByWidth;
      boardHeight = boardHeightByWidth;
    }
    
    // Step 2: Calculate cellSize to ensure grid COVERS entire board
    // Grid must cover 100% of board to ensure all image parts are accessible
    // Calculate cellSize if grid fills board width
    const cellSizeByBoardWidth = boardWidth / cols;
    const gridHeightByWidth = rows * cellSizeByBoardWidth;
    
    // Calculate cellSize if grid fills board height
    const cellSizeByBoardHeight = boardHeight / rows;
    const gridWidthByHeight = cols * cellSizeByBoardHeight;
    
    // Choose cellSize that ensures grid COVERS (not just fits) the entire board
    // Use the LARGER cellSize to ensure grid covers entire board area
    if (gridHeightByWidth >= boardHeight) {
      // Grid covers by width - use this cellSize
      cellSize = Math.max(MIN_CELL_SIZE, Math.floor(cellSizeByBoardWidth));
    } else {
      // Grid covers by height - use this cellSize
      cellSize = Math.max(MIN_CELL_SIZE, Math.floor(cellSizeByBoardHeight));
    }
    
    // Step 3: Recalculate board from cellSize to ensure grid covers 100% of board
    // This ensures grid covers entire board area, and image covers entire grid
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;
    
    // Use grid dimensions as board dimensions to ensure 100% coverage
    // This ensures puzzle covers 100% of image area - no missing pieces
    boardWidth = gridWidth;
    boardHeight = gridHeight;
  } else {
    // Fallback: use puzzle grid aspect ratio if image dimensions not available
    const puzzleAspectRatio = cols / rows;
    
    const boardWidthByWidth = boardAvailableWidth;
    const boardHeightByWidth = boardWidthByWidth / puzzleAspectRatio;
    
    const boardHeightByHeight = boardAvailableHeight;
    const boardWidthByHeight = boardHeightByHeight * puzzleAspectRatio;
    
    if (boardHeightByWidth <= boardAvailableHeight) {
      boardWidth = boardWidthByWidth;
      boardHeight = boardHeightByWidth;
    } else {
      boardWidth = boardWidthByHeight;
      boardHeight = boardHeightByHeight;
    }
    
    cellSize = Math.max(
      MIN_CELL_SIZE,
      Math.floor(Math.min(boardWidth / cols, boardHeight / rows))
    );
    
    boardWidth = cols * cellSize;
    boardHeight = rows * cellSize;
  }
  
  const tabRadius = cellSize * 0.22;
  const pieceVisualSize = Math.ceil(cellSize + tabRadius * 2);
  
  // Position the board within the board zone
  // Center horizontally, align to top vertically to maximize height usage
  const boardOriginX = (isMobile ? OUTER_PADDING : OUTER_PADDING + trayZoneWidth + 16) + Math.floor((boardZoneWidth - boardWidth) / 2);
  // Align board to top of zone (with minimal margin) to eliminate empty space at top
  const boardOriginY = boardZoneY + BOARD_MARGIN;
  
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
    boardHeight, // Board height is already maximized to use full available height
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

const scatterPiecesInTray = (
  total: number,
  scatterX: number,
  scatterY: number,
  scatterWidth: number,
  scatterHeight: number,
  pieceVisualSize: number,
): PieceState[] => {
  const pieces: PieceState[] = [];
  
  const maxX = Math.max(0, scatterWidth - pieceVisualSize);
  const maxY = Math.max(0, scatterHeight - pieceVisualSize);
  
  for (let id = 0; id < total; id++) {
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

// ---------- ANIMATED BURGER/X ICON ----------
interface BurgerIconProps {
  isOpen: boolean;
}

const BurgerIcon: React.FC<BurgerIconProps> = ({ isOpen }) => {
  const lineStyle: React.CSSProperties = {
    position: 'absolute',
    width: 18,
    height: 2.5,
    backgroundColor: '#1e293b', // Dark color for contrast on light background
    borderRadius: 2,
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    left: '50%',
    marginLeft: -9,
  };

  return (
    <div style={{ position: 'relative', width: 24, height: 24 }}>
      {/* Top line - rotates to form X */}
      <span
        style={{
          ...lineStyle,
          top: isOpen ? '50%' : 8,
          transform: isOpen 
            ? 'translateY(-50%) rotate(45deg)' 
            : 'translateY(0) rotate(0deg)',
        }}
      />
      {/* Bottom line - rotates to form X */}
      <span
        style={{
          ...lineStyle,
          top: isOpen ? '50%' : 14,
          transform: isOpen 
            ? 'translateY(-50%) rotate(-45deg)' 
            : 'translateY(0) rotate(0deg)',
        }}
      />
    </div>
  );
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
  const t = useTranslations("common.jigsaw");
  const router = useRouter();
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

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
        width < MOBILE_BREAKPOINT ||
        window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
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

  // Load image to get its dimensions for proper hint scaling
  useEffect(() => {
    if (!selectedImage?.src) return;
    
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      // Fallback: assume square aspect ratio if image fails to load
      setImageDimensions({ width: 1, height: 1 });
    };
    img.src = selectedImage.src;
  }, [selectedImage?.src]);

  const rows = selectedOption.rows;
  const cols = selectedOption.cols;
  const totalPieces = rows * cols;

  // Calculate image aspect ratio for proper scaling
  const imageAspectRatio = imageDimensions 
    ? imageDimensions.width / imageDimensions.height 
    : null;

  const layout = useMemo(() => {
    const width = containerSize.width || (isMobile ? 360 : 800);
    const height = containerSize.height || (isMobile ? 600 : 700);
    return calculateLayout(width, height, rows, cols, isMobile, imageAspectRatio);
  }, [containerSize.width, containerSize.height, rows, cols, isMobile, imageAspectRatio]);

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
    trayZoneWidth,
    trayZoneY,
    trayZoneHeight,
    scatterX,
    scatterY,
    scatterWidth,
    scatterHeight,
  } = layout;

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

  const newGame = useCallback((opts?: { option?: JigsawOption; imageId?: string }) => {
    const nextOption = opts?.option ?? selectedOption;
    const total = nextOption.rows * nextOption.cols;
    
    const width = containerSize.width || (isMobile ? 360 : 800);
    const height = containerSize.height || (isMobile ? 600 : 700);
    const nextLayout = calculateLayout(width, height, nextOption.rows, nextOption.cols, isMobile, imageAspectRatio);
    
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
    setIsMenuOpen(false); // Close menu after selecting new game
    setIsInitialized(true);
    dragStateRef.current = createInitialDragState();
  }, [selectedOption, containerSize.width, containerSize.height, isMobile]);

  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0 && !isInitialized) {
      newGame({ option: selectedOption });
    }
  }, [containerSize.width, containerSize.height, isInitialized, newGame, selectedOption]);

  const prevLayoutRef = useRef<{ scatterWidth: number; scatterHeight: number; pieceVisualSize: number } | null>(null);
  useEffect(() => {
    if (!isInitialized || pieces.length === 0) return;
    
    const prev = prevLayoutRef.current;
    if (prev && (
      Math.abs(prev.scatterWidth - scatterWidth) > 20 ||
      Math.abs(prev.scatterHeight - scatterHeight) > 20 ||
      Math.abs(prev.pieceVisualSize - pieceVisualSize) > 5
    )) {
      setPieces(prevPieces => {
        return prevPieces.map(piece => {
          if (piece.snapped) {
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

    // Allow piece to move freely to reach board edges
    // Piece center is at (newLeft + tabRadius + cellSize/2, newTop + tabRadius + cellSize/2)
    // To allow center to reach workspace edges, we need extended bounds
    const minX = -tabRadius - cellSize / 2; // Allow piece center to reach left edge (x=0)
    const minY = -tabRadius - cellSize / 2; // Allow piece center to reach top edge (y=0)
    const maxX = drag.workspaceWidth - (tabRadius + cellSize / 2); // Allow piece center to reach right edge
    const maxY = drag.workspaceHeight - (tabRadius + cellSize / 2); // Allow piece center to reach bottom edge

    newLeft = clamp(newLeft, minX, maxX);
    newTop = clamp(newTop, minY, maxY);

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
      // Use workspace dimensions from drag state for consistent boundaries
      // Allow piece to move freely to reach board edges
      // Piece center is at (currentLeft + tabRadius + cellSize/2, currentTop + tabRadius + cellSize/2)
      // To allow center to reach workspace edges, we need extended bounds
      const minX = -tabRadius - cellSize / 2; // Allow piece center to reach left edge (x=0)
      const minY = -tabRadius - cellSize / 2; // Allow piece center to reach top edge (y=0)
      const maxX = drag.workspaceWidth - (tabRadius + cellSize / 2); // Allow piece center to reach right edge
      const maxY = drag.workspaceHeight - (tabRadius + cellSize / 2); // Allow piece center to reach bottom edge
      finalX = clamp(currentLeft, minX, maxX);
      finalY = clamp(currentTop, minY, maxY);
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

  // ---------- MENU PANEL CONTENT ----------
  const difficultyColumns = `repeat(${MOBILE_GRID_COLUMNS}, minmax(0, 1fr))`;

  const menuContent = (
    <div style={{ padding: 20, paddingTop: 60 }}>
      {/* Difficulty section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 12, textAlign: 'center' }}>
          {t("difficulty")}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: difficultyColumns, gap: 12, justifyItems: 'center' }}>
          {JIGSAW_OPTIONS.map((opt) => {
            const active = opt.pieces === selectedOption.pieces;
            // Dynamic font size based on digit count
            const fontSize = opt.pieces >= 100 ? 18 : opt.pieces >= 10 ? 22 : 26;
            return (
              <button
                key={opt.pieces}
                type="button"
                onClick={() => newGame({ option: opt })}
                style={{
                  position: 'relative',
                  width: 56,
                  height: 56,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {/* Puzzle icon as background */}
                <img 
                  src="/icons/puzzle.png" 
                  alt="" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    filter: active ? 'brightness(1.15) drop-shadow(0 2px 6px rgba(255,255,255,0.3))' : 'brightness(1)',
                  }} 
                />
                {/* Number overlay centered on icon */}
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: fontSize,
                    fontWeight: 800,
                    color: '#1E3A8A',
                    textShadow: '0 1px 2px rgba(255,255,255,0.3)',
                    lineHeight: 1,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {opt.pieces}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setShowHint((v) => !v)}
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.25)',
            background: showHint ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            fontSize: 14,
            color: '#f1f5f9',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
        >
          {showHint ? t("hideHint") : t("showHint")}
        </button>

        <button
          type="button"
          onClick={() => newGame()}
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            fontSize: 14,
            color: '#f1f5f9',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
        >
          {t("newGame")}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={{ padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {t("moves")}: <strong>{moves}</strong>
        </span>
        <span style={{ padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {t("pieces")}: <strong>{totalPieces}</strong>
        </span>
      </div>
    </div>
  );

  // ---------- WORKSPACE (game area with board + tray) ----------
  const workspaceContent = (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: isMobile ? workspaceWidth : '100%',
        height: isMobile ? workspaceHeight : undefined, // Don't set height on desktop, let flex handle it
        flex: isMobile ? 'none' : '1 1 0', // Use flex on desktop to fill available space
        minHeight: 0, // Important for flex children to shrink properly
        maxWidth: '100%',
        maxHeight: '100%',
        borderRadius: 16,
        overflow: 'visible', // Changed from 'hidden' to allow pieces to move freely without clipping
        background: 'radial-gradient(circle at top left, #4b5563 0, #111827 55%, #020617 100%)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
        touchAction: 'none',
      }}
    >
      {/* Board zone indicator */}
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
          width: trayZoneWidth - TRAY_MARGIN * 2,
          height: trayZoneHeight - TRAY_MARGIN * 2,
          borderRadius: 12,
          border: '1px dashed rgba(148,163,184,0.3)',
          background: 'rgba(15,23,42,0.3)',
          overflowY: isMobile ? 'visible' : 'auto',
          overflowX: 'hidden',
        }}
      />

      {/* Hint overlay */}
      {showHint && imageDimensions && (
        <div
          style={{
            position: 'absolute',
            left: boardOriginX,
            top: boardOriginY,
            width: boardWidth,
            height: boardHeight,
            backgroundImage: `url(${selectedImage.src})`,
            // Use 'cover' to ensure image fills entire board area
            // This matches the SVG pieces which use preserveAspectRatio="slice"
            // Both hint and pieces will show image covering 100% of board/grid area
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.4,
            pointerEvents: 'none',
            borderRadius: 12,
            zIndex: 5,
            // Ensure the hint container matches the exact board dimensions
            // Don't use overflow: hidden here - it might clip the image
            overflow: 'visible',
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
                // 'slice' (cover) ensures image fills entire boardWidth x boardHeight
                // Image is scaled to cover the entire board/grid area while preserving aspect ratio
                // This ensures 100% image coverage of the puzzle grid
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

  // ---------- OVERLAY BUTTONS (back + menu) ----------
  // Shared button style for overlay controls
  const overlayButtonStyle: React.CSSProperties = {
    position: 'fixed',
    width: 44,
    height: 44,
    borderRadius: 9999,
    border: 'none',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(241,245,249,0.9))',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
    padding: 0,
    zIndex: 100,
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>, isEnter: boolean) => {
    if (isEnter) {
      e.currentTarget.style.transform = 'scale(1.05)';
      e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2), 0 3px 10px rgba(0,0,0,0.15)';
    } else {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)';
    }
  };

  // Back button (top-left)
  const backButton = (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      style={{
        ...overlayButtonStyle,
        top: isMobile ? 16 : 20,
        left: isMobile ? 16 : 24,
        color: '#1e293b', // Dark color for contrast on light background
      }}
      onMouseEnter={(e) => handleButtonHover(e, true)}
      onMouseLeave={(e) => handleButtonHover(e, false)}
    >
      <svg
        style={{ width: 20, height: 20 }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );

  // Burger button (top-right)
  const burgerButton = (
    <button
      type="button"
      onClick={() => setIsMenuOpen((v) => !v)}
      aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
      style={{
        ...overlayButtonStyle,
        top: isMobile ? 16 : 20,
        right: isMobile ? 16 : 24,
      }}
      onMouseEnter={(e) => handleButtonHover(e, true)}
      onMouseLeave={(e) => handleButtonHover(e, false)}
    >
      <BurgerIcon isOpen={isMenuOpen} />
    </button>
  );

  // ---------- SLIDE-IN MENU OVERLAY ----------
  const menuOverlay = (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsMenuOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 90,
          opacity: isMenuOpen ? 1 : 0,
          pointerEvents: isMenuOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />
      
      {/* Slide-in panel from right */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: isMobile ? '85%' : 320,
          maxWidth: 360,
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
          zIndex: 95,
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          overflowY: 'auto',
        }}
      >
        {menuContent}
      </div>
    </>
  );

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
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 8px calc(env(safe-area-inset-bottom, 0px) + 8px) 8px',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          overflow: 'hidden',
          width: '100%',
          height: '100dvh', // Use dynamic viewport height for better mobile support
        }}
      >
        {/* Game workspace - always visible, never pushed */}
        {workspaceContent}
        
        {/* Overlay buttons: Back (left) and Menu (right) */}
        {backButton}
        {burgerButton}
        
        {/* Menu overlay - slides from right */}
        {menuOverlay}
      </div>
    );
  }

  // ---------- DESKTOP LAYOUT ----------
  // Fullscreen game mode - no navbar, use entire viewport
  return (
    <div
      ref={outerContainerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        width: '100%',
        height: '100dvh', // Use dynamic viewport height for better mobile support
        overflow: 'hidden',
        padding: '8px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        boxSizing: 'border-box',
        zIndex: 30,
      }}
    >
      {/* Game workspace - full height with two-column layout */}
      {workspaceContent}
      
      {/* Overlay buttons: Back (left) and Menu (right) */}
      {backButton}
      {burgerButton}
      
      {/* Menu overlay - slides from right */}
      {menuOverlay}
    </div>
  );
};

export default JigsawGame;
