import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {}).flat().join(', ') || 'Registration failed');
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-display text-charcoal">Join the Community</h1>
          <p className="mt-2 text-charcoal-muted">Create your account to start collecting</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error">{error}</div>}
          <div>
            <label className="block text-sm text-charcoal-muted mb-1">Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-charcoal focus:outline-none focus:border-charcoal-muted" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm text-charcoal-muted mb-1">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-charcoal focus:outline-none focus:border-charcoal-muted" placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm text-charcoal-muted mb-1">Password</label>
            <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-charcoal focus:outline-none focus:border-charcoal-muted" placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-sm text-charcoal-muted mb-1">Confirm Password</label>
            <input type="password" required value={form.password_confirmation} onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
              className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-charcoal focus:outline-none focus:border-charcoal-muted" placeholder="Confirm password" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-charcoal text-ivory text-sm uppercase tracking-wider rounded-lg hover:bg-charcoal-light transition-colors disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-charcoal-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-terracotta hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}