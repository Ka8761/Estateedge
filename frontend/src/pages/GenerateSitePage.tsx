// EstateEdge — Generate Site Page (AI Wizard)
// Supports two modes:
//   Sync mode  (KAFKA_ENABLED=false): gateway returns completed job + siteId immediately
//   Async mode (KAFKA_ENABLED=true):  gateway returns pending job, frontend polls until done

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useLazyQuery } from '@apollo/client';
import { GENERATE_SITE_MUTATION, GENERATION_JOB_QUERY } from '../lib/apollo';
import {
  Sparkles, ChevronRight, ChevronLeft, CheckCircle,
  Loader2, MapPin, User, Palette, Target, AlertCircle
} from 'lucide-react';

const TONES = [
  { value: 'luxury',       label: 'Luxury',       desc: 'Refined, premium, elite' },
  { value: 'modern',       label: 'Modern',        desc: 'Clean, minimal, forward-thinking' },
  { value: 'professional', label: 'Professional',  desc: 'Trustworthy, established, credible' },
  { value: 'friendly',     label: 'Friendly',      desc: 'Approachable, warm, community-focused' },
  { value: 'bold',         label: 'Bold',          desc: 'Dynamic, confident, market leader' },
];

const SPECIALTIES = [
  'Luxury Homes', 'First-Time Buyers', 'Investment Properties', 'Condos & Townhomes',
  'Relocations', 'New Construction', 'Historic Homes', 'Waterfront', 'Commercial',
  'Land & Lots', 'Short Sales', 'Downsizing',
];

const STEPS = [
  { id: 1, label: 'About You', icon: User },
  { id: 2, label: 'Market',    icon: MapPin },
  { id: 3, label: 'Brand',     icon: Palette },
  { id: 4, label: 'Audience',  icon: Target },
];

const LOADING_MESSAGES = [
  'Analyzing your brand…',
  'Generating page structure…',
  'Writing your copy…',
  'Selecting your palette…',
  'Building your pages…',
  'Almost there…',
];

type GenStatus = 'idle' | 'generating' | 'polling' | 'done' | 'error';

export function GenerateSitePage() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [status, setStatus] = useState<GenStatus>('idle');
  const [jobId, setJobId]   = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [form, setForm] = useState({
    agentName:         '',
    agentTitle:        '',
    brokerage:         '',
    location:          '',
    specialties:       [] as string[],
    tone:              'luxury',
    colorPreference:   '',
    targetAudience:    '',
    additionalContext: '',
  });

  const [generateSite, { loading: mutationLoading }] = useMutation(GENERATE_SITE_MUTATION);
  const [pollJob] = useLazyQuery(GENERATION_JOB_QUERY, { fetchPolicy: 'network-only' });

  // Cycle through loading messages while generating
  useEffect(() => {
    if (status !== 'generating' && status !== 'polling') return;
    const t = setInterval(() => {
      setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(t);
  }, [status]);

  // Poll job status (async/Kafka mode)
  useEffect(() => {
    if (status !== 'polling' || !jobId) return;

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await pollJob({ variables: { jobId } });
        const job = data?.generationJob;
        if (!job) return;

        if (job.status === 'completed' && job.siteId) {
          clearInterval(pollRef.current!);
          setStatus('done');
          setTimeout(() => navigate(`/sites/${job.siteId}/builder`), 600);
        } else if (job.status === 'failed') {
          clearInterval(pollRef.current!);
          setStatus('error');
          setErrorMsg(job.error ?? 'Generation failed. Please try again.');
        }
      } catch (err) {
        console.error('[Poll] Error:', err);
      }
    }, 2500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, jobId]);

  const handleSubmit = async () => {
    setStatus('generating');
    setErrorMsg('');
    setMsgIdx(0);

    try {
      const result = await generateSite({ variables: { input: form } });
      const job = result.data?.generateSite;

      if (!job) throw new Error('No job returned from server');

      // ── Sync mode: siteId already set, navigate directly ──────────────────
      if (job.siteId) {
        setStatus('done');
        setTimeout(() => navigate(`/sites/${job.siteId}/builder`), 600);
        return;
      }

      // ── Async mode: poll until siteId appears ─────────────────────────────
      if (job.id) {
        setJobId(job.id);
        setStatus('polling');
        return;
      }

      throw new Error('Unexpected response from generation service');
    } catch (err: unknown) {
      console.error('[Generate] Error:', err);
      setStatus('error');
      const msg = (err as { graphQLErrors?: Array<{ message: string }>; message?: string });
      setErrorMsg(
        msg?.graphQLErrors?.[0]?.message ??
        msg?.message ??
        'Something went wrong. Check your Anthropic API key and try again.'
      );
    }
  };

  const update = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const toggleSpecialty = (s: string) =>
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter(x => x !== s)
        : [...f.specialties, s],
    }));

  const canNext = (step === 1 && form.agentName.trim()) || (step === 2 && form.location.trim()) || step > 2;

  // ── Loading / Done screen ─────────────────────────────────────────────────
  if (status === 'generating' || status === 'polling' || status === 'done') {
    return (
      <div className="min-h-full flex items-center justify-center p-6 bg-cream">
        <div className="max-w-md w-full text-center animate-fade-up">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-ink flex items-center justify-center transition-all duration-500 ${status === 'done' ? 'scale-110' : ''}`}>
            {status === 'done'
              ? <CheckCircle size={36} className="text-gold animate-fade-in" />
              : <Sparkles size={36} className="text-gold animate-pulse" />
            }
          </div>

          <h2 className="font-display text-3xl text-ink mb-2">
            {status === 'done' ? 'Site Created!' : 'Crafting Your Site…'}
          </h2>
          <p className="text-ink-400 font-body text-sm mb-8">
            {status === 'done'
              ? 'Redirecting you to the builder…'
              : 'Claude AI is designing your pages, writing your copy, and selecting your brand palette.'}
          </p>

          {status !== 'done' && (
            <div className="space-y-3 text-left max-w-xs mx-auto">
              {LOADING_MESSAGES.map((msg, i) => (
                <div key={msg} className={`flex items-center gap-3 transition-all duration-500 ${i === msgIdx ? 'opacity-100' : 'opacity-30'}`}>
                  {i < msgIdx
                    ? <CheckCircle size={14} className="text-sage-500 flex-shrink-0" />
                    : i === msgIdx
                    ? <Loader2 size={14} className="text-gold animate-spin flex-shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border border-ink-200 flex-shrink-0" />
                  }
                  <span className="text-sm font-heading text-ink-500">{msg}</span>
                </div>
              ))}
            </div>
          )}

          {status === 'polling' && (
            <p className="text-2xs text-ink-300 font-heading mt-6">
              This usually takes 20–40 seconds
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-full flex items-center justify-center p-6 bg-cream">
        <div className="max-w-md w-full text-center animate-fade-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={36} className="text-red-500" />
          </div>
          <h2 className="font-display text-3xl text-ink mb-2">Generation Failed</h2>
          <p className="text-ink-400 font-body text-sm mb-3">Something went wrong:</p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-red-700 font-body">{errorMsg}</p>
          </div>
          <div className="space-y-2">
            <button onClick={() => { setStatus('idle'); setStep(4); }} className="btn-primary w-full justify-center">
              Try Again
            </button>
            <button onClick={() => navigate('/sites')} className="btn-secondary w-full justify-center">
              Back to Sites
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-cream p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-gold mb-2">
            <Sparkles size={16} />
            <span className="text-xs font-heading uppercase tracking-widest">AI Site Generator</span>
          </div>
          <h1 className="font-display text-4xl text-ink">Build your site with AI</h1>
          <p className="text-ink-400 text-sm mt-2 font-body">
            Answer a few questions and Claude will generate a complete professional website for you.
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {STEPS.map(({ id, label, icon: Icon }, idx) => (
            <React.Fragment key={id}>
              <button
                onClick={() => id < step && setStep(id)}
                className={`flex items-center gap-2 text-xs font-heading font-medium transition-colors ${
                  step === id ? 'text-ink' : id < step ? 'text-gold cursor-pointer' : 'text-ink-300 cursor-default'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs transition-colors ${
                  step === id ? 'bg-ink text-white' : id < step ? 'bg-gold text-white' : 'bg-ink-100 text-ink-400'
                }`}>
                  {id < step ? <CheckCircle size={12} /> : id}
                </div>
                <span className="hidden sm:block">{label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${step > id ? 'bg-gold/50' : 'bg-ink-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form card */}
        <div className="card p-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>

          {/* Step 1: About You */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-ink text-lg">Tell us about yourself</h2>
              <div>
                <label className="label">Your Full Name *</label>
                <input type="text" value={form.agentName} onChange={update('agentName')}
                  placeholder="e.g. Sarah Mitchell" className="input-field" autoFocus />
              </div>
              <div>
                <label className="label">Title / Designation</label>
                <input type="text" value={form.agentTitle} onChange={update('agentTitle')}
                  placeholder="e.g. Realtor®, Luxury Specialist, Team Lead" className="input-field" />
              </div>
              <div>
                <label className="label">Brokerage</label>
                <input type="text" value={form.brokerage} onChange={update('brokerage')}
                  placeholder="e.g. Sotheby's International Realty" className="input-field" />
              </div>
            </div>
          )}

          {/* Step 2: Market */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-ink text-lg">Your market & specialties</h2>
              <div>
                <label className="label">Primary Market Location *</label>
                <input type="text" value={form.location} onChange={update('location')}
                  placeholder="e.g. Beverly Hills, CA" className="input-field" autoFocus />
              </div>
              <div>
                <label className="label">Specialties (select all that apply)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SPECIALTIES.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSpecialty(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-heading font-medium transition-all ${
                        form.specialties.includes(s)
                          ? 'bg-ink text-white'
                          : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Brand */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-ink text-lg">Brand & style</h2>
              <div>
                <label className="label">Brand Tone *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {TONES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, tone: t.value }))}
                      className={`p-3 rounded-lg text-left border transition-all ${
                        form.tone === t.value
                          ? 'border-ink bg-ink text-white'
                          : 'border-ink-200 hover:border-ink-400'
                      }`}
                    >
                      <div className={`text-sm font-heading font-medium ${form.tone === t.value ? 'text-white' : 'text-ink'}`}>
                        {t.label}
                      </div>
                      <div className={`text-xs ${form.tone === t.value ? 'text-white/60' : 'text-ink-400'}`}>
                        {t.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Color Preference (optional)</label>
                <input type="text" value={form.colorPreference} onChange={update('colorPreference')}
                  placeholder="e.g. navy and gold, earth tones, black and white" className="input-field" />
              </div>
            </div>
          )}

          {/* Step 4: Audience */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold text-ink text-lg">Your ideal client</h2>
              <div>
                <label className="label">Target Audience</label>
                <input type="text" value={form.targetAudience} onChange={update('targetAudience')}
                  placeholder="e.g. Luxury buyers relocating from NYC, First-time buyers under 35"
                  className="input-field" />
              </div>
              <div>
                <label className="label">Anything else you'd like Claude to know?</label>
                <textarea
                  value={form.additionalContext}
                  onChange={update('additionalContext')}
                  rows={4}
                  placeholder="Awards, unique approach, specific neighborhoods, years of experience, team size…"
                  className="input-field resize-none"
                />
              </div>
              <div className="pt-2 border-t border-ink-100">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/5 border border-gold/20">
                  <Sparkles size={16} className="text-gold flex-shrink-0" />
                  <div className="text-xs text-ink-600 font-body">
                    Claude will generate your homepage, about page, listings page, neighborhood guide,
                    and contact page — all with custom copy, layout, and SEO. This takes 20–40 seconds.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/sites')}
            className="btn-secondary"
          >
            <ChevronLeft size={16} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={mutationLoading || !form.agentName.trim() || !form.location.trim()}
              className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutationLoading
                ? <><Loader2 size={16} className="animate-spin" /> Starting…</>
                : <><Sparkles size={16} /> Generate My Site</>
              }
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
