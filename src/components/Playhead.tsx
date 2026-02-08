import { useRef, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import type { useResizeObserver } from '../hooks/useResizeObserver';
import { cn } from '@/lib/utils';

interface PlayheadProps {
  trackDimensions: ReturnType<typeof useResizeObserver>['dimensions'];
  currentTime: number;
}

export const Playhead = (props: PlayheadProps) => {
  const project = useAppSelector((state) => state.project);

  const [isPressed, setIsPressed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(
    (props.currentTime / project.totalDuration) * props.trackDimensions.width,
  );
  return (
    <>
      <div
        className={cn(
          'absolute w-0 h-0',
          'border-l-8 border-l-transparent',
          'border-r-8 border-r-transparent',
          'border-t-16 border-white',
          isPressed ? 'border-red-500' : 'border-white',
        )}
        style={{ left: `${left - 8}px` }}
        ref={ref}
        onPointerDown={(e) => {
          if (ref.current != null) {
            ref.current?.setPointerCapture(e.pointerId);
            setIsPressed(true);
          }
        }}
        onPointerUp={() => {
          setIsPressed(false);
        }}
        onPointerMove={(e) => {
          if (ref.current == null) return;
          if (!isPressed) return;

          const newLeft =
            e.clientX - props.trackDimensions.left + project.timelineScrollLeft;
          const constrainedNewLeft = Math.max(
            Math.min(newLeft, props.trackDimensions.width),
            0,
          );

          setLeft(constrainedNewLeft);
        }}
      />
      <div
        className='absolute -top-2.5 h-full w-px bg-white'
        style={{ left: `${left}px` }}
      />
    </>
  );
};
