import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { cn } from '@/lib/utils';
import { Block, BLOCK_HEIGHT } from './Block';
import { generateNoteRange, getNoteFreqByName } from '@/util/noteUtils';
import { useMemo, useRef } from 'react';
import { trackSlice } from '@/app/trackSlice';

interface PolyphonicTrackProps {
  trackId: string;
}

export const PolyphonicTrack = (props: PolyphonicTrackProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const track = useAppSelector((state) => state.tracks[props.trackId]);
  const project = useAppSelector((state) => state.project);
  const dispatch = useAppDispatch();

  // NOTE: Reverse b/c we want lower notes on the bottom
  const notes = useMemo(
    () => generateNoteRange(track.minNote, track.maxNote).reverse(),
    [],
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
  }, []);

  return (
    <div className='flex'>
      <div className='sticky left-0 w-12 z-10'>{noteElems}</div>
      <div
        ref={trackRef}
        className='relative grow'
        onMouseDown={(e) => {
          // 0 = left click
          if (e.button !== 0) return;
          // To create note on click...count # of notes - calculate height of one note, divide height of container, find
          // clientY of mouse click - given the mouse position, calculate which note it would fall in
          if (trackRef.current == null) return;
          const trackTop = trackRef.current.offsetTop;
          const trackLeft = trackRef.current.offsetLeft;

          const mouseY = e.clientY - trackTop;
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

          const duration = project.secondsPerMeasure / project.beatsPerMeasure;
          let startTime = mouseX / project.pxPerSecondScale;
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
          }

          dispatch(
            trackSlice.actions.addBlock({
              trackId: track.trackId,
              startTime,
              duration,
              frequency: getNoteFreqByName(`${noteName}`),
              gain: 1,
              dims: {
                top: clickedIndex * BLOCK_HEIGHT,
                left: startTime * project.pxPerSecondScale,
                width: duration * project.pxPerSecondScale,
                height: BLOCK_HEIGHT,
              },
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
        >
          {Object.entries(track.blocks).map(([blockId, block]) => {
            if (trackRef.current == null) return null;

            return (
              <Block
                key={blockId}
                trackId={props.trackId}
                {...block}
                railDimensions={{
                  width: trackRef.current.offsetWidth,
                  left: trackRef.current.offsetLeft,
                  top: trackRef.current.offsetTop,
                  height: trackRef.current.offsetHeight,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
