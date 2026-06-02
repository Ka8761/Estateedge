// EstateEdge — AI Assistant Page
// Powered by Claude via the Anthropic API (streamed responses)

import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { GENERATE_CONTENT_MUTATION, GENERATE_MARKET_REPORT_MUTATION } from '../lib/apollo';
import { Bot, Send, Sparkles, User, Copy, Check, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../lib/authStore';

type MessageRole = 'user' | 'assistant';
interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  type?: 'text' | 'market-report' | 'content';
}

const QUICK_PROMPTS = [
  { label: 'Write my agent bio', prompt: 'Write a compelling 200-word agent bio for a luxury real estate specialist with 10 years of experience in Beverly Hills.' },
  { label: 'Listing description', prompt: 'Write a captivating listing description for a 4-bed, 3-bath modern home with mountain views, chef kitchen, and pool in Scottsdale, AZ. Listed at $1.2M.' },
  { label: 'Neighborhood guide', prompt: 'Write an engaging neighborhood guide for Brentwood, Los Angeles — covering lifestyle, schools, amenities, and what makes it special for buyers.' },
  { label: 'Market report', prompt: 'Write a market report summary for the Miami Beach luxury condo market. Median price $850K, up 8% YoY, 45 days on market, low inventory.' },
  { label: 'Hero headline ideas', prompt: 'Give me 5 powerful hero headline options for a real estate agent website. The agent specializes in helping families find their forever home in Austin, TX.' },
  { label: 'SEO meta tags', prompt: 'Generate an SEO-optimized title tag and meta description for a real estate agent\'s home page. Agent: Marcus Chen, specializes in Silicon Valley tech-executive relocations.' },
];

export function AIAssistantPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hello${user?.firstName ? `, ${user.firstName}` : ''}! I'm your EstateEdge AI assistant, powered by Claude.\n\nI can help you with:\n- **Agent bios** and personal brand copy\n- **Listing descriptions** that sell the lifestyle\n- **Neighborhood guides** for your market\n- **Market report summaries** \n- **SEO meta tags** for your pages\n- **Hero headlines** and CTAs\n\nWhat would you like to create today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [generateContent] = useMutation(GENERATE_CONTENT_MUTATION);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const detectContentType = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('bio')) return 'bio';
    if (lower.includes('listing') || lower.includes('property')) return 'listing-description';
    if (lower.includes('neighborhood') || lower.includes('area guide')) return 'neighborhood-guide';
    if (lower.includes('market report') || lower.includes('market summary')) return 'market-report-summary';
    if (lower.includes('headline') || lower.includes('hero')) return 'hero-headline';
    if (lower.includes('seo') || lower.includes('meta')) return 'seo-meta';
    if (lower.includes('cta') || lower.includes('call to action')) return 'cta-copy';
    return 'bio'; // default
  };

  const sendMessage = async (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const contentType = detectContentType(messageText);
      const result = await generateContent({
        variables: {
          input: {
            contentType,
            prompt: messageText,
          },
        },
      });

      const aiContent = result.data?.generateContent?.content ?? 'Sorry, I could not generate a response.';
      const tokensUsed = result.data?.generateContent?.tokensUsed;

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        type: 'content',
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: `Chat cleared. What would you like to create?`,
      timestamp: new Date(),
    }]);
  };

  const formatContent = (content: string) => {
    // Simple markdown-like rendering
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ink-100 bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center">
            <Bot size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="font-heading font-semibold text-ink">AI Assistant</h1>
            <div className="flex items-center gap-1.5 text-2xs text-ink-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sage-400 inline-block" />
              <span className="font-heading">Powered by Claude</span>
            </div>
          </div>
        </div>
        <button onClick={clearChat} className="btn-secondary text-xs py-1.5 px-3">
          <RefreshCw size={12} /> New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-fade-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles size={14} className="text-gold" />
              </div>
            )}

            <div className={`max-w-2xl group ${msg.role === 'user' ? 'order-first' : ''}`}>
              <div
                className={`px-4 py-3 rounded-xl text-sm font-body leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-ink text-white rounded-br-sm'
                    : 'bg-white border border-ink-100 text-ink rounded-bl-sm shadow-card'
                }`}
                dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
              />
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    className="flex items-center gap-1 text-2xs text-ink-400 hover:text-ink transition-colors font-heading"
                  >
                    {copiedId === msg.id ? <Check size={11} className="text-sage-500" /> : <Copy size={11} />}
                    {copiedId === msg.id ? 'Copied!' : 'Copy'}
                  </button>
                  <span className="text-ink-200">·</span>
                  <span className="text-2xs text-ink-300 font-heading">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-gold" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-up">
            <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-gold animate-pulse" />
            </div>
            <div className="bg-white border border-ink-100 rounded-xl rounded-bl-sm px-4 py-3 shadow-card">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 py-2 border-t border-ink-100 bg-white flex-shrink-0 overflow-x-auto">
        <div className="flex gap-2 pb-0.5">
          {QUICK_PROMPTS.map(({ label, prompt }) => (
            <button
              key={label}
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              className="flex-shrink-0 px-3 py-1.5 bg-ink-50 hover:bg-gold/10 border border-ink-200 hover:border-gold/30 rounded-full text-xs font-heading text-ink-600 hover:text-gold transition-all disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-white border-t border-ink-100 flex-shrink-0">
        <div className="flex gap-2 items-end bg-ink-50 border border-ink-200 focus-within:border-ink focus-within:bg-white rounded-xl px-4 py-3 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to write agent copy, listing descriptions, neighborhood guides…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-400 font-body resize-none focus:outline-none min-h-[24px] max-h-32"
            rows={1}
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg bg-ink hover:bg-ink-800 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-center text-2xs text-ink-300 font-heading mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}