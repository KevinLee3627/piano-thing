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
    loadState: (_, action: PayloadAction<TrackState>) => {
      return action.payload;
    },
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
    deleteTrack: (state, action: PayloadAction<Pick<Track, 'trackId'>>) => {
      delete state[action.payload.trackId];
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
    setTrackQuantizationResolution: (
      state,
      action: PayloadAction<Pick<Track, 'trackId' | 'quantizationResolution'>>,
    ) => {
      state[action.payload.trackId].quantizationResolution =
        action.payload.quantizationResolution;
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
      action: PayloadAction<
        Pick<Track, 'trackId'> &
          Pick<Block, 'blockId'> & { multiSelect: boolean }
      >,
    ) => {
      const { trackId, blockId, multiSelect } = action.payload;
      const block = state[trackId].blocks[blockId];
      const anyOtherSelected = Object.values(state[trackId].blocks).some(
        (b) => b.blockId !== blockId && b.isSelected,
      );

      if (multiSelect) {
        // When ctrl/shift is held down, toggle the states of any blocks clicked
        block.isSelected = !block.isSelected;
      } else if (block.isSelected && anyOtherSelected) {
        // If multiple blocks are selected, and a selected block is clicked,
        // focus the clicked block and deselect all others
        Object.values(state[trackId].blocks).forEach((b) => {
          b.isSelected = b.blockId === blockId;
        });
      } else if (block.isSelected) {
        // Toggle selection of a block off
        block.isSelected = false;
      } else if (!block.isSelected) {
        // When clicking an unselected block, deselect all other blocks and select the clicked block
        Object.values(state[trackId].blocks).forEach((b) => {
          b.isSelected = false;
        });
        block.isSelected = true;
      }
    },
    deleteSelectedBlocks: (
      state,
      action: PayloadAction<Pick<Track, 'trackId'>>,
    ) => {
      const { trackId } = action.payload;
      const track = state[trackId];
      Object.values(track.blocks).forEach((block) => {
        if (block.isSelected) {
          delete track.blocks[block.blockId];
        }
      });
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
      action: PayloadAction<{ trackId: Track['trackId']; factor: number }>,
    ) => {
      const { factor } = action.payload;
      const trackId = action.payload.trackId;

      Object.values(state[trackId].blocks).forEach((block) => {
        block.duration /= factor;
        block.startTime /= factor;
      });
    },
    snapBlocksToGrid: (
      state,
      action: PayloadAction<{
        trackId: Track['trackId'];
        secondsPerMeasure: number;
        beatsPerMeasure: number;
        pxPerSecondScale: number;
      }>,
    ) => {
      const { trackId, secondsPerMeasure, beatsPerMeasure, pxPerSecondScale } =
        action.payload;
      const track = state[trackId];
      if (!track.isQuantized) return;

      const snapPointGap =
        secondsPerMeasure / beatsPerMeasure / track.quantizationResolution;

      Object.values(track.blocks).forEach((block) => {
        const snappedStartTime =
          Math.round(block.startTime / snapPointGap) * snapPointGap;
        const snappedDuration = Math.max(
          snapPointGap,
          Math.round(block.duration / snapPointGap) * snapPointGap,
        );
        const newLeft = snappedStartTime * pxPerSecondScale;
        const newWidth = snappedDuration * pxPerSecondScale;
        block.startTime = snappedStartTime;
        block.duration = snappedDuration;
        block.dims.left = newLeft;
        block.dims.width = newWidth;
      });
    },
  },
});
