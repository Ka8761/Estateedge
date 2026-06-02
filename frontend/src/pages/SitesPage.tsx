// EstateEdge — Sites Page

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { MY_SITES_QUERY, PUBLISH_SITE_MUTATION } from '../lib/apollo';
import { Plus, Sparkles, Globe, ExternalLink, Edit2, Zap, MoreHorizontal, Search } from 'lucide-react';

export function SitesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, loading, refetch } = useQuery(MY_SITES_QUERY);
  const [publishSite] = useMutation(PUBLISH_SITE_MUTATION);

  const sites = (data?.mySites ?? []).filter((s: { name: string }) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePublish = async (siteId: string) => {
    await publishSite({ variables: { siteId } });
    refetch();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl text-ink">My Sites</h1>
          <p className="text-sm text-ink-400 mt-1 font-body">{sites.length} site{sites.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/sites/generate')} className="btn-gold">
            <Sparkles size={14} /> Generate with AI
          </button>
          <button className="btn-secondary">
            <Plus size={14} /> Blank Site
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sites…"
          className="input-field pl-9"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-44 shimmer-bg rounded-xl" />)}
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <div className="w-16 h-16 bg-ink-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Globe size={24} className="text-ink-300" />
          </div>
          <h2 className="font-heading font-semibold text-ink mb-2">No sites yet</h2>
          <p className="text-sm text-ink-400 font-body mb-5">Get started by generating your first site with AI.</p>
          <button onClick={() => navigate('/sites/generate')} className="btn-gold">
            <Sparkles size={14} /> Generate My First Site
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {sites.map((site: {
            id: string; name: string; status: string; subdomain: string;
            domain?: string; aiGenerated: boolean; publishedAt?: string;
            theme: { primaryColor?: string };
          }) => (
            <div key={site.id} className="card overflow-hidden group">
              {/* Preview thumbnail */}
              <div
                className="h-32 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${site.theme?.primaryColor ?? '#0D0D0F'} 0%, ${site.theme?.primaryColor ?? '#0D0D0F'}88 100%)` }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe size={32} className="text-white/20" />
                </div>
                {site.aiGenerated && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/40 rounded-full">
                    <Sparkles size={10} className="text-gold" />
                    <span className="text-2xs text-white font-heading">AI Generated</span>
                  </div>
                )}
                <span className={`absolute top-2 right-2 badge ${site.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                  {site.status}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-heading font-semibold text-ink mb-0.5 truncate">{site.name}</h3>
                <p className="text-xs text-ink-400 mb-3 truncate">{site.domain ?? `${site.subdomain}.estateedge.io`}</p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/sites/${site.id}/builder`)}
                    className="btn-secondary text-xs py-1.5 px-3 flex-1"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  {site.status !== 'published' ? (
                    <button onClick={() => handlePublish(site.id)} className="btn-primary text-xs py-1.5 px-3">
                      <Zap size={12} /> Publish
                    </button>
                  ) : (
                    <a
                      href={`https://${site.domain ?? `${site.subdomain}.estateedge.io`}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      <ExternalLink size={12} /> View
                    </a>
                  )}
                  <button className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-400 hover:text-ink transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}