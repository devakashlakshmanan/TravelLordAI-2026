import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bot, X, Minus, Send, Trash2, Sparkles, AlertTriangle,
  ShieldCheck, ExternalLink, RefreshCw, ChevronDown, MessageSquare,
  HelpCircle, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { api } from '../services/api';
import { AssistantResponse, EvidenceCitation } from '../types';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: EvidenceCitation[];
  freshness?: string;
  provider?: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "Are there active landslides on mountain corridors?",
  "What are the rules for Bandipur night curfew (NH-766)?",
  "How do I obtain an Inner Line Permit for Arunachal?",
  "What is the emergency helpline for National Highways?"
];

export const FloatingAssistant: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am **TravelLord AI Assistant**, powered by Groq Llama with real-time Indian travel intelligence.\n\nAsk me about documented road conditions, weather warnings (IMD), river floods (CWC), wildlife corridors, or statutory permits.\n\n*Note: I strictly ground answers in platform evidence and never declare any road 100% safe.*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;

    setErrorMsg(null);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    // Format chat history for multi-turn RAG context
    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-6)
      .map((m) => ({
        role: m.sender,
        content: m.text,
      }));

    try {
      const res: AssistantResponse = await api.queryAssistant(q, undefined, historyPayload);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        citations: res.evidence_citations,
        freshness: res.data_freshness_status,
        provider: res.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const message = err?.message || 'Unable to reach the assistant service. Please try again.';
      setErrorMsg(message);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Service Alert**: ${message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Chat cleared. Ask me any question regarding active road hazards, official alerts, or route precautions across India.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorMsg(null);
  };

  // Render markdown-like text formatting safely
  const formatMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Heading 3
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-heading font-bold text-sm text-navy-900 mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Bullet point
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().substring(2);
        return (
          <li key={idx} className="ml-3 list-disc text-slate-700 my-0.5 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: inlineFormat(itemText) }} />
          </li>
        );
      }
      // Empty line spacer
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Standard paragraph
      return (
        <p key={idx} className="my-1 leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      );
    });
  };

  // Helper for **bold** and *italic*
  const inlineFormat = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-navy-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-600">$1</em>');
  };

  // If on the full-page /assistant route, hide the floating widget to prevent redundancy
  if (location.pathname === '/assistant') {
    return null;
  }

  // Only available for logged in users
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (Collapsed State) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 bg-navy-900 hover:bg-teal text-white rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-teal/30 border border-teal/40"
          aria-label="Open TravelLord AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-mint group-hover:text-white transition-colors" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-mint rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-mint rounded-full" />
          </div>
          <span className="font-heading font-bold text-xs tracking-wide">
            Ask TravelLord AI
          </span>
        </button>
      )}

      {/* Expandable Chat Panel (Open State) */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed z-40 bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[540px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="bg-navy-900 text-white p-3.5 px-4 flex items-center justify-between border-b border-navy-800 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal/20 text-mint flex items-center justify-center flex-shrink-0 border border-teal/30">
                <Bot className="w-4 h-4 text-mint" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-xs tracking-tight text-white">
                    TravelLord AI
                  </h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-mint/20 text-mint border border-mint/30 uppercase tracking-wider">
                    Groq RAG
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-none mt-0.5">
                  Live evidence-grounded intelligence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
                title="Minimize chat"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl shadow-2xs leading-relaxed ${
                      isUser
                        ? 'bg-teal text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200 text-navy-900 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="space-y-1">
                        {formatMarkdown(msg.text)}

                        {/* Citations List if available */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Verified Evidence Sources:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.citations.map((c, idx) => (
                                <Link
                                  key={idx}
                                  to={`/incidents/${c.incident_id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-teal hover:text-white text-[10px] font-medium text-slate-700 transition-colors border border-slate-200"
                                >
                                  <ShieldCheck className="w-3 h-3 text-teal" />
                                  <span className="truncate max-w-[140px]">{c.title}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-xs w-fit text-xs text-slate-500 shadow-2xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal" />
                <span>Retrieving verified context & consulting Groq...</span>
              </div>
            )}

            {/* Quick Prompts (only shown if 1-2 messages) */}
            {messages.length <= 2 && !loading && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Suggested Queries:
                </span>
                <div className="flex flex-col gap-1.5">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="text-left px-2.5 py-1.5 rounded-xl bg-white hover:bg-teal/10 hover:text-teal border border-slate-200 text-[11px] text-slate-700 transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate">{prompt}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-teal transition-opacity flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about road conditions, permits, fog..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputQuery.trim() || loading}
                className="w-8 h-8 rounded-xl bg-teal text-white flex items-center justify-center hover:bg-teal/90 disabled:opacity-40 disabled:hover:bg-teal transition-colors flex-shrink-0 shadow-2xs"
                title="Send query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 px-1">
              <span>National Highway Helpline: <strong>1033</strong></span>
              <span>Absence of alert ≠ Safe</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
