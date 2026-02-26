import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { cn } from '@/lib/utils';
import { Block, BLOCK_HEIGHT } from './Block';
import { generateNoteRange, getNoteFreqByName } from '@/util/noteUtils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { trackSlice } from '@/app/trackSlice';

interface PolyphonicTrackProps {
  trackId: string;
}

interface RailDimensions {
  width: number;
  left: number;
  top: number;
  height: number;
}

export const PolyphonicTrack = (props: PolyphonicTrackProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [railDimensions, setRailDimensions] = useState<RailDimensions | null>(
    null,
  );

  const track = useAppSelector((state) => state.tracks[props.trackId]);
  const project = useAppSelector((state) => state.project);
  const dispatch = useAppDispatch();

  // NOTE: Reverse b/c we want lower notes on the bottom
  const notes = useMemo(
    () => generateNoteRange(track.minNote, track.maxNote).reverse(),
    [track.minNote, track.maxNote],
  );
  const noteElems = useMemo(() => {
    return notes.map((noteName) => (
      <div
        key={`note-${noteName}`}
        className={cn(
          'h-6',
          noteName.includes('#') ? 'bg-black' : 'bg-white',
          noteName.includes('#') ? 'text-white' : 'text-black',
        )}
      >
        {noteName}
      </div>
    ));
  }, [track.minNote, track.maxNote]);

  useEffect(() => {
    if (trackRef.current == null) return;

    const updateDimensions = () => {
      if (trackRef.current == null) return;
      setRailDimensions({
        width: trackRef.current.offsetWidth,
        left: trackRef.current.offsetLeft,
        top: trackRef.current.offsetTop,
        height: trackRef.current.offsetHeight,
      });
    };

    // measure immediately on mount - fixes bug where blocks don't show when loading from persistence
    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(trackRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className='flex'>
      <div className='sticky left-0 w-12 z-10'>{noteElems}</div>
      <div
        ref={trackRef}
        className='relative grow'
        onPointerDown={(e) => {
          // 0 = left click
          if (e.button !== 0) return;
          // To create note on click...count # of notes - calculate height of one note, divide height of container, find
          // clientY of mouse click - given the mouse position, calculate which note it would fall in
          if (trackRef.current == null) return;
          const trackTop = trackRef.current.offsetTop;
          const trackLeft = trackRef.current.offsetLeft;

          const mouseY = e.clientY - trackTop + project.timelineScrollTop;
          const mouseX = e.clientX - trackLeft + project.timelineScrollLeft;

          const clickedBlock = Object.values(track.blocks).find((block) => {
            const withinX =
              mouseX >= block.dims.left &&
              mouseX <= block.dims.left + block.dims.width;
            const withinY =
              mouseY >= block.dims.top &&
              mouseY <= block.dims.top + block.dims.height;
            return withinX && withinY;
          });
          if (clickedBlock) return;

          const clickedIndex = Math.floor(mouseY / BLOCK_HEIGHT);
          const noteName = notes[clickedIndex];
          const frequency = getNoteFreqByName(`${noteName}`);

          const duration = project.secondsPerMeasure / project.beatsPerMeasure;
          let blockWidth = duration * project.pxPerSecondScale;

          let startTime = mouseX / project.pxPerSecondScale;
          // Check if creating a block at the clicked position would overlap an adjacent block
          // if the track is quantized, we don't care b/c overlaps don't happen
          if (track.isQuantized) {
            const snapPointGap =
              project.secondsPerMeasure /
              project.beatsPerMeasure /
              track.quantizationResolution;
            // NOTE: We don't round like we do when quantizing while dragging
            // Rounding causes us to create the block ahead of where we want it
            // I think it's due to the fact that dragging is centered on the position
            // of the cursor within the block, while creation of blocks is centered
            // around the left edge of the new block.
            startTime = Math.floor(startTime / snapPointGap) * snapPointGap;
          } else {
            // Limits the width of a block if too close to an adjacennt block
            const closestNeighbor = Object.values(track.blocks)
              .filter(
                (block) =>
                  block.frequency === frequency && block.dims.left > mouseX,
              )
              .sort((a, b) => a.dims.left - b.dims.left)
              .at(0);
            if (
              closestNeighbor != null &&
              mouseX + blockWidth > closestNeighbor.dims.left
            )
              blockWidth = closestNeighbor.dims.left - mouseX;
          }

          dispatch(
            trackSlice.actions.addBlock({
              trackId: track.trackId,
              startTime,
              duration,
              frequency,
              gain: 1,
              dims: {
                top: clickedIndex * BLOCK_HEIGHT,
                left: startTime * project.pxPerSecondScale,
                width: blockWidth,
                height: BLOCK_HEIGHT,
              },
              isSelected: true,
            }),
          );
        }}
      >
        <div
          className='absolute inset-0'
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              hsl(117.1429 23.5955% 17.451%) 0px,
              hsl(117.1429 23.5955% 17.451%) 1px,
              transparent 1px,
              transparent ${project.pxPerMeasureScale / project.beatsPerMeasure}px
            ),
            repeating-linear-gradient(
              0deg,
              hsl(117.1429 23.5955% 17.451%) 0px,
              hsl(117.1429 23.5955% 17.451%) 1px,
              transparent 1px,
              transparent ${BLOCK_HEIGHT}px
            )
            `,
          }}
          // tabIndex is required for onKeyDown
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
              dispatch(
                trackSlice.actions.deleteSelectedBlocks({
                  trackId: track.trackId,
                }),
              );
            }
          }}
          onPointerDown={() => {
            dispatch(
              trackSlice.actions.deselectAllBlocks({ trackId: track.trackId }),
            );
          }}
        >
          {railDimensions &&
            Object.entries(track.blocks).map(([blockId, block]) => {
              if (trackRef.current == null) return null;

              return (
                <Block
                  key={blockId}
                  trackId={props.trackId}
                  {...block}
                  railDimensions={railDimensions}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
};
