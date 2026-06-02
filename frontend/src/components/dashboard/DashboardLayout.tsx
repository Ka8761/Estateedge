// EstateEdge — Dashboard Layout

import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Globe, Sparkles, Users, BarChart3,
  Bot, Settings, LogOut, ChevronRight, Bell, Search
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sites', icon: Globe, label: 'My Sites' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
];

const NAV_BOTTOM = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase()
    : 'U';

  return (
    <div className="flex h-screen bg-ink-50 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-ink-100 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-ink-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center">
              <span className="text-gold font-display text-sm font-semibold">E</span>
            </div>
            <div>
              <div className="font-display text-ink font-semibold text-base leading-none">EstateEdge</div>
              <div className="text-2xs text-ink-400 font-heading uppercase tracking-wider mt-0.5">Pro Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx('sidebar-link', isActive && 'active')
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}

          {/* Divider */}
          <div className="pt-3 pb-2">
            <div className="text-2xs text-ink-400 font-heading uppercase tracking-wider px-3 mb-1">AI Tools</div>
            <button
              onClick={() => navigate('/sites/generate')}
              className="sidebar-link w-full text-left text-gold hover:text-gold-500 hover:bg-gold/5 group"
            >
              <Sparkles size={16} className="text-gold" />
              <span>Generate New Site</span>
              <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-ink-100 pt-3 space-y-0.5">
          {NAV_BOTTOM.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
          <button onClick={handleLogout} className="sidebar-link w-full text-left text-red-400 hover:text-red-600 hover:bg-red-50">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* User card */}
        <div className="px-4 py-3 border-t border-ink-100 bg-ink-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-xs font-heading font-semibold text-gold">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-heading font-medium text-ink truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user?.email}
              </div>
              <div className="text-2xs text-ink-400 capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-ink-100 flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex-1 flex items-center gap-3 max-w-sm">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search sites, leads..."
                className="input-field pl-9 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="p-2 rounded-lg hover:bg-ink-50 text-ink-400 hover:text-ink transition-colors relative">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}