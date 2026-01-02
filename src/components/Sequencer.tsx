import { useState } from 'react';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { trackSlice } from '../app/trackSlice';
import { Block } from './Block';
import { Keyboard } from './Keyboard';

interface SequencerProps {
  audioContext: AudioContext;
}

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
    <div style={{ height: '100%' }}>
      <div>
        <p>
          Track: {trackDimensions.width}px x {trackDimensions.height}px
        </p>
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
      </div>
      <div
        ref={trackRef}
        style={{
          height: '60%',
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
      <Keyboard />
    </div>
  );
};
