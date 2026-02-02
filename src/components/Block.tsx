import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { trackSlice } from '../app/trackSlice';
import type { useResizeObserver } from '../hooks/useResizeObserver';
import { cn } from '@/lib/utils';

interface BlockProps {
  trackId: string;
  blockId: string;
  startTime: number;
  duration: number;
  frequency: number;
  gain: number;
  trackDimensions: ReturnType<typeof useResizeObserver>['dimensions'];
}

export const Block = (props: BlockProps) => {
  const dispatch = useAppDispatch();
  const project = useAppSelector((state) => state.project);
  const blockInfo = useAppSelector(
    (state) => state.tracks[props.trackId].blocks[props.blockId], // TODO: Do we need props at all?
  );

  const [pointerIsPressed, setPointerIsPressed] = useState(false);

  // NOTE: Default 'left' is overwritten after first render, maybe something to do with the
  // resize observer? This also updates block positions when screen or track is resized.
  useEffect(() => {
    const newLeft =
      (props.startTime / project.totalDuration) * project.pxPerSecondScale;
    const blockWidth = props.duration * project.pxPerSecondScale;
    dispatch(
      trackSlice.actions.editBlock({
        trackId: props.trackId,
        blockId: props.blockId,
        dims: {
          left: newLeft,
          width: blockWidth,
          maxLeft: project.totalDuration * project.pxPerSecondScale,
        },
      }),
    );
  }, [project.totalDuration]);

  const blockRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={blockRef}
      style={{
        width: `${blockInfo.dims.width}px`,
        left: `${blockInfo.dims.left}px`,
      }}
      className={cn('absolute', 'bg-primary', 'h-full')}
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
            e.clientX - props.trackDimensions.left - blockInfo.dims.width / 2;
          // NOTE: Constrains block dragging to start and end of the track
          const constrainedNewLeft = Math.max(
            Math.min(newLeft, blockInfo.dims.maxLeft),
            0,
          );
          const blockWidth = props.duration * project.pxPerSecondScale;
          dispatch(
            trackSlice.actions.editBlock({
              trackId: props.trackId,
              blockId: props.blockId,
              dims: {
                left: constrainedNewLeft,
                width: blockWidth,
                maxLeft:
                  project.totalDuration * project.pxPerSecondScale - blockWidth,
              },
            }),
          );
        }
      }}
    >
      {/* <p>{props.blockId.slice(0, 4)} -</p> */}
      {/* <p>left: {blockInfo.dims.left} </p>
      <p>trackwiddth: {props.trackDimensions.width}</p>
      <p>start {blockInfo.startTime}s</p> */}
    </div>
  );
};
