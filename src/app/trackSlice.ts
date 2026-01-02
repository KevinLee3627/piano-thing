import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

interface Block {
  blockId: string;
  startTime: number;
  duration: number;
  frequency: number;
  gain: number;
}
interface TrackState {
  blocks: Record<string, Block>;
}

const initialState: TrackState = {
  blocks: {},
};

export const trackSlice = createSlice({
  name: 'track',
  initialState,
  reducers: {
    addBlock: (state) => {
      const blockId = crypto.randomUUID();
      state.blocks[blockId] = {
        blockId,
        startTime: 0,
        duration: 1,
        frequency: 440,
        gain: 1,
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
