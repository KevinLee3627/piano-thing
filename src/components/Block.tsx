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

const useMouseTracking = () => {
  const prevMouseXRef = useRef<number | null>(null);

  const updatePosition = (x: number) => {
    prevMouseXRef.current = x;
  };

  const getDragDirection = (currentX: number): 'left' | 'right' | null => {
    if (prevMouseXRef.current === null) return null;
    return currentX > prevMouseXRef.current ? 'right' : 'left';
  };

  const reset = () => {
    prevMouseXRef.current = null;
  };

  return { updatePosition, getDragDirection, reset };
};

const getResizeZone = (
  mouseXInBlock: number,
  blockWidth: number,
): 'left' | 'right' | null => {
  if (mouseXInBlock <= RESIZE_PX_THRESHOLD) return 'left';
  if (mouseXInBlock >= blockWidth - RESIZE_PX_THRESHOLD) return 'right';
  return null;
};

const calculateMouseX = (
  e: React.PointerEvent,
  railLeft: number,
  diff: number,
  scrollLeft: number,
): number => {
  return e.clientX - railLeft - diff + scrollLeft;
};

const calculateMouseXInBlock = (
  e: React.PointerEvent,
  blockRef: React.RefObject<HTMLDivElement | null>,
): number => {
  if (blockRef.current == null) return 0;
  return e.clientX - blockRef.current.getBoundingClientRect().left;
};

const updateCursor = (
  blockRef: React.RefObject<HTMLDivElement | null>,
  zone: 'left' | 'right' | null,
) => {
  if (blockRef.current == null) return;
  blockRef.current.style.cursor = zone ? 'ew-resize' : 'default';
};

// TODO: don't hard-code this??
export const BLOCK_HEIGHT = 24;
const RESIZE_PX_THRESHOLD = 4;
// TODO: Is this value rasonable? Should threshold and width be adjusted based on scale?
const MIN_BLOCK_WIDTH = 12; // in px

export const Block = (props: BlockProps) => {
  const dispatch = useAppDispatch();
  const project = useAppSelector((state) => state.project);
  const trackInfo = useAppSelector((state) => state.tracks[props.trackId]);
  const blockInfo = useAppSelector(
    (state) => state.tracks[props.trackId].blocks[props.blockId],
  );

  const [pointerIsPressed, setPointerIsPressed] = useState(false);
  const [movingEnabled, setMovingEnabled] = useState(true);
  const [resizingEnabled, setResizingEnabled] = useState(false);
  const mouseTracking = useMouseTracking();
  const blockRef = useRef<HTMLDivElement>(null);

  const noteRange = useMemo(
    () => generateNoteRange(trackInfo.minNote, trackInfo.maxNote).reverse(),
    [trackInfo.minNote, trackInfo.maxNote],
  );

  const diffRef = useRef(0); // Store offset from click to block's left edge

  // TODO: Let's clean these params up...
  const handleBlockMove = (
    mouseX: number,
    e: { clientY: number },
    blockWidth: number,
  ) => {
    let newLeft: number;
    if (trackInfo.isQuantized) {
      // Defines snap points at every X pixels, depending on resolution
      const snapPointGap =
        project.pxPerMeasureScale /
        project.beatsPerMeasure /
        trackInfo.quantizationResolution;
      // Get the previous and next snap point, then see what's closer
      newLeft = Math.round(mouseX / snapPointGap) * snapPointGap;
    } else {
      newLeft = mouseX;
    }

    const maxLeft =
      project.totalDuration * project.pxPerSecondScale - blockWidth;
    const constrainedNewLeft = Math.max(Math.min(newLeft, maxLeft), 0);

    const maxTop = props.railDimensions.height - BLOCK_HEIGHT;
    const newTop = e.clientY - props.railDimensions.top;
    const discretizedNewTop = Math.floor(newTop / BLOCK_HEIGHT) * BLOCK_HEIGHT;
    const constrainedNewTop = Math.max(Math.min(discretizedNewTop, maxTop), 0);

    // Get the new note based on y position
    // (use constrainedNewTop to stay within bounds of noteRange)
    const noteIndex = constrainedNewTop / BLOCK_HEIGHT;
    const newNoteFreq = getNoteFreqByName(noteRange[noteIndex]);

    // Calculate new start time basedd on x position
    const newStartTime =
      (constrainedNewLeft / props.railDimensions.width) * project.totalDuration;

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
  };

  const handleBlockResize = (
    mouseX: number,
    resizeZone: 'left' | 'right',
    dragDirection: 'left' | 'right',
  ) => {
    if (pointerIsPressed) {
      setMovingEnabled(false);
      // We need to handle 4 cases:
      if (resizeZone === 'left') {
        // drag left side left
        if (dragDirection === 'left') {
          // TODO: Take quuantiztaion into account
          // TODO: Lots of duplication between this and handleBlockMove...
          // TODO: Handle when dragging right from left - enforce minimum block width?
          const newLeft = mouseX;
          // Return early when trying to drag past start of rail
          if (newLeft < 0) return;

          const newWidth = blockInfo.dims.width + blockInfo.dims.left - mouseX;
          dispatch(
            trackSlice.actions.editBlock({
              trackId: props.trackId,
              blockId: props.blockId,
              startTime:
                (newLeft / props.railDimensions.width) * project.totalDuration,
              duration: newWidth / project.pxPerSecondScale,
              dims: {
                ...blockInfo.dims,
                left: newLeft,
                width: newWidth,
              },
            }),
          );
        } else if (dragDirection === 'right') {
        }
      } else if (resizeZone === 'right') {
        // drag right side left
        // drag right side right
      }
    }
  };

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
        setResizingEnabled(true);
        setMovingEnabled(true);
        // Reset previous mouse position for future resizes
        mouseTracking.reset();
      }}
      onPointerMove={(e) => {
        if (blockRef.current == null) return;
        // mouseX = position relative to rail w/ position within the block and timeline scroll taken into account
        const mouseX = calculateMouseX(
          e,
          props.railDimensions.left,
          diffRef.current,
          project.timelineScrollLeft,
        );

        // x position relative to the left edge of the hovered block
        const mouseXInBlock = calculateMouseXInBlock(e, blockRef);
        const blockWidth = blockInfo.duration * project.pxPerSecondScale;

        const resizeZone = getResizeZone(mouseXInBlock, blockWidth);
        const dragDirection = mouseTracking.getDragDirection(mouseX);

        // When moving block, 'disable'/'block' resizing? Then on pointerUp, we re-enable resizing?
        if (resizeZone != null && resizingEnabled && dragDirection) {
          // TODO: what happens if two adjacent blocks get resized and you drag into each other?
          updateCursor(blockRef, resizeZone);
          handleBlockResize(mouseX, resizeZone, dragDirection);
        } else if (resizeZone == null && movingEnabled && pointerIsPressed) {
          updateCursor(blockRef, null);
          setResizingEnabled(false);
          handleBlockMove(mouseX, e, blockWidth);
        }

        // Update mousexref for resizes
        mouseTracking.updatePosition(mouseX);
      }}
    />
  );
};
