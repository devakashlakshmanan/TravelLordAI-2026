import React, { useState } from 'react';
import { HelpCircle, X, Mail, AlertTriangle, FileText, Send, CheckCircle2 } from 'lucide-react';

export const SupportModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTicketSubject('');
      setTicketMessage('');
      setIsOpen(false);
    }, 2500);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-navy-900 hover:bg-teal text-white p-3.5 rounded-full shadow-hover flex items-center gap-2 border border-slate-700 transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-mint"
        title="Help & Support Centre"
        aria-label="Open Help and Support"
      >
        <HelpCircle className="w-5 h-5 text-mint" />
        <span className="hidden sm:inline text-xs font-bold tracking-wide">Help & Support</span>
      </button>

      {/* Support Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-navy-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-mint" />
                <h3 className="font-heading font-bold text-base">TravelLord Support Centre</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
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
                    No. The India Threat Map, route risk analyzer, and official alerts are completely open to explore without registration.
                  </p>
                </details>
              </div>

              {/* Contact / Bug Report Form */}
              <div className="pt-2 border-t border-slate-200">
                <h4 className="font-heading font-bold text-sm text-navy-900 mb-2">Submit an Inquiry or Data Correction</h4>

                {submitted ? (
                  <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>Inquiry submitted successfully. A ticket ID has been generated for review.</span>
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
                      className="w-full py-2 bg-teal hover:bg-teal-dark text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Submit Ticket
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
