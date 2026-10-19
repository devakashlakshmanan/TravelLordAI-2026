import React, { useState } from 'react';
import {
  Bot, Send, Sparkles, AlertTriangle, ShieldCheck, Clock,
  ExternalLink, HelpCircle, FileText, ChevronRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { AssistantResponse, EvidenceCitation } from '../types';
import { Link } from 'react-router-dom';

const SUGGESTED_QUERIES = [
  "Are there any reported landslides or rockfalls along mountain routes?",
  "What weather alerts are active along the NH-3 Kiratpur-Manali highway corridor?",
  "Are there active elephant crossing zones or night travel bans in Bandipur?",
  "Which highway corridors currently have reported farmer or civil gatherings?",
  "Is the route from Delhi to Shimla verified 100% safe to travel right now?"
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: EvidenceCitation[];
  freshness?: string;
  isDisclaimer?: boolean;
}

export const AssistantPage: React.FC = () => {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am TravelLord AI's **Evidence-Grounded Journey Assistant**.\n\nI query active official meteorological warnings (IMD), geological landslide mappings (GSI), and verified road blockages. Ask any question regarding hazard exposure along India's travel corridors.\n\n*Safety Principle: I do not fabricate information, and I never claim any travel route is guaranteed 100% safe.*",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: q.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res: AssistantResponse = await api.queryAssistant(q);

      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.answer,
        citations: res.evidence_citations,
        freshness: res.data_freshness_status,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `⚠️ **Service Notice**: ${err.message || 'Unable to retrieve evidence. Please check connection and try again.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider mb-1">
          <Bot className="w-4 h-4 text-teal" />
          Evidence-Grounded Conversational Intelligence
        </div>
        <h1 className="font-heading font-extrabold text-3xl text-navy-900">
          AI Journey Assistant
        </h1>
        <p className="text-xs text-slateText mt-1 max-w-2xl">
          Directly grounded in authentic database records and official alerts. Inquires regarding route exposures, landslide susceptibility, and active disruptions.
        </p>
      </div>

      {/* Suggested Questions Pill Carousel */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Suggested Evidence Queries
        </span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUERIES.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              className="text-xs bg-white hover:bg-teal/10 hover:text-teal text-slate-700 font-medium px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all text-left"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Display Box */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden flex flex-col h-[550px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-navy-900 text-mint flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal text-white shadow-sm'
                    : 'bg-slate-50 text-navy-900 border border-slate-200 shadow-sm'
                }`}
              >
                <div className="prose prose-xs max-w-none text-current whitespace-pre-line font-medium">
                  {msg.text}
                </div>

                {/* Evidence Citations Footnotes if present */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Traceable Database Citations ({msg.citations.length})
                    </span>
                    <div className="space-y-1.5">
                      {msg.citations.map((c, i) => (
                        <div
                          key={i}
                          className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-navy-900">{c.title}</span>
                            <div className="text-[10px] text-slate-500">
                              Source: {c.source_name} • {c.relevance_reason}
                            </div>
                          </div>
                          <Link
                            to={`/incidents/${c.incident_id}`}
                            className="font-bold text-teal hover:underline flex items-center gap-0.5 text-[10px] flex-shrink-0"
                          >
                            Inspect <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-navy-900 text-mint flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal" />
                <span>Searching ingested bulletins, landslide maps, and active corridors...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about weather, landslides, roadblocks, or specific highways..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal font-medium"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-4 py-2.5 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
