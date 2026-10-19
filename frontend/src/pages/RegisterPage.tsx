import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, register } = useAuth();

  const redirectTarget = searchParams.get('redirect') || (location.state as any)?.from?.pathname || '/app';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate(redirectTarget, { replace: true });
    }
  }, [user, authLoading, redirectTarget, navigate]);

  // Live password validation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please acknowledge the terms of use and safety transparency disclaimer.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please ensure your password satisfies all security requirements.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register(name, email, password);
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check details or try another email.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-card border border-slate-200 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-navy-900 text-mint flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-navy-900">
            Create Free Account
          </h1>
          <p className="text-xs text-slateText">
            Join TravelLord AI to save routes, report community hazards, and receive corridor alerts.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-alertRed flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal focus-within:bg-white transition-all">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full bg-transparent text-sm font-medium focus:outline-none text-navy-900"
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Create Password
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal focus-within:bg-white transition-all">
              <Lock className="w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm font-medium focus:outline-none text-navy-900"
              />
            </div>

            {/* Password checklist */}
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-500">
              <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-700 font-semibold' : ''}`}>
                <CheckCircle2 className={`w-3 h-3 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                Min 8 characters
              </span>
              <span className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-700 font-semibold' : ''}`}>
                <CheckCircle2 className={`w-3 h-3 ${hasUpper ? 'text-emerald-600' : 'text-slate-300'}`} />
                1 Uppercase letter
              </span>
              <span className={`flex items-center gap-1 ${hasLower ? 'text-emerald-700 font-semibold' : ''}`}>
                <CheckCircle2 className={`w-3 h-3 ${hasLower ? 'text-emerald-600' : 'text-slate-300'}`} />
                1 Lowercase letter
              </span>
              <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-semibold' : ''}`}>
                <CheckCircle2 className={`w-3 h-3 ${hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
                1 Number
              </span>
            </div>
          </div>

          <label className="flex items-start gap-2 pt-1 text-xs text-slateText cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded accent-teal"
            />
            <span>
              I understand that TravelLord AI is an evidence aggregation tool and the absence of an alert is not a guarantee of safety.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal hover:bg-teal-dark disabled:opacity-70 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200 text-center text-xs text-slateText">
          Already registered?{' '}
          <Link
            to={`/login${redirectTarget !== '/app' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`}
            className="font-bold text-teal hover:underline"
          >
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
