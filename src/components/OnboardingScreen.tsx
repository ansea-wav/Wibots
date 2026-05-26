'use client';
import { useState } from 'react';
import { apiUpdateGroupLink } from '@/lib/api';

interface OnboardingScreenProps {
  userId: string;
  onComplete: () => void;
}

export default function OnboardingScreen({ userId, onComplete }: OnboardingScreenProps) {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.includes('chat.whatsapp.com/')) {
      setError('Please provide a valid WhatsApp group invite link.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiUpdateGroupLink(userId, link);
      if (data.status === 'success') {
        onComplete();
      } else {
        setError(data.message || 'Failed to save group link.');
      }
    } catch (err) {
      setError('Network error occurred.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md p-8 rounded-2xl border border-[var(--border-subtle)] shadow-2xl relative overflow-hidden" style={{ background: 'var(--surface-panel)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-primary)]/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 text-center mb-6">
          <img src="/logo-white.png" alt="Logo" className="h-16 w-auto mx-auto mb-4 opacity-95" />
          <h2 className="text-2xl font-bold text-white mb-2">Welcome</h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            To get started, please paste your WhatsApp Group invite link below. The bot will use this as your primary group.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Group Invite Link</label>
            <input 
              type="text" 
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full px-4 py-3 bg-black/40 border border-[var(--border-subtle)] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              required
            />
          </div>
          
          {error && <div className="text-xs text-[var(--neon-red)]">{error}</div>}

          <button 
            type="submit" 
            disabled={loading || !link}
            className="w-full py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-xl font-bold transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? 'Saving...' : 'Get Started'}
          </button>
        </form>

        <div className="mt-6 text-center text-[10px] text-[var(--text-tertiary)] relative z-10">
          You can add more groups later by installing the Group Manager app from the App Store.
        </div>
      </div>
    </div>
  );
}
