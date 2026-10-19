import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit recovery request.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-card border border-slate-200 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-navy-900 text-mint flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-navy-900">
            Account Recovery
          </h1>
          <p className="text-xs text-slateText">
            Enter your account email to receive a password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Recovery Instructions Dispatched
            </div>
            <p className="leading-relaxed">
              If an account with <strong>{email}</strong> exists in our system, an email containing secure password reset instructions has been sent.
            </p>
            <div className="pt-2">
              <Link to="/login" className="font-bold text-teal hover:underline inline-flex items-center gap-1">
                Back to Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal focus-within:bg-white transition-all">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-transparent text-sm font-medium focus:outline-none text-navy-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <span>Send Recovery Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-200 text-center text-xs text-slateText">
          Remember your password?{' '}
          <Link to="/login" className="font-bold text-teal hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
