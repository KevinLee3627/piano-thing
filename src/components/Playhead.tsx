import React, { useEffect, useRef, useState, type SetStateAction } from 'react';
import { useAppSelector } from '../app/hooks';
import { cn } from '@/lib/utils';

interface PlayheadProps {
  playbackTime: number;
  railLeft: number;
  setPlaybackTime: React.Dispatch<SetStateAction<number>>;
  pause: () => Promise<void>;
  play: () => Promise<void>;
}

export const Playhead = (props: PlayheadProps) => {
  const project = useAppSelector((state) => state.project);

  const railWidth = project.pxPerMeasureScale * project.totalMeasures;

  const [isPressed, setIsPressed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(
    (props.playbackTime / project.totalDuration) * railWidth,
  );

  useEffect(() => {
    setLeft((props.playbackTime / project.totalDuration) * railWidth);
  }, [props.playbackTime]);

  return (
    <div className='absolute h-full z-50' style={{ left: `${left - 8}px` }}>
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
          if (ref.current != null) {
            ref.current?.setPointerCapture(e.pointerId);
            setIsPressed(true);
            props.pause();
          }
        }}
        onPointerUp={() => {
          const newPlaybackTime = (left / railWidth) * project.totalDuration;
          props.setPlaybackTime(newPlaybackTime);
          setIsPressed(false);
          props.play();
        }}
        onPointerMove={(e) => {
          if (ref.current == null) return;
          if (!isPressed) return;

          const newLeft =
            e.clientX - props.railLeft + project.timelineScrollLeft;
          const constrainedNewLeft = Math.max(Math.min(newLeft, railWidth), 0);

          setLeft(constrainedNewLeft);
        }}
      />
      <div className='relative left-2 -top-2.5 h-full w-px bg-white' />
    </div>
  );
};
