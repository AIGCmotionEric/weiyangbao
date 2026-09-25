declare global {
  interface Window {
    MonetGate?: MonetGateSDK;
  }
}

export interface MonetGateUser {
  id: string;
  type: 'guest' | 'member';
  email?: string;
}

export interface MonetGateCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface MonetGateInitOptions {
  appId: string;
  apiBase?: string;
  externalUser?: string;
  protectedRoutes?: Array<string | { path: string; remark?: string }>;
  paywallTarget?: string;
}

export interface MonetGateAuthCallbacks {
  onSuccess?: (user?: MonetGateUser) => void;
  onClose?: () => void;
}

export interface MonetGateCheckoutParams {
  productId: string;
}

export interface MonetGateCheckoutResult {
  payUrl?: string;
  orderId?: string;
}

export interface MonetGatePaywallProduct {
  productId: string;
  name: string;
  price: number;
  description?: string;
}

export interface MonetGatePaywallOptions {
  products: MonetGatePaywallProduct[];
  title?: string;
  onClose?: () => void;
  onCheckout?: (productId: string, tradeType?: string) => Promise<MonetGateCheckoutResult>;
}

export interface MonetGateSDK {
  init(options: MonetGateInitOptions): Promise<{ token: string; user: MonetGateUser }>;
  user(): Promise<MonetGateUser>;
  check(params: { feature: string }): Promise<MonetGateCheckResult>;
  consume(params: { feature: string; amount?: number }): Promise<{ success: boolean; remaining?: number }>;
  checkout(params: MonetGateCheckoutParams): Promise<MonetGateCheckoutResult>;
  paywall(options?: MonetGatePaywallOptions): void;
  closePaywall(): void;
  register(params: { email: string; password: string }): Promise<{ token: string; user: MonetGateUser }>;
  login(params: { email: string; password: string }): Promise<{ token: string; user: MonetGateUser }>;
  openLoginModal(callbacks?: MonetGateAuthCallbacks): void;
  openRegisterModal(callbacks?: MonetGateAuthCallbacks): void;
  closeAuthModal(): void;
  ensureLoggedIn(reason?: string): Promise<void>;
  isLoggedInMember(): boolean;
  logout(): Promise<MonetGateUser | null>;
  registerRoutes(routes: Array<string | { path: string; remark?: string }>): void;
  addProtectedRoute(route: string | { path: string; remark?: string }): void;
  removeProtectedRoute(route: string): void;
  getProtectedRoutes(): string[];
  getProtectedRouteItems(): Array<{ path: string; remark?: string }>;
  setPaywallTarget(selector: string, onUnlock?: () => void): void;
  hidePaywallOverlay(): void;
  isPaywallOverlayVisible(): boolean;
  queryOrderStatus(orderId?: string): Promise<{ status: string; paid: boolean }>;
}

const MONETGATE_SDK_URL =
  'https://treated-home-wires-precipitation.trycloudflare.com/sdk.js';

export function loadMonetGateSdk(): Promise<MonetGateSDK> {
  return new Promise((resolve, reject) => {
    if (window.MonetGate) {
      resolve(window.MonetGate);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${MONETGATE_SDK_URL}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.MonetGate) resolve(window.MonetGate);
        else reject(new Error('MonetGate SDK 加载后未挂载到 window'));
      });
      existing.addEventListener('error', () =>
        reject(new Error('MonetGate SDK 加载失败')),
      );
      return;
    }

    const script = document.createElement('script');
    script.src = MONETGATE_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.MonetGate) resolve(window.MonetGate);
      else reject(new Error('MonetGate SDK 加载后未挂载到 window'));
    };
    script.onerror = () => reject(new Error('MonetGate SDK 加载失败'));
    document.head.appendChild(script);
  });
}

export const MONETGATE_FEATURE_KEY = '1234567890';

const PAYWALL_PRODUCTS: Array<{ productId: string; name: string; price: number; description?: string }> = [
  {
    productId: '1234567890',
    name: '终身会员',
    price: 0.01,
    description: '永久有效，解锁全部功能',
  },
];

export function getMonetGate(): MonetGateSDK | null {
  return window.MonetGate ?? null;
}

export function openPaywall(title?: string): void {
  const mg = window.MonetGate;
  if (!mg) return;
  mg.paywall({
    products: PAYWALL_PRODUCTS,
    title: title ?? '升级会员，解锁完整功能',
  });
}

export {};
