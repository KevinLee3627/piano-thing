import { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { trackSlice } from '../app/trackSlice';
import type { useResizeObserver } from '../hooks/useResizeObserver';
import { cn } from '@/lib/utils';

interface BlockProps {
  trackId: string;
  blockId: string;
  trackDimensions: ReturnType<typeof useResizeObserver>['dimensions'];
}

// TODO: don't hard-code this??
export const BLOCK_HEIGHT = 24;

export const Block = (props: BlockProps) => {
  const dispatch = useAppDispatch();
  const project = useAppSelector((state) => state.project);
  const blockInfo = useAppSelector(
    (state) => state.tracks[props.trackId].blocks[props.blockId],
  );

  const [pointerIsPressed, setPointerIsPressed] = useState(false);

  const blockRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={blockRef}
      style={{
        height: `${blockInfo.dims.height}px`,
        width: `${blockInfo.dims.width}px`,
        left: `${blockInfo.dims.left}px`,
        top: `${blockInfo.dims.top}px`,
      }}
      className={cn('absolute', 'bg-primary')}
      onPointerDown={(e) => {
        if (blockRef.current != null) {
          // NOTE: NEEDED TO KEEP SLIDING AFTER CURSOR LEAVES BOUNDARIES
          blockRef.current.setPointerCapture(e.pointerId);
          setPointerIsPressed(true);
        }
      }}
      onPointerUp={() => {
        setPointerIsPressed(false);
        const newStartTime =
          (blockInfo.dims.left / props.trackDimensions.width) *
          project.totalDuration;

        dispatch(
          trackSlice.actions.editBlock({
            trackId: props.trackId,
            blockId: props.blockId,
            startTime: newStartTime,
          }),
        );
      }}
      onPointerMove={(e) => {
        if (blockRef.current == null) return;
        if (pointerIsPressed) {
          const newLeft =
            e.clientX -
            props.trackDimensions.left -
            blockInfo.dims.width / 2 +
            project.timelineScrollLeft;
          // NOTE: Constrains block dragging to start and end of the track
          const constrainedNewLeft = Math.max(
            Math.min(newLeft, blockInfo.dims.maxLeft),
            0,
          );
          const blockWidth = blockInfo.duration * project.pxPerSecondScale;
          dispatch(
            trackSlice.actions.editBlock({
              trackId: props.trackId,
              blockId: props.blockId,
              dims: {
                top: blockInfo.dims.top,
                left: constrainedNewLeft,
                width: blockWidth,
                height: BLOCK_HEIGHT,
                maxLeft:
                  project.totalDuration * project.pxPerSecondScale - blockWidth,
              },
            }),
          );
        }
      }}
    />
  );
};
