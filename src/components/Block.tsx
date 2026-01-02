import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { trackSlice } from '../app/trackSlice';

interface BlockProps {
  blockId: string;
  startTime: number;
  duration: number;
  frequency: number;
  gain: number;
  trackDimensions: { width: number; height: number };
  trackLength: number; // in seconds
}

export const Block = (props: BlockProps) => {
  const dispatch = useAppDispatch();
  const blockInfo = useAppSelector(
    (state) => state.tracks.blocks[props.blockId]
  );

  const [pointerIsPressed, setPointerIsPressed] = useState(false);

  // NOTE: Default 'left' is overwritten after first render, maybe something to do with the
  // resize observer? This also updates block positions when screen or track is resized.
  useEffect(() => {
    const newLeft =
      (props.startTime / props.trackLength) * props.trackDimensions.width;
    const blockWidth =
      (props.duration / props.trackLength) * props.trackDimensions.width;
    dispatch(
      trackSlice.actions.editBlock({
        blockId: props.blockId,
        dims: {
          left: newLeft,
          width: blockWidth,
          maxLeft: props.trackDimensions.width - blockWidth,
        },
      })
    );
  }, [props.trackDimensions, props.trackLength]);

  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      style={{
        width: `${blockInfo.dims.width}px`,
        height: '100%',
        left: `${blockInfo.dims.left}px`,
        position: 'absolute',
        backgroundColor: pointerIsPressed ? 'red' : 'green',
      }}
      onPointerDown={(e) => {
        if (ref.current != null) {
          // NOTE: NEEDED TO KEEP SLIDING AFTER CURSOR LEAVES BOUNDARIES
          ref.current.setPointerCapture(e.pointerId);
          setPointerIsPressed(true);
        }
      }}
      onPointerUp={() => {
        setPointerIsPressed(false);
        const newStartTime =
          (blockInfo.dims.left / props.trackDimensions.width) *
          props.trackLength;
        dispatch(
          trackSlice.actions.editBlock({
            blockId: props.blockId,
            startTime: newStartTime,
          })
        );
      }}
      onPointerMove={(e) => {
        if (ref.current == null) return;
        if (pointerIsPressed) {
          // NOTE: Constrains block dragging to start and end of the track
          const newLeft = Math.max(
            Math.min(e.clientX - blockInfo.dims.width, blockInfo.dims.maxLeft),
            0
          );
          const blockWidth =
            (props.duration / props.trackLength) * props.trackDimensions.width;
          dispatch(
            trackSlice.actions.editBlock({
              blockId: props.blockId,
              dims: {
                left: newLeft,
                width: blockWidth,
                maxLeft: props.trackDimensions.width - blockWidth,
              },
            })
          );
        }
      }}
    >
      <p>{props.blockId.slice(0, 4)}</p>
    </div>
  );
};
