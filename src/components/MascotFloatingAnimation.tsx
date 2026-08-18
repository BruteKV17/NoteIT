/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import ChromaKeyVideo from './ChromaKeyVideo';

type CornerLocation = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type AnimationPhase = 'hidden' | 'entering' | 'visible' | 'exiting';

interface MascotFloatingAnimationProps {
  /** Optional custom mascot video path */
  videoSrc?: string;
  /** Optional callback when mascot is clicked (if interactive mode enabled) */
  onClick?: () => void;
  /** Disable mascot floating feature if set to true */
  disabled?: boolean;
}

const CORNERS: CornerLocation[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

export default function MascotFloatingAnimation({
  videoSrc = '/mascots/noteit-mascot.mp4',
  onClick,
  disabled = false
}: MascotFloatingAnimationProps) {
  const [corner, setCorner] = useState<CornerLocation>('top-right');
  const [phase, setPhase] = useState<AnimationPhase>('hidden');

  const prevCornerRef = useRef<CornerLocation | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get random number in range
  const getRandomRange = (minSec: number, maxSec: number) => {
    return Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
  };

  // Helper to pick next random corner ensuring no immediate repeat
  const getNextCorner = (): CornerLocation => {
    const available = CORNERS.filter((c) => c !== prevCornerRef.current);
    const next = available[Math.floor(Math.random() * available.length)];
    prevCornerRef.current = next;
    return next;
  };

  useEffect(() => {
    if (disabled) {
      setPhase('hidden');
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Schedule appearance loop
    const scheduleNextAppearance = (delayMs: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const nextCorner = getNextCorner();
        setCorner(nextCorner);
        setPhase('entering');

        // Transition from entering to visible after intro duration (700ms)
        timerRef.current = setTimeout(() => {
          setPhase('visible');

          // Stay visible for 5 to 6 seconds
          const visibleDuration = getRandomRange(5, 6);
          timerRef.current = setTimeout(() => {
            setPhase('exiting');

            // Exit animation finishes after 700ms, hide component and schedule next delay
            timerRef.current = setTimeout(() => {
              setPhase('hidden');

              // Next appearance after 20 to 45 seconds
              const nextDelay = getRandomRange(20, 45);
              scheduleNextAppearance(nextDelay);
            }, 700);
          }, visibleDuration);
        }, 700);
      }, delayMs);
    };

    // Initial random delay of 5 to 15 seconds
    const initialDelay = getRandomRange(5, 15);
    scheduleNextAppearance(initialDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [disabled]);

  if (disabled || phase === 'hidden') {
    return null;
  }

  // Positioning & Transform Styles per Corner
  const getPositionStyles = () => {
    const isEnteringOrVisible = phase === 'entering' || phase === 'visible';

    switch (corner) {
      case 'top-left':
        return {
          containerClass: 'top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8',
          tiltClass: 'rotate-[25deg]',
          transformClass: isEnteringOrVisible
            ? 'translate-x-0 translate-y-0 opacity-100 scale-100'
            : '-translate-x-32 -translate-y-32 opacity-0 scale-90',
        };
      case 'top-right':
        return {
          containerClass: 'top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8',
          tiltClass: '-rotate-[25deg]',
          transformClass: isEnteringOrVisible
            ? 'translate-x-0 translate-y-0 opacity-100 scale-100'
            : 'translate-x-32 -translate-y-32 opacity-0 scale-90',
        };
      case 'bottom-left':
        return {
          containerClass: 'bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8',
          tiltClass: 'rotate-[20deg]',
          transformClass: isEnteringOrVisible
            ? 'translate-x-0 translate-y-0 opacity-100 scale-100'
            : '-translate-x-32 translate-y-32 opacity-0 scale-90',
        };
      case 'bottom-right':
      default:
        return {
          containerClass: 'bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8',
          tiltClass: '-rotate-[20deg]',
          transformClass: isEnteringOrVisible
            ? 'translate-x-0 translate-y-0 opacity-100 scale-100'
            : 'translate-x-32 translate-y-32 opacity-0 scale-90',
        };
    }
  };

  const { containerClass, tiltClass, transformClass } = getPositionStyles();

  return (
    <div
      aria-hidden="true"
      className={`fixed ${containerClass} z-40 pointer-events-none select-none transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${transformClass}`}
    >
      <div className={`transform transition-transform duration-500 ease-out ${tiltClass}`}>
        <ChromaKeyVideo
          src={videoSrc}
          fallbackSrc="/mascots/mascot-recording.mp4"
          fallbackImg="/mascots/mascot-celebrate.png"
          className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
          targetFps={45}
          canvasWidth={240}
          canvasHeight={240}
          onClick={onClick}
        />
      </div>
    </div>
  );
}
