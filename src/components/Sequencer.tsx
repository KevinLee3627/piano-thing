import { useEffect, useRef, useState } from 'react';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { getRandomInt } from '../util/getRandomInt';

interface SequencerProps {
  audioContext: AudioContext;
}

interface Note {
  startTime: number;
  duration: number;
  frequency: number;
  gain: number;
}

interface BlockProps {
  blockId: string;
  startTime: number;
  duration: number;
  frequency: number;
  gain: number;
  trackDimensions: { width: number; height: number };
  trackLength: number; // in seconds
  setBlocks: React.Dispatch<React.SetStateAction<Record<string, Note>>>;
}

const Block = (props: BlockProps) => {
  const noteWidth =
    (props.duration / props.trackLength) * props.trackDimensions.width;

  const [touched, setTouched] = useState(false);
  const [pointerIsPressed, setPointerIsPressed] = useState(false);

  const [left, setLeft] = useState(
    (props.startTime / props.trackLength) * props.trackDimensions.width
  );

  // NOTE: Default 'left' is overwritten after first render, maybe something to do with the
  // resize observer?
  useEffect(() => {
    if (!touched) {
      setLeft(
        (props.startTime / props.trackLength) * props.trackDimensions.width
      );
    }
  }, [touched, props.trackDimensions, props.trackLength]);

  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      style={{
        width: `${noteWidth}px`,
        height: '100%',
        left: `${left}px`,
        position: 'absolute',
        backgroundColor: pointerIsPressed ? 'red' : 'green',
      }}
      onPointerDown={(e) => {
        if (ref.current != null) {
          setTouched(true);
          // NOTE: NEEDED TO KEEP SLIDING AFTER CURSOR LEAVES BOUNDARIES
          ref.current.setPointerCapture(e.pointerId);
          setPointerIsPressed(true);
        }
      }}
      onPointerUp={() => {
        setPointerIsPressed(false);
        props.setBlocks((blocks) => {
          const selectedBlock = blocks[props.blockId];
          const newStartTime =
            (left / props.trackDimensions.width) * props.trackLength;
          return {
            ...blocks,
            [props.blockId]: { ...selectedBlock, startTime: newStartTime },
          };
        });
      }}
      onPointerMove={(e) => {
        // TODO: Handle bounds of tracks

        if (pointerIsPressed) {
          setLeft(e.clientX);
        }
      }}
    >
      {props.frequency}
    </div>
  );
};

export const Sequencer = (props: SequencerProps) => {
  const [blocks, setBlocks] = useState<Record<string, Note>>({
    [crypto.randomUUID()]: {
      startTime: 0,
      duration: 1,
      frequency: 440,
      gain: 1,
    },
    [crypto.randomUUID()]: {
      startTime: 1,
      duration: 1,
      frequency: 540,
      gain: 1,
    },
  });
  const [trackLength, setTrackLength] = useState(5); // secs
  const { ref: trackRef, dimensions: trackDimensions } = useResizeObserver();

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
          height: '50px',
          width: '100%',
          border: '1px solid black',
          position: 'relative',
        }}
      >
        {Object.entries(blocks).map(([blockId, note]) => (
          <Block
            key={blockId}
            blockId={blockId}
            {...note}
            trackDimensions={trackDimensions}
            trackLength={trackLength}
            setBlocks={setBlocks}
          />
        ))}
      </div>
    </div>
  );
};
