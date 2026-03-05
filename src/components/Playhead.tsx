import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import { cn } from '@/lib/utils';

interface PlayheadProps {
  playbackTimeRef: React.RefObject<number>;
  railLeft: number;
  pause: () => Promise<void>;
  play: () => Promise<void>;
}

export const Playhead = (props: PlayheadProps) => {
  const project = useAppSelector((state) => state.project);

  const railWidth = project.pxPerMeasureScale * project.totalMeasures;

  const [isPressed, setIsPressed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (wrapperRef.current) {
        const left =
          (props.playbackTimeRef.current / project.totalDuration) * railWidth;
        wrapperRef.current.style.left = `${left - 8}px`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [railWidth, project.totalDuration]);

  const clientXToTime = (clientX: number) => {
    const left = clientX - props.railLeft + project.timelineScrollLeft;
    const constrained = Math.max(Math.min(left, railWidth), 0);
    return (constrained / railWidth) * project.totalDuration;
  };

  return (
    <div className='absolute h-full z-50' ref={wrapperRef}>
      <div
        className={cn(
          'relative w-0 h-0',
          'border-l-8 border-l-transparent',
          'border-r-8 border-r-transparent',
          'border-t-16 border-white',
          isPressed ? 'border-red-500' : 'border-white',
        )}
        ref={ref}
        onPointerDown={(e) => {
          ref.current?.setPointerCapture(e.pointerId);
          setIsPressed(true);
          props.pause();
        }}
        onPointerMove={(e) => {
          if (!isPressed) return;
          props.playbackTimeRef.current = clientXToTime(e.clientX);
        }}
        onPointerUp={(e) => {
          const seekTime = clientXToTime(e.clientX);
          props.playbackTimeRef.current = seekTime;
          setIsPressed(false);
          props.play();
        }}
      />
      <div className='relative left-2 -top-2.5 h-full w-px bg-white' />
    </div>
  );
};
