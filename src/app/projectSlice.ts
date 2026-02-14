import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ProjectState {
  isPlaying: boolean;
  totalDuration: number;
  pxPerSecondScale: number;
  pxPerMeasureScale: number;
  beatsPerMeasure: number;
  secondsPerMeasure: number;
  beatValue: number;
  totalMeasures: number;
  beatsPerMinute: number;
  timelineScrollLeft: number;
}

const DEFAULT_BEAT_VALUE = 1 / 4;
const DEFAULT_BEATS_PER_MEASURE = 4;
const DEFAULT_TOTAL_MEASURES = 10;
const DEFAULT_BEATS_PER_MINUTE = 60;
const DEFAULT_TOTAL_DURATION =
  (DEFAULT_BEATS_PER_MEASURE * DEFAULT_TOTAL_MEASURES) /
  (DEFAULT_BEATS_PER_MINUTE / 60); // in seconds
const DEFAULT_PX_PER_MEASURE_SCALE = 300;
const DEFAULT_SECONDS_PER_MEASURE =
  DEFAULT_TOTAL_DURATION / DEFAULT_TOTAL_MEASURES;

const initialState: ProjectState = {
  isPlaying: false,
  totalDuration: DEFAULT_TOTAL_DURATION, // seconds
  pxPerMeasureScale: DEFAULT_PX_PER_MEASURE_SCALE,
  pxPerSecondScale: DEFAULT_PX_PER_MEASURE_SCALE / DEFAULT_SECONDS_PER_MEASURE,
  beatsPerMeasure: DEFAULT_BEATS_PER_MEASURE,
  secondsPerMeasure: DEFAULT_SECONDS_PER_MEASURE,
  beatValue: DEFAULT_BEAT_VALUE,
  totalMeasures: DEFAULT_TOTAL_MEASURES,
  beatsPerMinute: DEFAULT_BEATS_PER_MINUTE,
  timelineScrollLeft: 0,
};

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    startPlayback: (state) => {
      state.isPlaying = true;
    },
    stopPlayback: (state) => {
      state.isPlaying = false;
    },
    updateTimelineScrollLeft: (state, action: PayloadAction<number>) => {
      state.timelineScrollLeft = action.payload;
    },
    setBeatsPerMinute: (state, action: PayloadAction<number>) => {
      const newTotalDuration =
        (state.beatsPerMeasure * state.totalMeasures) / (action.payload / 60);
      const newSecondsPerMeasure = newTotalDuration / state.totalMeasures;
      const newPxPerSecondScale =
        state.pxPerMeasureScale / newSecondsPerMeasure;
      console.log(newTotalDuration, newSecondsPerMeasure, newPxPerSecondScale);

      state.beatsPerMinute = action.payload;
      state.totalDuration = newTotalDuration;
      state.secondsPerMeasure = newSecondsPerMeasure;
      state.pxPerSecondScale = newPxPerSecondScale;
    },
  },
});
