import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, KanbanSquare, BarChart3, LogOut, Briefcase } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ReactNode } from "react";

const NAV_ITEMS = [
  { to: "/board", label: "Board", icon: KanbanSquare },
  { to: "/applications", label: "Applications", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen bg-ink-50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-ink-200 bg-ink-950 text-ink-50">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <Briefcase size={16} strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">JobTrackr</span>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-600/20 text-brand-400"
                    : "text-ink-500 hover:bg-ink-900 hover:text-ink-50"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-800 px-3 py-4">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium text-ink-50">{user?.name}</p>
            <p className="truncate text-xs text-ink-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-900 hover:text-rose-400"
          >
            <LogOut size={18} strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
