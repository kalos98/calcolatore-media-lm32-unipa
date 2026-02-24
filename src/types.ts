export interface Exam {
  id?: number;
  name: string;
  grade: number;
  is_lode: boolean;
  cfu: number;
  isConvalida?: boolean;
}

export interface Stats {
  weightedAverage: number; // LM-32 weighted average (with 6 CFU discount)
  standardWeightedAverage: number; // Standard weighted average (no discount)
  arithmeticAverage: number;
  graduationBase: number;
  totalCFU: number;
  lodeBonus: number;
  initialBase: number; // Base 110 + lode bonus
  isLodeEligible: boolean;
  isMenzioneEligible: boolean;
}
