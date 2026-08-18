/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';

interface ChromaKeyVideoProps {
  src: string;
  fallbackSrc?: string;
  fallbackImg?: string;
  className?: string;
  onClick?: () => void;
  targetFps?: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

export default function ChromaKeyVideo({
  src,
  fallbackSrc,
  fallbackImg,
  className = 'w-48 h-48 sm:w-60 sm:h-60',
  onClick,
  targetFps = 45,
  canvasWidth = 320,
  canvasHeight = 320
}: ChromaKeyVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Pre-allocated reusable buffers to avoid Garbage Collection memory thrashing at 45-60 FPS
  const buffersRef = useRef<{
    visited: Uint8Array;
    queue: Int32Array;
    size: number;
  } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let isComponentMounted = true;
    let lastFrameTime = 0;
    const frameInterval = 1000 / targetFps; // e.g. ~22ms for 45 FPS target

    const renderFrame = (now: number) => {
      if (!isComponentMounted) return;

      // Request next frame immediately
      animationFrameRef.current = requestAnimationFrame(renderFrame);

      // Regulate frame rate to target 40-50 FPS
      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval) {
        return;
      }
      lastFrameTime = now - (elapsed % frameInterval);

      if (video.readyState >= 2 && !video.paused && !video.ended) {
        const width = canvas.width;
        const height = canvas.height;
        const totalPixels = width * height;

        // Reuse or initialize typed array buffers
        if (!buffersRef.current || buffersRef.current.size !== totalPixels) {
          buffersRef.current = {
            visited: new Uint8Array(totalPixels),
            queue: new Int32Array(totalPixels),
            size: totalPixels
          };
        }

        const visited = buffersRef.current.visited;
        const queue = buffersRef.current.queue;
        // Reset visited array quickly
        visited.fill(0);

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(video, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        let head = 0;
        let tail = 0;

        // Background color detection (Green screen OR White/Light-grey background)
        const isBackgroundPixel = (r: number, g: number, b: number): boolean => {
          // Green screen check
          if ((g > 65 && g > r * 1.12 && g > b * 1.08) || (g - r > 25 && g - b > 25)) {
            return true;
          }
          // White / Light grey background check
          const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
          if (r > 200 && g > 200 && b > 200 && maxDiff < 35) {
            return true;
          }
          return false;
        };

        // Seed all 4 outer borders of the video frame
        for (let x = 0; x < width; x++) {
          // Top border
          const idxTop = x;
          const pTop = idxTop * 4;
          if (isBackgroundPixel(data[pTop], data[pTop + 1], data[pTop + 2])) {
            visited[idxTop] = 1;
            queue[tail++] = idxTop;
          }
          // Bottom border
          const idxBot = (height - 1) * width + x;
          const pBot = idxBot * 4;
          if (!visited[idxBot] && isBackgroundPixel(data[pBot], data[pBot + 1], data[pBot + 2])) {
            visited[idxBot] = 1;
            queue[tail++] = idxBot;
          }
        }

        for (let y = 0; y < height; y++) {
          // Left border
          const idxLeft = y * width;
          const pLeft = idxLeft * 4;
          if (!visited[idxLeft] && isBackgroundPixel(data[pLeft], data[pLeft + 1], data[pLeft + 2])) {
            visited[idxLeft] = 1;
            queue[tail++] = idxLeft;
          }
          // Right border
          const idxRight = y * width + (width - 1);
          const pRight = idxRight * 4;
          if (!visited[idxRight] && isBackgroundPixel(data[pRight], data[pRight + 1], data[pRight + 2])) {
            visited[idxRight] = 1;
            queue[tail++] = idxRight;
          }
        }

        // BFS Flood fill to remove outer background while preserving internal features
        while (head < tail) {
          const curr = queue[head++];
          const p = curr * 4;

          data[p + 3] = 0; // Transparent

          const cx = curr % width;
          const cy = (curr / width) | 0;

          if (cx > 0) {
            const n = curr - 1;
            if (!visited[n]) {
              visited[n] = 1;
              const np = n * 4;
              if (isBackgroundPixel(data[np], data[np + 1], data[np + 2])) queue[tail++] = n;
            }
          }
          if (cx < width - 1) {
            const n = curr + 1;
            if (!visited[n]) {
              visited[n] = 1;
              const np = n * 4;
              if (isBackgroundPixel(data[np], data[np + 1], data[np + 2])) queue[tail++] = n;
            }
          }
          if (cy > 0) {
            const n = curr - width;
            if (!visited[n]) {
              visited[n] = 1;
              const np = n * 4;
              if (isBackgroundPixel(data[np], data[np + 1], data[np + 2])) queue[tail++] = n;
            }
          }
          if (cy < height - 1) {
            const n = curr + width;
            if (!visited[n]) {
              visited[n] = 1;
              const np = n * 4;
              if (isBackgroundPixel(data[np], data[np + 1], data[np + 2])) queue[tail++] = n;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
      }
    };

    video.play().catch(console.error);
    animationFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      isComponentMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [src, targetFps]);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} onClick={onClick}>
      {/* Hidden HTML5 video source element */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
        className="hidden"
      >
        <source src={src} type="video/mp4" />
        {fallbackSrc && <source src={fallbackSrc} type="video/mp4" />}
      </video>

      {/* Real-time Chroma Key Canvas (Transparent, borderless) */}
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="w-full h-full object-contain pointer-events-auto filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]"
      />

      {/* Static Image Fallback if Video fails */}
      {fallbackImg && (
        <img
          src={fallbackImg}
          alt="Mascot Fallback"
          className="absolute inset-0 w-full h-full object-contain -z-10 opacity-0 transition-opacity"
          onError={(e) => {
            (e.target as HTMLElement).style.opacity = '1';
          }}
        />
      )}
    </div>
  );
}


