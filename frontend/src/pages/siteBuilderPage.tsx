// EstateEdge — Site Builder Page
// Full drag-and-drop site editor with AI content generation per block

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { SITE_QUERY, SITE_PAGES_QUERY, PUBLISH_SITE_MUTATION, GENERATE_CONTENT_MUTATION } from '../lib/apollo';
import {
  DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Layers, Eye, Zap, Sparkles, Plus, GripVertical, Settings, Trash2,
  ChevronLeft, Globe, Monitor, Smartphone, Tablet, Loader2, ArrowLeft
} from 'lucide-react';
import { useMutation as useApolloMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const UPDATE_PAGE = gql`
  mutation UpdatePage($pageId: ID!, $content: JSON) {
    updatePage(pageId: $pageId, content: $content) {
      id content
    }
  }
`;

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero Banner', icon: '🏔️', desc: 'Full-width hero with headline and CTA' },
  { type: 'bio', label: 'Agent Bio', icon: '👤', desc: 'Personal introduction with photo' },
  { type: 'listings-grid', label: 'Listings Grid', icon: '🏠', desc: 'Featured property listings grid' },
  { type: 'testimonials', label: 'Testimonials', icon: '⭐', desc: 'Client reviews and social proof' },
  { type: 'cta', label: 'Call to Action', icon: '📣', desc: 'Conversion-focused CTA section' },
  { type: 'market-report', label: 'Market Report', icon: '📊', desc: 'Local market stats and insights' },
  { type: 'neighborhood-guide', label: 'Neighborhood', icon: '🗺️', desc: 'Local area guide' },
  { type: 'stats-bar', label: 'Stats Bar', icon: '🔢', desc: 'Key numbers and achievements' },
  { type: 'contact-form', label: 'Contact Form', icon: '✉️', desc: 'Lead capture form' },
  { type: 'image-gallery', label: 'Gallery', icon: '🖼️', desc: 'Photo gallery grid' },
];

type ViewMode = 'desktop' | 'tablet' | 'mobile';

function BlockPreview({ block }: { block: { blockType: string; content: Record<string, unknown> } }) {
  const content = block.content;
  switch (block.blockType) {
    case 'hero':
      return (
        <div className="bg-ink text-white p-8 rounded-lg text-center min-h-[120px] flex flex-col items-center justify-center">
          <h2 className="font-display text-2xl mb-1">{String(content.headline ?? 'Your Compelling Headline')}</h2>
          <p className="text-white/60 text-sm mb-3">{String(content.subheadline ?? 'Supporting subheadline text')}</p>
          <button className="px-4 py-2 bg-gold text-white text-xs rounded-lg font-heading">{String(content.ctaText ?? 'Get Started')}</button>
        </div>
      );
    case 'bio':
      return (
        <div className="flex gap-4 p-4 bg-ink-50 rounded-lg">
          <div className="w-16 h-16 bg-gold/20 rounded-full flex-shrink-0 flex items-center justify-center text-2xl">👤</div>
          <div>
            <h3 className="font-heading font-semibold text-ink mb-1">{String(content.name ?? 'Agent Name')}</h3>
            <p className="text-xs text-ink-500 leading-relaxed">{String(content.bio ?? 'Agent bio text goes here...')}</p>
          </div>
        </div>
      );
    case 'stats-bar':
      return (
        <div className="grid grid-cols-3 gap-3 p-4 bg-ink-50 rounded-lg">
          {(['10+ Years', '500+ Deals', '$500M+ Sold'] as string[]).map(s => (
            <div key={s} className="text-center">
              <div className="font-display text-xl text-ink">{s.split(' ')[0]}</div>
              <div className="text-2xs text-ink-400 font-heading">{s.split(' ').slice(1).join(' ')}</div>
            </div>
          ))}
        </div>
      );
    case 'testimonials':
      return (
        <div className="p-4 bg-cream border border-ink-100 rounded-lg">
          <div className="flex gap-1 mb-2">{'★★★★★'.split('').map((s,i) => <span key={i} className="text-gold text-sm">{s}</span>)}</div>
          <p className="text-xs text-ink-600 italic mb-2">{String(content.quote ?? '"Working with this agent was an exceptional experience..."')}</p>
          <p className="text-2xs font-heading font-semibold text-ink">{String(content.author ?? '— Happy Client')}</p>
        </div>
      );
    case 'contact-form':
      return (
        <div className="p-4 bg-ink-50 rounded-lg space-y-2">
          <h3 className="font-heading font-semibold text-sm text-ink mb-2">{String(content.title ?? 'Get In Touch')}</h3>
          {['Full Name', 'Email Address', 'Phone Number'].map(ph => (
            <div key={ph} className="h-8 bg-white border border-ink-200 rounded-md flex items-center px-3">
              <span className="text-2xs text-ink-300 font-heading">{ph}</span>
            </div>
          ))}
          <div className="h-12 bg-white border border-ink-200 rounded-md" />
          <div className="h-8 bg-ink rounded-md flex items-center justify-center">
            <span className="text-2xs text-white font-heading">Send Message</span>
          </div>
        </div>
      );
    default:
      return (
        <div className="p-4 bg-ink-50 rounded-lg flex items-center gap-3">
          <span className="text-2xl">{BLOCK_TYPES.find(b => b.type === block.blockType)?.icon ?? '📄'}</span>
          <div>
            <div className="font-heading font-medium text-sm text-ink">
              {BLOCK_TYPES.find(b => b.type === block.blockType)?.label ?? block.blockType}
            </div>
            <div className="text-2xs text-ink-400">Click to edit content</div>
          </div>
        </div>
      );
  }
}

function SortableBlock({
  block, onDelete, onAIGenerate, isGenerating
}: {
  block: { id: string; blockType: string; content: Record<string, unknown> };
  onDelete: () => void;
  onAIGenerate: () => void;
  isGenerating: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="group relative border border-ink-200 hover:border-gold/50 rounded-xl overflow-hidden bg-white transition-colors">
      {/* Block toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-ink-50 border-b border-ink-100">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="text-ink-300 hover:text-ink cursor-grab active:cursor-grabbing">
            <GripVertical size={14} />
          </button>
          <span className="text-2xs font-heading font-medium text-ink-500 uppercase tracking-wide">
            {BLOCK_TYPES.find(b => b.type === block.blockType)?.label ?? block.blockType}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onAIGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1 px-2 py-1 text-2xs font-heading bg-gold/10 text-gold hover:bg-gold/20 rounded-md transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
            AI Fill
          </button>
          <button className="p-1 rounded-md hover:bg-ink-100 text-ink-400 hover:text-ink transition-colors">
            <Settings size={12} />
          </button>
          <button onClick={onDelete} className="p-1 rounded-md hover:bg-red-50 text-ink-400 hover:text-red-500 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {/* Block preview */}
      <div className="p-3">
        <BlockPreview block={block} />
      </div>
    </div>
  );
}

export function SiteBuilderPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Array<{ id: string; blockType: string; content: Record<string, unknown> }>>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [generatingBlockId, setGeneratingBlockId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'pages' | 'blocks' | 'settings'>('pages');

  const { data: siteData, loading: siteLoading } = useQuery(SITE_QUERY, { variables: { id: siteId } });
  const [publishSite, { loading: publishing }] = useMutation(PUBLISH_SITE_MUTATION);
  const [updatePage] = useMutation(UPDATE_PAGE);
  const [generateContent] = useApolloMutation(GENERATE_CONTENT_MUTATION);

  const site = siteData?.site;
  const pages = site?.pages ?? [];

  // Load blocks when page is selected
  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    // In real impl: fetch full page content via SITE_PAGES_QUERY then extract blocks
    // For now, set a few default blocks based on page type
    const page = pages.find((p: { id: string; pageType: string }) => p.id === pageId);
    if (page?.pageType === 'home') {
      setBlocks([
        { id: '1', blockType: 'hero', content: { headline: 'Find Your Dream Home', subheadline: 'Expert guidance for every step of your journey', ctaText: 'View Listings' } },
        { id: '2', blockType: 'stats-bar', content: {} },
        { id: '3', blockType: 'listings-grid', content: {} },
        { id: '4', blockType: 'testimonials', content: { quote: '"Working with this team was the best decision we made."', author: '— The Johnson Family' } },
        { id: '5', blockType: 'contact-form', content: { title: 'Start Your Journey' } },
      ]);
    } else if (page?.pageType === 'about') {
      setBlocks([
        { id: '1', blockType: 'hero', content: { headline: 'About Us', subheadline: 'Trusted real estate expertise' } },
        { id: '2', blockType: 'bio', content: {} },
        { id: '3', blockType: 'testimonials', content: {} },
      ]);
    } else {
      setBlocks([
        { id: '1', blockType: 'hero', content: {} },
        { id: '2', blockType: 'contact-form', content: {} },
      ]);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setBlocks(prev => {
      const oldIndex = prev.findIndex(b => b.id === active.id);
      const newIndex = prev.findIndex(b => b.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const addBlock = (blockType: string) => {
    const newBlock = {
      id: `${Date.now()}`,
      blockType,
      content: {},
    };
    setBlocks(prev => [...prev, newBlock]);
    setShowBlockPicker(false);
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const aiGenerateBlock = async (blockId: string, blockType: string) => {
    setGeneratingBlockId(blockId);
    try {
      const site = siteData?.site;
      const prompt = buildBlockPrompt(blockType, site);
      const result = await generateContent({
        variables: { input: { contentType: mapBlockToContentType(blockType), prompt } },
      });
      const content = result.data?.generateContent?.content ?? '';
      // Parse if JSON, otherwise use as text
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(content); } catch { parsed = { text: content }; }

      setBlocks(prev =>
        prev.map(b => b.id === blockId ? { ...b, content: { ...b.content, ...parsed } } : b)
      );
    } catch (err) {
      console.error('AI block generation failed', err);
    } finally {
      setGeneratingBlockId(null);
    }
  };

  const handlePublish = async () => {
    if (!siteId) return;
    // Save current page blocks first
    if (selectedPageId) {
      await updatePage({ variables: { pageId: selectedPageId, content: { blocks } } }).catch(console.error);
    }
    await publishSite({ variables: { siteId } });
  };

  const viewWidths: Record<ViewMode, string> = {
    desktop: 'w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[390px]',
  };

  if (siteLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-ink-50">
      {/* ── Left panel ──────────────────────────────────────────────────── */}
      <div className="w-64 bg-white border-r border-ink-100 flex flex-col flex-shrink-0">
        {/* Site name */}
        <div className="px-4 py-3 border-b border-ink-100">
          <button onClick={() => navigate('/sites')} className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink transition-colors font-heading mb-2">
            <ArrowLeft size={12} /> Back to Sites
          </button>
          <div className="font-heading font-semibold text-ink text-sm truncate">{site?.name ?? 'Loading…'}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`badge ${site?.status === 'published' ? 'badge-published' : 'badge-draft'}`}>{site?.status}</span>
          </div>
        </div>

        {/* Panel tabs */}
        <div className="flex border-b border-ink-100">
          {(['pages', 'blocks', 'settings'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPanel(p)}
              className={`flex-1 py-2 text-2xs font-heading font-medium uppercase tracking-wide transition-colors ${panel === p ? 'text-ink border-b-2 border-ink' : 'text-ink-400 hover:text-ink'}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-3">
          {panel === 'pages' && (
            <div className="space-y-1">
              {pages.map((page: { id: string; title: string; pageType: string; status: string }) => (
                <button
                  key={page.id}
                  onClick={() => handleSelectPage(page.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${selectedPageId === page.id ? 'bg-ink text-white' : 'hover:bg-ink-50 text-ink'}`}
                >
                  <Layers size={13} className={selectedPageId === page.id ? 'text-gold' : 'text-ink-400'} />
                  <span className="text-sm font-heading font-medium flex-1 truncate">{page.title}</span>
                  <span className={`badge ${page.status === 'published' ? 'badge-published' : 'badge-draft'} text-2xs`}>{page.status}</span>
                </button>
              ))}
              {pages.length === 0 && (
                <div className="text-center py-6 text-ink-400">
                  <p className="text-xs font-heading">No pages yet.</p>
                  <p className="text-2xs mt-1">Generate a site to get started.</p>
                </div>
              )}
            </div>
          )}

          {panel === 'blocks' && selectedPageId && (
            <div className="space-y-1">
              <p className="text-2xs text-ink-400 font-heading uppercase tracking-wide px-1 mb-2">Add a block</p>
              {BLOCK_TYPES.map(({ type, label, icon, desc }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gold/5 hover:border-gold/20 border border-transparent text-left transition-all group"
                >
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div>
                    <div className="text-sm font-heading font-medium text-ink group-hover:text-gold-600 transition-colors">{label}</div>
                    <div className="text-2xs text-ink-400">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {panel === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="label">Site Name</label>
                <input type="text" defaultValue={site?.name} className="input-field text-sm" />
              </div>
              <div>
                <label className="label">Custom Domain</label>
                <input type="text" placeholder="yourdomain.com" className="input-field text-sm" />
              </div>
              <div>
                <label className="label">SEO Title</label>
                <input type="text" defaultValue={site?.seo?.title} className="input-field text-sm" />
              </div>
              <div>
                <label className="label">Meta Description</label>
                <textarea rows={3} className="input-field text-sm resize-none" defaultValue={site?.seo?.description} />
              </div>
              <button className="btn-secondary w-full text-sm justify-center">Save Settings</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-12 bg-white border-b border-ink-100 flex items-center px-4 gap-3 flex-shrink-0">
          {/* View toggles */}
          <div className="flex items-center bg-ink-50 rounded-lg p-0.5 gap-0.5">
            {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as [ViewMode, React.ElementType][]).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded-md transition-colors ${viewMode === mode ? 'bg-white shadow-sm text-ink' : 'text-ink-400 hover:text-ink'}`}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {selectedPageId && (
            <button
              onClick={() => setShowBlockPicker(!showBlockPicker)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <Plus size={13} /> Add Block
            </button>
          )}
          <a
            href={`https://${site?.subdomain}.estateedge.io`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <Eye size={13} /> Preview
          </a>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="btn-gold text-xs py-1.5 px-3"
          >
            {publishing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            Publish
          </button>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center">
          {!selectedPageId ? (
            <div className="flex flex-col items-center justify-center text-center max-w-sm mt-16">
              <div className="w-16 h-16 bg-ink-50 rounded-2xl mb-4 flex items-center justify-center">
                <Layers size={24} className="text-ink-300" />
              </div>
              <h3 className="font-heading font-semibold text-ink mb-2">Select a page to edit</h3>
              <p className="text-sm text-ink-400 font-body">Choose a page from the left panel to start building.</p>
            </div>
          ) : (
            <div className={`${viewWidths[viewMode]} transition-all duration-300 space-y-3`}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.map(block => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      onDelete={() => deleteBlock(block.id)}
                      onAIGenerate={() => aiGenerateBlock(block.id, block.blockType)}
                      isGenerating={generatingBlockId === block.id}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Add block button */}
              <button
                onClick={() => { setPanel('blocks'); }}
                className="w-full border-2 border-dashed border-ink-200 hover:border-gold/40 rounded-xl py-6 flex flex-col items-center gap-2 text-ink-400 hover:text-gold transition-colors group"
              >
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-heading">Add a block</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function mapBlockToContentType(blockType: string): string {
  const map: Record<string, string> = {
    'hero': 'hero-headline',
    'bio': 'bio',
    'listings-grid': 'cta-copy',
    'testimonials': 'bio',
    'cta': 'cta-copy',
    'market-report': 'market-report-summary',
    'neighborhood-guide': 'neighborhood-guide',
    'contact-form': 'cta-copy',
  };
  return map[blockType] ?? 'bio';
}

function buildBlockPrompt(blockType: string, site: { name?: string } | null): string {
  const name = site?.name ?? 'real estate professional';
  switch (blockType) {
    case 'hero': return `Generate hero section content for ${name}. Return JSON: {"headline":"...","subheadline":"...","ctaText":"..."}`;
    case 'bio': return `Write a compelling 150-word agent bio for ${name}. Return JSON: {"name":"Agent Name","bio":"...","title":"..."}`;
    case 'testimonials': return `Write 3 realistic client testimonials for ${name}. Return JSON: {"quote":"...","author":"..."}`;
    case 'market-report': return `Write a brief market insights section for ${name}. Return JSON: {"headline":"...","summary":"...","stats":[{"label":"...","value":"..."}]}`;
    case 'neighborhood-guide': return `Write a compelling neighborhood guide intro for a real estate agent. Return JSON: {"neighborhood":"...","intro":"...","highlights":["..."]}`;
    default: return `Generate content for a ${blockType} block for ${name}'s real estate website.`;
  }
}