import { useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { trackSlice } from '../app/trackSlice';
import { cn } from '@/lib/utils';
import { generateNoteRange, getNoteFreqByName } from '@/util/noteUtils';

interface BlockProps {
  trackId: string;
  blockId: string;
  railDimensions: { width: number; left: number; top: number; height: number };
}

// TODO: don't hard-code this??
export const BLOCK_HEIGHT = 24;

export const Block = (props: BlockProps) => {
  const dispatch = useAppDispatch();
  const project = useAppSelector((state) => state.project);
  const trackInfo = useAppSelector((state) => state.tracks[props.trackId]);
  const blockInfo = useAppSelector(
    (state) => state.tracks[props.trackId].blocks[props.blockId],
  );

  const [pointerIsPressed, setPointerIsPressed] = useState(false);

  const blockRef = useRef<HTMLDivElement>(null);

  const noteRange = useMemo(
    () => generateNoteRange(trackInfo.minNote, trackInfo.maxNote).reverse(),
    [trackInfo.minNote, trackInfo.maxNote],
  );

  const diffRef = useRef(0); // Store offset from click to block's left edge

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
          // Calculate offset from block's left edge to click position
          const blockRect = blockRef.current.getBoundingClientRect();
          diffRef.current = e.clientX - blockRect.left;

          // NOTE: NEEDED TO KEEP SLIDING AFTER CURSOR LEAVES BOUNDARIES
          blockRef.current.setPointerCapture(e.pointerId);
          setPointerIsPressed(true);
        }
      }}
      onPointerUp={() => {
        setPointerIsPressed(false);
      }}
      onPointerMove={(e) => {
        if (blockRef.current == null) return;
        if (pointerIsPressed) {
          // mouseX = position relative to rail w/ position within the block and timeline scroll taken into account
          const mouseX =
            e.clientX -
            props.railDimensions.left -
            diffRef.current +
            project.timelineScrollLeft;

          let newLeft: number;
          if (trackInfo.isQuantized) {
            // For a first implementation, a snap point will be at the start of each beat.
            const snapPointGap =
              project.pxPerMeasureScale /
              project.beatsPerMeasure /
              trackInfo.quantizationResolution;
            // Get the previous and next snap point, then see what's closer
            newLeft = Math.round(mouseX / snapPointGap) * snapPointGap;
          } else {
            newLeft = mouseX;
          }

          const blockWidth = blockInfo.duration * project.pxPerSecondScale;

          const maxLeft =
            project.totalDuration * project.pxPerSecondScale - blockWidth;
          const constrainedNewLeft = Math.max(Math.min(newLeft, maxLeft), 0);

          const newTop = e.clientY - props.railDimensions.top;
          const discretizedNewTop =
            Math.floor(newTop / BLOCK_HEIGHT) * BLOCK_HEIGHT;
          const maxTop = props.railDimensions.height - BLOCK_HEIGHT;
          const constrainedNewTop = Math.max(
            Math.min(discretizedNewTop, maxTop),
            0,
          );

          // Get the new note based on y position
          // (use constrainedNewTop to stay within bounds of noteRange)
          const noteIndex = constrainedNewTop / BLOCK_HEIGHT;
          const newNoteFreq = getNoteFreqByName(noteRange[noteIndex]);

          // Calculate new start time basedd on x position
          const newStartTime =
            (constrainedNewLeft / props.railDimensions.width) *
            project.totalDuration;

          dispatch(
            trackSlice.actions.editBlock({
              trackId: props.trackId,
              blockId: props.blockId,
              startTime: newStartTime,
              frequency: newNoteFreq,
              dims: {
                top: constrainedNewTop,
                left: constrainedNewLeft,
                width: blockWidth,
                height: BLOCK_HEIGHT,
              },
            }),
          );
        }
      }}
    />
  );
};
