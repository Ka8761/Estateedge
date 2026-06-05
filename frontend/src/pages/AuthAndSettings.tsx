// EstateEdge — Auth Pages & Settings

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION, REGISTER_MUTATION } from '../lib/apollo';
import { useAuthStore } from '../lib/authStore';
import { Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';

// ─── Shared Auth Layout ───────────────────────────────────────────────────────

function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-[0.04] bg-noise" />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gold/20 border border-gold/40 rounded-xl flex items-center justify-center">
              <span className="text-gold font-display text-lg font-bold">E</span>
            </div>
            <div>
              <div className="font-display text-white text-xl font-semibold">EstateEdge</div>
              <div className="text-2xs text-white/40 font-heading uppercase tracking-widest">Pro Platform</div>
            </div>
          </div>
          <h2 className="font-display text-4xl text-white leading-tight mb-6">
            The future of real estate is here.
          </h2>
          <p className="text-white/50 font-body text-sm leading-relaxed mb-8">
            AI-powered websites, intelligent lead management, and market intelligence tools — everything you need to dominate your market.
          </p>
          <div className="space-y-3">
            {[
              'Generate a complete agent website in 60 seconds',
              'AI scores and prioritizes your leads automatically',
              'Smart SEO that keeps you ahead of competitors',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={10} className="text-gold" />
                </div>
                <span className="text-white/70 text-sm font-body">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center">
              <span className="text-gold font-display text-sm font-bold">E</span>
            </div>
            <span className="font-display text-ink text-xl font-semibold">EstateEdge</span>
          </div>
          <h1 className="font-display text-3xl text-ink mb-1">{title}</h1>
          <p className="text-sm text-ink-400 font-body mb-7">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await loginMutation({ variables: { input: { email, password } } });
      const { user, accessToken, refreshToken } = result.data.login;
      login(user, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError('Invalid email or password.');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your EstateEdge account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" className="input-field" required autoFocus
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Password</label>
            <a href="#" className="text-xs text-gold hover:text-gold-500 font-heading">Forgot password?</a>
          </div>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className="input-field pr-10" required
            />
            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-500 font-heading">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Sign In
        </button>
      </form>
      <p className="text-center text-sm text-ink-400 font-body mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-gold hover:text-gold-500 font-heading font-medium">Create one free</Link>
      </p>
    </AuthLayout>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');

  const [registerMutation, { loading }] = useMutation(REGISTER_MUTATION);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  try {
    const result = await registerMutation({
      variables: {
        input: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
        },
      },
    });

    if (!result.data) {
      throw new Error('No data returned');
    }

    const { user, accessToken, refreshToken } = result.data.register;

    login(user, accessToken, refreshToken);
    localStorage.setItem('ee_access_token', accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    navigate('/sites/generate');
  } catch (err) {
    console.error(err);
    setError(err.toString());
  }
};

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <AuthLayout title="Create your account" subtitle="Start building your real estate presence today">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First Name</label>
            <input type="text" value={form.firstName} onChange={upd('firstName')} placeholder="Sarah" className="input-field" required />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input type="text" value={form.lastName} onChange={upd('lastName')} placeholder="Mitchell" className="input-field" required />
          </div>
        </div>
        <div>
          <label className="label">Email Address</label>
          <input type="email" value={form.email} onChange={upd('email')} placeholder="you@example.com" className="input-field" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" value={form.password} onChange={upd('password')} placeholder="At least 8 characters" className="input-field" required minLength={8} />
        </div>
        {error && <p className="text-xs text-red-500 font-heading">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3 disabled:opacity-50">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Create Free Account
        </button>
        <p className="text-center text-2xs text-ink-400 font-body">
          By creating an account, you agree to our <a href="#" className="text-gold">Terms of Service</a> and <a href="#" className="text-gold">Privacy Policy</a>.
        </p>
      </form>
      <p className="text-center text-sm text-ink-400 font-body mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-gold hover:text-gold-500 font-heading font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: '',
    bio: '',
    licenseNumber: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ firstName: form.firstName, lastName: form.lastName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 animate-fade-up">
        <h1 className="font-display text-3xl text-ink">Settings</h1>
        <p className="text-sm text-ink-400 mt-1 font-body">Manage your profile and account preferences</p>
      </div>

      <div className="space-y-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {/* Profile */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-ink mb-4 pb-3 border-b border-ink-100">Profile Information</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 border-2 border-gold/20 flex items-center justify-center">
                <span className="font-display text-2xl text-gold">
                  {form.firstName?.[0]}{form.lastName?.[0]}
                </span>
              </div>
              <div>
                <button type="button" className="btn-secondary text-xs py-1.5 px-3">Change Photo</button>
                <p className="text-2xs text-ink-400 mt-1 font-body">JPG, PNG up to 5MB</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">First Name</label>
                <input type="text" value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} className="input-field" /></div>
              <div><label className="label">Last Name</label>
                <input type="text" value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} className="input-field" /></div>
            </div>
            <div><label className="label">Email Address</label>
              <input type="email" value={form.email} className="input-field bg-ink-50" readOnly /></div>
            <div><label className="label">Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+1 (310) 555-0192" className="input-field" /></div>
            <div><label className="label">License Number</label>
              <input type="text" value={form.licenseNumber} onChange={e => setForm(f => ({...f, licenseNumber: e.target.value}))} placeholder="DRE #01234567" className="input-field" /></div>
            <div><label className="label">Bio</label>
              <textarea rows={3} value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} className="input-field resize-none" placeholder="Tell clients about yourself…" /></div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="btn-primary">{saved ? '✓ Saved' : 'Save Changes'}</button>
            </div>
          </form>
        </div>

        {/* Integrations */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-ink mb-4 pb-3 border-b border-ink-100">Integrations</h2>
          <div className="space-y-3">
            {[
              { name: 'Google Analytics', desc: 'Track detailed visitor behavior', connected: true },
              { name: 'IDX / MLS Feed', desc: 'Sync live property listings', connected: false },
              { name: 'Mailchimp', desc: 'Email marketing automation', connected: false },
              { name: 'Follow Up Boss', desc: 'CRM sync for lead management', connected: true },
            ].map(({ name, desc, connected }) => (
              <div key={name} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-heading font-medium text-ink">{name}</div>
                  <div className="text-xs text-ink-400 font-body">{desc}</div>
                </div>
                <button className={connected ? 'btn-secondary text-xs py-1.5 px-3' : 'btn-primary text-xs py-1.5 px-3'}>
                  {connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card p-6 border-red-200">
          <h2 className="font-heading font-semibold text-red-600 mb-3">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-heading font-medium text-ink">Delete Account</div>
              <div className="text-xs text-ink-400 font-body">Permanently delete your account and all sites</div>
            </div>
            <button className="px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-heading transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}