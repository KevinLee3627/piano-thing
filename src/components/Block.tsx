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
type OverlapSide = 'left' | 'right' | 'full';

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

const getOverlapSide = (
  proposedLeft: number,
  selectedBlock: BlockType,
  neighbor: BlockType,
): OverlapSide | null => {
  const neighborLeft = neighbor.dims.left;
  const neighborRight = neighborLeft + neighbor.dims.width;

  const proposedRight = proposedLeft + selectedBlock.dims.width;
  // You can be 'overlapped' in three scenarios:
  // block right edge > neighbor left edge AND block left edge < neighbor left edge
  // block left edge < neighbor right edge AND block right edge > neighbor right edge
  // all edges are equal (complete overlap)
  const blockOverlapsNeighborLeftEdge =
    proposedRight > neighborLeft && proposedLeft < neighborLeft;
  if (blockOverlapsNeighborLeftEdge) return 'left';

  const blockOverlapsNeighborRightEdge =
    proposedLeft < neighborRight && proposedRight > neighborRight;
  if (blockOverlapsNeighborRightEdge) return 'right';

  const blockOverlapsCompletely =
    proposedLeft === neighborLeft && proposedRight === neighborRight;
  if (blockOverlapsCompletely) return 'full';

  return null;
};

interface HorizontalCollisionParams {
  proposedLeft: number;
  selectedBlock: BlockType;
  allBlocks: Track['blocks'];
}

const checkHorizontalCollision = ({
  proposedLeft,
  selectedBlock,
  allBlocks,
  // dragDirection,
}: HorizontalCollisionParams) => {
  // Take the proposed x position (left), get all neighboring blocks.
  // What is a neighbor? Neighbor = same frequency/note, not selectedBlock
  const neighbors = Object.values(allBlocks).filter(
    (block) =>
      block.blockId !== selectedBlock.blockId &&
      block.frequency === selectedBlock.frequency,
  );

  // NOTE: How this works - we check if the proposed x position overlaps ANY neighbor.
  // If it does, just return the original x position. If it doesn't, move the block to the proposed xposition
  const overlappedNeighbor = neighbors.some((neighbor) =>
    getOverlapSide(proposedLeft, selectedBlock, neighbor),
  );

  return overlappedNeighbor ? selectedBlock.dims.left : proposedLeft;
};

interface VerticalCollisionParams {
  proposedLeft: number;
  proposedTop: number;
  selectedBlock: BlockType;
  allBlocks: Track['blocks'];
}

const checkVerticalCollision = ({
  proposedLeft,
  proposedTop,
  selectedBlock,
  allBlocks,
}: VerticalCollisionParams): number => {
  const proposedRight = proposedLeft + selectedBlock.dims.width;

  const neighbors = Object.values(allBlocks).filter(
    (block) =>
      block.blockId !== selectedBlock.blockId && block.dims.top === proposedTop, // same row
  );

  // Check if any neighbor at the proposed row overlaps horizontally
  const hasCollision = neighbors.some((neighbor) => {
    const neighborLeft = neighbor.dims.left;
    const neighborRight = neighborLeft + neighbor.dims.width;
    return proposedRight > neighborLeft && proposedLeft < neighborRight;
  });

  return hasCollision ? selectedBlock.dims.top : proposedTop;
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

  const diffRef = useRef(0); // Store offset from click to block's left edge

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
    let newLeft = trackInfo.isQuantized ? quantizeValue(mouseX) : mouseX;
    const maxLeft =
      project.totalDuration * project.pxPerSecondScale - blockWidth;
    const horizontalCollisionClamp = checkHorizontalCollision({
      proposedLeft: newLeft,
      selectedBlock: blockInfo,
      allBlocks: trackInfo.blocks,
    });

    const constrainedNewLeft = Math.max(
      Math.min(horizontalCollisionClamp, maxLeft),
      0,
    );

    const maxTop = props.railDimensions.height - BLOCK_HEIGHT;
    const newTop = mouseY;
    const discretizedNewTop = Math.floor(newTop / BLOCK_HEIGHT) * BLOCK_HEIGHT;
    const constrainedNewTop = Math.max(Math.min(discretizedNewTop, maxTop), 0);
    const finalNewTop = checkVerticalCollision({
      proposedLeft: constrainedNewLeft,
      proposedTop: constrainedNewTop,
      selectedBlock: blockInfo,
      allBlocks: trackInfo.blocks,
    });

    // Get the new note based on y position
    // (use constrainedNewTop to stay within bounds of noteRange)
    const noteIndex = finalNewTop / BLOCK_HEIGHT;
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
          top: finalNewTop,
          left: constrainedNewLeft,
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
      let newWidth = mouseX - blockInfo.dims.left + diffRef.current;
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
        pointerIsPressed ? 'border-4 border-foreground' : 'border-0',
      )}
      onPointerDown={(e) => {
        if (blockRef.current == null) return;

        const mouseXInBlock = calculateMouseXInBlock(e, blockRef);
        // TODO: Can this be calculated in getrseizezone? or just have one place to calculate it in case the way we calc changes!

        const blockWidth = blockInfo.duration * project.pxPerSecondScale;
        const resizeZone = getResizeZone(mouseXInBlock, blockWidth);

        diffRef.current = mouseXInBlock;
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
          diffRef.current,
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

        // if (dragDirection == null) return;

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
