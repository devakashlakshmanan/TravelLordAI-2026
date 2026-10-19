import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-card border border-slate-200 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-navy-900 text-mint flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-navy-900">
            Sign In to TravelLord AI
          </h1>
          <p className="text-xs text-slateText">
            Access saved routes, customized travel preferences, and personalized hazard updates.
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-teal hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal focus-within:bg-white transition-all">
              <Lock className="w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm font-medium focus:outline-none text-navy-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal hover:bg-teal-dark disabled:opacity-70 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200 text-center text-xs text-slateText">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-teal hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
