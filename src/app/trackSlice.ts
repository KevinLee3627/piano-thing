import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

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
interface TrackState {
  blocks: Record<string, Block>;
}

const initialState: TrackState = {
  blocks: {},
};

const DEFAULT_START_TIME = 0;
const DEFAULT_DURATION = 1;
const DEFAULT_FREQUENCY = 440;
const DEFAULT_GAIN = 1;

export const trackSlice = createSlice({
  name: 'track',
  initialState,
  reducers: {
    addBlock: (state, action: PayloadAction<Omit<Block, 'blockId'>>) => {
      const blockId = crypto.randomUUID();
      state.blocks[blockId] = {
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
      action: PayloadAction<Pick<Block, 'blockId'> & Partial<Block>>
    ) => {
      const blockId = action.payload.blockId;
      state.blocks[blockId] = { ...state.blocks[blockId], ...action.payload };
    },
  },
});

export const selectBlocks = (state: RootState) => state.tracks.blocks;
