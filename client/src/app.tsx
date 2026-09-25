import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/HomePage/HomePage';
import FeedingPage from './pages/FeedingPage/FeedingPage';
import GrowthPage from './pages/GrowthPage/GrowthPage';
import BabyPage from './pages/BabyPage/BabyPage';
import {
  loadMonetGateSdk,
  getMonetGate,
  openPaywall,
  type MonetGateUser,
} from './utils/monetgate';

const MONETGATE_APP_ID = 'cp_gfohtjofl3680pfme9ohojx3';
const MONETGATE_API_BASE =
  'https://treated-home-wires-precipitation.trycloudflare.com';

const PROTECTED_ROUTES = ['/feeding', '/growth'];

const RoutesComponent = () => {
  const [mgUser, setMgUser] = useState<MonetGateUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const sdk = await loadMonetGateSdk();
        const result = await sdk.init({
          appId: MONETGATE_APP_ID,
          apiBase: MONETGATE_API_BASE,
          protectedRoutes: PROTECTED_ROUTES,
        });
        if (!cancelled) {
          setMgUser(result.user);
          logger.info('[MonetGate] 初始化成功', JSON.stringify({ type: result.user.type }));
        }
      } catch (err) {
        logger.error('[MonetGate] 初始化失败', JSON.stringify(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handlePaywallShow = (): void => {
      logger.info('[MonetGate] SDK 路由守卫触发付费墙');
      openPaywall();
    };
    window.addEventListener('monetgate:paywall:show', handlePaywallShow);
    return () => {
      window.removeEventListener('monetgate:paywall:show', handlePaywallShow);
    };
  }, []);

  const handleLoginSuccess = (user: MonetGateUser): void => {
    setMgUser(user);
  };

  const handleLogout = (): void => {
    const mg = getMonetGate();
    if (mg) {
      void mg.logout().catch((err: unknown) => {
        logger.error('[MonetGate] 退出登录失败', JSON.stringify(err));
      });
    }
    setMgUser(null);
  };

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="feeding" element={<FeedingPage />} />
        <Route path="growth" element={<GrowthPage />} />
        <Route
          path="baby"
          element={
            <BabyPage
              mgUser={mgUser}
              onLogout={handleLogout}
              onLoginSuccess={handleLoginSuccess}
            />
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
