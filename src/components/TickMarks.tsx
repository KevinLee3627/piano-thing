import { useAppSelector } from '../app/hooks';

export const TickMarks = () => {
  const project = useAppSelector((state) => state.project);

  return (
    <div className='h-8 relative select-none'>
      {Array.from({ length: project.totalMeasures })
        .fill(0)
        .map((_, i) => {
          const trackElemWidth =
            project.pxPerMeasureScale * project.totalMeasures;
          const left = trackElemWidth * (i / project.totalMeasures);
          return (
            <div
              key={`tick-${i}`}
              className='absolute'
              style={{ left: `${left}px` }}
            >
              {i}
            </div>
          );
        })}
    </div>
  );
};
