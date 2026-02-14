import { PauseIcon, PlayIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useState } from 'react';
import { Input } from './ui/input';
import { projectSlice } from '@/app/projectSlice';
import { trackSlice } from '@/app/trackSlice';

interface ControlBarProps {
  playbackTime: number;
  startPlaybackAndUIUpdates: () => Promise<void>;
  pause: () => Promise<void>;
}

export function ControlBar(props: ControlBarProps) {
  const dispatch = useAppDispatch();
  const project = useAppSelector((state) => state.project);
  const tracks = useAppSelector((state) => state.tracks);
  const currentMeasure =
    Math.floor(props.playbackTime / project.secondsPerMeasure) + 1;

  const playbackTimeWithinMeasure =
    props.playbackTime - (currentMeasure - 1) * project.secondsPerMeasure;
  const secondsPerBeat = project.secondsPerMeasure / project.beatsPerMeasure;
  const currentBeatInMeasure =
    Math.floor(playbackTimeWithinMeasure / secondsPerBeat) + 1;

  const [isEditingBpm, setIsEditingBpm] = useState(false);

  return (
    <div className='flex h-16 justify-center items-center m-2 gap-8'>
      <ToggleGroup
        type='single'
        className='border'
        onValueChange={async (value) => {
          if (value === 'play') {
            await props.startPlaybackAndUIUpdates();
          } else if (value === 'pause') {
            await props.pause();
          }
        }}
      >
        <ToggleGroupItem value='play'>
          <PlayIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value='pause'>
          <PauseIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <div className='border rounded h-full flex gap-4 px-4'>
        <div className='flex flex-col'>
          {isEditingBpm ? (
            <Input
              type='number'
              className='text-4xl! w-24 p-0 border-0 h-full'
              defaultValue={project.beatsPerMinute}
              autoFocus
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              onBlur={(e) => {
                const oldBeatsPerMinute = project.beatsPerMinute;
                const newBeatsPerMinute = parseInt(e.currentTarget.value, 10);
                if (isNaN(newBeatsPerMinute) || newBeatsPerMinute <= 0) return;

                dispatch(
                  projectSlice.actions.setBeatsPerMinute(newBeatsPerMinute),
                );
                Object.values(tracks).forEach((track) => {
                  dispatch(
                    trackSlice.actions.rescaleBlocks({
                      trackId: track.trackId,
                      oldBeatsPerMinute,
                      newBeatsPerMinute,
                    }),
                  );
                });

                setIsEditingBpm(false);
              }}
            />
          ) : (
            <>
              <p className='text-4xl' onClick={() => setIsEditingBpm(true)}>
                {project.beatsPerMinute}
              </p>
              <p className='text-xs'>BPM</p>
            </>
          )}
        </div>
        <div>
          <p className='text-4xl'>
            {project.beatsPerMeasure}/{1 / project.beatValue}
          </p>
          <p className='text-xs'>Time Sig.</p>
        </div>
        <div>
          <p className='text-4xl'>{props.playbackTime.toFixed(2)}s</p>
          <p className='text-xs'>Playback Time</p>
        </div>
        <div>
          <p className='text-4xl'>
            {currentMeasure}.{currentBeatInMeasure}
          </p>
          <p className='text-xs'>Measure</p>
        </div>
      </div>
    </div>
  );
}
