import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface BlockDimensions {
  width: number;
  left: number;
  maxLeft: number;
}

interface Block {
  blockId: string;
  startTime: number;
  duration: number;
  frequency: number;
  gain: number;
  dims: BlockDimensions;
}

interface Track {
  trackId: string;
  blocks: Record<string, Block>;
  isPlaying: boolean;
}

export type TrackState = Record<string, Track>;

const initialTrackID = crypto.randomUUID();
const initialState: TrackState = {
  [initialTrackID]: {
    trackId: initialTrackID,
    blocks: {},
    isPlaying: false,
  },
};

export const trackSlice = createSlice({
  name: 'track',
  initialState,
  reducers: {
    addTrack: (state) => {
      const newTrackId = crypto.randomUUID();
      state[newTrackId] = {
        trackId: newTrackId,
        blocks: {},
        isPlaying: false,
      };
    },
    startTrack: (state, action: PayloadAction<Pick<Track, 'trackId'>>) => {
      state[action.payload.trackId].isPlaying = true;
    },
    stopTrack: (state, action: PayloadAction<Pick<Track, 'trackId'>>) => {
      state[action.payload.trackId].isPlaying = false;
    },
    addBlock: (
      state,
      action: PayloadAction<Pick<Track, 'trackId'> & Omit<Block, 'blockId'>>
    ) => {
      const blockId = crypto.randomUUID();
      state[action.payload.trackId].blocks[blockId] = {
        blockId,
        startTime: action.payload.startTime,
        duration: action.payload.duration,
        frequency: action.payload.frequency,
        gain: action.payload.gain,
        dims: { width: 0, left: 0, maxLeft: 0 },
      };
    },
    editBlock: (
      state,
      action: PayloadAction<
        Pick<Track, 'trackId'> & Pick<Block, 'blockId'> & Partial<Block>
      >
    ) => {
      const trackID = action.payload.trackId;
      const blockId = action.payload.blockId;
      state[trackID].blocks[blockId] = {
        ...state[trackID].blocks[blockId],
        ...action.payload,
      };
    },
  },
});
