import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { trackSlice, type Track } from '../app/trackSlice';
import { cn } from '@/lib/utils';
import { generateNoteRange, getNoteFreqByName } from '@/util/noteUtils';

interface BlockProps {
  trackId: string;
  blockId: string;
  railDimensions: { width: number; left: number; top: number; height: number };
}

type BlockType = Track['blocks'][string];

type DragDirection = 'left' | 'right';
type ResizeZone = 'left' | 'right';

const useMouseTracking = () => {
  const prevMouseXRef = useRef<number | null>(null);

  const updatePosition = (x: number) => {
    prevMouseXRef.current = x;
  };

  const getDragDirection = (currentX: number): DragDirection | null => {
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
): ResizeZone | null => {
  if (mouseXInBlock <= RESIZE_PX_THRESHOLD) return 'left';
  if (mouseXInBlock >= blockWidth - RESIZE_PX_THRESHOLD) return 'right';
  return null;
};

// mouseX = position relative to rail w/ position within the block and timeline scroll taken into account
const calculateMouseX = (
  e: React.PointerEvent,
  railLeft: number,
  diff: number,
  scrollLeft: number,
): number => {
  return e.clientX - railLeft - diff + scrollLeft;
};

const calculateMouseY = (e: React.PointerEvent, railTop: number) =>
  e.clientY - railTop;

// x position relative to the left edge of the hovered block
const calculateMouseXInBlock = (
  e: React.PointerEvent,
  blockRef: React.RefObject<HTMLDivElement | null>,
): number => {
  if (blockRef.current == null) return 0;
  return e.clientX - blockRef.current.getBoundingClientRect().left;
};

type PointerMode = 'idle' | 'moving' | 'resizing-left' | 'resizing-right';
const determinePointerMode = (
  currentMode: PointerMode,
  pointerIsPressed: boolean,
  resizeZone: ResizeZone | null,
): PointerMode => {
  // if pointer is not pressed, always return to idle
  if (!pointerIsPressed) return 'idle';

  // if already in a mode and pointer is still pressed, maintain that mode
  // This prevents mode switching mid-drag
  if (currentMode !== 'idle') return currentMode;

  // Determine initial mode when pointer first presses
  if (resizeZone === 'left') return 'resizing-left';
  if (resizeZone === 'right') return 'resizing-right';
  return 'moving';
};

const getCursorForMode = (mode: PointerMode): string => {
  switch (mode) {
    case 'resizing-left':
    case 'resizing-right':
      return 'ew-resize';
    case 'moving':
    case 'idle':
    default:
      return 'default';
  }
};

interface CollisionParams {
  proposedLeft: number;
  proposedTop: number;
  selectedBlock: BlockType;
  allBlocks: Track['blocks'];
}

const checkCollision = ({
  proposedLeft,
  proposedTop,
  selectedBlock,
  allBlocks,
}: CollisionParams): { left: number; top: number } => {
  const proposedRight = proposedLeft + selectedBlock.dims.width;
  const neighbors = Object.values(allBlocks).filter(
    (block) => block.blockId !== selectedBlock.blockId,
  );

  const horizontalRangeOverlap = (neighbor: BlockType) => {
    const neighborRight = neighbor.dims.left + neighbor.dims.width;
    return proposedRight > neighbor.dims.left && proposedLeft < neighborRight;
  };

  const hasHorizontalCollision = neighbors
    .filter((n) => n.frequency === selectedBlock.frequency)
    .some((n) => horizontalRangeOverlap(n));

  const hasVerticalCollision = neighbors
    .filter((n) => n.dims.top === proposedTop)
    .some((n) => horizontalRangeOverlap(n));

  return {
    left: hasHorizontalCollision ? selectedBlock.dims.left : proposedLeft,
    top: hasVerticalCollision ? selectedBlock.dims.top : proposedTop,
  };
};

// TODO: don't hard-code this??
export const BLOCK_HEIGHT = 24;
const RESIZE_PX_THRESHOLD = 4;
// TODO: Is this value rasonable? Should threshold and width be adjusted based on scale?
const MIN_BLOCK_WIDTH = 20; // in px

export const Block = (props: BlockProps) => {
  const dispatch = useAppDispatch();
  const project = useAppSelector((state) => state.project);
  const trackInfo = useAppSelector((state) => state.tracks[props.trackId]);
  const blockInfo = useAppSelector(
    (state) => state.tracks[props.trackId].blocks[props.blockId],
  );

  const [pointerIsPressed, setPointerIsPressed] = useState(false);
  const [pointerMode, setPointerMode] = useState<PointerMode>('idle');
  const mouseTracking = useMouseTracking();
  const blockRef = useRef<HTMLDivElement>(null);

  const noteRange = useMemo(
    () => generateNoteRange(trackInfo.minNote, trackInfo.maxNote).reverse(),
    [trackInfo.minNote, trackInfo.maxNote],
  );

  const clickOffsetRef = useRef(0); // Store offset from click to block's left edge

  const quantizeValue = useCallback(
    (value: number) => {
      const snapPointGap =
        project.pxPerMeasureScale /
        project.beatsPerMeasure /
        trackInfo.quantizationResolution;

      return Math.round(value / snapPointGap) * snapPointGap;
    },
    [
      project.pxPerMeasureScale,
      project.beatsPerMeasure,
      trackInfo.quantizationResolution,
    ],
  );

  const handleBlockMove = (
    mouseX: number,
    mouseY: number,
    blockWidth: number,
  ) => {
    let proposedLeft = trackInfo.isQuantized ? quantizeValue(mouseX) : mouseX;
    const maxLeft =
      project.totalDuration * project.pxPerSecondScale - blockWidth;

    const constrainedNewLeft = Math.max(Math.min(proposedLeft, maxLeft), 0);

    const maxTop = props.railDimensions.height - BLOCK_HEIGHT;
    const proposedTop = mouseY;
    const discretizedProposedTop =
      Math.floor(proposedTop / BLOCK_HEIGHT) * BLOCK_HEIGHT;
    const constrainedProposedTop = Math.max(
      Math.min(discretizedProposedTop, maxTop),
      0,
    );

    const { left: finalNewLeft, top: finalNewTop } = checkCollision({
      proposedLeft: constrainedNewLeft,
      proposedTop: constrainedProposedTop,
      selectedBlock: blockInfo,
      allBlocks: trackInfo.blocks,
    });

    // Get the new note based on y position
    // (use constrainedNewTop to stay within bounds of noteRange)
    const noteIndex = finalNewTop / BLOCK_HEIGHT;
    const newNoteFreq = getNoteFreqByName(noteRange[noteIndex]);

    // Calculate new start time basedd on x position
    const newStartTime =
      (finalNewLeft / props.railDimensions.width) * project.totalDuration;

    dispatch(
      trackSlice.actions.editBlock({
        trackId: props.trackId,
        blockId: props.blockId,
        startTime: newStartTime,
        frequency: newNoteFreq,
        dims: {
          top: finalNewTop,
          left: finalNewLeft,
          width: blockWidth,
          height: BLOCK_HEIGHT,
        },
      }),
    );
  };

  const handleBlockResize = (
    mouseX: number,
    resizeZone: ResizeZone,
    dragDirection: DragDirection,
  ) => {
    if (!pointerIsPressed) return;
    // TODO: what happens if two adjacent blocks get resized and you drag into each other?
    if (resizeZone === 'left') {
      let newLeft = trackInfo.isQuantized ? quantizeValue(mouseX) : mouseX;

      const newWidth = blockInfo.dims.width + blockInfo.dims.left - newLeft;

      // Check boundaries based on drag direction
      if (dragDirection === 'left' && newLeft < 0) return;
      if (dragDirection === 'right' && newWidth < MIN_BLOCK_WIDTH) return;

      dispatch(
        trackSlice.actions.editBlock({
          trackId: props.trackId,
          blockId: props.blockId,
          startTime:
            (newLeft / props.railDimensions.width) * project.totalDuration,
          duration: newWidth / project.pxPerSecondScale,
          dims: { ...blockInfo.dims, left: newLeft, width: newWidth },
        }),
      );
    } else if (resizeZone === 'right') {
      let newWidth = mouseX - blockInfo.dims.left + clickOffsetRef.current;
      newWidth = trackInfo.isQuantized ? quantizeValue(newWidth) : newWidth;

      const maxRight = project.totalDuration * project.pxPerSecondScale;
      if (
        dragDirection === 'right' &&
        blockInfo.dims.left + newWidth > maxRight
      )
        return;
      if (dragDirection === 'left' && newWidth < MIN_BLOCK_WIDTH) return;

      dispatch(
        trackSlice.actions.editBlock({
          trackId: props.trackId,
          blockId: props.blockId,
          duration: newWidth / project.pxPerSecondScale,
          dims: { ...blockInfo.dims, width: newWidth },
        }),
      );
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
      className={cn(
        'absolute bg-primary rounded text-black',
        blockInfo.isSelected ? 'border-4 border-foreground' : 'border-0',
      )}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        if (blockRef.current == null) return;

        dispatch(
          trackSlice.actions.selectBlock({
            trackId: trackInfo.trackId,
            blockId: blockInfo.blockId,
          }),
        );

        console.log(blockInfo);

        const mouseXInBlock = calculateMouseXInBlock(e, blockRef);
        // TODO: Can this be calculated in getrseizezone? or just have one place to calculate it in case the way we calc changes!
        const blockWidth = blockInfo.duration * project.pxPerSecondScale;
        const resizeZone = getResizeZone(mouseXInBlock, blockWidth);

        clickOffsetRef.current = mouseXInBlock;
        // NOTE: NEEDED TO KEEP SLIDING AFTER CURSOR LEAVES BOUNDARIES
        blockRef.current.setPointerCapture(e.pointerId);
        setPointerIsPressed(true);
        setPointerMode(determinePointerMode('idle', true, resizeZone));
      }}
      onPointerUp={() => {
        setPointerIsPressed(false);
        setPointerMode('idle');
        // Reset previous mouse position for future resizes
        mouseTracking.reset();
      }}
      onPointerMove={(e) => {
        if (blockRef.current == null) return;

        const mouseX = calculateMouseX(
          e,
          props.railDimensions.left,
          clickOffsetRef.current,
          project.timelineScrollLeft,
        );
        const mouseXInBlock = calculateMouseXInBlock(e, blockRef);
        const mouseY = calculateMouseY(e, props.railDimensions.top);

        const blockWidth = blockInfo.duration * project.pxPerSecondScale;

        const resizeZone = getResizeZone(mouseXInBlock, blockWidth);
        const dragDirection = mouseTracking.getDragDirection(mouseX);

        // When moving block, 'disable'/'block' resizing? Then on pointerUp, we re-enable resizing?
        if (pointerIsPressed) {
          blockRef.current.style.cursor = getCursorForMode(pointerMode);
        } else {
          blockRef.current.style.cursor = resizeZone ? 'ew-resize' : 'default';
        }

        if (pointerMode === 'resizing-left' && dragDirection) {
          handleBlockResize(mouseX, 'left', dragDirection);
        } else if (pointerMode === 'resizing-right' && dragDirection) {
          handleBlockResize(mouseX, 'right', dragDirection);
        } else if (pointerMode === 'moving') {
          handleBlockMove(mouseX, mouseY, blockWidth);
        }

        // Update mousexref for resizes
        mouseTracking.updatePosition(mouseX);
      }}
    >
      {blockInfo.dims.left}
    </div>
  );
};
