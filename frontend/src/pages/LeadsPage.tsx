// EstateEdge — Leads Page

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { MY_SITES_QUERY, MY_LEADS_QUERY } from '../lib/apollo';
import { Users, Mail, Phone, Star, TrendingUp, Filter, Search, ChevronDown, Bot } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  new: 'badge-draft',
  contacted: 'bg-blue-100 text-blue-600',
  qualified: 'bg-purple-100 text-purple-600',
  converted: 'badge-published',
  lost: 'bg-red-100 text-red-500',
};

// Mock leads for demo (in production: fetched from analytics-service via GraphQL)
const MOCK_LEADS = [
  { id: '1', firstName: 'Jennifer', lastName: 'Walsh', email: 'jennifer@example.com', phone: '(310) 555-0192', source: 'contact-form', status: 'hot' as const, score: 87, message: "I'm looking to buy a 4-bed home in the area, budget around $1.5M", createdAt: '2025-05-20T14:22:00Z', metadata: { aiPriority: 'hot', aiSuggestedAction: 'Call immediately — high-intent buyer with clear budget' } },
  { id: '2', firstName: 'Marcus', lastName: 'Thompson', email: 'mthompson@email.com', phone: '(323) 555-0847', source: 'listing-inquiry', status: 'warm' as const, score: 64, message: 'Interested in the listing on Elm St', createdAt: '2025-05-21T09:10:00Z', metadata: { aiPriority: 'warm', aiSuggestedAction: 'Send listing details + schedule showing' } },
  { id: '3', firstName: 'Sofia', lastName: 'Reyes', email: 'sofia.r@gmail.com', phone: '', source: 'newsletter', status: 'cold' as const, score: 22, message: '', createdAt: '2025-05-22T16:40:00Z', metadata: { aiPriority: 'cold', aiSuggestedAction: 'Add to email nurture sequence' } },
  { id: '4', firstName: 'David', lastName: 'Park', email: 'dpark@corp.com', phone: '(415) 555-3344', source: 'contact-form', status: 'warm' as const, score: 71, message: 'Relocating from SF, need something before August', createdAt: '2025-05-23T11:55:00Z', metadata: { aiPriority: 'warm', aiSuggestedAction: 'Relocation urgency — schedule video call this week' } },
  { id: '5', firstName: 'Amanda', lastName: 'Chen', email: 'amanda.chen@me.com', phone: '(310) 555-7291', source: 'listing-inquiry', status: 'new' as const, score: 55, message: 'Can I schedule a showing for this weekend?', createdAt: '2025-05-24T08:30:00Z', metadata: { aiPriority: 'warm', aiSuggestedAction: 'Respond with available showing times' } },
];

type Priority = 'hot' | 'warm' | 'cold' | 'new';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'text-red-600 bg-red-50' : score >= 50 ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-heading font-semibold ${color}`}>
      <Star size={10} fill="currentColor" />
      {score}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    hot: 'badge-hot', warm: 'badge-warm', cold: 'bg-blue-100 text-blue-600', new: 'badge-draft',
  };
  return <span className={`badge ${colors[priority] ?? 'badge-draft'}`}>{priority}</span>;
}

export function LeadsPage() {
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<typeof MOCK_LEADS[0] | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filtered = MOCK_LEADS.filter(l => {
    const name = `${l.firstName} ${l.lastName} ${l.email}`.toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || l.metadata.aiPriority === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-full overflow-hidden">
      {/* Lead list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-ink-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-3xl text-ink">Leads</h1>
              <p className="text-sm text-ink-400 mt-1 font-body">{MOCK_LEADS.length} total · AI-scored automatically</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-heading text-ink-500">
              <Bot size={14} className="text-gold" />
              AI scoring active
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search leads…"
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'hot', 'warm', 'cold'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-heading font-medium capitalize transition-colors ${
                    filter === f ? 'bg-ink text-white' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Stats row */}
          <div className="grid grid-cols-4 divide-x divide-ink-100 bg-cream border-b border-ink-100">
            {[
              { label: 'Total Leads', value: '147', icon: Users },
              { label: 'Hot Leads', value: '23', icon: TrendingUp },
              { label: 'This Week', value: '18', icon: Star },
              { label: 'Avg Score', value: '61', icon: Bot },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="px-5 py-3 flex items-center gap-3">
                <Icon size={16} className="text-gold" />
                <div>
                  <div className="font-display text-xl text-ink">{value}</div>
                  <div className="text-2xs text-ink-400 font-heading">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Lead rows */}
          <div className="divide-y divide-ink-100">
            {filtered.map(lead => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-ink-50 text-left transition-colors ${selectedLead?.id === lead.id ? 'bg-gold/5' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-ink-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-heading font-semibold text-ink-500">
                    {lead.firstName[0]}{lead.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-heading font-semibold text-sm text-ink">
                      {lead.firstName} {lead.lastName}
                    </span>
                    <PriorityBadge priority={lead.metadata.aiPriority} />
                  </div>
                  <div className="text-xs text-ink-400 truncate font-body">
                    {lead.email} {lead.phone && `· ${lead.phone}`}
                  </div>
                  {lead.message && (
                    <div className="text-xs text-ink-500 mt-0.5 truncate font-body italic">"{lead.message}"</div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <ScoreBadge score={lead.score} />
                  <span className="text-xs text-ink-400 font-heading">
                    {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xs text-ink-400 badge badge-draft capitalize">{lead.source.replace('-', ' ')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lead detail panel */}
      {selectedLead && (
        <div className="w-80 bg-white border-l border-ink-100 flex flex-col overflow-y-auto animate-slide-in-right">
          <div className="p-5 border-b border-ink-100">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <span className="font-heading font-bold text-gold">{selectedLead.firstName[0]}{selectedLead.lastName[0]}</span>
              </div>
              <PriorityBadge priority={selectedLead.metadata.aiPriority} />
            </div>
            <h2 className="font-heading font-bold text-ink">{selectedLead.firstName} {selectedLead.lastName}</h2>
            <ScoreBadge score={selectedLead.score} />
          </div>

          <div className="p-5 space-y-4">
            <div>
              <div className="label">Contact</div>
              <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-2 text-sm text-ink hover:text-gold transition-colors font-body mb-1">
                <Mail size={13} className="text-ink-400" /> {selectedLead.email}
              </a>
              {selectedLead.phone && (
                <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-2 text-sm text-ink hover:text-gold transition-colors font-body">
                  <Phone size={13} className="text-ink-400" /> {selectedLead.phone}
                </a>
              )}
            </div>

            {selectedLead.message && (
              <div>
                <div className="label">Message</div>
                <p className="text-sm text-ink-600 font-body italic leading-relaxed">"{selectedLead.message}"</p>
              </div>
            )}

            <div>
              <div className="label">Source</div>
              <span className="text-sm font-heading capitalize text-ink">{selectedLead.source.replace('-', ' ')}</span>
            </div>

            {/* AI Insight */}
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={14} className="text-gold" />
                <span className="text-xs font-heading font-semibold text-gold uppercase tracking-wide">AI Insight</span>
              </div>
              <p className="text-xs text-ink-700 font-body leading-relaxed">{selectedLead.metadata.aiSuggestedAction}</p>
            </div>

            <div className="space-y-2 pt-2">
              <button className="btn-primary w-full justify-center text-sm">
                <Mail size={14} /> Send Email
              </button>
              <button className="btn-secondary w-full justify-center text-sm">
                Mark as Contacted
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}