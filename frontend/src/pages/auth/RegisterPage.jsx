import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import OtpInput from '../../components/ui/OtpInput';

export default function RegisterPage() {
  const { register, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // form | otp
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Send OTP first — stores name + password server-side temporarily
      await sendOtp({
        email: form.email,
        type: 'register',
        name: form.name,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {}).flat().join(', ') || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (code) => {
    setError('');
    setLoading(true);
    try {
      const data = await verifyOtp({ email: form.email, code, type: 'register' });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpBack = (action) => {
    if (action === 'resend') {
      sendOtp({
        email: form.email,
        type: 'register',
        name: form.name,
        password: form.password,
        password_confirmation: form.password_confirmation,
      }).catch(() => {});
      return;
    }
    setStep('form');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {step === 'otp' ? (
            <OtpInput
              key="otp"
              email={form.email}
              type="register"
              onVerify={handleOtpVerify}
              onBack={handleOtpBack}
              loading={loading}
            />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-10">
                <h1 className="text-3xl font-display text-charcoal dark:text-[#F0EDE8]">Join the Community</h1>
                <p className="mt-2 text-charcoal-muted dark:text-[#9A9590]">Create your account to start collecting</p>
              </div>

              {error && <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error mb-5">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-charcoal-muted dark:text-[#9A9590] mb-1">Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-transparent border border-border dark:border-white/10 rounded-lg text-charcoal dark:text-[#F0EDE8] focus:outline-none focus:border-charcoal-muted" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm text-charcoal-muted dark:text-[#9A9590] mb-1">Email</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-transparent border border-border dark:border-white/10 rounded-lg text-charcoal dark:text-[#F0EDE8] focus:outline-none focus:border-charcoal-muted" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-sm text-charcoal-muted dark:text-[#9A9590] mb-1">Password</label>
                  <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 bg-transparent border border-border dark:border-white/10 rounded-lg text-charcoal dark:text-[#F0EDE8] focus:outline-none focus:border-charcoal-muted" placeholder="Min 8 characters" />
                </div>
                <div>
                  <label className="block text-sm text-charcoal-muted dark:text-[#9A9590] mb-1">Confirm Password</label>
                  <input type="password" required value={form.password_confirmation} onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                    className="w-full px-4 py-3 bg-transparent border border-border dark:border-white/10 rounded-lg text-charcoal dark:text-[#F0EDE8] focus:outline-none focus:border-charcoal-muted" placeholder="Confirm password" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814] text-sm uppercase tracking-wider rounded-lg hover:bg-charcoal-light dark:hover:bg-white transition-colors disabled:opacity-50">
                  {loading ? 'Sending Code...' : 'Create Account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-charcoal-muted dark:text-[#9A9590]">
                Already have an account?{' '}
                <Link to="/login" className="text-terracotta hover:underline">Sign in</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}