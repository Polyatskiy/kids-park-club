"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container } from "@/ui/container";
import { useTranslations } from "next-intl";

type GameStatus = "ready" | "running" | "gameover" | "paused";

type ChunkType = "ground" | "platform" | "gap" | "spikes" | "coins";

type Cactus = {
  id: number;
  x: number;
  y: number;
};

type ChunkCoin = {
  x: number;
  y: number;
  collected: boolean;
  id: number;
};

type Chunk = {
  x: number;
  width: number;
  type: ChunkType;
  groundY: number;
  platforms?: Array<{ x: number; y: number; width: number }>;
  spikes?: Array<{ x: number }>;
  coins?: ChunkCoin[];
};

type Coin = {
  id: number;
  x: number;
  y: number;
  collected: boolean;
};

type Obstacle = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "spike" | "box";
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// Предустановленные чанки для уровней
type ChunkTemplate = Omit<Chunk, "x" | "coins"> & {
  coins?: Array<{ x: number; y: number; collected: boolean }>;
  cacti?: Array<{ x: number }>;
};

const CHUNK_TEMPLATES: ChunkTemplate[] = [
  // Обычная земля
  { width: 200, type: "ground", groundY: 0 },
  // Платформа
  { width: 150, type: "platform", groundY: 0, platforms: [{ x: 0, y: -60, width: 150 }] },
  // Пропасть (ограничена дальностью прыжка - максимум 200px)
  { width: 180, type: "gap", groundY: 0 },
  // Шипы
  { width: 180, type: "spikes", groundY: 0, spikes: [{ x: 40 }, { x: 100 }, { x: 160 }] },
  // Монеты
  { width: 250, type: "coins", groundY: 0, coins: [{ x: 50, y: -80, collected: false }, { x: 150, y: -80, collected: false }, { x: 250, y: -80, collected: false }] },
  // Кактусы (только один кактус)
  { width: 250, type: "ground", groundY: 0, cacti: [{ x: 125 }] },
];

export default function RunnerPage() {
  const t = useTranslations("common.gameDetails.runner");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const statusRef = useRef<GameStatus>("ready");
  const [status, setStatus] = useState<GameStatus>("ready");

  const scoreRef = useRef<number>(0);
  const [score, setScore] = useState<number>(0);

  const coinsRef = useRef<number>(0);
  const [coins, setCoins] = useState<number>(0);

  const skinRef = useRef<number>(0);
  const [skin, setSkin] = useState<number>(0);

  const lastTimeRef = useRef<number>(0);

  // Фиксированная позиция персонажа на экране
  const PLAYER_SCREEN_X = 150;

  const worldRef = useRef({
    camX: 0, // Позиция камеры в мировых координатах
    speed: 280,
    gravity: 1500,
    jumpVel: 650, // Увеличена скорость прыжка для большей дальности
    width: 900,
    height: 520,
    player: {
      x: PLAYER_SCREEN_X, // Мировая координата X = camX + PLAYER_SCREEN_X
      y: 0,
      w: 32,
      h: 42,
      vy: 0,
      onGround: false,
      canJump: true, // Буфер для прыжка - можно прыгнуть сразу после приземления
      jumpBufferTime: 0, // Время буфера прыжка
    },
    chunks: [] as Chunk[],
    coins: [] as Coin[],
    obstacles: [] as Obstacle[],
    cacti: [] as Cactus[],
    nextChunkX: 0,
    baseGroundY: 420,
    currentLevel: 0,
    coinIdCounter: 0,
    obstacleIdCounter: 0,
    cactusIdCounter: 0,
    safeZoneEnd: 0,
    lastObstacleX: 0, // Последняя позиция препятствия для контроля интервалов
  });

  const skins = [
    { name: "Cat", emoji: "🐱", color: "#fbbf24" },
    { name: "Dog", emoji: "🐶", color: "#8b5cf6" },
    { name: "Bunny", emoji: "🐰", color: "#ec4899" },
    { name: "Bird", emoji: "🐦", color: "#10b981" },
  ];
  
  const animationFrameRef = useRef<number>(0);

  function setGameStatus(s: GameStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  function resetGame() {
    const world = worldRef.current;
    world.camX = 0;
    world.speed = 280;
    world.player.x = PLAYER_SCREEN_X; // Начальная позиция
    world.player.y = world.baseGroundY - world.player.h;
    world.player.vy = 0;
    world.player.onGround = true;
    world.player.canJump = true;
    world.player.jumpBufferTime = 0;
    animationFrameRef.current = 0;
    world.chunks = [];
    world.coins = [];
    world.obstacles = [];
    world.cacti = [];
    world.nextChunkX = 0;
    world.currentLevel = 0;
    world.coinIdCounter = 0;
    world.obstacleIdCounter = 0;
    world.cactusIdCounter = 0;
    world.lastObstacleX = 0;
    
    // Безопасная зона в начале игры (3 секунды на скорости 280 = ~840 пикселей)
    world.safeZoneEnd = world.speed * 3;

    scoreRef.current = 0;
    coinsRef.current = 0;
    setScore(0);
    setCoins(0);

    seedChunks();
  }

  // Вычисляем дальность прыжка (максимальное расстояние по горизонтали)
  function getJumpDistance(): number {
    const world = worldRef.current;
    // Время полета = время подъема + время падения = 2 * jumpVel / gravity
    const flightTime = (2 * world.jumpVel) / world.gravity;
    // Дальность = горизонтальная скорость * время полета
    const distance = world.speed * flightTime;
    // Округляем и возвращаем с большим запасом для безопасности (уменьшаем на 40% для гарантии)
    // Это гарантирует, что все пропасти будут перепрыгиваемыми
    return Math.floor(distance * 0.6);
  }

  // Получаем параметры уровня
  function getLevelParams(level: number) {
    // Уровень определяется по пройденному расстоянию (каждые 2000 пикселей = новый уровень)
    const baseLevel = Math.floor(level / 2000);
    
    return {
      minObstacleGap: 280 + (baseLevel * 20), // Минимальное расстояние между препятствиями (увеличивается с уровнем)
      obstacleChance: 0.3 + (baseLevel * 0.05), // Шанс появления препятствия (увеличивается с уровнем, макс 0.6)
      maxObstaclesPerChunk: 1 + Math.floor(baseLevel / 2), // Максимум препятствий в чанке
    };
  }

  function seedChunks() {
    const world = worldRef.current;
    while (world.nextChunkX < world.width * 3) {
      pushNextChunk();
    }
  }

  function pushNextChunk() {
    const world = worldRef.current;

    // В безопасной зоне используем только чанки без препятствий
    const inSafeZone = world.nextChunkX < world.safeZoneEnd;
    
    // Получаем параметры уровня
    const levelParams = getLevelParams(world.camX);
    const jumpDistance = getJumpDistance();
    const minGap = Math.max(levelParams.minObstacleGap, jumpDistance + 50); // Минимум = дальность прыжка + запас
    
    let template: ChunkTemplate;
    if (inSafeZone) {
      // В безопасной зоне только обычная земля или монеты
      const safeTemplates = CHUNK_TEMPLATES.filter(t => 
        (t.type === "ground" && !(t as any).cacti) || t.type === "coins"
      );
      template = safeTemplates[Math.floor(Math.random() * safeTemplates.length)] || CHUNK_TEMPLATES[0];
    } else {
      // Ограничиваем размер пропастей - они должны быть меньше дальности прыжка
      const maxGapWidth = Math.max(50, Math.floor(jumpDistance - 50)); // Максимум на 50px меньше дальности прыжка
      
      // Выбираем шаблон, избегая препятствий если они слишком близко
      const availableTemplates = CHUNK_TEMPLATES.filter(t => {
        // Если последнее препятствие было недавно, избегаем шаблонов с препятствиями
        if (world.nextChunkX - world.lastObstacleX < minGap) {
          return t.type === "ground" && !(t as any).cacti || t.type === "coins" || t.type === "platform" || t.type === "gap";
        }
        // Не фильтруем пропасти здесь - их ширина будет ограничена позже
        return true;
      });
      
      if (availableTemplates.length === 0) {
        template = CHUNK_TEMPLATES[0]; // Fallback на обычную землю
      } else {
        template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
      }
    }
    
    // Ограничиваем ширину пропасти, если она выбрана
    let chunkWidth = template.width;
    if (template.type === "gap") {
      const jumpDistance = getJumpDistance();
      // Максимальная ширина пропасти = дальность прыжка - большой запас безопасности (100px)
      // Это гарантирует, что все пропасти будут перепрыгиваемыми даже при максимальной скорости
      // Минимум 60px, чтобы пропасти были заметны
      const maxGapWidth = Math.max(60, Math.floor(jumpDistance - 100));
      // Принудительно ограничиваем ширину пропасти
      chunkWidth = Math.min(template.width, maxGapWidth);
      // Дополнительная проверка на всякий случай
      if (chunkWidth > maxGapWidth) {
        chunkWidth = maxGapWidth;
      }
      // Убеждаемся, что пропасть не слишком маленькая
      if (chunkWidth < 60) {
        chunkWidth = 60;
      }
      // Финальная проверка: пропасть не должна быть больше дальности прыжка
      if (chunkWidth > jumpDistance) {
        chunkWidth = Math.max(60, Math.floor(jumpDistance - 50));
      }
    }
    
    const chunk: Chunk = {
      x: world.nextChunkX,
      width: chunkWidth, // Используем ограниченную ширину
      type: template.type,
      groundY: world.baseGroundY,
      platforms: template.platforms ? template.platforms.map(p => ({ ...p })) : undefined,
      spikes: template.spikes ? template.spikes.map(s => ({ ...s })) : undefined,
      coins: template.coins ? template.coins.map((c) => ({
        ...c,
        collected: false,
        id: world.coinIdCounter++,
      })) : undefined,
    };

    world.chunks.push(chunk);

    // Добавляем монеты
    if (chunk.coins) {
      chunk.coins.forEach(coin => {
        world.coins.push({
          id: coin.id,
          x: chunk.x + coin.x,
          y: world.baseGroundY + coin.y,
          collected: false,
        });
      });
    }

    // НЕ добавляем препятствия в безопасной зоне
    if (!inSafeZone) {
      // Проверяем, можно ли добавить препятствия (достаточное расстояние от последнего)
      const canAddObstacle = world.nextChunkX - world.lastObstacleX >= minGap;
      const shouldAddObstacle = canAddObstacle && Math.random() < levelParams.obstacleChance;
      
      if (shouldAddObstacle) {
        // Добавляем препятствия (шипы) - но только если достаточно места
        if (chunk.type === "spikes" && chunk.spikes) {
          // Берем только первое препятствие из шаблона, чтобы не было слишком много
          const firstSpike = chunk.spikes[0];
          if (firstSpike) {
            const obstacleX = chunk.x + firstSpike.x;
            world.obstacles.push({
              id: world.obstacleIdCounter++,
              x: obstacleX,
              y: world.baseGroundY - 20,
              width: 30,
              height: 20,
              type: "spike",
            });
            world.lastObstacleX = obstacleX;
          }
        }

        // Добавляем кактусы (только если достаточно места)
        if ((template as any).cacti && canAddObstacle) {
          (template as any).cacti.forEach((cactus: { x: number }) => {
            const obstacleX = chunk.x + cactus.x;
            world.cacti.push({
              id: world.cactusIdCounter++,
              x: obstacleX,
              y: world.baseGroundY - 45,
            });
            world.obstacles.push({
              id: world.obstacleIdCounter++,
              x: obstacleX,
              y: world.baseGroundY - 45,
              width: 25,
              height: 45,
              type: "box",
            });
            world.lastObstacleX = obstacleX;
          });
        }

        // Случайные ящики (только если достаточно места и редко)
        if (canAddObstacle && Math.random() < 0.1 && chunk.type === "ground" && !(template as any).cacti) {
          const obstacleX = chunk.x + chunk.width * 0.5;
          world.obstacles.push({
            id: world.obstacleIdCounter++,
            x: obstacleX,
            y: world.baseGroundY - 40,
            width: 40,
            height: 40,
            type: "box",
          });
          world.lastObstacleX = obstacleX;
        }
      }
    }

    world.nextChunkX += chunk.width;
  }

  function tryJump() {
    const world = worldRef.current;
    if (statusRef.current !== "running") return;
    const p = world.player;
    
    // Можно прыгнуть если на земле или есть буфер прыжка
    if (p.onGround || (p.canJump && p.jumpBufferTime > 0)) {
      p.vy = -world.jumpVel;
      p.onGround = false;
      p.canJump = false;
      p.jumpBufferTime = 0;
    }
  }

  function start() {
    if (statusRef.current === "running") return;
    resetGame();
    setGameStatus("running");
  }

  function restart() {
    resetGame();
    setGameStatus("running");
  }

  function nextSkin() {
    setSkin((prev) => (prev + 1) % skins.length);
    skinRef.current = (skinRef.current + 1) % skins.length;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault();
        if (statusRef.current === "ready") {
          start();
        } else if (statusRef.current === "running") {
          tryJump();
        } else if (statusRef.current === "gameover") {
          restart();
        }
      } else if (e.key === "r" || e.key === "R") {
        if (statusRef.current === "gameover") {
          restart();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = () => {
      if (statusRef.current === "ready") {
        start();
      } else if (statusRef.current === "running") {
        tryJump();
      } else if (statusRef.current === "gameover") {
        restart();
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    return () => canvas.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(420, Math.floor(rect.height));
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const world = worldRef.current;
      world.width = w;
      world.height = h;
      world.baseGroundY = clamp(Math.floor(h * 0.82), 300, h - 40);

      if (statusRef.current === "ready") {
        resetGame();
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const world = worldRef.current;

      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, world.width, world.height);

      // Градиентный фон
      const gradient = ctx.createLinearGradient(0, 0, 0, world.height);
      gradient.addColorStop(0, "#1e3a8a");
      gradient.addColorStop(0.5, "#3b82f6");
      gradient.addColorStop(1, "#60a5fa");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, world.width, world.height);

      // Звёзды
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (let i = 0; i < 50; i++) {
        const x = (i * 137 + (world.camX * 0.05)) % world.width;
        const y = (i * 79) % Math.floor(world.height * 0.7);
        const size = 2 + (i % 3);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      const camX = world.camX;
      const viewLeft = camX;
      const viewRight = camX + world.width;

      // Рисуем чанки (земля и платформы)
      for (const chunk of world.chunks) {
        const chunkRight = chunk.x + chunk.width;
        if (chunkRight < viewLeft || chunk.x > viewRight) continue;

        const chunkScreenX = chunk.x - camX;

        // Основная земля
        if (chunk.type !== "gap") {
          ctx.fillStyle = "#16a34a";
          ctx.fillRect(chunkScreenX, chunk.groundY, chunk.width, world.height - chunk.groundY);

          // Трава сверху
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(chunkScreenX, chunk.groundY - 8, chunk.width, 8);

          // Текстура травы
          ctx.fillStyle = "#15803d";
          for (let i = 0; i < chunk.width; i += 15) {
            ctx.fillRect(chunkScreenX + i, chunk.groundY - 8, 2, 8);
          }
        }

        // Платформы
        if (chunk.platforms) {
          chunk.platforms.forEach(platform => {
            const px = chunkScreenX + platform.x;
            const py = chunk.groundY + platform.y;
            ctx.fillStyle = "#16a34a";
            ctx.fillRect(px, py, platform.width, 15);
            ctx.fillStyle = "#22c55e";
            ctx.fillRect(px, py, platform.width, 8);
          });
        }
      }

      // Препятствия
      for (const obstacle of world.obstacles) {
        const obstacleScreenX = obstacle.x - camX;
        // Рисуем только если препятствие видно на экране
        if (obstacleScreenX + obstacle.width < 0 || obstacleScreenX > world.width) continue;

        if (obstacle.type === "spike") {
          ctx.fillStyle = "#dc2626";
          ctx.beginPath();
          ctx.moveTo(obstacleScreenX, obstacle.y + obstacle.height);
          ctx.lineTo(obstacleScreenX + obstacle.width / 2, obstacle.y);
          ctx.lineTo(obstacleScreenX + obstacle.width, obstacle.y + obstacle.height);
          ctx.closePath();
          ctx.fill();
        } else if (obstacle.type === "box") {
          const isCactus = world.cacti.some(c => c.x === obstacle.x && c.y === obstacle.y);
          
          if (isCactus) {
            // Кактус
            ctx.fillStyle = "#16a34a";
            ctx.fillRect(obstacleScreenX, obstacle.y, obstacle.width, obstacle.height);
            ctx.fillStyle = "#15803d";
            for (let i = 0; i < 3; i++) {
              ctx.fillRect(obstacleScreenX + 4 + i * 7, obstacle.y + 5, 2, obstacle.height - 10);
            }
            ctx.fillStyle = "#16a34a";
            ctx.beginPath();
            ctx.arc(obstacleScreenX + obstacle.width / 2, obstacle.y, obstacle.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#15803d";
            for (let i = 0; i < 4; i++) {
              const spikeY = obstacle.y + 8 + i * 10;
              ctx.fillRect(obstacleScreenX - 2, spikeY, 2, 3);
              ctx.fillRect(obstacleScreenX + obstacle.width, spikeY, 2, 3);
            }
          } else {
            // Ящик
            ctx.fillStyle = "#92400e";
            ctx.fillRect(obstacleScreenX, obstacle.y, obstacle.width, obstacle.height);
            ctx.fillStyle = "#b45309";
            ctx.fillRect(obstacleScreenX + 3, obstacle.y + 3, obstacle.width - 6, obstacle.height - 6);
            ctx.strokeStyle = "#78350f";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(obstacleScreenX + obstacle.width * 0.3, obstacle.y + obstacle.height * 0.3);
            ctx.lineTo(obstacleScreenX + obstacle.width * 0.7, obstacle.y + obstacle.height * 0.7);
            ctx.moveTo(obstacleScreenX + obstacle.width * 0.7, obstacle.y + obstacle.height * 0.3);
            ctx.lineTo(obstacleScreenX + obstacle.width * 0.3, obstacle.y + obstacle.height * 0.7);
            ctx.stroke();
          }
        }
      }

      // Монеты
      for (const coin of world.coins) {
        if (coin.collected) continue;
        const coinScreenX = coin.x - camX;
        if (coinScreenX + 30 < 0 || coinScreenX - 30 > world.width) continue;

        const time = Date.now() / 300;
        const scale = 1 + Math.sin(time) * 0.1;

        ctx.save();
        ctx.translate(coinScreenX + 15, coin.y + 15);
        ctx.scale(scale, scale);
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⭐", 0, 0);
        ctx.restore();
      }

      // Персонаж - фиксированная позиция на экране
      const p = world.player;
      const playerScreenX = PLAYER_SCREEN_X;
      const playerScreenY = p.y;

      if (playerScreenX >= -p.w && playerScreenX <= world.width) {
        const currentSkin = skins[skinRef.current];
        
        const runCycle = Math.floor(animationFrameRef.current / 8) % 4;
        const jumpOffset = p.onGround ? 0 : -5;
        
        ctx.save();
        
        // Тело
        ctx.fillStyle = currentSkin.color;
        ctx.beginPath();
        ctx.ellipse(playerScreenX + p.w / 2, playerScreenY + p.h * 0.55 + jumpOffset, p.w / 2.8, p.h / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Голова
        ctx.beginPath();
        ctx.arc(playerScreenX + p.w / 2, playerScreenY + p.h * 0.35 + jumpOffset, p.w / 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Глаза
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(playerScreenX + p.w / 2 - 4, playerScreenY + p.h * 0.28 + jumpOffset, 3, 0, Math.PI * 2);
        ctx.arc(playerScreenX + p.w / 2 + 4, playerScreenY + p.h * 0.28 + jumpOffset, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(playerScreenX + p.w / 2 - 4, playerScreenY + p.h * 0.28 + jumpOffset, 1.5, 0, Math.PI * 2);
        ctx.arc(playerScreenX + p.w / 2 + 4, playerScreenY + p.h * 0.28 + jumpOffset, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Нос
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.moveTo(playerScreenX + p.w / 2, playerScreenY + p.h * 0.33 + jumpOffset);
        ctx.lineTo(playerScreenX + p.w / 2 - 2, playerScreenY + p.h * 0.36 + jumpOffset);
        ctx.lineTo(playerScreenX + p.w / 2 + 2, playerScreenY + p.h * 0.36 + jumpOffset);
        ctx.closePath();
        ctx.fill();

        // Ноги (анимация бега)
        ctx.fillStyle = currentSkin.color;
        const legY = playerScreenY + p.h * 0.75 + jumpOffset;
        const legW = 5;
        const legH = p.h / 3;
        
        if (p.onGround && statusRef.current === "running") {
          if (runCycle === 0 || runCycle === 3) {
            ctx.fillRect(playerScreenX + p.w / 2 - 7, legY - 2, legW, legH);
          } else {
            ctx.fillRect(playerScreenX + p.w / 2 - 7, legY + 3, legW, legH - 3);
          }
          
          if (runCycle === 1 || runCycle === 2) {
            ctx.fillRect(playerScreenX + p.w / 2 + 2, legY - 2, legW, legH);
          } else {
            ctx.fillRect(playerScreenX + p.w / 2 + 2, legY + 3, legW, legH - 3);
          }
        } else {
          ctx.fillRect(playerScreenX + p.w / 2 - 7, legY, legW, legH);
          ctx.fillRect(playerScreenX + p.w / 2 + 2, legY, legW, legH);
        }

        // Хвостик и ушки для кошечки
        if (skinRef.current === 0) {
          ctx.fillStyle = currentSkin.color;
          ctx.beginPath();
          ctx.moveTo(playerScreenX + p.w * 0.2, playerScreenY + p.h * 0.5 + jumpOffset);
          ctx.quadraticCurveTo(playerScreenX - 5, playerScreenY + p.h * 0.35 + jumpOffset, playerScreenX + p.w * 0.15, playerScreenY + p.h * 0.45 + jumpOffset);
          ctx.closePath();
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(playerScreenX + p.w / 2 - 6, playerScreenY + p.h * 0.22 + jumpOffset);
          ctx.lineTo(playerScreenX + p.w / 2 - 10, playerScreenY + p.h * 0.12 + jumpOffset);
          ctx.lineTo(playerScreenX + p.w / 2 - 3, playerScreenY + p.h * 0.18 + jumpOffset);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(playerScreenX + p.w / 2 + 6, playerScreenY + p.h * 0.22 + jumpOffset);
          ctx.lineTo(playerScreenX + p.w / 2 + 10, playerScreenY + p.h * 0.12 + jumpOffset);
          ctx.lineTo(playerScreenX + p.w / 2 + 3, playerScreenY + p.h * 0.18 + jumpOffset);
          ctx.closePath();
          ctx.fill();
        }
        
        ctx.restore();
        animationFrameRef.current++;
      }

      // UI
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "bold 18px system-ui";
      ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, 20, 30);
      ctx.fillText(`⭐ ${coinsRef.current}`, 20, 55);
      if (world.currentLevel > 0) {
        ctx.fillText(`Level: ${world.currentLevel + 1}`, 20, 80);
      }

      // Подсказки
      if (statusRef.current === "ready") {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "16px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Нажми Space или тапни, чтобы начать!", world.width / 2, world.height / 2);
        ctx.textAlign = "left";
      } else if (statusRef.current === "gameover") {
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "bold 24px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", world.width / 2, world.height / 2 - 20);
        ctx.font = "16px system-ui";
        ctx.fillText("Нажми R для перезапуска", world.width / 2, world.height / 2 + 20);
        ctx.textAlign = "left";
      }
    };

    const step = (t: number) => {
      const world = worldRef.current;
      const dt = Math.min(0.033, (t - lastTimeRef.current) / 1000 || 0);
      lastTimeRef.current = t;

      if (statusRef.current === "running") {
        update(dt);
      }
      draw();
      requestAnimationFrame(step);
    };

    const update = (dt: number) => {
      const world = worldRef.current;

      // Движение камеры (мир движется влево, камера вправо)
      world.camX += world.speed * dt;
      scoreRef.current += world.speed * dt * 0.1;
      if (Math.random() < 0.08) setScore(Math.floor(scoreRef.current));

      // Обновляем мировую координату персонажа (фиксированная позиция на экране = camX + PLAYER_SCREEN_X)
      const p = world.player;
      p.x = world.camX + PLAYER_SCREEN_X;

      // Генерация новых чанков
      while (world.nextChunkX < world.camX + world.width * 2) {
        pushNextChunk();
      }

      // Удаление объектов, которые прошли мимо персонажа (левее его на экране)
      // Персонаж на экране на PLAYER_SCREEN_X, в мировых координатах на camX + PLAYER_SCREEN_X
      // Удаляем объекты, которые полностью прошли левее персонажа
      const deleteBeforeX = world.camX + PLAYER_SCREEN_X - 200; // 200px запас позади
      
      world.chunks = world.chunks.filter((c) => c.x + c.width > deleteBeforeX);
      world.coins = world.coins.filter((c) => c.x > deleteBeforeX);
      world.obstacles = world.obstacles.filter((o) => o.x + o.width > deleteBeforeX);
      world.cacti = world.cacti.filter((c) => c.x > deleteBeforeX);

      // Физика персонажа
      p.vy += world.gravity * dt;
      p.y += p.vy * dt;

      // Проверка столкновений с препятствиями (в мировых координатах)
      const playerRect = {
        x: p.x,
        y: p.y,
        w: p.w,
        h: p.h,
      };

      for (const obstacle of world.obstacles) {
        if (
          playerRect.x < obstacle.x + obstacle.width &&
          playerRect.x + playerRect.w > obstacle.x &&
          playerRect.y < obstacle.y + obstacle.height &&
          playerRect.y + playerRect.h > obstacle.y
        ) {
          setGameStatus("gameover");
          return;
        }
      }

      // Сбор монет (в мировых координатах)
      for (const coin of world.coins) {
        if (coin.collected) continue;
        const dx = coin.x - (p.x + p.w / 2);
        const dy = coin.y - (p.y + p.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 25) {
          coin.collected = true;
          coinsRef.current++;
          setCoins(coinsRef.current);
          scoreRef.current += 50;
        }
      }

      // Проверка столкновения с платформами снизу (чтобы не проходить сквозь них)
      const playerX = p.x + p.w * 0.5;
      const playerLeft = p.x;
      const playerRight = p.x + p.w;
      const playerTop = p.y;
      const playerBottom = p.y + p.h;
      
      // Проверяем столкновение с платформами снизу (когда персонаж движется вверх)
      if (p.vy < 0) {
        for (const chunk of world.chunks) {
          if (chunk.platforms) {
            for (const platform of chunk.platforms) {
              const px = chunk.x + platform.x;
              const platformLeft = px;
              const platformRight = px + platform.width;
              const platformTop = chunk.groundY + platform.y;
              const platformBottom = platformTop + 15;
              
              // Проверяем горизонтальное пересечение
              if (playerRight > platformLeft && playerLeft < platformRight) {
                // Проверяем вертикальное пересечение - персонаж ударяется головой о платформу снизу
                if (playerTop < platformBottom && playerBottom > platformTop && p.y < platformTop) {
                  // Персонаж ударился о платформу снизу - останавливаем движение вверх
                  p.y = platformBottom;
                  p.vy = 0;
                }
              }
            }
          }
        }
      }

      // Определение земли под игроком (передаем Y позицию и скорость для проверки платформ)
      const groundY = getGroundYUnderPlayer(p.x + p.w * 0.5, p.y, p.vy);

      // Game Over если упал слишком низко
      if (p.y > world.height + 200) {
        setGameStatus("gameover");
        return;
      }

      // Проверяем, находится ли персонаж над пропастью
      let isOverGap = false;
      for (const chunk of world.chunks) {
        if (chunk.type === "gap") {
          // Персонаж находится над пропастью, если его X координата в пределах пропасти
          if (playerX >= chunk.x && playerX <= chunk.x + chunk.width) {
            isOverGap = true;
            break;
          }
        }
      }

      // Game Over если падает в пропасть (ниже уровня земли и нет земли под ним)
      // ИЛИ если находится над пропастью и упал ниже уровня земли
      if ((groundY === null && p.y + p.h > world.baseGroundY + 50) || 
          (isOverGap && p.y + p.h > world.baseGroundY + 30)) {
        setGameStatus("gameover");
        return;
      }

      if (groundY !== null) {
        const feetY = p.y + p.h;
        const headY = p.y;
        
        // Проверяем, является ли groundY платформой (one-way platform логика)
        let isPlatform = false;
        let platformTop = 0;
        let platformLeft = 0;
        let platformRight = 0;
        
        for (const chunk of world.chunks) {
          if (chunk.platforms) {
            for (const platform of chunk.platforms) {
              const px = chunk.x + platform.x;
              if (playerX >= px && playerX <= px + platform.width) {
                const pt = chunk.groundY + platform.y;
                // Проверяем, соответствует ли groundY этой платформе (с небольшой погрешностью)
                if (Math.abs(groundY - pt) < 1) {
                  isPlatform = true;
                  platformTop = pt;
                  platformLeft = px;
                  platformRight = px + platform.width;
                  break;
                }
              }
            }
            if (isPlatform) break;
          }
        }
        
        if (isPlatform) {
          // Это платформа - one-way platform логика
          const isOnPlatformHorizontally = playerRight > platformLeft && playerLeft < platformRight;
          const isFalling = p.vy >= 0; // Строго падает или стоит
          
          // Проверяем, стоит ли персонаж уже на платформе (его ноги на уровне платформы)
          const distanceToPlatform = feetY - platformTop;
          const isStandingOnPlatform = distanceToPlatform >= -5 && distanceToPlatform <= 10; // Персонаж стоит на платформе
          
          // Проверяем, находится ли персонаж под платформой
          // Персонаж под платформой, если его верхняя точка значительно ниже верха платформы
          // Используем запас 10px, чтобы платформа работала когда персонаж стоит на ней
          const isUnderPlatform = headY + 10 < platformTop;
          
          // Персонаж может приземлиться на платформу или оставаться на ней если:
          // 1. Падает сверху (vy >= 0)
          // 2. НЕ под платформой
          // 3. В горизонтальных пределах платформы
          // 4. Достаточно близко к платформе сверху (для приземления) ИЛИ уже стоит на ней
          // Расширяем диапазон для приземления: от -20px (ноги выше платформы) до 40px (ноги ниже платформы)
          // Увеличен диапазон для лучшего приземления при прыжке
          const isCloseEnoughForLanding = distanceToPlatform >= -20 && distanceToPlatform <= 40;
          
          // Дополнительная проверка: если персонаж прыгает и его ноги выше платформы, но он падает,
          // то он должен приземлиться на платформу (это нормальный прыжок на платформу)
          const isJumpingOntoPlatform = distanceToPlatform < 0 && distanceToPlatform >= -20 && p.vy >= 0;
          
          // Если персонаж стоит на платформе, он должен оставаться на ней стабильно
          if (isStandingOnPlatform && isOnPlatformHorizontally && !isUnderPlatform) {
            // Персонаж стоит на платформе - принудительно удерживаем его на ней
            p.y = platformTop - p.h;
            p.vy = 0;
            p.onGround = true;
            p.canJump = true;
            p.jumpBufferTime = 0.15;
          } else if (isFalling && !isUnderPlatform && isOnPlatformHorizontally && (isCloseEnoughForLanding || isJumpingOntoPlatform)) {
            // Может приземлиться на платформу (прыгает на неё)
            p.y = platformTop - p.h;
            p.vy = 0;
            p.onGround = true;
            p.canJump = true;
            p.jumpBufferTime = 0.15;
          } else {
            // Не может приземлиться на платформу - используем основную землю, если она есть
            const mainGroundY = world.baseGroundY;
            // Проверяем, есть ли основная земля под персонажем (не в пропасти)
            let hasMainGround = false;
            for (const chunk of world.chunks) {
              if (chunk.type !== "gap" && playerX >= chunk.x && playerX <= chunk.x + chunk.width) {
                hasMainGround = true;
                break;
              }
            }
            
            if (hasMainGround && feetY >= mainGroundY && p.vy >= 0) {
              // Приземление на основную землю
              p.y = mainGroundY - p.h;
              p.vy = 0;
              p.onGround = true;
              p.canJump = true;
              p.jumpBufferTime = 0.15;
            } else {
              // В воздухе или в пропасти
              p.onGround = false;
              if (p.jumpBufferTime > 0) {
                p.jumpBufferTime -= dt;
                if (p.jumpBufferTime < 0) p.jumpBufferTime = 0;
              }
            }
          }
        } else {
          // Это обычная земля
          if (feetY >= groundY && p.vy >= 0) {
            // Приземление на землю
            p.y = groundY - p.h;
            p.vy = 0;
            p.onGround = true;
            p.canJump = true;
            p.jumpBufferTime = 0.15;
          } else {
            // Персонаж в воздухе или движется вверх
            p.onGround = false;
            if (p.jumpBufferTime > 0) {
              p.jumpBufferTime -= dt;
              if (p.jumpBufferTime < 0) p.jumpBufferTime = 0;
            }
          }
        }
      } else {
        // Нет земли под персонажем (пропасть)
        p.onGround = false;
        if (p.jumpBufferTime > 0) {
          p.jumpBufferTime -= dt;
          if (p.jumpBufferTime < 0) p.jumpBufferTime = 0;
        }
      }

      // Ускорение и обновление уровня
      world.speed = clamp(280 + scoreRef.current / 100, 280, 400);
      world.currentLevel = Math.floor(world.camX / 2000); // Новый уровень каждые 2000 пикселей
    };

    const getGroundYUnderPlayer = (worldX: number, playerY: number, playerVy: number): number | null => {
      const world = worldRef.current;

      let bestGroundY: number | null = null;
      let bestPlatformY: number | null = null; // Отдельно отслеживаем платформы
      const playerTop = playerY;
      const playerBottom = playerY + world.player.h;
      const playerFeetY = playerBottom;

      // Сначала проверяем платформы (они имеют приоритет, если персонаж стоит на них)
      for (const chunk of world.chunks) {
        if (chunk.type === "gap") continue;
        
        if (chunk.platforms) {
          for (const platform of chunk.platforms) {
            const px = chunk.x + platform.x;
            if (worldX >= px && worldX <= px + platform.width) {
              const platformTop = chunk.groundY + platform.y; // Верх платформы
              
              // One-way platform: персонаж должен быть ВЫШЕ платформы
              // Персонаж находится под платформой, если его верхняя точка значительно ниже верха платформы
              // Используем меньший запас (10px), чтобы платформа возвращалась когда персонаж стоит на ней
              if (playerTop + 10 < platformTop) {
                // Персонаж полностью под платформой - игнорируем эту платформу
                continue;
              }
              
              // Проверяем, стоит ли персонаж на платформе (его ноги на уровне платформы или чуть выше/ниже)
              const distanceToPlatform = playerFeetY - platformTop;
              const isStandingOnPlatform = distanceToPlatform >= -5 && distanceToPlatform <= 10;
              
              // Если персонаж стоит на платформе, она имеет приоритет
              if (isStandingOnPlatform && playerVy >= 0) {
                bestPlatformY = platformTop;
              } else if (playerVy >= 0) {
                // Персонаж падает и может приземлиться на платформу
                // Проверяем, находится ли персонаж над платформой (его ноги выше платформы, но не слишком далеко)
                // Это позволяет приземлиться на платформу при прыжке
                const isAbovePlatform = distanceToPlatform >= -20 && distanceToPlatform <= 40;
                if (isAbovePlatform) {
                  // Выбираем платформу только если она выше основной земли
                  if (bestPlatformY === null || platformTop < bestPlatformY) {
                    bestPlatformY = platformTop;
                  }
                }
              }
            }
          }
        }
      }

      // Если нашли платформу, возвращаем её (платформы имеют приоритет)
      if (bestPlatformY !== null) {
        return bestPlatformY;
      }

      // Если платформы нет, проверяем основную землю
      for (const chunk of world.chunks) {
        if (chunk.type === "gap") continue;
        
        // Проверяем основную землю чанка (всегда доступна)
        if (worldX >= chunk.x && worldX <= chunk.x + chunk.width) {
          if (bestGroundY === null || chunk.groundY > bestGroundY) {
            bestGroundY = chunk.groundY;
          }
        }
      }

      return bestGroundY;
    };

    requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <Container className="pt-16 md:pt-20 pb-12">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            {t("pageTitle", { defaultValue: "Бегущий Игрок" })}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {t("pageDescription", { defaultValue: "Собирай звёзды, избегай препятствий!" })}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={start}
            disabled={status === "running"}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Start
          </button>
          <button
            onClick={restart}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
          >
            Restart
          </button>
          <button
            onClick={nextSkin}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold"
          >
            {t("changeSkin", { defaultValue: "Сменить скин" })} {skins[skin].emoji}
          </button>
        </div>

        <div className="relative bg-gray-100 rounded-lg overflow-hidden shadow-lg" style={{ minHeight: "420px" }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ touchAction: "none" }}
          />
        </div>
      </div>
    </Container>
  );
}
