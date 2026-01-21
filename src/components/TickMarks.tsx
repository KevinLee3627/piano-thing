import { useAppSelector } from '../app/hooks';

export interface TickMarksProps {
  trackElemWidth: number;
}

export const TickMarks = (props: TickMarksProps) => {
  const project = useAppSelector((state) => state.project);

  return (
    <div style={{ position: 'relative', height: '1rem' }}>
      {Array.from({ length: project.totalMeasures })
        .fill(0)
        .map((_, i) => {
          const left = props.trackElemWidth * (i / project.totalMeasures);
          return (
            <div
              key={`tick-${i}`}
              style={{
                border: '1px dashed blue',
                position: 'absolute',
                left: `${left}px`,
              }}
            >
              {i}
            </div>
          );
        })}
    </div>
  );
};
