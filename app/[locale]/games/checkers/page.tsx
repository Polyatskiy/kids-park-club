"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Container } from "@/ui/container";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";

type Color = "r" | "b"; // r = human (red), b = AI (black)
type Piece = "r" | "R" | "b" | "B" | null; // uppercase = king
type Board = Piece[][];
type Diff = "easy" | "medium" | "hard";

type Pos = { r: number; c: number };
type Move = {
  from: Pos;
  path: Pos[]; // sequential landing squares (length >= 1)
  captures: Pos[]; // captured piece positions (same length as number of jumps)
};

const BOARD_SIZE = 8;

function inBounds(r: number, c: number) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function isDarkSquare(r: number, c: number) {
  return (r + c) % 2 === 1;
}

function pieceColor(p: Piece): Color | null {
  if (!p) return null;
  return p.toLowerCase() as Color;
}

function isKing(p: Piece) {
  return p === "R" || p === "B";
}

function makeKing(p: Piece): Piece {
  if (p === "r") return "R";
  if (p === "b") return "B";
  return p;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

function boardToKey(board: Board, turn: Color): string {
  return (
    turn +
    "|" +
    board
      .map((row) => row.map((p) => (p ? p : ".")).join(""))
      .join("/")
  );
}

function initialBoard(): Board {
  const b: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null as Piece)
  );

  // Black at top rows 0..2 on dark squares
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isDarkSquare(r, c)) b[r][c] = "b";
    }
  }

  // Red at bottom rows 5..7 on dark squares
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isDarkSquare(r, c)) b[r][c] = "r";
    }
  }

  return b;
}

function getMoveDirs(p: Piece): number[] {
  if (!p) return [];
  if (isKing(p)) return [-1, +1];
  return p === "r" ? [-1] : [+1];
}

function applyMove(board: Board, move: Move): Board {
  const b = cloneBoard(board);
  const piece = b[move.from.r][move.from.c];
  if (!piece) return b;

  b[move.from.r][move.from.c] = null;

  for (const cap of move.captures) {
    b[cap.r][cap.c] = null;
  }

  const last = move.path[move.path.length - 1];
  let placed: Piece = piece;

  if (placed === "r" && last.r === 0) placed = makeKing(placed);
  if (placed === "b" && last.r === BOARD_SIZE - 1) placed = makeKing(placed);

  b[last.r][last.c] = placed;
  return b;
}

function collectSimpleMoves(board: Board, from: Pos, p: Piece): Move[] {
  const moves: Move[] = [];
  const dirs = getMoveDirs(p);
  for (const dr of dirs) {
    for (const dc of [-1, +1]) {
      const nr = from.r + dr;
      const nc = from.c + dc;
      if (!inBounds(nr, nc)) continue;
      if (!isDarkSquare(nr, nc)) continue;
      if (board[nr][nc] === null) {
        moves.push({ from, path: [{ r: nr, c: nc }], captures: [] });
      }
    }
  }
  return moves;
}

function collectJumpSequences(board: Board, from: Pos, p: Piece): Move[] {
  const color = pieceColor(p);
  if (!color) return [];

  const results: Move[] = [];
  const dirs = getMoveDirs(p);

  function dfs(
    curBoard: Board,
    curPos: Pos,
    curPiece: Piece,
    path: Pos[],
    captures: Pos[]
  ) {
    let foundFurtherJump = false;

    const curDirs = getMoveDirs(curPiece);
    for (const dr of curDirs) {
      for (const dc of [-1, +1]) {
        const midR = curPos.r + dr;
        const midC = curPos.c + dc;
        const landR = curPos.r + 2 * dr;
        const landC = curPos.c + 2 * dc;

        if (!inBounds(midR, midC) || !inBounds(landR, landC)) continue;
        if (!isDarkSquare(landR, landC)) continue;

        const mid = curBoard[midR][midC];
        const land = curBoard[landR][landC];

        if (mid && pieceColor(mid) !== color && land === null) {
          foundFurtherJump = true;

          const nextBoard = cloneBoard(curBoard);
          nextBoard[curPos.r][curPos.c] = null;
          nextBoard[midR][midC] = null;

          let nextPiece: Piece = curPiece;

          if (nextPiece === "r" && landR === 0) nextPiece = makeKing(nextPiece);
          if (nextPiece === "b" && landR === BOARD_SIZE - 1)
            nextPiece = makeKing(nextPiece);

          nextBoard[landR][landC] = nextPiece;

          dfs(
            nextBoard,
            { r: landR, c: landC },
            nextPiece,
            [...path, { r: landR, c: landC }],
            [...captures, { r: midR, c: midC }]
          );
        }
      }
    }

    if (!foundFurtherJump && captures.length > 0) {
      results.push({ from, path, captures });
    }
  }

  dfs(board, from, p, [], []);
  return results;
}

function getPieceMoves(board: Board, pos: Pos): Move[] {
  const p = board[pos.r][pos.c];
  if (!p) return [];
  const jumps = collectJumpSequences(board, pos, p);
  const simples = collectSimpleMoves(board, pos, p);
  return [...jumps, ...simples];
}

function getAllMoves(board: Board, color: Color): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (p && pieceColor(p) === color) {
        moves.push(...getPieceMoves(board, { r, c }));
      }
    }
  }
  return moves;
}

function countPieces(board: Board) {
  let rMen = 0,
    rKings = 0,
    bMen = 0,
    bKings = 0;
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const p = board[i][j];
      if (!p) continue;
      if (p === "r") rMen++;
      else if (p === "R") rKings++;
      else if (p === "b") bMen++;
      else if (p === "B") bKings++;
    }
  }
  return { rMen, rKings, bMen, bKings };
}

function evaluate(board: Board): number {
  const { rMen, rKings, bMen, bKings } = countPieces(board);
  const material = (bMen - rMen) * 100 + (bKings - rKings) * 180;

  const bMoves = getAllMoves(board, "b").length;
  const rMoves = getAllMoves(board, "r").length;
  const mobility = (bMoves - rMoves) * 2;

  return material + mobility;
}

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function bestByCapturesThenEval(
  board: Board,
  moves: Move[],
  fallbackEval: (b: Board) => number
): Move {
  let best = moves[0];
  let bestCaps = best.captures.length;
  let bestScore = -Infinity;

  for (const m of moves) {
    const caps = m.captures.length;
    const b2 = applyMove(board, m);
    const score = fallbackEval(b2);

    if (caps > bestCaps) {
      best = m;
      bestCaps = caps;
      bestScore = score;
    } else if (caps === bestCaps) {
      if (score > bestScore) {
        best = m;
        bestScore = score;
      }
    }
  }
  return best;
}

function minimax(
  board: Board,
  turn: Color,
  depth: number,
  alpha: number,
  beta: number,
  memo: Map<string, { score: number; move: Move | null }>
): { score: number; move: Move | null } {
  const key = boardToKey(board, turn) + `|d=${depth}`;
  const cached = memo.get(key);
  if (cached) return cached;

  const moves = getAllMoves(board, turn);
  if (depth === 0 || moves.length === 0) {
    const terminal =
      moves.length === 0 ? (turn === "b" ? -999999 : 999999) : 0;
    const res = { score: evaluate(board) + terminal, move: null as Move | null };
    memo.set(key, res);
    return res;
  }

  const isMax = turn === "b";
  const nextTurn: Color = turn === "b" ? "r" : "b";
  let bestMove: Move | null = null;

  if (isMax) {
    let bestScore = -Infinity;
    for (const m of moves) {
      const b2 = applyMove(board, m);
      const child = minimax(
        b2,
        nextTurn,
        depth - 1,
        alpha,
        beta,
        memo
      );

      const bonus = m.captures.length * 5;
      const score = child.score + bonus;

      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break;
    }
    const res = { score: bestScore, move: bestMove };
    memo.set(key, res);
    return res;
  } else {
    let bestScore = Infinity;
    for (const m of moves) {
      const b2 = applyMove(board, m);
      const child = minimax(
        b2,
        nextTurn,
        depth - 1,
        alpha,
        beta,
        memo
      );

      const penalty = m.captures.length * 5;
      const score = child.score - penalty;

      if (score < bestScore) {
        bestScore = score;
        bestMove = m;
      }
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break;
    }
    const res = { score: bestScore, move: bestMove };
    memo.set(key, res);
    return res;
  }
}

function chooseAiMove(board: Board, diff: Diff): Move | null {
  const moves = getAllMoves(board, "b");
  if (moves.length === 0) return null;

  if (diff === "easy") {
    const caps = moves.filter((m) => m.captures.length > 0);
    if (caps.length > 0 && Math.random() < 0.6) return pickRandom(caps);
    return pickRandom(moves);
  }

  if (diff === "medium") {
    const caps = moves.filter((m) => m.captures.length > 0);
    if (caps.length > 0) return bestByCapturesThenEval(board, caps, evaluate);

    const memo = new Map<string, { score: number; move: Move | null }>();
    return minimax(board, "b", 2, -Infinity, Infinity, memo).move;
  }

  {
    const memo = new Map<string, { score: number; move: Move | null }>();
    const mm = minimax(board, "b", 4, -Infinity, Infinity, memo);
    return mm.move ?? bestByCapturesThenEval(board, moves, evaluate);
  }
}

function samePos(a: Pos, b: Pos) {
  return a.r === b.r && a.c === b.c;
}

function moveFinal(m: Move): Pos {
  return m.path[m.path.length - 1];
}

function getBestMoveToDestination(moves: Move[], dest: Pos): Move | null {
  const candidates = moves.filter((m) => samePos(moveFinal(m), dest));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.captures.length - a.captures.length);
  return candidates[0];
}

export default function CheckersGame() {
  const t = useTranslations("common.gameDetails.checkers");
  const [board, setBoard] = useState<Board>(() => initialBoard());
  const [turn, setTurn] = useState<Color>("r");
  const [selected, setSelected] = useState<Pos | null>(null);
  const [movesForSelected, setMovesForSelected] = useState<Move[]>([]);
  const [diff, setDiff] = useState<Diff>("medium");
  const [thinking, setThinking] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [message, setMessage] = useState<string>(t("yourTurn"));
  const [vsComputer, setVsComputer] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allRedMoves = useMemo(() => getAllMoves(board, "r"), [board]);
  const allBlackMoves = useMemo(() => getAllMoves(board, "b"), [board]);

  const gameOver = useMemo(() => {
    const { rMen, rKings, bMen, bKings } = countPieces(board);
    if (rMen + rKings === 0) {
      return { over: true, winner: vsComputer ? t("computer") : t("blackPlayer") };
    }
    if (bMen + bKings === 0) {
      return { over: true, winner: vsComputer ? t("you") : t("redPlayer") };
    }
    if (turn === "r" && allRedMoves.length === 0) {
      return { over: true, winner: vsComputer ? t("computer") : t("blackPlayer") };
    }
    if (turn === "b" && allBlackMoves.length === 0) {
      return { over: true, winner: vsComputer ? t("you") : t("redPlayer") };
    }
    return { over: false, winner: "" };
  }, [board, turn, allRedMoves.length, allBlackMoves.length, vsComputer, t]);

  useEffect(() => {
    if (gameOver.over) {
      setThinking(false);
      setMessage(t("gameOver", { winner: gameOver.winner }));
    }
  }, [gameOver, t]);

  // AI turn (only when playing vs computer)
  useEffect(() => {
    if (!vsComputer) return; // Don't run AI in player vs player mode
    if (gameOver.over) return;
    if (turn !== "b") return;

    setThinking(true);
    setMessage(t("computerThinking"));

    const timer = setTimeout(() => {
      const aiMove = chooseAiMove(board, diff);
      if (!aiMove) {
        setThinking(false);
        return;
      }
      const next = applyMove(board, aiMove);
      setBoard(next);
      setLastMove(aiMove);
      setSelected(null);
      setMovesForSelected([]);
      setTurn("r");
      setThinking(false);
      setMessage(t("yourTurn"));
    }, 250);

    return () => clearTimeout(timer);
  }, [turn, board, diff, gameOver.over, t]);

  function resetGame() {
    setBoard(initialBoard());
    setTurn("r");
    setSelected(null);
    setMovesForSelected([]);
    setThinking(false);
    setLastMove(null);
    setMessage(vsComputer ? t("yourTurn") : t("redTurn", { defaultValue: "Red's turn" }));
  }

  function onSquareClick(r: number, c: number) {
    if (thinking || gameOver.over) return;
    if (!isDarkSquare(r, c)) return;

    const clickedPiece = board[r][c];

    const currentColor = turn;
    
    if (selected) {
      const chosen = getBestMoveToDestination(movesForSelected, { r, c });
      if (chosen) {
        const next = applyMove(board, chosen);
        setBoard(next);
        setLastMove(chosen);
        setSelected(null);
        setMovesForSelected([]);
        const nextTurn: Color = turn === "r" ? "b" : "r";
        setTurn(nextTurn);
        if (vsComputer) {
          setMessage(nextTurn === "r" ? t("yourTurn") : t("computerTurn"));
        } else {
          setMessage(nextTurn === "r" ? t("redTurn", { defaultValue: "Red's turn" }) : t("blackTurn", { defaultValue: "Black's turn" }));
        }
        return;
      }
    }

    if (clickedPiece && pieceColor(clickedPiece) === currentColor) {
      setSelected({ r, c });
      const moves = getPieceMoves(board, { r, c });
      setMovesForSelected(moves);
      setMessage(t("selectDestination"));
      return;
    }

    setSelected(null);
    setMovesForSelected([]);
    if (vsComputer) {
      setMessage(turn === "r" ? t("yourTurn") : t("computerTurn"));
    } else {
      setMessage(turn === "r" ? t("redTurn", { defaultValue: "Red's turn" }) : t("blackTurn", { defaultValue: "Black's turn" }));
    }
  }

  const hintDestinations = useMemo(() => {
    if (!showHints || !selected) return [];
    const finals = movesForSelected.map(moveFinal);
    const uniq: Pos[] = [];
    for (const f of finals) {
      if (!uniq.some((u) => samePos(u, f))) uniq.push(f);
    }
    return uniq;
  }, [movesForSelected, selected, showHints]);

  const lastFrom = lastMove?.from ?? null;
  const lastTo = lastMove ? moveFinal(lastMove) : null;

  const { rMen, rKings, bMen, bKings } = countPieces(board);

  return (
    <Container className="pt-16 md:pt-20 pb-8 space-y-6">
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border bg-white/60 backdrop-blur shadow-sm p-4 sm:p-5">
            <div className="flex flex-col gap-3">
              {/* Title and mobile menu button */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">
                    {vsComputer 
                      ? t("pageTitleVsComputer", { defaultValue: t("pageTitle") })
                      : t("pageTitleVsPlayer", { defaultValue: t("pageTitle") })
                    }
                  </h1>
                  {/* Description only on desktop */}
                  <p className="hidden sm:block text-xs sm:text-sm text-slate-600 mt-1">
                    {vsComputer 
                      ? t("pageDescriptionVsComputer", { defaultValue: "Red is you. Black is computer." })
                      : t("pageDescriptionVsPlayer", { defaultValue: "Play with a friend. Red and Black take turns." })
                    }
                  </p>
                </div>

                {/* Mobile menu button */}
                <button
                  className="sm:hidden rounded-lg p-2 border bg-white hover:bg-slate-50 transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Desktop controls - always visible on desktop */}
              <div className="hidden sm:flex flex-wrap items-center gap-2">
                <button
                  className={[
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                    vsComputer
                      ? "bg-blue-100 border-blue-300 text-blue-900"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  ].join(" ")}
                  onClick={() => {
                    setVsComputer(true);
                    resetGame();
                  }}
                  disabled={thinking}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t("vsComputer", { defaultValue: "VS Computer" })}
                </button>

                <button
                  className={[
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                    !vsComputer
                      ? "bg-green-100 border-green-300 text-green-900"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  ].join(" ")}
                  onClick={() => {
                    setVsComputer(false);
                    resetGame();
                  }}
                  disabled={thinking}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  {t("vsPlayer", { defaultValue: "VS Player" })}
                </button>

                {vsComputer && (
                  <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-white">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <select
                      className="border-none bg-transparent text-sm focus:outline-none"
                      value={diff}
                      onChange={(e) => setDiff(e.target.value as Diff)}
                      disabled={thinking}
                    >
                      <option value="easy">{t("difficultyEasy")}</option>
                      <option value="medium">{t("difficultyMedium")}</option>
                      <option value="hard">{t("difficultyHard")}</option>
                    </select>
                  </div>
                )}

                <button
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-white hover:bg-slate-50 transition-colors"
                  onClick={() => setShowHints((v) => !v)}
                >
                  <svg className="w-4 h-4" fill={showHints ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="hidden sm:inline">{t("hints")}</span>
                  <span className="sm:hidden">{showHints ? t("on") : t("off")}</span>
                </button>

                <button
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                  onClick={resetGame}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t("newGame")}
                </button>
              </div>

              {/* Mobile menu - collapsible */}
              {mobileMenuOpen && (
                <div className="sm:hidden flex flex-col gap-2 pt-2 border-t border-slate-200">
                  <button
                    className={[
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors w-full",
                      vsComputer
                        ? "bg-blue-100 border-blue-300 text-blue-900"
                        : "bg-white border-slate-300 text-slate-700"
                    ].join(" ")}
                    onClick={() => {
                      setVsComputer(true);
                      resetGame();
                      setMobileMenuOpen(false);
                    }}
                    disabled={thinking}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 7H7v6h6V7z" />
                      <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                    </svg>
                    {t("vsComputer", { defaultValue: "VS Computer" })}
                  </button>

                  <button
                    className={[
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors w-full",
                      !vsComputer
                        ? "bg-green-100 border-green-300 text-green-900"
                        : "bg-white border-slate-300 text-slate-700"
                    ].join(" ")}
                    onClick={() => {
                      setVsComputer(false);
                      resetGame();
                      setMobileMenuOpen(false);
                    }}
                    disabled={thinking}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {t("vsPlayer", { defaultValue: "VS Player" })}
                  </button>

                  {vsComputer && (
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-white">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <select
                        className="flex-1 border-none bg-transparent text-sm focus:outline-none"
                        value={diff}
                        onChange={(e) => setDiff(e.target.value as Diff)}
                        disabled={thinking}
                      >
                        <option value="easy">{t("difficultyEasy")}</option>
                        <option value="medium">{t("difficultyMedium")}</option>
                        <option value="hard">{t("difficultyHard")}</option>
                      </select>
                    </div>
                  )}

                  <button
                    className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-white hover:bg-slate-50 transition-colors w-full"
                    onClick={() => {
                      setShowHints((v) => !v);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <svg className="w-4 h-4" fill={showHints ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {t("hints")}: {showHints ? t("on") : t("off")}
                  </button>

                  <button
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors w-full"
                    onClick={() => {
                      resetGame();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t("newGame")}
                  </button>
                </div>
              )}
            </div>

            {!vsComputer && (
              <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Turn indicator with checkers - only show in vsPlayer mode */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Red checker */}
                    <div
                      className={[
                        "relative grid place-items-center rounded-full w-8 h-8 sm:w-10 sm:h-10 shadow-md transition-all",
                        "bg-gradient-to-b from-red-500 to-red-700",
                        turn === "r" && !gameOver.over
                          ? "ring-4 ring-offset-2 ring-green-500 scale-110"
                          : "ring-0 scale-100 opacity-60",
                      ].join(" ")}
                    >
                      <span className="absolute inset-1 rounded-full border border-red-200/60" />
                    </div>
                    {/* Black checker */}
                    <div
                      className={[
                        "relative grid place-items-center rounded-full w-8 h-8 sm:w-10 sm:h-10 shadow-md transition-all",
                        "bg-gradient-to-b from-slate-700 to-black",
                        turn === "b" && !gameOver.over
                          ? "ring-4 ring-offset-2 ring-green-500 scale-110"
                          : "ring-0 scale-100 opacity-60",
                      ].join(" ")}
                    >
                      <span className="absolute inset-1 rounded-full border border-slate-200/20" />
                    </div>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-slate-700">
                    <span className="font-semibold">
                      {turn === "r" ? t("redTurn", { defaultValue: "Red's turn" }) : t("blackTurn", { defaultValue: "Black's turn" })}
                    </span>
                  </div>
                </div>

                {/* Pieces count */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-700">
                  <span className="font-semibold text-red-600">
                    {rMen + rKings}
                  </span>
                  <span>/</span>
                  <span className="font-semibold text-slate-700">
                    {bMen + bKings}
                  </span>
                </div>

                {/* Status message */}
                {gameOver.over && (
                  <span className="inline-flex items-center gap-2 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border bg-amber-50 border-amber-200 text-amber-900 text-xs sm:text-sm">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    {message}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
            {/* Board */}
            <div className="rounded-2xl border bg-white shadow-sm p-4 sm:p-6">

              <div className="w-full max-w-[560px] mx-auto">
                <div className="aspect-square rounded-2xl overflow-hidden border-4 border-[#3e2723] shadow-inner bg-[#3e2723]">
                  <div className="grid grid-cols-8 w-full h-full grid-rows-8">
                    {board.map((row, r) =>
                      row.map((cell, c) => {
                        const dark = isDarkSquare(r, c);
                        const isSel = selected && selected.r === r && selected.c === c;
                        const isHint = hintDestinations.some((p) => p.r === r && p.c === c);
                        const isLastFrom = lastFrom && lastFrom.r === r && lastFrom.c === c;
                        const isLastTo = lastTo && lastTo.r === r && lastTo.c === c;

                        const base = dark
                          ? "bg-[#5d4037]"
                          : "bg-[#d7ccc8]";

                        const ring =
                          isSel
                            ? "ring-4 ring-offset-0 ring-indigo-400"
                            : isLastFrom
                            ? "ring-4 ring-offset-0 ring-amber-400"
                            : isLastTo
                            ? "ring-4 ring-offset-0 ring-emerald-400"
                            : "ring-0";

                        return (
                          <button
                            key={`${r}-${c}`}
                            onClick={() => onSquareClick(r, c)}
                            className={[
                              "relative flex items-center justify-center",
                              "aspect-square w-full h-full",
                              base,
                              ring,
                              "transition",
                              dark ? "hover:brightness-110" : "hover:brightness-105",
                              "focus:outline-none",
                            ].join(" ")}
                            style={{ cursor: dark ? "pointer" : "default" }}
                            aria-label={`cell-${r}-${c}`}
                          >
                            {dark && isHint && (
                              <span className="absolute h-3 w-3 rounded-full bg-indigo-300/90 shadow" />
                            )}

                            {cell && (
                              <span
                                className={[
                                  "relative grid place-items-center rounded-full",
                                  "w-9 h-9 sm:w-12 sm:h-12",
                                  "shadow-md",
                                  pieceColor(cell) === "r"
                                    ? "bg-gradient-to-b from-red-500 to-red-700"
                                    : "bg-gradient-to-b from-slate-700 to-black",
                                  isSel ? "scale-105" : "scale-100",
                                  "transition-transform",
                                ].join(" ")}
                              >
                                <span
                                  className={[
                                    "absolute inset-1 rounded-full",
                                    pieceColor(cell) === "r"
                                      ? "border border-red-200/60"
                                      : "border border-slate-200/20",
                                  ].join(" ")}
                                />
                                {isKing(cell) && (
                                  <span className="text-xs sm:text-sm font-bold text-amber-200 drop-shadow">
                                    ♛
                                  </span>
                                )}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="rounded-2xl border bg-white shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold">{t("settings")}</h2>

              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <div className="rounded-xl bg-slate-50 border p-3">
                  <div className="font-semibold">{t("difficulties")}</div>
                  <ul className="mt-1 list-disc pl-5 space-y-1">
                    <li>{t("difficultyEasyDesc")}</li>
                    <li>{t("difficultyMediumDesc")}</li>
                    <li>{t("difficultyHardDesc")}</li>
                  </ul>
                </div>

                <div className="rounded-xl bg-slate-50 border p-3">
                  <div className="font-semibold">{t("rules")}</div>
                  <ul className="mt-1 list-disc pl-5 space-y-1">
                    <li>{t("rule1")}</li>
                    <li>{t("rule2")}</li>
                    <li>{t("rule3")}</li>
                    <li>{t("rule4")}</li>
                  </ul>
                </div>

                {gameOver.over && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900">
                    <div className="font-semibold">{t("gameFinished")}</div>
                    <div className="mt-1">{message}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

