import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Pencil, UserRound, Info, ChevronRight, Crown, LogOut } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { createBaby, getBaby, updateBaby } from '@client/src/api/baby';
import type { Baby, BabyGender } from '@shared/api.interface';
import { getMonetGate, type MonetGateUser } from '@client/src/utils/monetgate';
import { toast } from 'sonner';

/**
 * 计算宝宝年龄描述
 * 不足一个月显示天数，满1岁显示岁数，否则显示月龄
 */
function formatBabyAge(birthday: string): string {
  const birth = new Date(birthday);
  const now = new Date();

  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const days = now.getDate() - birth.getDate();

  let totalMonths = years * 12 + months;
  if (days < 0) {
    totalMonths -= 1;
  }

  if (totalMonths < 1) {
    // 不足一个月，按天数算
    const diffMs = now.getTime() - birth.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return `${diffDays} 天`;
  }

  if (totalMonths >= 12) {
    const ageYears = Math.floor(totalMonths / 12);
    const remainMonths = totalMonths % 12;
    if (remainMonths === 0) {
      return `${ageYears} 岁`;
    }
    return `${ageYears} 岁 ${remainMonths} 个月`;
  }

  return `${totalMonths} 个月`;
}

interface BabyPageProps {
  mgUser?: MonetGateUser | null;
  onLogout: () => void;
  onLoginSuccess?: (user: MonetGateUser) => void;
}

const BabyPage: React.FC<BabyPageProps> = ({ mgUser = null, onLogout, onLoginSuccess }) => {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  // 表单状态
  const [formName, setFormName] = useState<string>('');
  const [formGender, setFormGender] = useState<BabyGender>('boy');
  const [formBirthday, setFormBirthday] = useState<string>('');

  const loadBaby = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getBaby();
      setBaby(data);
    } catch (err: unknown) {
      logger.error('加载宝宝信息失败', JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBaby();
  }, []);

  const handleOpenLogin = (): void => {
    const mg = getMonetGate();
    if (!mg) {
      logger.warn('[MonetGate] SDK 未初始化');
      return;
    }
    mg.openLoginModal({
      onSuccess: async () => {
        try {
          const user = await mg.user();
          onLoginSuccess?.(user);
        } catch (err) {
          logger.error('[MonetGate] 获取用户信息失败', JSON.stringify(err));
        }
      },
    });
  };

  const handleLogout = async (): Promise<void> => {
    setLoggingOut(true);
    try {
      const mg = getMonetGate();
      if (mg) {
        await mg.logout();
      }
    } catch (err) {
      logger.error('[MonetGate] 退出登录失败', JSON.stringify(err));
    } finally {
      onLogout();
      toast.success('已退出登录');
      setLoggingOut(false);
    }
  };

  const handleOpenEdit = (): void => {
    if (baby) {
      setFormName(baby.name);
      setFormGender(baby.gender);
      setFormBirthday(baby.birthday);
    } else {
      setFormName('');
      setFormGender('boy');
      const today = new Date().toISOString().split('T')[0];
      setFormBirthday(today);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formName.trim()) return;
    if (!formBirthday) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formName.trim(),
        gender: formGender,
        birthday: formBirthday,
      };

      if (baby) {
        const updated = await updateBaby(baby.id, payload);
        setBaby(updated);
      } else {
        const created = await createBaby(payload);
        setBaby(created);
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      logger.error('保存宝宝信息失败', JSON.stringify(err));
    } finally {
      setSubmitting(false);
    }
  };

  const avatarEmoji = baby?.gender === 'boy' ? '👦' : '👧';
  const appVersion = '1.0.0';

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">宝宝档案</h1>
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border text-center text-muted-foreground">
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">宝宝档案</h1>

      {/* 宝宝信息卡片 */}
      <div className="relative rounded-2xl bg-card p-6 shadow-sm border border-border text-center">
        {baby && (
          <button
            type="button"
            onClick={handleOpenEdit}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            aria-label="编辑宝宝信息"
          >
            <Pencil size={18} />
          </button>
        )}
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
            baby ? 'bg-primary/10' : 'bg-secondary'
          }`}
        >
          {baby ? avatarEmoji : '👶'}
        </div>
        {baby ? (
          <>
            <div className="mt-4 text-xl font-semibold">{baby.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {baby.gender === 'boy' ? '男宝宝' : '女宝宝'} · {formatBabyAge(baby.birthday)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              出生日期：{baby.birthday}
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 text-xl font-semibold">未设置宝宝信息</div>
            <div className="mt-1 text-sm text-muted-foreground">
              完善宝宝档案，开始记录成长
            </div>
            <Button
              variant="default"
              size="default"
              className="mt-4 rounded-full"
              onClick={handleOpenEdit}
            >
              设置宝宝信息
            </Button>
          </>
        )}
      </div>

      {/* 设置列表 */}
      <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
        {/* 会员中心 */}
        <div className="flex w-full items-center justify-between px-4 py-3.5 border-b border-border hover:bg-muted/50 transition-colors">
          <button
            type="button"
            onClick={mgUser?.type === 'member' ? undefined : handleOpenLogin}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Crown size={16} />
            </div>
            <span className="text-sm">
              {mgUser?.type === 'member'
                ? `会员 · ${mgUser.email ?? '已登录'}`
                : '登录会员'}
            </span>
          </button>
           {mgUser?.type === 'member' ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="flex items-center gap-1.5 px-2.5 py-1.5 -mr-2 rounded-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 disabled:opacity-50"
            >
              <LogOut size={14} />
              {loggingOut ? '退出中...' : '退出'}
            </button>
          ) : (
            <ChevronRight size={18} className="text-muted-foreground" />
          )}
        </div>

        {/* 宝宝资料 */}
        <button
          type="button"
          onClick={handleOpenEdit}
          className="flex w-full items-center justify-between px-4 py-3.5 border-b border-border text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound size={16} />
            </div>
            <span className="text-sm">宝宝资料</span>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>

        {/* 关于喂养宝 */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 text-secondary-foreground">
              <Info size={16} />
            </div>
            <span className="text-sm">关于喂养宝</span>
          </div>
          <span className="text-xs text-muted-foreground">v{appVersion}</span>
        </div>
      </div>

      {/* 编辑/新增弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{baby ? '编辑宝宝信息' : '添加宝宝'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">宝宝姓名</label>
              <Input
                type="text"
                placeholder="请输入宝宝姓名"
                value={formName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">性别</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormGender('boy')}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    formGender === 'boy'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-transparent text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  👦 男宝宝
                </button>
                <button
                  type="button"
                  onClick={() => setFormGender('girl')}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    formGender === 'girl'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-transparent text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  👧 女宝宝
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">出生日期</label>
              <Input
                type="date"
                value={formBirthday}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormBirthday(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="default"
              size="default"
              className="w-full rounded-full"
              onClick={() => void handleSubmit()}
              disabled={submitting || !formName.trim() || !formBirthday}
            >
              {submitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BabyPage;
