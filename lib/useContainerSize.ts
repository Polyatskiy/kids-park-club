'use client';

import { useEffect, useState, useCallback, RefObject } from 'react';

export interface ContainerSize {
  width: number;
  height: number;
}

/**
 * Hook to measure container dimensions using ResizeObserver.
 * Returns the current width and height of the referenced element.
 * Updates automatically on resize, orientation change, and window resize.
 */
export function useContainerSize(
  containerRef: RefObject<HTMLElement | null>
): ContainerSize {
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setSize((prev) => {
        // Only update if values actually changed to avoid unnecessary re-renders
        if (prev.width !== clientWidth || prev.height !== clientHeight) {
          return { width: clientWidth, height: clientHeight };
        }
        return prev;
      });
    }
  }, [containerRef]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Initial measurement
    updateSize();

    // Use ResizeObserver for element size changes
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(element);

    // Also listen to window resize for viewport changes
    const handleResize = () => {
      updateSize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [containerRef, updateSize]);

  return size;
}

/**
 * Calculate puzzle board dimensions that fit within a container.
 * Returns the cell size, board dimensions, and piece visual size.
 */
export interface PuzzleDimensions {
  cellSize: number;
  tabRadius: number;
  pieceVisualSize: number;
  boardWidth: number;
  boardHeight: number;
}

export function calculatePuzzleDimensions(
  containerWidth: number,
  containerHeight: number,
  rows: number,
  cols: number,
  margin: number,
  isMobile: boolean
): PuzzleDimensions {
  // For mobile: we need space for board + scatter area below
  // For desktop: we need space for board + scatter area on the left
  
  // Available space for the board itself (accounting for margins)
  let availableWidth: number;
  let availableHeight: number;

  if (isMobile) {
    // On mobile, the board takes full width, with scatter area below
    // Reserve ~40% of height for scatter area
    availableWidth = containerWidth - margin * 2;
    availableHeight = (containerHeight - margin * 3) * 0.55; // Board gets 55% of height
  } else {
    // On desktop, the board is on the right side
    // Reserve ~50% of width for scatter area on the left
    availableWidth = (containerWidth - margin * 3) * 0.5;
    availableHeight = containerHeight - margin * 2;
  }

  // Calculate cell size that fits all pieces within available space
  const cellSizeByWidth = availableWidth / cols;
  const cellSizeByHeight = availableHeight / rows;
  
  // Use the smaller of the two to ensure the board fits
  // Apply a minimum cell size for usability and a maximum for aesthetics
  const MIN_CELL_SIZE = 20;
  const MAX_CELL_SIZE = 120;
  
  const cellSize = Math.max(
    MIN_CELL_SIZE,
    Math.min(MAX_CELL_SIZE, Math.floor(Math.min(cellSizeByWidth, cellSizeByHeight)))
  );

  const tabRadius = cellSize * 0.22;
  const pieceVisualSize = Math.ceil(cellSize + tabRadius * 2);
  const boardWidth = cols * cellSize;
  const boardHeight = rows * cellSize;

  return {
    cellSize,
    tabRadius,
    pieceVisualSize,
    boardWidth,
    boardHeight,
  };
}

