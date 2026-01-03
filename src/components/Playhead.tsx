interface PlayheadProps {
  trackDimensions: { width: number; height: number };
  trackLength: number; // in seconds
  currentTime: number;
}

export const Playhead = (props: PlayheadProps) => {
  return (
    <div
      style={{
        height: '100px',
        width: '1px',
        backgroundColor: 'red',
        color: 'white',
        position: 'absolute',
        left: `${
          (props.currentTime / props.trackLength) * props.trackDimensions.width
        }px`,
        top: '-10px',
      }}
    ></div>
  );
};
