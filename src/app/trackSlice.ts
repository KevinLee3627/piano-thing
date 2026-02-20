import type { NoteNameWithOctave } from '@/util/noteUtils';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface BlockDimensions {
  height: number;
  width: number;
  left: number;
  top: number;
}

interface Block {
  blockId: string;
  startTime: number;
  duration: number;
  frequency: number;
  gain: number;
  dims: BlockDimensions;
  isSelected: boolean;
}

type TrackPolyphony = 'monophonic' | 'polyphonic';

export const QUANTIZATION_RESOLUTION = {
  MIN: 1,
  MAX: 8,
};

export interface Track {
  trackId: string;
  blocks: Record<string, Block>;
  isPlaying: boolean;
  isExpanded: boolean;
  polyphony: TrackPolyphony;
  name: string;
  minNote: NoteNameWithOctave;
  maxNote: NoteNameWithOctave;
  isQuantized: boolean;
  // The resolution should be defined as a factor of the BEAT VALUE
  // For example, if one beat = one quarter note = 1/4, then a resolution of 1 = quantize to the quarter note = (1/4) / 1
  // if resolution = 2, (1/4) / 2 -> quantize to an 1/8 note
  quantizationResolution: number;
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
    minNote: 'A3',
    maxNote: 'A4',
    isQuantized: true,
    quantizationResolution: QUANTIZATION_RESOLUTION.MIN,
  },
};

type AddTrackPayload = Omit<
  Track,
  'trackId' | 'blocks' | 'isPlaying' | 'isExpanded'
>;

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
        // TODO: Make this editable
        minNote: action.payload.minNote,
        maxNote: action.payload.maxNote,
        isQuantized: action.payload.isQuantized,
        quantizationResolution: action.payload.quantizationResolution,
      };
    },
    editTrack: (
      state,
      action: PayloadAction<
        Pick<Track, 'trackId'> & Partial<Omit<Track, 'trackId' | 'blocks'>>
      >,
    ) => {
      state[action.payload.trackId] = {
        ...state[action.payload.trackId],
        ...action.payload,
      };
    },
    setTrackPlaying: (
      state,
      action: PayloadAction<Pick<Track, 'trackId' | 'isPlaying'>>,
    ) => {
      state[action.payload.trackId].isPlaying = action.payload.isPlaying;
    },
    setTrackExpanded: (
      state,
      action: PayloadAction<Pick<Track, 'trackId' | 'isExpanded'>>,
    ) => {
      state[action.payload.trackId].isExpanded = action.payload.isExpanded;
    },
    setTrackQuantized: (
      state,
      action: PayloadAction<Pick<Track, 'trackId' | 'isQuantized'>>,
    ) => {
      state[action.payload.trackId].isQuantized = action.payload.isQuantized;
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
        isSelected: action.payload.isSelected,
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
    selectBlock: (
      state,
      action: PayloadAction<Pick<Track, 'trackId'> & Pick<Block, 'blockId'>>,
    ) => {
      const { trackId, blockId } = action.payload;
      const block = state[trackId].blocks[blockId];

      if (block.isSelected) {
        block.isSelected = false;
      } else {
        Object.values(state[trackId].blocks).forEach((b) => {
          b.isSelected = false;
        });
        block.isSelected = true;
      }
    },
    deselectAllBlocks: (
      state,
      action: PayloadAction<Pick<Track, 'trackId'>>,
    ) => {
      const track = state[action.payload.trackId];
      Object.values(track.blocks).forEach((block) => {
        block.isSelected = false;
      });
    },
    rescaleBlocks: (
      state,
      action: PayloadAction<{
        trackId: Track['trackId'];
        oldBeatsPerMinute: number;
        newBeatsPerMinute: number;
      }>,
    ) => {
      const scale =
        action.payload.newBeatsPerMinute / action.payload.oldBeatsPerMinute;
      const trackId = action.payload.trackId;

      Object.values(state[trackId].blocks).forEach((block) => {
        block.duration /= scale;
        block.startTime /= scale;
      });
    },
  },
});
