import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { Baby } from '@shared/api.interface';

export async function getBaby(): Promise<Baby | null> {
  const res = await axiosForBackend.get<Baby[]>('/api/baby');
  const list: Baby[] = res.data;
  return list.length > 0 ? list[0] : null;
}

export async function createBaby(data: Omit<Baby, 'id' | 'createdAt' | 'updatedAt'>): Promise<Baby> {
  const res = await axiosForBackend.post('/api/baby', data);
  return res.data;
}

export async function updateBaby(id: string, data: Partial<Omit<Baby, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Baby> {
  const res = await axiosForBackend.patch(`/api/baby/${id}`, data);
  return res.data;
}
