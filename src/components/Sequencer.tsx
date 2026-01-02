import { useEffect, useRef, useState, type RefObject } from 'react';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { trackSlice } from '../app/trackSlice';

interface SequencerProps {
  audioContext: AudioContext;
}

interface BlockProps {
  blockId: string;
  startTime: number;
  duration: number;
  frequency: number;
  gain: number;
  trackDimensions: { width: number; height: number };
  trackLength: number; // in seconds
}

const Block = (props: BlockProps) => {
  const dispatch = useAppDispatch();
  const blockInfo = useAppSelector(
    (state) => state.tracks.blocks[props.blockId]
  );

  const [pointerIsPressed, setPointerIsPressed] = useState(false);

  // NOTE: Default 'left' is overwritten after first render, maybe something to do with the
  // resize observer? This also updates block positions when screen or track is resized.
  useEffect(() => {
    const newLeft =
      (props.startTime / props.trackLength) * props.trackDimensions.width;
    const blockWidth =
      (props.duration / props.trackLength) * props.trackDimensions.width;
    dispatch(
      trackSlice.actions.editBlock({
        blockId: props.blockId,
        dims: {
          left: newLeft,
          width: blockWidth,
          maxLeft: props.trackDimensions.width - blockWidth,
        },
      })
    );
  }, [props.trackDimensions, props.trackLength]);

  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      style={{
        width: `${blockInfo.dims.width}px`,
        height: '100%',
        left: `${blockInfo.dims.left}px`,
        position: 'absolute',
        backgroundColor: pointerIsPressed ? 'red' : 'green',
      }}
      onPointerDown={(e) => {
        if (ref.current != null) {
          // NOTE: NEEDED TO KEEP SLIDING AFTER CURSOR LEAVES BOUNDARIES
          ref.current.setPointerCapture(e.pointerId);
          setPointerIsPressed(true);
        }
      }}
      onPointerUp={() => {
        setPointerIsPressed(false);
        const newStartTime =
          (blockInfo.dims.left / props.trackDimensions.width) *
          props.trackLength;
        dispatch(
          trackSlice.actions.editBlock({
            blockId: props.blockId,
            startTime: newStartTime,
          })
        );
      }}
      onPointerMove={(e) => {
        if (ref.current == null) return;
        if (pointerIsPressed) {
          // NOTE: Constrains block dragging to start and end of the track
          const newLeft = Math.max(
            Math.min(e.clientX - blockInfo.dims.width, blockInfo.dims.maxLeft),
            0
          );
          const blockWidth =
            (props.duration / props.trackLength) * props.trackDimensions.width;
          dispatch(
            trackSlice.actions.editBlock({
              blockId: props.blockId,
              dims: {
                left: newLeft,
                width: blockWidth,
                maxLeft: props.trackDimensions.width - blockWidth,
              },
            })
          );
        }
      }}
    >
      <p>{props.blockId.slice(0, 4)}</p>
    </div>
  );
};

export const Sequencer = (props: SequencerProps) => {
  const [trackLength, setTrackLength] = useState(5); // secs
  const { ref: trackRef, dimensions: trackDimensions } = useResizeObserver();
  const dispatch = useAppDispatch();
  const blocks = useAppSelector((state) => state.tracks.blocks);

  const playTrack = () => {
    Object.values(blocks).forEach((note) => {
      const startTime = props.audioContext.currentTime + note.startTime;
      const duration = note.duration;

      const oscillatorNode = props.audioContext.createOscillator();
      oscillatorNode.type = 'sine';
      oscillatorNode.frequency.setValueAtTime(
        note.frequency,
        props.audioContext.currentTime
      );

      const gainNode = props.audioContext.createGain();

      gainNode.gain.setValueAtTime(note.gain, startTime);
      gainNode.gain.linearRampToValueAtTime(0.01, startTime + duration);

      oscillatorNode.connect(gainNode);
      gainNode.connect(props.audioContext.destination);

      oscillatorNode.start(startTime);
      oscillatorNode.stop(startTime + duration);
    });
  };

  return (
    <div>
      <div>
        Track: {trackDimensions.width}px x {trackDimensions.height}px
      </div>
      <button onClick={playTrack}>play</button>
      <button
        onClick={() =>
          dispatch(
            trackSlice.actions.addBlock({
              startTime: 0,
              duration: 1,
              frequency: 440,
              gain: 1,
              dims: {
                left: (0 / trackLength) * trackDimensions.width,
                width: (1 / trackLength) * trackDimensions.width,
                maxLeft:
                  trackDimensions.width -
                  (1 / trackLength) * trackDimensions.width,
              },
            })
          )
        }
      >
        add block
      </button>
      <input
        type='number'
        step={0.01}
        value={trackLength}
        onChange={(e) => {
          setTrackLength(Number(e.target.value));
        }}
      />
      <div
        ref={trackRef}
        style={{
          height: '250px',
          width: '80%',
          margin: '0 auto',
          border: '1px solid black',
          position: 'relative',
        }}
      >
        {Object.entries(blocks).map(([blockId, block]) => (
          <Block
            key={blockId}
            {...block}
            trackDimensions={trackDimensions}
            trackLength={trackLength}
          />
        ))}
      </div>
    </div>
  );
};
