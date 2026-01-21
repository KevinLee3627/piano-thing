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
      style={{
        height: '100px',
        width: '1px',
        backgroundColor: 'red',
        color: 'white',
        position: 'absolute',
        left: `${left}px`,
        top: '-10px',
      }}
    ></div>
  );
};
