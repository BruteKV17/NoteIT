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
}

export default function ChromaKeyVideo({
  src,
  fallbackSrc,
  fallbackImg,
  className = 'w-48 h-48 sm:w-60 sm:h-60',
  onClick
}: ChromaKeyVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let isComponentMounted = true;

    const renderFrame = () => {
      if (!isComponentMounted) return;

      if (video.readyState >= 2 && !video.paused && !video.ended) {
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw video centered on canvas
        ctx.drawImage(video, 0, 0, width, height);

        // Real-Time Green Screen Chroma Key Removal
        const frame = ctx.getImageData(0, 0, width, height);
        const data = frame.data;
        const len = data.length;

        for (let i = 0; i < len; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Detect green screen background
          if (g > 65 && g > r * 1.12 && g > b * 1.08) {
            data[i + 3] = 0; // Set pixel to 100% transparent
          }
        }

        ctx.putImageData(frame, 0, 0);
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    video.play().catch(console.error);
    renderFrame();

    return () => {
      isComponentMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [src]);

  return (
    <div className={`relative flex items-center justify-center select-none cursor-pointer ${className}`} onClick={onClick}>
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

      {/* Real-time Chroma Key Canvas (Transparent, no border, no circular frame) */}
      <canvas
        ref={canvasRef}
        width={360}
        height={360}
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
