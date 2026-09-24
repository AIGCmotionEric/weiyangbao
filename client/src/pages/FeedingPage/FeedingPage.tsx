import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Baby, Trash2, Plus, Milk, Coffee, UtensilsCrossed } from 'lucide-react';
import dayjs from 'dayjs';
import type { Baby as BabyType } from '@shared/api.interface';
import { getBaby } from '@client/src/api/baby';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import {
  getFeedingRecords,
  createFeedingRecord,
  deleteFeedingRecord,
} from '@client/src/api/feeding';
import type {
  FeedingRecord,
  FeedingType,
  FeedingListResponse,
} from '@shared/api.interface';
import { getMonetGate, openPaywall, MONETGATE_FEATURE_KEY } from '@client/src/utils/monetgate';

const FEEDING_TYPE_META: Record<
  FeedingType,
  { label: string; unit: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }
> = {
  breast_milk: {
    label: '母乳',
    unit: 'ml',
    icon: Milk,
    color: 'text-pink-500 bg-pink-50',
  },
  formula: {
    label: '奶粉',
    unit: 'ml',
    icon: Coffee,
    color: 'text-amber-500 bg-amber-50',
  },
  solid_food: {
    label: '辅食',
    unit: 'g',
    icon: UtensilsCrossed,
    color: 'text-emerald-500 bg-emerald-50',
  },
};

const FILTER_TABS: Array<{ key: 'all' | FeedingType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'breast_milk', label: '母乳' },
  { key: 'formula', label: '奶粉' },
  { key: 'solid_food', label: '辅食' },
];

interface FormState {
  type: FeedingType;
  amount: string;
  feedingTime: string;
  note: string;
}

const getInitialFormState = (): FormState => ({
  type: 'breast_milk',
  amount: '',
  feedingTime: dayjs().format('YYYY-MM-DDTHH:mm'),
  note: '',
});

const FeedingPage: React.FC = () => {
  const [records, setRecords] = useState<FeedingRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | FeedingType>('all');

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formState, setFormState] = useState<FormState>(getInitialFormState());

  const [baby, setBaby] = useState<BabyType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedingRecord | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    void (async () => {
      try {
        const data: BabyType | null = await getBaby();
        setBaby(data);
      } catch (err: unknown) {
        logger.error('获取宝宝信息失败', err);
      }
    })();
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params =
        activeFilter === 'all' ? undefined : { type: activeFilter };
      const data: FeedingListResponse = await getFeedingRecords(params);
      setRecords(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      logger.error('获取喂养记录失败', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const handleOpenDialog = (): void => {
    const mg = getMonetGate();
    if (!mg) {
      setFormState(getInitialFormState());
      setDialogOpen(true);
      return;
    }
    void mg.check({ feature: MONETGATE_FEATURE_KEY }).then((result) => {
      if (result.allowed) {
        setFormState(getInitialFormState());
        setDialogOpen(true);
      } else {
        openPaywall();
      }
    }).catch((err: unknown) => {
      logger.error('[MonetGate] 权益校验失败', JSON.stringify(err));
      setFormState(getInitialFormState());
      setDialogOpen(true);
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const amountNum = Number(formState.amount);
    if (!formState.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      setError('请输入有效的喂养量');
      return;
    }
    if (!formState.feedingTime) {
      setError('请选择喂养时间');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createFeedingRecord({
        babyId: baby?.id ?? records[0]?.babyId ?? '',
        type: formState.type,
        amount: amountNum,
        feedingTime: new Date(formState.feedingTime).toISOString(),
        note: formState.note || undefined,
      });
      setDialogOpen(false);
      void fetchRecords();
    } catch (err: unknown) {
      logger.error('创建喂养记录失败', err);
      setError('创建失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFeedingRecord(deleteTarget.id);
      setDeleteTarget(null);
      void fetchRecords();
    } catch (err: unknown) {
      logger.error('删除喂养记录失败', err);
      setError('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const meta = FEEDING_TYPE_META[formState.type];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">喂养记录</h1>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">共 {total} 条</span>
        )}
      </div>

      {/* 筛选标签 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="rounded-2xl bg-card p-8 text-center text-muted-foreground border border-border">
          加载中...
        </div>
      )}

      {/* 空状态 */}
      {!loading && records.length === 0 && (
        <div className="rounded-2xl bg-card p-8 text-center shadow-sm border border-border">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Baby className="h-8 w-8 text-primary" />
          </div>
          <div className="text-base font-medium text-foreground mb-1">
            还没有喂养记录
          </div>
          <div className="text-sm text-muted-foreground">
            点击右下角按钮，记录宝宝的第一次喂养
          </div>
        </div>
      )}

      {/* 记录列表 */}
      {!loading && records.length > 0 && (
        <div className="space-y-3">
          {records.map((record: FeedingRecord) => {
            const recordMeta = FEEDING_TYPE_META[record.type];
            const Icon = recordMeta.icon;
            return (
              <div
                key={record.id}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm border border-border"
              >
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${recordMeta.color}`}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-foreground">
                      {recordMeta.label}
                    </span>
                    <span className="text-lg font-semibold text-primary">
                      {record.amount}
                      <span className="text-sm font-normal text-muted-foreground ml-0.5">
                        {recordMeta.unit}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {dayjs(record.feedingTime).format('MM月DD日 HH:mm')}
                  </div>
                  {record.note && (
                    <div className="mt-1.5 text-sm text-muted-foreground break-words">
                      {record.note}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(record)}
                  className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label="删除记录"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 悬浮 + 按钮 */}
      <button
        type="button"
        onClick={handleOpenDialog}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 active:opacity-80 transition-opacity md:bottom-6 md:right-6"
        aria-label="新增喂养记录"
      >
        <Plus size={28} strokeWidth={2} />
      </button>

      {/* 新增弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">新增喂养记录</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 类型选择 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                喂养类型
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(FEEDING_TYPE_META) as FeedingType[]).map(
                  (typeKey: FeedingType) => {
                    const typeMeta = FEEDING_TYPE_META[typeKey];
                    const TypeIcon = typeMeta.icon;
                    const selected = formState.type === typeKey;
                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() =>
                          setFormState((prev) => ({ ...prev, type: typeKey }))
                        }
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition-colors ${
                          selected
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        <TypeIcon size={20} />
                        <span>{typeMeta.label}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* 喂养量 */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                喂养量
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={formState.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormState((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder={`请输入喂养量`}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {meta.unit}
                </span>
              </div>
            </div>

            {/* 喂养时间 */}
            <div className="space-y-2">
              <Label htmlFor="feedingTime" className="text-sm font-medium text-foreground">
                喂养时间
              </Label>
              <Input
                id="feedingTime"
                type="datetime-local"
                value={formState.feedingTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormState((prev) => ({
                    ...prev,
                    feedingTime: e.target.value,
                  }))
                }
              />
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-medium text-foreground">
                备注（可选）
              </Label>
              <Textarea
                id="note"
                value={formState.note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormState((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="记录一下宝宝这次的反应..."
                rows={3}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialogOpen(false)}
                className="rounded-full"
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={submitting}
                className="rounded-full"
              >
                {submitting ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open: boolean) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除这条喂养记录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-full"
              disabled={deleting}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="rounded-full bg-destructive hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FeedingPage;
