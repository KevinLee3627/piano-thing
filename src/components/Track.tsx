import { useEffect } from 'react';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { useAppSelector } from '../app/hooks';
import { useGlobalAudioContext } from '../context/audioContext';
import { MonophonicTrack } from './MonophonicTrack';
import { PolyphonicTrack } from './PolyphonicTrack';

interface TrackProps {
  trackId: string;
  trackDimensions: ReturnType<typeof useResizeObserver>['dimensions'];
}

export const Track = (props: TrackProps) => {
  const audioContext = useGlobalAudioContext();

  const track = useAppSelector((state) => state.tracks[props.trackId]);

  const playTrack = () => {
    // TODO: Possibly extract out into hook so both Monophonic and Polyphonic track can play?
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
  if (track.polyphony === 'monophonic') {
    return (
      <MonophonicTrack
        trackId={track.trackId}
        trackDimensions={props.trackDimensions}
      />
    );
  } else
    return (
      <PolyphonicTrack
        trackId={track.trackId}
        trackDimensions={props.trackDimensions}
      />
    );
};
