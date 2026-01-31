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
    <div
      style={{ left: `${left}px` }}
      className='absolute -top-2.5 h-25 w-px bg-red-500 text-white'
    ></div>
  );
};
