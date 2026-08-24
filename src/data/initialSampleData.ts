import { generateMaduraTobaccoDataset } from './maduraDatasetGenerator';
import { PengirimanSample } from '../types';

const dataset = generateMaduraTobaccoDataset();

export const INITIAL_SAMPLE_DATA: PengirimanSample[] = dataset.sampleList;
