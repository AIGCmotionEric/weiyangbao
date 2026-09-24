export type BabyGender = 'boy' | 'girl';

export interface Baby {
  id: string;
  name: string;
  gender: BabyGender;
  birthday: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type FeedingType = 'breast_milk' | 'formula' | 'solid_food';

export interface FeedingRecord {
  id: string;
  babyId: string;
  type: FeedingType;
  amount: number;
  feedingTime: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingListResponse {
  items: FeedingRecord[];
  total: number;
}

export interface FeedingStats {
  count: number;
  totalAmount: number;
}

export interface GrowthRecord {
  id: string;
  babyId: string;
  height: number;
  weight: number;
  measureDate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrowthListResponse {
  items: GrowthRecord[];
  total: number;
}
