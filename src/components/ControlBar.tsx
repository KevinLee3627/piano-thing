import { PauseIcon, PlayIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from './ui/card';
import { useAppSelector } from '@/app/hooks';

interface ControlBarProps {
  playbackTime: number;
  startPlaybackAndUIUpdates: () => Promise<void>;
  pause: () => Promise<void>;
}

export function ControlBar(props: ControlBarProps) {
  const project = useAppSelector((state) => state.project);
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
          <p className='text-4xl'>{project.beatsPerMinute}</p>
          <p className='text-xs'>BPM</p>
        </div>
        <div>
          <p className='text-4xl'>
            {project.beatsPerMeasure}/{1 / project.beatValue}
          </p>
          <p className='text-xs'>Time</p>
        </div>
        <div>
          <p className='text-4xl'>{props.playbackTime.toFixed(2)}s</p>
        </div>
        <div>
          <p className='text-4xl'>
            {Math.floor(props.playbackTime / project.secondsPerMeasure)}
          </p>
        </div>
      </div>
    </div>
  );
}
