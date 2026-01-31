import { useAppSelector } from '../app/hooks';

export interface TickMarksProps {
  trackElemWidth: number;
}

export const TickMarks = (props: TickMarksProps) => {
  const project = useAppSelector((state) => state.project);

  return (
    <div className='h-4 relative'>
      {Array.from({ length: project.totalMeasures })
        .fill(0)
        .map((_, i) => {
          const left = props.trackElemWidth * (i / project.totalMeasures);
          return (
            <div
              key={`tick-${i}`}
              className='border border-dashed border-red-500 absolute'
              style={{ left: `${left}px` }}
            >
              {i}
            </div>
          );
        })}
    </div>
  );
};
