import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Mail, AlertTriangle, FileText, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SupportModal: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.submitSupportTicket({
        subject: ticketSubject,
        description: ticketMessage,
        email: user?.email,
      });
      setSubmittedRef(res.ticket_reference);
      setTicketSubject('');
      setTicketMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (Positioned at bottom-left to avoid colliding with AI Assistant on the right) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[900] bg-navy-900 hover:bg-teal text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-hover flex items-center gap-2 border border-slate-700 transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-mint"
        title="Help & Support Centre"
        aria-label="Open Help and Support"
      >
        <HelpCircle className="w-5 h-5 text-mint" />
        <span className="hidden sm:inline text-xs font-bold tracking-wide">Help & Support</span>
      </button>

      {/* Support Drawer / Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center sm:justify-start p-4 bg-navy-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-slide-up sm:ml-4"
          >
            {/* Header */}
            <div className="bg-navy-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-mint" />
                <h3 id="support-modal-title" className="font-heading font-bold text-base">TravelLord Support Centre</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-mint"
                aria-label="Close Support Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-navy-900">
              <div className="p-3 bg-warmWhite rounded-xl border border-slate-200">
                <p className="font-medium text-slateText leading-relaxed">
                  Notice: Automated evidence query system. Official support inquiries are logged and dispatched to the platform moderation desk.
                </p>
              </div>

              {/* FAQs Accordion / Quick Answers */}
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-sm text-navy-900">Frequently Asked Questions</h4>
                <details className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 cursor-pointer">
                  <summary className="font-semibold text-slate-800">Where does the hazard information originate?</summary>
                  <p className="mt-1 text-slateText leading-normal">
                    We aggregate official alerts from the India Meteorological Department (IMD), National Disaster Management Authority (NDMA), Geological Survey of India (GSI), and verified citizen submissions.
                  </p>
                </details>

                <details className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 cursor-pointer">
                  <summary className="font-semibold text-slate-800">Why are wildlife coordinates fuzzed?</summary>
                  <p className="mt-1 text-slateText leading-normal">
                    In strict compliance with wildlife protection protocols, endangered animal coordinates are broadened to regional corridors to prevent poaching and harassment.
                  </p>
                </details>

                <details className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 cursor-pointer">
                  <summary className="font-semibold text-slate-800">Is an account mandatory?</summary>
                  <p className="mt-1 text-slateText leading-normal">
                    Public visitors can view the landing page, marketing overview, and official source transparency. Operational platform features—including Journey Planning, the complete Threat Centre radar, Citizen Reporting, and the AI Assistant—require a signed-in account to ensure data integrity and personalized corridor safety.
                  </p>
                </details>
              </div>

              {/* Contact / Bug Report Form */}
              <div className="pt-2 border-t border-slate-200">
                <h4 className="font-heading font-bold text-sm text-navy-900 mb-2">Submit an Inquiry or Data Correction</h4>

                {error && (
                  <div className="p-3 mb-3 bg-red-50 text-red-900 border border-red-200 rounded-xl flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-alertRed flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {submittedRef ? (
                  <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span>Inquiry Logged Successfully</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Your inquiry has been recorded under tracking reference <strong className="font-mono text-navy-900">{submittedRef}</strong>. The moderation desk reviews active corridors periodically.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmittedRef(null)}
                      className="mt-2 text-xs font-bold text-teal hover:underline"
                    >
                      Submit another inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Subject</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Inaccurate road status on NH-44"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Description</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Describe the issue, highway stretch, or question..."
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 bg-teal hover:bg-teal-dark disabled:opacity-75 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {loading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Ticket</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
