import { useEffect } from 'react';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { useAppSelector } from '../app/hooks';
import { Block } from './Block';
import { useGlobalAudioContext } from '../context/audioContext';
import { Keyboard } from './Keyboard';
import { cn } from '@/lib/utils';

interface TrackProps {
  trackId: string;
  trackDimensions: ReturnType<typeof useResizeObserver>['dimensions'];
}

export const Track = (props: TrackProps) => {
  const audioContext = useGlobalAudioContext();

  const track = useAppSelector((state) => state.tracks[props.trackId]);

  const playTrack = () => {
    // TODO: https://old.reddit.com/r/javascript/comments/6juyjk/optimizing_the_sound_quality_of_web_audio_api/
    // Playing chords - fix gain value?
    Object.values(track.blocks).forEach((block) => {
      const startTime = audioContext.currentTime + block.startTime;
      const duration = block.duration;

      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.type = 'sine';
      oscillatorNode.frequency.setValueAtTime(
        block.frequency,
        audioContext.currentTime,
      );

      const gainNode = audioContext.createGain();

      gainNode.gain.setValueAtTime(block.gain, startTime);
      gainNode.gain.linearRampToValueAtTime(0.01, startTime + duration);

      oscillatorNode.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillatorNode.start(startTime);
      oscillatorNode.stop(startTime + duration);
    });
  };
  // Triggered by button to play all tracksa t once
  useEffect(() => {
    if (track.isPlaying) {
      playTrack();
    }
  }, [track.isPlaying]);
  return (
    <div className={cn(track.isExpanded ? 'h-96' : 'h-16', 'border-b')}>
      {!track.isExpanded && (
        <div className='h-4 relative'>
          {Object.entries(track.blocks).map(([blockId, block]) => (
            <Block
              key={blockId}
              trackId={props.trackId}
              {...block}
              trackDimensions={props.trackDimensions}
            />
          ))}
        </div>
      )}
      {track.isExpanded && <div></div>}
      {track.isExpanded && <Keyboard trackId={props.trackId} />}
    </div>
  );
};
