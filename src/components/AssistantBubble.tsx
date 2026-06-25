'use client';
import { useState, useEffect, useRef } from 'react';

interface AssistantBubbleProps {
  userId: string;
  tutorialActive: boolean;
  tutorialStep: number;
  onNextTutorialStep: () => void;
  onCompleteTutorial: () => void;
  targetSelector: string | null;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export default function AssistantBubble({
  userId,
  tutorialActive,
  tutorialStep,
  onNextTutorialStep,
  onCompleteTutorial,
  targetSelector,
}: AssistantBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Halo! Saya YAY Assistant. Ada yang bisa saya bantu hari ini?' }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  // Position coordinates for the bubble during the tutorial
  const [bubbleCoords, setBubbleCoords] = useState<{
    x: number;
    y: number;
    isCenter: boolean;
    isPositioned: boolean;
    placement?: 'top' | 'bottom';
    caretOffset?: number;
  }>({
    x: 0,
    y: 0,
    isCenter: true,
    isPositioned: false,
    placement: 'top',
    caretOffset: 0,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Recalculate coordinates during tutorial steps
  useEffect(() => {
    if (!tutorialActive) {
      setBubbleCoords({ x: 0, y: 0, isCenter: false, isPositioned: false, placement: 'top', caretOffset: 0 });
      return;
    }

    // Step 1: Intro, Step 5: Grand Finale -> center of the screen
    if (tutorialStep === 1 || tutorialStep === 5) {
      setBubbleCoords({ x: 0, y: 0, isCenter: true, isPositioned: false, placement: 'top', caretOffset: 0 });
      return;
    }

    if (targetSelector) {
      // Proactively scroll the target element into view when the step starts
      const targetEl = document.querySelector(targetSelector);
      if (targetEl) {
        targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

      const calculatePos = () => {
        const el = document.querySelector(targetSelector);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Don't position if the element is hidden or has 0 dimensions yet
          if (rect.width === 0 || rect.height === 0) return false;
          
          const cardWidth = window.innerWidth < 640 ? 340 : 385;
          const cardHeight = 250; // Estimated height of the card
          
          // Target center coordinates
          const targetCenterX = rect.left + rect.width / 2;
          
          // Constrain X to viewport
          const minX = cardWidth / 2 + 16;
          const maxX = window.innerWidth - cardWidth / 2 - 16;
          const x = Math.max(minX, Math.min(maxX, targetCenterX));
          
          // Caret offset relative to card center
          const caretOffset = targetCenterX - x;
          const maxCaretOffset = cardWidth / 2 - 24;
          const constrainedCaretOffset = Math.max(-maxCaretOffset, Math.min(maxCaretOffset, caretOffset));
          
          // Determine placement: above or below
          // Status bar is 28px. Let's say we need at least cardHeight + 44px above the target
          const spaceAbove = rect.top - 28;
          let y = 0;
          let placement: 'top' | 'bottom' = 'top';
          
          if (spaceAbove >= cardHeight + 16) {
            // Position above target
            y = rect.top - 16;
            placement = 'top';
          } else {
            // Position below target
            y = rect.bottom + 16;
            placement = 'bottom';
          }
          
          // Ensure Y doesn't go below the viewport
          if (placement === 'bottom') {
            const maxY = window.innerHeight - cardHeight - 16;
            if (y > maxY) {
              y = maxY;
            }
          }
          
          setBubbleCoords({
            x,
            y,
            isCenter: false,
            isPositioned: true,
            placement,
            caretOffset: constrainedCaretOffset,
          });
          return true;
        }
        return false;
      };

      // Try immediately
      calculatePos();

      // Poll every 150ms to support dynamic rendering (like catalog loading)
      // and follow element if user drags the window
      const interval = setInterval(calculatePos, 150);

      window.addEventListener('resize', calculatePos);
      return () => {
        clearInterval(interval);
        window.removeEventListener('resize', calculatePos);
      };
    }
  }, [tutorialActive, tutorialStep, targetSelector]);

  // Send message to Gemini Assistant API
  const handleSendMessage = async () => {
    if (!inputText.trim() || isThinking) return;

    const userText = inputText;
    setInputText('');
    
    // Add user message to log
    const updatedMessages = [...messages, { role: 'user', text: userText } as ChatMessage];
    setMessages(updatedMessages);
    setIsThinking(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          history: updatedMessages.slice(1, -1), // skip first welcome message
        }),
      });

      const data = await res.json();
      if (data.status === 'success' && data.reply) {
        setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: 'Maaf, saya sedang mengalami kendala jaringan. Coba tanyakan lagi ya!' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: 'Koneksi gagal. Silakan coba beberapa saat lagi.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Get current tutorial text
  const getTutorialContent = () => {
    switch (tutorialStep) {
      case 1:
        return {
          title: 'Halo! Selamat datang di YAY',
          body: 'Saya adalah YAY Assistant yang siap menemani Anda mengelola panel virtual ini. Mari ikuti pengenalan singkat untuk memulai.',
          buttonText: 'Lanjut Tur',
        };
      case 2:
        return {
          title: 'Membuka Menu Utama (Start Menu)',
          body: 'Pertama-tama, mari buka Start Menu. Klik tombol logo YAY di pojok kiri bawah Dock untuk melihat daftar aplikasi.',
          buttonText: null, // waits for click
        };
      case 3:
        return {
          title: 'Pusat Aplikasi (App Store)',
          body: 'Bagus. Di dalam Start Menu, Anda dapat melihat AppStore.exe. Silakan klik ikon App Store untuk membukanya.',
          buttonText: null, // waits for click
        };
      case 4:
        return {
          title: 'Instalasi Responder Studio',
          body: 'Sekarang, mari kita pasang aplikasi Responder Studio agar bot Anda bisa merespons otomatis. Silakan klik tombol Get / Install pada aplikasi Responder Studio.\n\nSaya akan menunggu di sini sampai aplikasi selesai terpasang!',
          buttonText: null, // waits for installation
        };
      case 5:
        return {
          title: 'Selamat Datang di YAY!',
          body: 'Selamat! Aplikasi Responder Studio telah berhasil terpasang di desktop Anda. Kini, seluruh modul dasar Anda telah aktif dan siap digunakan.',
          buttonText: 'Mulai Jelajah',
        };
      default:
        return { title: '', body: '', buttonText: null };
    }
  };

  const currentTutorial = getTutorialContent();

  // If in tutorial mode
  if (tutorialActive) {
    const isCenter = bubbleCoords.isCenter || !bubbleCoords.isPositioned;
    const style: React.CSSProperties = isCenter
      ? {
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9500,
        }
      : {
          position: 'fixed',
          left: `${bubbleCoords.x}px`,
          top: `${bubbleCoords.y}px`,
          transform: bubbleCoords.placement === 'bottom' ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          zIndex: 9500,
        };

    return (
      <div
        className="transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] select-text"
        style={style}
      >
        {/* Tutorial Card */}
        <div
          className="relative w-[340px] sm:w-[385px] rounded-[1.5rem] p-6 border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-visible isolate"
          style={{
            background: 'rgba(10, 10, 15, 0.95)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
            animation: isThinking ? 'assistantPulseActive 0.7s ease-in-out infinite' : 'assistantPulseIdle 4s ease-in-out infinite',
          }}
        >
          {/* Glowing Aura Effect */}
          <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-tr from-[var(--neon-green)]/5 to-transparent -z-10 pointer-events-none" />

          {/* Assistant Face Header (OLED solid circle) */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center relative">
              <div className="w-5 h-5 rounded-full bg-black border border-white/20 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.2)]" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--neon-green)] border-2 border-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <img src="/icons.png" alt="Logo" className="w-4 h-4 rounded-md" />
                <span className="text-xs text-[var(--neon-green)] uppercase tracking-[0.15em] font-black">Assistant</span>
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Interactive Onboarding</div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-white leading-snug">{currentTutorial.title}</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
              {currentTutorial.body}
            </p>

            {/* Buttons */}
            {currentTutorial.buttonText && (
              <button
                onClick={tutorialStep === 5 ? onCompleteTutorial : onNextTutorialStep}
                className="w-full mt-2 py-3 bg-[var(--neon-green)] hover:bg-[#4fff33] text-black font-extrabold text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(57,255,20,0.25)] hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] active:scale-[0.98]"
              >
                {currentTutorial.buttonText}
              </button>
            )}

            {tutorialStep === 4 && (
              <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-[var(--text-tertiary)] bg-white/[0.02] py-2 px-4 rounded-lg border border-white/5">
                <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menunggu instalasi Responder Studio...
              </div>
            )}
          </div>

          {/* Tooltip Caret (Only when pointed to a target element) */}
          {!isCenter && (
            <div
              className="absolute -translate-x-1/2 w-0 h-0"
              style={
                bubbleCoords.placement === 'top'
                  ? {
                      left: `calc(50% + ${bubbleCoords.caretOffset || 0}px)`,
                      top: '100%',
                      borderLeft: '10px solid transparent',
                      borderRight: '10px solid transparent',
                      borderTop: '10px solid rgba(10, 10, 15, 0.95)',
                      filter: 'drop-shadow(0 2px 0 rgba(255,255,255,0.05))',
                    }
                  : {
                      left: `calc(50% + ${bubbleCoords.caretOffset || 0}px)`,
                      bottom: '100%',
                      borderLeft: '10px solid transparent',
                      borderRight: '10px solid transparent',
                      borderBottom: '10px solid rgba(10, 10, 15, 0.95)',
                      filter: 'drop-shadow(0 -2px 0 rgba(255,255,255,0.05))',
                    }
              }
            />
          )}
        </div>
      </div>
    );
  }

  // Post-Tutorial: Floating Assistant Bubble (Normal Mode)
  return (
    <div
      className="fixed z-[9200] transition-all duration-500 select-text"
      style={{
        right: '24px',
        bottom: '84px',
      }}
    >
      {/* 1. Floating Circle Trigger (Black OLED Circle) */}
      {!isOpen && (
        <div className="relative group">
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full border border-white/5 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_8px_30px_rgba(0,0,0,0.6)] bg-black"
            style={{
              animation: isThinking ? 'assistantPulseActive 0.7s ease-in-out infinite' : 'assistantPulseIdle 4s ease-in-out infinite',
            }}
          >
            <div className="w-6 h-6 rounded-full bg-black border border-white/20 shadow-[inset_0_1px_2.5px_rgba(255,255,255,0.25)]" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--neon-green)] border-2 border-black" />
          </button>
          <div className="absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3.5 py-2 bg-black/90 border border-white/10 rounded-xl text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg backdrop-blur-md">
            Tanya YAY Assistant
          </div>
        </div>
      )}

      {/* 2. Expanded Chat Panel */}
      {isOpen && (
        <div
          className="w-[350px] sm:w-[380px] h-[480px] rounded-[1.8rem] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col overflow-hidden isolate"
          style={{
            background: 'rgba(8, 8, 12, 0.96)',
            animation: 'windowOpen 0.3s var(--ease-spring) forwards',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black border border-white/10 flex items-center justify-center relative">
                <div className="w-4 h-4 rounded-full bg-black border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--neon-green)] border border-black" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <img src="/icons.png" alt="Logo" className="w-3.5 h-3.5 rounded-sm" />
                  <span className="text-[11px] text-[var(--neon-green)] uppercase tracking-[0.15em] font-black">Assistant</span>
                </div>
                <div className="text-[9px] text-[var(--text-tertiary)]">Pencarian & Informasi Fitur</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 flex items-center justify-center cursor-pointer transition-all active:scale-90"
            >
              <i className="fi fi-rr-cross text-[10px] text-white"></i>
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-[1.2rem] px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--neon-green)]/15 text-white border border-[var(--neon-green)]/20 rounded-tr-none'
                      : 'bg-white/[0.03] text-[var(--text-primary)] border border-white/5 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white/[0.03] border border-white/5 rounded-[1.2rem] rounded-tl-none px-4 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-4 border-t border-white/[0.06] bg-black/20 flex gap-2 items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tanya seputar fitur YAY..."
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[var(--neon-green)]/40 transition-colors placeholder:text-white/20"
              disabled={isThinking}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isThinking}
              className="w-10 h-10 rounded-xl bg-[var(--neon-green)] text-black flex items-center justify-center cursor-pointer transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4fff33] shadow-[0_0_15px_rgba(57,255,20,0.25)]"
            >
              <i className="fi fi-rr-paper-plane text-sm flex items-center justify-center"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
