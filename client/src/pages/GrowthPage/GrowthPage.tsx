import React, { useEffect, useState, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Plus, Ruler, Scale, Calendar, StickyNote, Trash2 } from 'lucide-react';
import type { GrowthRecord } from '@shared/api.interface';
import {
  getGrowthRecords,
  createGrowthRecord,
  deleteGrowthRecord,
  getLatestGrowth,
} from '@client/src/api/growth';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { getMonetGate, openPaywall, MONETGATE_FEATURE_KEY } from '@client/src/utils/monetgate';

const GrowthPage: React.FC = () => {
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [latest, setLatest] = useState<GrowthRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [measureDate, setMeasureDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, latestRes] = await Promise.all([
        getGrowthRecords(),
        getLatestGrowth(),
      ]);
      setRecords(listRes.items);
      setLatest(latestRes);
    } catch (err) {
      logger.error('获取生长记录失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const resetForm = useCallback(() => {
    setHeight('');
    setWeight('');
    setMeasureDate(new Date().toISOString().slice(0, 10));
    setNote('');
  }, []);

  const handleOpenDialog = (): void => {
    const mg = getMonetGate();
    if (!mg) {
      setDialogOpen(true);
      return;
    }
    void mg.check({ feature: MONETGATE_FEATURE_KEY }).then((result) => {
      if (result.allowed) {
        setDialogOpen(true);
      } else {
        openPaywall();
      }
    }).catch((err: unknown) => {
      logger.error('[MonetGate] 权益校验失败', JSON.stringify(err));
      setDialogOpen(true);
    });
  };

  const handleSubmit = useCallback(async () => {
    const heightNum = Number(height);
    const weightNum = Number(weight);
    if (!height || !weight || !measureDate) return;
    if (Number.isNaN(heightNum) || Number.isNaN(weightNum)) return;

    setSubmitting(true);
    try {
      await createGrowthRecord({
        babyId: latest?.babyId ?? '',
        height: heightNum,
        weight: weightNum,
        measureDate,
        note: note || undefined,
      });
      setDialogOpen(false);
      resetForm();
      void fetchData();
    } catch (err) {
      logger.error('新增生长记录失败', err);
    } finally {
      setSubmitting(false);
    }
  }, [height, weight, measureDate, note, latest, fetchData, resetForm]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteGrowthRecord(id);
        void fetchData();
      } catch (err) {
        logger.error('删除生长记录失败', err);
      }
    },
    [fetchData],
  );

  const sortedRecords = [...records].sort(
    (a: GrowthRecord, b: GrowthRecord) =>
      new Date(b.measureDate).getTime() - new Date(a.measureDate).getTime(),
  );

  const chartOption = {
    tooltip: { trigger: 'axis' as const },
    legend: {
      data: ['身高', '体重'],
      bottom: 0,
      textStyle: { color: 'hsl(30, 10%, 45%)', fontSize: 12 },
    },
    grid: { left: 40, right: 40, top: 20, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: sortedRecords
        .slice()
        .reverse()
        .map((r: GrowthRecord) =>
          r.measureDate.slice(5).replace('-', '/'),
        ),
      axisLabel: { color: 'hsl(30, 10%, 45%)', fontSize: 11 },
      axisLine: { lineStyle: { color: 'hsl(30, 15%, 90%)' } },
    },
    yAxis: [
      {
        type: 'value' as const,
        name: '身高(cm)',
        nameTextStyle: { color: 'hsl(340, 75%, 65%)', fontSize: 11 },
        axisLabel: { color: 'hsl(30, 10%, 45%)', fontSize: 11 },
        splitLine: { lineStyle: { color: 'hsl(30, 15%, 92%)' } },
      },
      {
        type: 'value' as const,
        name: '体重(kg)',
        nameTextStyle: { color: 'hsl(200, 70%, 65%)', fontSize: 11 },
        axisLabel: { color: 'hsl(30, 10%, 45%)', fontSize: 11 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '身高',
        type: 'line' as const,
        yAxisIndex: 0,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 6,
        lineStyle: { color: 'hsl(340, 75%, 65%)', width: 2 },
        itemStyle: { color: 'hsl(340, 75%, 65%)' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'hsla(340, 75%, 65%, 0.2)' },
              { offset: 1, color: 'hsla(340, 75%, 65%, 0)' },
            ],
          },
        },
        data: sortedRecords
          .slice()
          .reverse()
          .map((r: GrowthRecord) => r.height),
      },
      {
        name: '体重',
        type: 'line' as const,
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 6,
        lineStyle: { color: 'hsl(200, 70%, 65%)', width: 2 },
        itemStyle: { color: 'hsl(200, 70%, 65%)' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'hsla(200, 70%, 65%, 0.2)' },
              { offset: 1, color: 'hsla(200, 70%, 65%, 0)' },
            ],
          },
        },
        data: sortedRecords
          .slice()
          .reverse()
          .map((r: GrowthRecord) => r.weight),
      },
    ],
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">生长记录</h1>
      </div>

      {/* 当前身高体重卡片 */}
      <div className="grid grid-cols-2 gap-3" data-ai-section-type="card-stat">
        <div className="rounded-2xl bg-card p-4 shadow-sm border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ruler className="size-4 text-[hsl(340_75%_65%)]" />
            <span>当前身高</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              {loading ? '--' : latest ? latest.height.toFixed(1) : '--'}
            </span>
            <span className="text-sm text-muted-foreground">cm</span>
          </div>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-sm border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Scale className="size-4 text-[hsl(200_70%_65%)]" />
            <span>当前体重</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              {loading ? '--' : latest ? latest.weight.toFixed(2) : '--'}
            </span>
            <span className="text-sm text-muted-foreground">kg</span>
          </div>
        </div>
      </div>

      {/* 生长趋势图 */}
      <div className="rounded-2xl bg-card p-4 shadow-sm border border-border">
        <h2 className="text-base font-semibold mb-2">生长趋势</h2>
        {loading ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            加载中...
          </div>
        ) : records.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            暂无数据，添加记录后查看趋势
          </div>
        ) : (
          <ReactECharts
            option={chartOption}
            style={{ height: '224px', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        )}
      </div>

      {/* 历史记录列表 */}
      <div className="rounded-2xl bg-card p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">历史记录</h2>
          <span className="text-xs text-muted-foreground">
            共 {records.length} 条
          </span>
        </div>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            加载中...
          </div>
        ) : sortedRecords.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            还没有生长记录
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRecords.map((record: GrowthRecord) => (
              <div
                key={record.id}
                className="flex items-start justify-between rounded-xl bg-muted/50 p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    {record.measureDate}
                  </div>
                  <div className="mt-1.5 flex gap-4 text-sm">
                    <span>
                      <span className="text-[hsl(340_75%_65%)] font-semibold">
                        {record.height.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground text-xs ml-0.5">
                        cm
                      </span>
                    </span>
                    <span>
                      <span className="text-[hsl(200_70%_65%)] font-semibold">
                        {record.weight.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground text-xs ml-0.5">
                        kg
                      </span>
                    </span>
                  </div>
                  {record.note && (
                    <div className="mt-1.5 flex items-start gap-1 text-xs text-muted-foreground">
                      <StickyNote className="size-3 mt-0.5 shrink-0" />
                      <span className="break-words">{record.note}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive shrink-0 ml-2"
                  onClick={() => handleDelete(record.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 悬浮 + 按钮 */}
      <button
        type="button"
        onClick={handleOpenDialog}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:opacity-80 transition-opacity md:bottom-6 md:right-6"
        aria-label="新增生长记录"
      >
        <Plus className="size-6" />
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>新增生长记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                身高 (cm)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="请输入身高"
                value={height}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setHeight(e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                体重 (kg)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="请输入体重"
                value={weight}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWeight(e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                测量日期
              </label>
              <Input
                type="date"
                value={measureDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMeasureDate(e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                备注 (可选)
              </label>
              <Textarea
                placeholder="记录一下特殊情况..."
                value={note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNote(e.target.value)
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full">
                取消
              </Button>
            </DialogClose>
            <Button
              className="rounded-full bg-primary hover:bg-primary/90"
              onClick={handleSubmit}
              disabled={
                submitting ||
                !height ||
                !weight ||
                !measureDate ||
                Number.isNaN(Number(height)) ||
                Number.isNaN(Number(weight))
              }
            >
              {submitting ? '提交中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GrowthPage;
