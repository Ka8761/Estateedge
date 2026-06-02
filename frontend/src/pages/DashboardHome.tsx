// EstateEdge — Dashboard Home Page

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Globe, Users, TrendingUp, ArrowUpRight, Plus, Bot, Zap } from 'lucide-react';
import { useAuthStore } from '../lib/authStore';
import { useQuery } from '@apollo/client';
import { MY_SITES_QUERY, MY_LEADS_QUERY } from '../lib/apollo';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// Mock analytics data — in production comes from analytics-service
const TRAFFIC_DATA = [
  { day: 'Mon', views: 240 }, { day: 'Tue', views: 380 }, { day: 'Wed', views: 310 },
  { day: 'Thu', views: 490 }, { day: 'Fri', views: 620 }, { day: 'Sat', views: 410 },
  { day: 'Sun', views: 290 },
];

function StatCard({
  label, value, change, icon: Icon, accent = false
}: {
  label: string; value: string | number; change?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={`card p-5 ${accent ? 'bg-ink border-ink text-white' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${accent ? 'bg-white/10' : 'bg-ink-50'}`}>
          <Icon size={16} className={accent ? 'text-gold' : 'text-ink-500'} />
        </div>
        {change && (
          <span className={`text-xs font-heading font-medium ${
            change.startsWith('+') ? 'text-sage-500' : 'text-red-400'
          } ${accent ? 'text-sage-300' : ''}`}>
            {change}
          </span>
        )}
      </div>
      <div className={`text-2xl font-display font-semibold ${accent ? 'text-white' : 'text-ink'}`}>{value}</div>
      <div className={`text-xs font-heading mt-0.5 ${accent ? 'text-white/60' : 'text-ink-400'}`}>{label}</div>
    </div>
  );
}

export function DashboardHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: sitesData, loading: sitesLoading } = useQuery(MY_SITES_QUERY);

  const sites = sitesData?.mySites ?? [];
  const publishedCount = sites.filter((s: { status: string }) => s.status === 'published').length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <div className="text-sm text-ink-400 font-heading mb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h1 className="text-3xl font-display text-ink">
          {greeting()}, {user?.firstName ?? 'there'}.
        </h1>
        <p className="text-ink-400 text-sm mt-1 font-body">Here's what's happening with your real estate presence today.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {[
          { label: 'Generate Site with AI', icon: Sparkles, action: () => navigate('/sites/generate'), primary: true },
          { label: 'Create Blank Site', icon: Plus, action: () => navigate('/sites') },
          { label: 'AI Assistant', icon: Bot, action: () => navigate('/ai') },
          { label: 'View Analytics', icon: TrendingUp, action: () => navigate('/analytics') },
        ].map(({ label, icon: Icon, action, primary }) => (
          <button
            key={label}
            onClick={action}
            className={`flex items-center gap-2.5 p-3.5 rounded-xl text-left text-sm font-heading font-medium transition-all duration-150 active:scale-95 ${
              primary
                ? 'bg-ink text-white hover:bg-ink-800 shadow-sm'
                : 'bg-white border border-ink-200 text-ink hover:border-ink-400 hover:shadow-sm'
            }`}
          >
            <Icon size={15} className={primary ? 'text-gold' : 'text-ink-500'} />
            {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <StatCard label="Total Sites" value={sites.length} change="+2 this month" icon={Globe} accent />
        <StatCard label="Published" value={publishedCount} icon={Zap} />
        <StatCard label="Total Leads" value="147" change="+23 this week" icon={Users} />
        <StatCard label="Site Views" value="4,821" change="+12.4%" icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        {/* Traffic chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-ink">Site Traffic</h2>
            <span className="text-xs text-ink-400 font-heading">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={TRAFFIC_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#7E7E8E', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#7E7E8E', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0D0D0F', border: 'none', borderRadius: 8, fontSize: 12, fontFamily: 'DM Sans', color: '#fff' }}
                itemStyle={{ color: '#C9A84C' }}
                cursor={{ stroke: '#C9A84C', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="views" stroke="#C9A84C" strokeWidth={2} fill="url(#trafficGrad)" dot={false} activeDot={{ r: 4, fill: '#C9A84C', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent sites */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-ink">Recent Sites</h2>
            <button onClick={() => navigate('/sites')} className="text-xs text-gold hover:text-gold-500 font-heading flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </button>
          </div>

          {sitesLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 shimmer-bg rounded-lg" />)}
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-8">
              <Globe size={24} className="text-ink-300 mx-auto mb-2" />
              <p className="text-sm text-ink-400 font-heading">No sites yet</p>
              <button onClick={() => navigate('/sites/generate')} className="btn-gold mt-3 text-xs py-1.5 px-3">
                <Sparkles size={12} /> Generate one
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sites.slice(0, 5).map((site: { id: string; name: string; status: string; subdomain: string }) => (
                <button
                  key={site.id}
                  onClick={() => navigate(`/sites/${site.id}/builder`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-ink-50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-gold/20 to-sage/10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-heading font-medium text-ink truncate">{site.name}</div>
                    <div className="text-2xs text-ink-400 truncate">{site.subdomain}.estateedge.io</div>
                  </div>
                  <span className={`badge flex-shrink-0 ${site.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                    {site.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI prompt card */}
      <div className="mt-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="relative overflow-hidden rounded-xl bg-ink p-6 flex items-center gap-6">
          <div className="absolute inset-0 opacity-[0.04] bg-noise" />
          <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <Sparkles size={22} className="text-gold" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-white text-lg">Ready to build your next site?</h3>
            <p className="text-white/50 text-sm font-body mt-0.5">
              Describe your brand in a few words — EstateEdge AI generates a complete, professional website in under 60 seconds.
            </p>
          </div>
          <button onClick={() => navigate('/sites/generate')} className="btn-gold flex-shrink-0">
            <Sparkles size={14} /> Generate Site
          </button>
        </div>
      </div>
    </div>
  );
}