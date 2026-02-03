import { useAppSelector } from '../app/hooks';
import type { useResizeObserver } from '../hooks/useResizeObserver';

interface PlayheadProps {
  trackDimensions: ReturnType<typeof useResizeObserver>['dimensions'];
  currentTime: number;
}

export const Playhead = (props: PlayheadProps) => {
  const project = useAppSelector((state) => state.project);
  const left =
    (props.currentTime / project.totalDuration) * props.trackDimensions.width;
  return (
    <>
      <div
        className='absolute w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-16 border-t-red-500'
        style={{ left: `${left - 8}px` }}
      />
      <div
        className='absolute -top-2.5 h-full w-px bg-white'
        style={{ left: `${left}px` }}
      />
    </>
  );
};
