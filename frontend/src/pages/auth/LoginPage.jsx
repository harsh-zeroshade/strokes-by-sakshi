import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in after auth loads, redirect away
  useEffect(() => {
    if (!loading && user) {
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  // Show spinner while auth resolves so user doesn't see a flash of the form
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(form);
      navigate(data.user?.is_admin ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display text-charcoal">Welcome Back</h1>
          <p className="mt-2 text-charcoal-muted">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error">{error}</div>
          )}
          <div>
            <label className="block text-sm text-charcoal-muted mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-charcoal focus:outline-none focus:border-charcoal-muted transition-colors"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm text-charcoal-muted mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-charcoal focus:outline-none focus:border-charcoal-muted transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-charcoal text-ivory text-sm uppercase tracking-wider rounded-lg hover:bg-charcoal-light transition-colors disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-charcoal-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-terracotta hover:underline">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}