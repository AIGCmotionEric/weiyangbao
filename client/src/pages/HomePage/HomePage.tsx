import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Milk, ArrowRight, Ruler, Scale, Baby as BabyIcon } from 'lucide-react';
import type { Baby, FeedingRecord, FeedingStats, GrowthRecord } from '@shared/api.interface';
import { getBaby } from '@client/src/api/baby';
import { getFeedingRecords, getTodayFeedingStats } from '@client/src/api/feeding';
import { getLatestGrowth } from '@client/src/api/growth';

/**
 * 获取问候语
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

/**
 * 计算宝宝年龄描述（月龄为主，满1岁显示岁数+月）
 */
function formatBabyAge(birthday: string): string {
  const birth = dayjs(birthday);
  const now = dayjs();

  const months = now.diff(birth, 'month');
  const days = now.diff(birth.add(months, 'month'), 'day');

  if (months < 1) {
    return `${days} 天`;
  }
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remain = months % 12;
    if (remain === 0) return `${years} 岁`;
    return `${years} 岁 ${remain} 个月`;
  }
  return `${months} 个月`;
}

/**
 * 喂养类型中文名
 */
function feedingTypeLabel(type: string): string {
  switch (type) {
    case 'breast_milk':
      return '母乳';
    case 'formula':
      return '配方奶';
    case 'solid_food':
      return '辅食';
    default:
      return type;
  }
}

/**
 * 喂养类型单位
 */
function feedingUnit(type: string): string {
  return type === 'solid_food' ? 'g' : 'ml';
}

const HomePage: React.FC = () => {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [stats, setStats] = useState<FeedingStats>({ count: 0, totalAmount: 0 });
  const [latestGrowth, setLatestGrowth] = useState<GrowthRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<FeedingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [babyData, statsData, growthData, recordsData] = await Promise.all([
        getBaby(),
        getTodayFeedingStats().catch((err: unknown) => {
          logger.error('加载喂养统计失败', JSON.stringify(err));
          return { count: 0, totalAmount: 0 };
        }),
        getLatestGrowth().catch((err: unknown) => {
          logger.error('加载生长记录失败', JSON.stringify(err));
          return null;
        }),
        getFeedingRecords({ limit: 5 }).catch((err: unknown) => {
          logger.error('加载最近记录失败', JSON.stringify(err));
          return { items: [], total: 0 };
        }),
      ]);

      setBaby(babyData);
      setStats(statsData);
      setLatestGrowth(growthData);
      setRecentRecords(recordsData.items);
    } catch (err: unknown) {
      logger.error('加载首页数据失败', JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const greeting = getGreeting();
  const displayName = baby?.name ?? '喂养宝';

  // 最近一次喂养时间文案
  const latestTimeText =
    recentRecords.length > 0
      ? `最近一次 ${dayjs(recentRecords[0].feedingTime).format('HH:mm')}`
      : '暂无记录，开始第一次喂养吧';

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
          <p className="text-sm text-muted-foreground mt-1">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部问候 + 宝宝信息 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}，{displayName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {baby ? `${baby.gender === 'boy' ? '男宝' : '女宝'} · ${formatBabyAge(baby.birthday)}` : '记录宝宝的每一天'}
        </p>
      </div>

      {/* 今日喂养卡片 */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-5 text-primary-foreground shadow-md">
        <div className="flex items-center gap-2 text-sm opacity-90">
          <Milk size={16} />
          <span>今日喂养</span>
        </div>
        <div className="mt-3 flex items-baseline gap-4">
          <div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold">{stats.count}</span>
              <span className="text-sm opacity-80 mb-1">次</span>
            </div>
            <div className="text-xs opacity-70 mt-0.5">喂养次数</div>
          </div>
          <div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-semibold">{stats.totalAmount}</span>
              <span className="text-sm opacity-80 mb-1">ml</span>
            </div>
            <div className="text-xs opacity-70 mt-0.5">总奶量</div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/20 text-sm opacity-80">
          {latestTimeText}
        </div>
      </div>

      {/* 身高体重概览 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-sm border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ruler size={14} className="text-primary" />
            <span>最近身高</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {latestGrowth ? `${latestGrowth.height} cm` : '-- cm'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {latestGrowth ? latestGrowth.measureDate : '暂无记录'}
          </div>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-sm border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Scale size={14} className="text-primary" />
            <span>最近体重</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {latestGrowth ? `${latestGrowth.weight} kg` : '-- kg'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {latestGrowth ? latestGrowth.measureDate : '暂无记录'}
          </div>
        </div>
      </div>

      {/* 最近记录 */}
      <div className="rounded-2xl bg-card p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">最近记录</h2>
          <Link
            to="/feeding"
            className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity"
          >
            查看全部 <ArrowRight size={12} />
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            还没有任何记录哦
          </div>
        ) : (
          <div className="space-y-1">
            {recentRecords.map((record: FeedingRecord) => (
              <div
                key={record.id}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BabyIcon size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {feedingTypeLabel(record.type)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dayjs(record.feedingTime).format('MM-DD HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  {record.amount}
                  <span className="text-xs text-muted-foreground font-normal ml-0.5">
                    {feedingUnit(record.type)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
