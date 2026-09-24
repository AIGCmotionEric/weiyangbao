import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { GrowthRecord, GrowthListResponse } from '@shared/api.interface';

export async function getGrowthRecords(): Promise<GrowthListResponse> {
  const res = await axiosForBackend.get('/api/growth');
  return res.data;
}

export async function createGrowthRecord(data: Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<GrowthRecord> {
  const res = await axiosForBackend.post('/api/growth', data);
  return res.data;
}

export async function deleteGrowthRecord(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/growth/${id}`);
}

export async function getLatestGrowth(): Promise<GrowthRecord | null> {
  const res = await axiosForBackend.get('/api/growth/latest');
  return res.data;
}
