import { generateMaduraTobaccoDataset } from './maduraDatasetGenerator';
import { Petani } from '../types';

const dataset = generateMaduraTobaccoDataset();

export const INITIAL_PETANI_DATA: Petani[] = dataset.petaniList;
