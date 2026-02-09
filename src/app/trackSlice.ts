import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface BlockDimensions {
  height: number;
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

type TrackPolyphony = 'monophonic' | 'polyphonic';

export interface Track {
  trackId: string;
  blocks: Record<string, Block>;
  isPlaying: boolean;
  isExpanded: boolean;
  polyphony: TrackPolyphony;
  name: string;
}

export type TrackState = Record<string, Track>;

const initialTrackID = crypto.randomUUID();
const initialState: TrackState = {
  [initialTrackID]: {
    trackId: initialTrackID,
    blocks: {},
    isPlaying: false,
    isExpanded: true,
    polyphony: 'polyphonic',
    name: 'Track 1',
  },
};

type AddTrackPayload = Pick<Track, 'polyphony' | 'name'>;

export const trackSlice = createSlice({
  name: 'track',
  initialState,
  reducers: {
    addTrack: (state, action: PayloadAction<AddTrackPayload>) => {
      const newTrackId = crypto.randomUUID();
      state[newTrackId] = {
        trackId: newTrackId,
        blocks: {},
        isPlaying: false,
        isExpanded: false,
        polyphony: action.payload.polyphony,
        name: action.payload.name,
      };
    },
    startTrack: (state, action: PayloadAction<Pick<Track, 'trackId'>>) => {
      state[action.payload.trackId].isPlaying = true;
    },
    stopTrack: (state, action: PayloadAction<Pick<Track, 'trackId'>>) => {
      state[action.payload.trackId].isPlaying = false;
    },
    expandTrack: (state, action: PayloadAction<Pick<Track, 'trackId'>>) => {
      state[action.payload.trackId].isExpanded = true;
    },
    collapseTrack: (state, action: PayloadAction<Pick<Track, 'trackId'>>) => {
      state[action.payload.trackId].isExpanded = false;
    },
    addBlock: (
      state,
      action: PayloadAction<Pick<Track, 'trackId'> & Omit<Block, 'blockId'>>,
    ) => {
      const blockId = crypto.randomUUID();
      state[action.payload.trackId].blocks[blockId] = {
        blockId,
        startTime: action.payload.startTime,
        duration: action.payload.duration,
        frequency: action.payload.frequency,
        gain: action.payload.gain,
        dims: action.payload.dims,
      };
    },
    editBlock: (
      state,
      action: PayloadAction<
        Pick<Track, 'trackId'> & Pick<Block, 'blockId'> & Partial<Block>
      >,
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
