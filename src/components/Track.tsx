import { useEffect } from 'react';
import { useAppSelector } from '../app/hooks';
import { useGlobalAudioContext } from '../context/audioContext';
import { PolyphonicTrack } from './PolyphonicTrack';

interface TrackProps {
  trackId: string;
  playbackTime: number;
}

export const Track = (props: TrackProps) => {
  const audioContext = useGlobalAudioContext();

  const track = useAppSelector((state) => state.tracks[props.trackId]);

  const playTrack = () => {
    // TODO: https://old.reddit.com/r/javascript/comments/6juyjk/optimizing_the_sound_quality_of_web_audio_api/
    // Playing chords - fix gain value?
    Object.values(track.blocks).forEach((block) => {
      if (block.startTime < props.playbackTime) return;

      const startTime =
        audioContext.currentTime + block.startTime - props.playbackTime;
      const duration = block.duration;

      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.type = 'sine';
      oscillatorNode.frequency.setValueAtTime(
        block.frequency,
        audioContext.currentTime,
      );

      const gainNode = audioContext.createGain();

      // adding attack and release so the notes don't "clip" when right next to each other
      // TODO: hard-coded - bad? good? idk
      const ATTACK_TIME = 0.05; // 10ms
      const RELEASE_TIME = 0.05; // 20ms

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(
        block.gain,
        startTime + ATTACK_TIME,
      );
      gainNode.gain.setValueAtTime(
        block.gain,
        startTime + duration - RELEASE_TIME,
      );
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

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
  return <PolyphonicTrack trackId={track.trackId} />;
};
