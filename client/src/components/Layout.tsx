import { NavLink, Outlet } from "react-router-dom";
import { Home, Baby, TrendingUp, UserRound } from "lucide-react";

const navItems = [
  { to: "/", label: "首页", icon: Home, end: true },
  { to: "/feeding", label: "喂养", icon: Baby },
  { to: "/growth", label: "生长", icon: TrendingUp },
  { to: "/baby", label: "我的", icon: UserRound },
];

const Layout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col md:max-w-2xl lg:max-w-4xl">
        <main className="flex-1 pb-20 pt-6 px-4 md:pb-6 md:pl-20">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur md:left-0 md:top-0 md:h-screen md:w-16 md:border-t-0 md:border-r">
          <ul className="safe-bottom flex items-center justify-around py-2 md:flex-col md:justify-start md:gap-6 md:py-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition-colors ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    <Icon size={22} strokeWidth={1.8} />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
