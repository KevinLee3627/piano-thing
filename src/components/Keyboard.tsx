import { useAppDispatch, useAppSelector } from '../app/hooks';
import { trackSlice } from '../app/trackSlice';
import { getNoteFreqByName, noteMapping } from '../util/noteUtils';

export const Keyboard = ({ trackId }: { trackId: string }) => {
  const dispatch = useAppDispatch();
  const project = useAppSelector((state) => state.project);
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {Object.keys(noteMapping).map((note) => {
        return (
          <div
            key={note}
            style={{
              height: '150px',
              width: '50px',
              border: '1px dashed black',
            }}
            onClick={() => {
              dispatch(
                trackSlice.actions.addBlock({
                  trackId,
                  startTime: 0,
                  duration: project.secondsPerMeasure / project.beatsPerMeasure,
                  frequency: getNoteFreqByName(`${note}4`),
                  gain: 1,
                  dims: {
                    left: 0,
                    maxLeft: 0,
                    width: 0,
                  },
                }),
              );
            }}
          >
            {note}
          </div>
        );
      })}
    </div>
  );
};
