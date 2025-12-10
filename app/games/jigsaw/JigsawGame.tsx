'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  JIGSAW_IMAGES,
  DEFAULT_IMAGE_ID,
  DEFAULT_OPTION,
  JIGSAW_OPTIONS,
  type JigsawOption,
} from './jigsawConfig';

const IMAGES = JIGSAW_IMAGES;

const CELL_SIZE = 96; // логическая клетка
const TAB_RADIUS = CELL_SIZE * 0.22; // радиус «ушка» — точно как 'r' в getPiecePath
const PIECE_VISUAL_SIZE = Math.ceil(CELL_SIZE + TAB_RADIUS * 2); // реальный размер div с учётом ушек

const BOARD_MARGIN = 24;

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

// ---------- ГЕОМЕТРИЯ ПАЗЛА ----------

type EdgeType = 'flat' | 'tab' | 'blank';

interface PieceEdges {
  top: EdgeType;
  right: EdgeType;
  bottom: EdgeType;
  left: EdgeType;
}

const complementEdge = (e: EdgeType): EdgeType =>
  e === 'tab' ? 'blank' : e === 'blank' ? 'tab' : 'flat';

/**
 * Детерминированно генерируем типы граней для всех кусков.
 * Без случайности → одинаково на сервере и клиенте.
 */
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

      // top
      if (r === 0) {
        piece.top = 'flat';
      } else {
        piece.top = complementEdge(edges[r - 1][c].bottom);
      }

      // left
      if (c === 0) {
        piece.left = 'flat';
      } else {
        piece.left = complementEdge(edges[r][c - 1].right);
      }

      // bottom (внутренние горизонтальные стыки)
      if (r === rows - 1) {
        piece.bottom = 'flat';
      } else {
        // шахматный узор: таб/пустота
        piece.bottom = (r + c) % 2 === 0 ? 'tab' : 'blank';
      }

      // right (внутренние вертикальные стыки)
      if (c === cols - 1) {
        piece.right = 'flat';
      } else {
        piece.right = (r + c + 1) % 2 === 0 ? 'tab' : 'blank';
      }
    }
  }

  return edges;
};

/**
 * Строим path для конкретного куска с учётом типов граней.
 * Основано на простых Bézier-дугах, выглядит как классический пазл.
 */
const getPiecePath = (edges: PieceEdges): string => {
  const s = CELL_SIZE;
  const r = s * 0.22; // радиус "ушки"
  const notchW = s * 0.18;
  const mid = s / 2;
  const x1 = mid - notchW;
  const x2 = mid + notchW;
  const y1 = mid - notchW;
  const y2 = mid + notchW;

  const k = 0.4; // коэффициент "крутизны" дуги

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
    // blank
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
    // blank
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
        `C ${x2 - notchW * k} ${s} ${mid + r} ${s + r} ${mid} ${
          s + r
        }`,
        `C ${mid - r} ${s + r} ${x1 + notchW * k} ${s} ${x1} ${s}`,
        `L 0 ${s}`,
      ].join(' ');
    }
    // blank
    return [
      `L ${x2} ${s}`,
      `C ${x2 - notchW * k} ${s} ${mid + r} ${s - r} ${mid} ${
        s - r
      }`,
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
    // blank
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
  rows: number,
  cols: number,
  boardOriginX: number,
  boardOriginY: number,
): { x: number; y: number } => {
  const row = Math.floor(pieceId / cols);
  const col = pieceId % cols;

  // позиция — левый верх внешнего прямоугольника (учитываем TAB_RADIUS)
  return {
    x: boardOriginX + col * CELL_SIZE - TAB_RADIUS,
    y: boardOriginY + row * CELL_SIZE - TAB_RADIUS,
  };
};


const MOBILE_BREAKPOINT = 768;
const MOBILE_BOARD_MARGIN = 6;

// ---------- КОМПОНЕНТ ----------

export interface JigsawGameProps {
  initialImageId?: string;
  initialGridSize?: number;
  /** If provided (from Supabase), use this URL instead of static images */
  puzzleImageUrl?: string;
  puzzleTitle?: string;
}

export const JigsawGame: React.FC<JigsawGameProps> = ({
  initialImageId,
  initialGridSize,
  puzzleImageUrl,
  puzzleTitle,
}) => {
  // Check if we have a Supabase puzzle
  const isSupabasePuzzle = Boolean(puzzleImageUrl);
  
  // Helpers for option selection (supports legacy grid sizes 3/4/5)
  const normalizePieces = (value?: number): number => {
    if (!value) return DEFAULT_OPTION.pieces;
    if (value === 3) return 9;
    if (value === 4) return 16;
    if (value === 5) return 25;
    return value;
  };

  const getOptionByPieces = (pieces: number): JigsawOption =>
    JIGSAW_OPTIONS.find((opt) => opt.pieces === pieces) || DEFAULT_OPTION;

  // Validate and apply initial values with fallbacks
  const defaultImageId = !isSupabasePuzzle && initialImageId && IMAGES.some(img => img.id === initialImageId)
    ? initialImageId
    : DEFAULT_IMAGE_ID;
  const initialPieces = normalizePieces(initialGridSize);
  const defaultOption = getOptionByPieces(initialPieces);

  const [selectedOption, setSelectedOption] =
    useState<JigsawOption>(defaultOption);
  const [selectedImageId, setSelectedImageId] = useState<string>(
    isSupabasePuzzle ? (initialImageId || 'supabase') : defaultImageId,
  );
  
  // Custom image URL state for Supabase puzzles
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(
    puzzleImageUrl || null
  );
  const [pieces, setPieces] = useState<PieceState[]>(() => {
    const total = defaultOption.rows * defaultOption.cols;
    return Array.from({ length: total }, (_, id) => ({
      id,
      x: 0,
      y: 0,
      snapped: false,
    }));
  });
  const [moves, setMoves] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragStateRef = useRef<DragState>(createInitialDragState());

  // Detect mobile - robust detection with user agent + viewport width
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

  // Get the current image - either from Supabase URL or static images
  const selectedImage = customImageUrl 
    ? { id: 'supabase', src: customImageUrl, label: puzzleTitle || 'Puzzle' }
    : (IMAGES.find((img) => img.id === selectedImageId) ?? IMAGES[0]);

  const isGameplayMode = Boolean(selectedImage);
  const MOBILE_GRID_COLUMNS = 3;

  const rows = selectedOption.rows;
  const cols = selectedOption.cols;
  const totalPieces = rows * cols;
  const boardWidth = cols * CELL_SIZE;
  const boardHeight = rows * CELL_SIZE;

  // Use smaller margin on mobile
  const boardMargin = isMobile ? MOBILE_BOARD_MARGIN : BOARD_MARGIN;

  // Toggle a body flag so the Navbar can react to in-game mobile layout
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

  // Layout variables - conditional on isMobile
  let workspaceWidth: number;
  let workspaceHeight: number;
  let boardOriginX: number;
  let boardOriginY: number;
  let scatterOriginX: number;
  let scatterOriginY: number;
  let scatterWidth: number;
  let scatterHeight: number;

  if (isMobile) {
    workspaceWidth = boardWidth + boardMargin * 2;

    // bottom area for scattered pieces (slightly smaller)
    const bottomAreaHeight = Math.max(
      boardHeight * 0.55,
      CELL_SIZE * 2 + boardMargin * 2,
    );

    workspaceHeight =
      boardHeight + bottomAreaHeight + boardMargin * 2;

    // board starts very close to the top of the card
    boardOriginX = boardMargin;
    boardOriginY = boardMargin;

    // scattered pieces area directly under the board
    scatterOriginX = boardMargin;
    scatterOriginY = boardOriginY + boardHeight + boardMargin;
    scatterWidth = workspaceWidth - boardMargin * 2;
    scatterHeight = bottomAreaHeight;
  } else {
    workspaceWidth = boardWidth * 2;
    workspaceHeight = boardHeight + BOARD_MARGIN * 2;

    boardOriginX = workspaceWidth - boardWidth - BOARD_MARGIN;
    boardOriginY = BOARD_MARGIN;

    scatterOriginX = BOARD_MARGIN;
    scatterOriginY = BOARD_MARGIN;
    scatterWidth = Math.max(PIECE_VISUAL_SIZE, boardWidth - BOARD_MARGIN * 2);
    scatterHeight = Math.max(PIECE_VISUAL_SIZE, boardHeight - BOARD_MARGIN * 2);
  }

  const pieceEdges = useMemo(
    () => generatePieceEdges(rows, cols),
    [rows, cols],
  );

  const setPieceRef = (id: number, el: HTMLDivElement | null) => {
    pieceRefs.current[id] = el;
  };

  const newGame = (opts?: { option?: JigsawOption; imageId?: string }) => {
    const nextOption = opts?.option ?? selectedOption;
    const total = nextOption.rows * nextOption.cols;
    const nextBoardWidth = nextOption.cols * CELL_SIZE;
    const nextBoardHeight = nextOption.rows * CELL_SIZE;

    // Use correct margin based on isMobile
    const margin = isMobile ? MOBILE_BOARD_MARGIN : BOARD_MARGIN;

    // Calculate scatter dimensions based on current isMobile state
    let nextScatterOriginX: number;
    let nextScatterOriginY: number;
    let nextScatterWidth: number;
    let nextScatterHeight: number;

    if (isMobile) {
      const nextWorkspaceWidth = nextBoardWidth + margin * 2;
      const bottomAreaHeight = Math.max(
        nextBoardHeight * 0.55,
        CELL_SIZE * 2 + margin * 2,
      );
      nextScatterOriginX = margin;
      nextScatterOriginY = margin + nextBoardHeight + margin;
      nextScatterWidth = nextWorkspaceWidth - margin * 2;
      nextScatterHeight = bottomAreaHeight;
    } else {
      nextScatterOriginX = BOARD_MARGIN;
      nextScatterOriginY = BOARD_MARGIN;
      nextScatterWidth = Math.max(PIECE_VISUAL_SIZE, nextBoardWidth - BOARD_MARGIN * 2);
      nextScatterHeight = Math.max(PIECE_VISUAL_SIZE, nextBoardHeight - BOARD_MARGIN * 2);
    }

    const nextPieces: PieceState[] = [];

    for (let id = 0; id < total; id += 1) {
      const randX =
        nextScatterOriginX +
        Math.random() * Math.max(1, nextScatterWidth - PIECE_VISUAL_SIZE);
      const randY =
        nextScatterOriginY +
        Math.random() * Math.max(1, nextScatterHeight - PIECE_VISUAL_SIZE);

      nextPieces.push({
        id,
        x: randX,
        y: randY,
        snapped: false,
      });
    }

    setSelectedOption(nextOption);
    if (opts?.imageId) setSelectedImageId(opts.imageId);
    setPieces(nextPieces);
    setMoves(0);
    setIsPanelOpen(true);
    dragStateRef.current = createInitialDragState();
  };


  // раскидываем кусочки только на клиенте, после гидратации
  useEffect(() => {
    newGame({ option: defaultOption });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const startDrag = (
    e: React.PointerEvent<HTMLDivElement>,
    pieceId: number,
  ) => {
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
    

    if (
      drag.activePieceId === null ||
      drag.pointerId === null ||
      drag.pointerId !== e.pointerId
    ) {
      return;
    }

    const pieceEl = pieceRefs.current[drag.activePieceId];
    if (!pieceEl) return;

    const localX = e.clientX - drag.containerLeft;
    const localY = e.clientY - drag.containerTop;

    let newLeft = localX - drag.offsetX;
    let newTop = localY - drag.offsetY;

    const maxX = drag.workspaceWidth - PIECE_VISUAL_SIZE;
    const maxY = drag.workspaceHeight - PIECE_VISUAL_SIZE;

    newLeft = clamp(newLeft, 0, maxX);
    newTop = clamp(newTop, 0, maxY);

    pieceEl.style.left = `${newLeft}px`;
    pieceEl.style.top = `${newTop}px`;

    e.preventDefault();
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;

    if (
      drag.activePieceId === null ||
      drag.pointerId === null ||
      drag.pointerId !== e.pointerId
    ) {
      return;
    }

    const pieceId = drag.activePieceId;
    const pieceEl = pieceRefs.current[pieceId];
    const containerEl = containerRef.current;

    if (!pieceEl || !containerEl) {
      dragStateRef.current = createInitialDragState();
      return;
    }

    try {
      pieceEl.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    pieceEl.style.transition = 'left 160ms ease-out, top 160ms ease-out';

    const currentLeft = parseFloat(pieceEl.style.left || '0');
    const currentTop = parseFloat(pieceEl.style.top || '0');

    // Центр базовой ячейки (без ушек) для корректного snapping
    const centerX = currentLeft + TAB_RADIUS + CELL_SIZE / 2;
    const centerY = currentTop + TAB_RADIUS + CELL_SIZE / 2;

    const correctPos = getCorrectPosition(
      pieceId,
      rows,
      cols,
      boardOriginX,
      boardOriginY,
    );
    const correctCenterX = correctPos.x + TAB_RADIUS + CELL_SIZE / 2;
    const correctCenterY = correctPos.y + TAB_RADIUS + CELL_SIZE / 2;

    const dx = centerX - correctCenterX;
    const dy = centerY - correctCenterY;
    const distance = Math.hypot(dx, dy);

    const SNAP_THRESHOLD = CELL_SIZE * 0.45;

    let finalX = currentLeft;
    let finalY = currentTop;
    let snapped = false;

    if (distance <= SNAP_THRESHOLD) {
      finalX = correctPos.x;
      finalY = correctPos.y;
      snapped = true;
    } else {
      const rect = containerEl.getBoundingClientRect();
      const maxX = rect.width - PIECE_VISUAL_SIZE;
      const maxY = rect.height - PIECE_VISUAL_SIZE;
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

  // Если вдруг сменили сложность, а массив не совпадает по длине —
  // аккуратно пересоздаём, без рандома.
  useEffect(() => {
    if (pieces.length !== totalPieces) {
      const fixed: PieceState[] = Array.from(
        { length: totalPieces },
        (_, id) => ({ id, x: 0, y: 0, snapped: false }),
      );
      setPieces(fixed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPieces]);

  // ---------- CONTROLS JSX (reusable for desktop sidebar and mobile overlay) ----------
  const difficultyColumns = `repeat(${MOBILE_GRID_COLUMNS}, minmax(0, 1fr))`;
  const controlsTopMargin = isMobile ? 64 : 72;

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
      <div
        style={{
          marginBottom: 16,
          marginTop: controlsTopMargin,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Сложность</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: difficultyColumns,
            gap: 14,
            justifyItems: 'center',
            width: '100%',
          }}
        >
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
                  boxShadow: active
                    ? '0 10px 26px rgba(0,0,0,0.2)'
                    : '0 8px 20px rgba(0,0,0,0.14)',
                  transform: active ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.22)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = active ? 'scale(1.02)' : 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = active
                    ? '0 10px 26px rgba(0,0,0,0.2)'
                    : '0 8px 20px rgba(0,0,0,0.14)';
                }}
              >
                <span
                  style={{
                    width: 'clamp(16px, 3.8vw, 20px)',
                    height: 'clamp(16px, 3.8vw, 20px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <img
                    src="/assets/icon-puzzle.png"
                    alt="puzzle"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'brightness(1.15)',
                    }}
                  />
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
            background: showHint
              ? 'rgba(255, 255, 255, 0.28)'
              : 'rgba(255, 255, 255, 0.18)',
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

      <div
        style={{
          fontSize: 14,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <span
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(15,23,42,0.65)',
            color: '#f8fafc',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <span style={{ opacity: 0.9 }}>Ходы:</span>
          <strong style={{ color: '#fff' }}>{moves}</strong>
        </span>
        <span
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(15,23,42,0.65)',
            color: '#f8fafc',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <span style={{ opacity: 0.9 }}>Пазлов:</span>
          <strong style={{ color: '#fff' }}>{totalPieces}</strong>
        </span>
      </div>
    </>
  );

  // ---------- WORKSPACE JSX (the puzzle board and pieces) ----------
  const workspaceContent = (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: workspaceWidth,
        height: workspaceHeight,
        borderRadius: isMobile ? 18 : 12,
        overflow: 'hidden',
        border: isMobile
          ? '2px solid rgba(148,163,184,0.6)'
          : '2px solid #4b5563',
        background:
          'radial-gradient(circle at top left, #4b5563 0, #111827 55%, #020617 100%)',
        boxShadow: isMobile
          ? '0 16px 40px rgba(0,0,0,0.55)'
          : '0 12px 30px rgba(0,0,0,0.35)',
        touchAction: 'none',
        flexShrink: 0,
      }}
    >
      {/* Рамка-цель */}
      <div
        style={{
          position: 'absolute',
          left: boardOriginX,
          top: boardOriginY,
          width: boardWidth,
          height: boardHeight,
          borderRadius: 12,
          border: '2px dashed rgba(241,245,249,0.4)',
          background:
            'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,64,175,0.35))',
        }}
      />

      {/* Подсказка */}
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

      {/* Фигурные кусочки */}
      {pieces.map((piece) => {
        const row = Math.floor(piece.id / cols);
        const col = piece.id % cols;
        const edges = pieceEdges[row][col];
        const path = getPiecePath(edges);

        const correctRow = row;
        const correctCol = col;
        const clipId = `clip-${rows}x${cols}-${piece.id}`;

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
              width: PIECE_VISUAL_SIZE,
              height: PIECE_VISUAL_SIZE,
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
              width={PIECE_VISUAL_SIZE}
              height={PIECE_VISUAL_SIZE}
              viewBox={`${-TAB_RADIUS} ${-TAB_RADIUS} ${PIECE_VISUAL_SIZE} ${PIECE_VISUAL_SIZE}`}
            >
              <defs>
                <clipPath id={clipId}>
                  <path d={path} />
                </clipPath>
              </defs>

              <image
                href={selectedImage.src}
                x={-correctCol * CELL_SIZE}
                y={-correctRow * CELL_SIZE}
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
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(31,41,55,0.9)"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );

  const controlsPanel = isPanelOpen ? (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        paddingTop: 8,
      }}
    >
      <div style={panelCardStyles}>{controlsContent}</div>
    </div>
  ) : null;

  // ---------- MOBILE LAYOUT ----------
  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: '#020617',
          display: 'flex',
          flexDirection: 'column',
          padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 12px 12px 12px',
          boxSizing: 'border-box',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          gap: 14,
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
      style={{
        position: 'relative',
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        paddingTop: 8,
      }}
    >
      {burgerButton}
      {controlsPanel && <div style={{ minWidth: 260 }}>{controlsPanel}</div>}

      <div
        style={{
          display: 'flex',
          flex: 1,
          justifyContent: isPanelOpen ? 'flex-start' : 'center',
        }}
      >
        {workspaceContent}
      </div>
    </div>
  );
};

export default JigsawGame;



