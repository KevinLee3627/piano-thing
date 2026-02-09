import { useAppDispatch, useAppSelector } from '../app/hooks';
import { trackSlice } from '../app/trackSlice';
import { getNoteFreqByName, noteMapping } from '../util/noteUtils';

export const Keyboard = ({ trackId }: { trackId: string }) => {
  const dispatch = useAppDispatch();
  const project = useAppSelector((state) => state.project);
  return (
    <div className='justify-center flex'>
      {Object.keys(noteMapping).map((note) => {
        return (
          <div
            key={note}
            className='w-12.5 border border-dashed border-black'
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
                    height: 24,
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
