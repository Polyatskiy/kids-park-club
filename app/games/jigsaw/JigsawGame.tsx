'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type Difficulty = 3 | 4 | 5;

interface PuzzleImage {
  id: string;
  src: string;
  label: string;
}

// ⚠️ если файл лежит в public/puzzles/warsaw.png,
// то путь в src должен быть '/puzzles/warsaw.png'
const IMAGES: PuzzleImage[] = [
  { id: 'city', src: '/puzzles/warsaw.png', label: 'Warsaw' },
  { id: 'mountain', src: '/puzzles/mountain.png', label: 'Mountains' },
  { id: 'village', src: '/puzzles/village.png', label: 'Village' },
];

const CELL_SIZE = 96; // логическая клетка
const TAB_RADIUS = CELL_SIZE * 0.22; // радиус «ушка» — точно как 'r' в getPiecePath
const PIECE_VISUAL_SIZE = Math.ceil(CELL_SIZE + TAB_RADIUS * 2); // реальный размер div с учётом ушек

const INITIAL_DIFFICULTY: Difficulty = 3;
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
const generatePieceEdges = (gridSize: number): PieceEdges[][] => {
  const edges: PieceEdges[][] = Array.from(
    { length: gridSize },
    () => Array.from({ length: gridSize }, () => ({
      top: 'flat' as EdgeType,
      right: 'flat' as EdgeType,
      bottom: 'flat' as EdgeType,
      left: 'flat' as EdgeType,
    })),
  );

  for (let r = 0; r < gridSize; r += 1) {
    for (let c = 0; c < gridSize; c += 1) {
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
      if (r === gridSize - 1) {
        piece.bottom = 'flat';
      } else {
        // шахматный узор: таб/пустота
        piece.bottom = (r + c) % 2 === 0 ? 'tab' : 'blank';
      }

      // right (внутренние вертикальные стыки)
      if (c === gridSize - 1) {
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
  gridSize: number,
  boardOriginX: number,
  boardOriginY: number,
): { x: number; y: number } => {
  const row = Math.floor(pieceId / gridSize);
  const col = pieceId % gridSize;

  // позиция — левый верх внешнего прямоугольника (учитываем TAB_RADIUS)
  return {
    x: boardOriginX + col * CELL_SIZE - TAB_RADIUS,
    y: boardOriginY + row * CELL_SIZE - TAB_RADIUS,
  };
};


// ---------- КОМПОНЕНТ ----------

export const JigsawGame: React.FC = () => {
  const [difficulty, setDifficulty] =
    useState<Difficulty>(INITIAL_DIFFICULTY);
  const [selectedImageId, setSelectedImageId] = useState<string>(
    IMAGES[0].id,
  );
  const [pieces, setPieces] = useState<PieceState[]>(() => {
    const total = INITIAL_DIFFICULTY * INITIAL_DIFFICULTY;
    return Array.from({ length: total }, (_, id) => ({
      id,
      x: 0,
      y: 0,
      snapped: false,
    }));
  });
  const [moves, setMoves] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragStateRef = useRef<DragState>(createInitialDragState());

  const selectedImage =
    IMAGES.find((img) => img.id === selectedImageId) ?? IMAGES[0];

  const gridSize = difficulty;
  const totalPieces = gridSize * gridSize;
  const boardSize = gridSize * CELL_SIZE;

  const workspaceWidth = boardSize * 2;
  const workspaceHeight = boardSize + BOARD_MARGIN * 2;

  const boardOriginX = workspaceWidth - boardSize - BOARD_MARGIN;
  const boardOriginY = BOARD_MARGIN;

  const scatterOriginX = BOARD_MARGIN;
  const scatterOriginY = BOARD_MARGIN;
  const scatterWidth = boardSize - BOARD_MARGIN * 2;
  const scatterHeight = boardSize - BOARD_MARGIN * 2;

  const pieceEdges = useMemo(
    () => generatePieceEdges(gridSize),
    [gridSize],
  );

  const setPieceRef = (id: number, el: HTMLDivElement | null) => {
    pieceRefs.current[id] = el;
  };

  const newGame = (opts?: { difficulty?: Difficulty; imageId?: string }) => {
    const nextDifficulty = opts?.difficulty ?? difficulty;
    const total = nextDifficulty * nextDifficulty;
    const nextBoardSize = nextDifficulty * CELL_SIZE;
    const nextScatterWidth = nextBoardSize - BOARD_MARGIN * 2;
    const nextScatterHeight = nextBoardSize - BOARD_MARGIN * 2;
  
    const nextPieces: PieceState[] = [];
  
    for (let id = 0; id < total; id += 1) {
      const randX =
        scatterOriginX +
        Math.random() * Math.max(1, nextScatterWidth - PIECE_VISUAL_SIZE);
      const randY =
        scatterOriginY +
        Math.random() * Math.max(1, nextScatterHeight - PIECE_VISUAL_SIZE);
  
      nextPieces.push({
        id,
        x: randX,
        y: randY,
        snapped: false,
      });
    }
  
    setDifficulty(nextDifficulty);
    if (opts?.imageId) setSelectedImageId(opts.imageId);
    setPieces(nextPieces);
    setMoves(0);
    dragStateRef.current = createInitialDragState();
  };
  

  // раскидываем кусочки только на клиенте, после гидратации
  useEffect(() => {
    newGame({ difficulty: INITIAL_DIFFICULTY });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      gridSize,
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

  return (
    <div
      style={{
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Панель управления */}
      <div style={{ minWidth: 220 }}>
        <h2 style={{ marginBottom: 12 }}>Jigsaw Puzzle</h2>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            Картинка:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {IMAGES.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() =>
                  newGame({ difficulty, imageId: img.id })
                }
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  borderRadius: 6,
                  border:
                    img.id === selectedImageId
                      ? '2px solid #2563eb'
                      : '1px solid #ccc',
                  backgroundColor:
                    img.id === selectedImageId ? '#e0ecff' : '#f8f8f8',
                  cursor: 'pointer',
                }}
              >
                {img.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            Сложность:
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {[3, 4, 5].map((size) => {
              const count = size * size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    newGame({ difficulty: size as Difficulty })
                  }
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border:
                      size === difficulty
                        ? '2px solid #16a34a'
                        : '1px solid #ccc',
                    backgroundColor:
                      size === difficulty ? '#dcfce7' : '#f8f8f8',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {size} × {size} — {count} пазлов
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #ccc',
              backgroundColor: showHint ? '#fef3c7' : '#f8fafc',
              cursor: 'pointer',
              fontSize: 14,
              width: '100%',
              marginBottom: 8,
            }}
          >
            {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
          </button>

          <button
            type="button"
            onClick={() => newGame()}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #ccc',
              backgroundColor: '#eff6ff',
              cursor: 'pointer',
              fontSize: 14,
              width: '100%',
            }}
          >
            Новая игра
          </button>
        </div>

        <div style={{ fontSize: 14 }}>
          <div>
            Ходы: <strong>{moves}</strong>
          </div>
          <div>
            Пазлов: <strong>{totalPieces}</strong>
          </div>
        </div>
      </div>

      {/* Рабочее поле */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: workspaceWidth,
          height: workspaceHeight,
          borderRadius: 12,
          overflow: 'hidden',
          border: '2px solid #4b5563',
          background:
            'radial-gradient(circle at top left, #4b5563 0, #111827 55%, #020617 100%)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          touchAction: 'none',
        }}
      >
        {/* Рамка-цель */}
        <div
          style={{
            position: 'absolute',
            left: boardOriginX,
            top: boardOriginY,
            width: boardSize,
            height: boardSize,
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
              width: boardSize,
              height: boardSize,
              backgroundImage: `url(${selectedImage.src})`,
              backgroundSize: `${boardSize}px ${boardSize}px`,
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
          const row = Math.floor(piece.id / gridSize);
          const col = piece.id % gridSize;
          const edges = pieceEdges[row][col];
          const path = getPiecePath(edges);

          const correctRow = row;
          const correctCol = col;
          const clipId = `clip-${gridSize}-${piece.id}`;

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
                transition:
                  'left 160ms ease-out, top 160ms ease-out',
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
                  width={boardSize}
                  height={boardSize}
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
    </div>
  );
};

export default JigsawGame;
