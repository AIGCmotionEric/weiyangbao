import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { FeedingRecord, FeedingType, FeedingListResponse } from '@shared/api.interface';

export async function getFeedingRecords(params?: { type?: FeedingType; limit?: number }): Promise<FeedingListResponse> {
  const res = await axiosForBackend.get('/api/feeding', { params });
  return res.data;
}

export async function createFeedingRecord(data: Omit<FeedingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeedingRecord> {
  const res = await axiosForBackend.post('/api/feeding', data);
  return res.data;
}

export async function deleteFeedingRecord(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/feeding/${id}`);
}

export async function getTodayFeedingStats(): Promise<{ count: number; totalAmount: number }> {
  const res = await axiosForBackend.get('/api/feeding/stats/today');
  return res.data;
}
