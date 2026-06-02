// EstateEdge — Analytics Page

import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Eye, Users, MousePointer, Globe, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

const TRAFFIC_DATA = [
  { date: 'May 1', views: 312, leads: 4, visitors: 201 },
  { date: 'May 5', views: 480, leads: 7, visitors: 342 },
  { date: 'May 10', views: 390, leads: 5, visitors: 280 },
  { date: 'May 15', views: 620, leads: 11, visitors: 450 },
  { date: 'May 20', views: 540, leads: 9, visitors: 390 },
  { date: 'May 24', views: 710, leads: 14, visitors: 510 },
];

const TOP_PAGES = [
  { page: 'Home', views: 2841, bounce: 38 },
  { page: 'Listings', views: 1920, bounce: 22 },
  { page: 'About', views: 870, bounce: 45 },
  { page: 'Neighborhoods', views: 540, bounce: 31 },
  { page: 'Contact', views: 390, bounce: 18 },
];

const SOURCES = [
  { name: 'Organic Search', value: 45, color: '#C9A84C' },
  { name: 'Direct', value: 28, color: '#0D0D0F' },
  { name: 'Social Media', value: 15, color: '#4A7C59' },
  { name: 'Referral', value: 12, color: '#ADADB8' },
];

const LEAD_SOURCES = [
  { source: 'Contact Form', count: 42 },
  { source: 'Listing Inquiry', count: 38 },
  { source: 'Home Valuation', count: 27 },
  { source: 'Newsletter', count: 19 },
  { source: 'Chat Widget', count: 11 },
];

function StatCard({ label, value, change, icon: Icon, positive }: {
  label: string; value: string; change: string; icon: React.ElementType; positive: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-ink-50">
          <Icon size={16} className="text-ink-500" />
        </div>
        <span className={`flex items-center gap-1 text-xs font-heading font-medium ${positive ? 'text-sage-600' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </span>
      </div>
      <div className="text-2xl font-display text-ink font-semibold">{value}</div>
      <div className="text-xs text-ink-400 font-heading mt-0.5">{label}</div>
    </div>
  );
}

export function AnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-3xl text-ink">Analytics</h1>
          <p className="text-sm text-ink-400 mt-1 font-body">Performance across all your sites</p>
        </div>
        <div className="flex items-center gap-1 bg-ink-50 border border-ink-200 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-heading font-medium transition-colors ${
                range === r ? 'bg-white shadow-sm text-ink' : 'text-ink-400 hover:text-ink'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <StatCard label="Total Page Views" value="4,821" change="+12.4%" icon={Eye} positive />
        <StatCard label="Unique Visitors" value="2,340" change="+8.1%" icon={Users} positive />
        <StatCard label="Leads Captured" value="137" change="+23.5%" icon={MousePointer} positive />
        <StatCard label="Avg Bounce Rate" value="31.4%" change="-4.2%" icon={TrendingUp} positive />
      </div>

      {/* Traffic chart */}
      <div className="card p-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-ink">Traffic & Lead Trends</h2>
          <div className="flex items-center gap-4 text-xs font-heading">
            <span className="flex items-center gap-1.5 text-ink-400"><span className="w-3 h-0.5 bg-gold rounded inline-block" /> Page Views</span>
            <span className="flex items-center gap-1.5 text-ink-400"><span className="w-3 h-0.5 bg-sage rounded inline-block" /> Leads</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={TRAFFIC_DATA} margin={{ left: -20, right: 0, top: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4A7C59" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#4A7C59" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#EBEBED" strokeDasharray="4 4" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7E7E8E', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#7E7E8E', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0D0D0F', border: 'none', borderRadius: 8, fontSize: 12, fontFamily: 'DM Sans', color: '#fff' }} />
            <Area type="monotone" dataKey="views" stroke="#C9A84C" strokeWidth={2} fill="url(#gViews)" dot={false} />
            <Area type="monotone" dataKey="leads" stroke="#4A7C59" strokeWidth={2} fill="url(#gLeads)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        {/* Top Pages */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-heading font-semibold text-ink mb-4">Top Pages</h2>
          <div className="space-y-2">
            <div className="grid grid-cols-3 text-2xs font-heading uppercase tracking-wide text-ink-400 pb-1 border-b border-ink-100">
              <span>Page</span><span className="text-right">Views</span><span className="text-right">Bounce</span>
            </div>
            {TOP_PAGES.map(({ page, views, bounce }, i) => (
              <div key={page} className="grid grid-cols-3 items-center py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xs text-ink-300 font-heading w-4">{i + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <Globe size={12} className="text-ink-400" />
                    <span className="text-sm font-heading text-ink">{page}</span>
                  </div>
                </div>
                <span className="text-sm text-right font-heading font-medium text-ink">{views.toLocaleString()}</span>
                <span className={`text-sm text-right font-heading ${bounce < 30 ? 'text-sage-600' : bounce > 40 ? 'text-red-400' : 'text-amber-600'}`}>{bounce}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic sources pie */}
        <div className="card p-5">
          <h2 className="font-heading font-semibold text-ink mb-4">Traffic Sources</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={SOURCES} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {SOURCES.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0D0D0F', border: 'none', borderRadius: 8, fontSize: 11, fontFamily: 'DM Sans', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {SOURCES.map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="font-heading text-ink-600">{s.name}</span>
                </div>
                <span className="font-heading font-semibold text-ink">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead sources bar */}
      <div className="card p-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="font-heading font-semibold text-ink mb-4">Lead Sources</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={LEAD_SOURCES} margin={{ left: -20, right: 0 }}>
            <CartesianGrid stroke="#EBEBED" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="source" tick={{ fontSize: 11, fill: '#7E7E8E', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#7E7E8E', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0D0D0F', border: 'none', borderRadius: 8, fontSize: 12, fontFamily: 'DM Sans', color: '#fff' }} />
            <Bar dataKey="count" fill="#C9A84C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}