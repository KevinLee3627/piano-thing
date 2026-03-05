import { PauseIcon, PlayIcon, PlusIcon, RulerIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { projectSlice } from '@/app/projectSlice';
import { trackSlice } from '@/app/trackSlice';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './ui/popover';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface ControlBarProps {
  playbackTimeRef: React.RefObject<number>;
  startPlaybackAndUIUpdates: () => Promise<void>;
  pause: () => Promise<void>;
}

export function ControlBar(props: ControlBarProps) {
  const dispatch = useAppDispatch();
  const project = useAppSelector((state) => state.project);
  const tracks = useAppSelector((state) => state.tracks);

  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setDisplayTime(props.playbackTimeRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const currentMeasure =
    Math.floor(displayTime / project.secondsPerMeasure) + 1;
  const playbackTimeWithinMeasure =
    props.playbackTimeRef.current -
    (currentMeasure - 1) * project.secondsPerMeasure;
  const secondsPerBeat = project.secondsPerMeasure / project.beatsPerMeasure;
  const currentBeatInMeasure =
    Math.floor(playbackTimeWithinMeasure / secondsPerBeat) + 1;

  const [isEditingBpm, setIsEditingBpm] = useState(false);
  const [isEditingTimeSignature, setIsEditingTimeSignature] = useState(false);

  const [measuresToAdd, setMeasuresToAdd] = useState(1);

  const handleTimeSignatureChange = (
    newBeatsPerMeasure: number,
    newBeatValue: number,
  ) => {
    const oldBeatValue = project.beatValue;
    const oldBeatsPerMinute = project.beatsPerMinute;
    const newBeatsPerMinute = oldBeatsPerMinute * (newBeatValue / (1 / 4));

    dispatch(
      projectSlice.actions.setTimeSignature({
        beatsPerMeasure: newBeatsPerMeasure,
        beatValue: newBeatValue,
      }),
    );

    const newSecondsPerMeasure =
      (newBeatsPerMeasure * project.totalMeasures) /
      (project.beatsPerMinute / 60) /
      project.totalMeasures;
    const newPxPerSecondScale =
      project.pxPerMeasureScale / newSecondsPerMeasure;

    Object.values(tracks).forEach((track) => {
      // If beat value changed, rescale block times proportionally (like BPM change)
      if (newBeatValue !== oldBeatValue) {
        dispatch(
          trackSlice.actions.rescaleBlocks({
            trackId: track.trackId,
            factor: newBeatsPerMinute / oldBeatsPerMinute,
          }),
        );
      }

      // Re-snap quantized tracks to the new grid
      if (track.isQuantized) {
        dispatch(
          trackSlice.actions.snapBlocksToGrid({
            trackId: track.trackId,
            secondsPerMeasure: newSecondsPerMeasure,
            beatsPerMeasure: newBeatsPerMeasure,
            pxPerSecondScale: newPxPerSecondScale,
          }),
        );
      }
    });
  };

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

                // Update project setting AND rescale block start times/durations/etc.
                dispatch(
                  projectSlice.actions.setBeatsPerMinute(newBeatsPerMinute),
                );
                Object.values(tracks).forEach((track) => {
                  dispatch(
                    trackSlice.actions.rescaleBlocks({
                      trackId: track.trackId,
                      factor: newBeatsPerMinute / oldBeatsPerMinute,
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
          {isEditingTimeSignature ? (
            <div className='flex w-32'>
              <Input
                // Beats Per Measure
                className='text-4xl! h-full'
                defaultValue={project.beatsPerMeasure}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                onBlur={(e) => {
                  handleTimeSignatureChange(
                    parseInt(e.target.value),
                    project.beatValue,
                  );
                  setIsEditingTimeSignature(false);
                }}
              />
              <span className='text-4xl'>/</span>
              <Select
                defaultValue={String(1 / project.beatValue)}
                onValueChange={(v) => {
                  handleTimeSignatureChange(
                    project.beatsPerMeasure,
                    1 / parseInt(v),
                  );
                  setIsEditingTimeSignature(false);
                }}
              >
                <SelectTrigger className='w-16'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 4, 8, 16].map((v) => (
                    <SelectItem key={v} value={String(v)}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <p
                className='text-4xl'
                onClick={() => setIsEditingTimeSignature(true)}
              >
                {project.beatsPerMeasure}/{1 / project.beatValue}
              </p>
              <p className='text-xs'>Time Sig.</p>
            </>
          )}
        </div>
        <div>
          <p className='text-4xl'>
            {props.playbackTimeRef.current.toFixed(2)}s
          </p>
          <p className='text-xs'>Playback Time</p>
        </div>
        <div>
          <p className='text-4xl'>
            {currentMeasure}.{currentBeatInMeasure}
          </p>
          <p className='text-xs'>Measure</p>
        </div>
      </div>
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline'>
              <RulerIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Add measures</PopoverTitle>
            </PopoverHeader>
            <div className='flex'>
              <Input
                type='number'
                value={measuresToAdd}
                min={1}
                onChange={(e) => {
                  const add = parseInt(e.target.value, 10);
                  setMeasuresToAdd(add);
                }}
              />
              <Button
                onClick={() => {
                  console.log(`add ${measuresToAdd} measures`);
                  dispatch(projectSlice.actions.addMeasures(measuresToAdd));
                }}
              >
                <PlusIcon />
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
