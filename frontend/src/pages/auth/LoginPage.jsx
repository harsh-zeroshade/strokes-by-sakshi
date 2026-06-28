import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import OtpInput from '../../components/ui/OtpInput';

const GoogleIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const { user, isAdmin, loading: authLoading, login, sendOtp, verifyOtp, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [step, setStep] = useState('form');     // 'form' | 'otp'
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // If already logged in after auth loads, redirect away
  useEffect(() => {
    if (!authLoading && user) {
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    }
  }, [authLoading, user, isAdmin, navigate]);

  // Show spinner while auth resolves so user doesn't see a flash of the form
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Password Login ──
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(form);
      navigate(data.user?.is_admin ? '/admin' : '/', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        const retry = err.response?.data?.retry_after || 60;
        setError(`Too many login attempts. Please wait ${retry} seconds before trying again.`);
      } else if (status === 422) {
        // Validation error — wrong credentials
        const msgs = err.response?.data?.errors;
        setError(msgs ? Object.values(msgs).flat().join(' ') : 'Incorrect email or password.');
      } else if (status >= 500) {
        setError('Server error. Please try again in a moment.');
      } else {
        setError('Incorrect email or password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── OTP: Send code ──
  const handleOtpSend = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await sendOtp({ email: form.email, type: 'login' });
      setStep('otp');
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setError('No account found with this email address.');
      } else if (status === 429) {
        setError('Too many attempts. Please wait a moment before trying again.');
      } else if (status >= 500) {
        setError('Server error. Please try again or use password login instead.');
      } else {
        setError(err.response?.data?.message || 'Could not send verification code. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── OTP: Verify code ──
  const handleOtpVerify = async (code) => {
    setError('');
    setSubmitting(true);
    try {
      const data = await verifyOtp({ email: form.email, code, type: 'login' });
      navigate(data.user?.is_admin ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpBack = (action) => {
    if (action === 'resend') {
      sendOtp({ email: form.email, type: 'login' }).catch(() => {});
      return;
    }
    setStep('form');
  };

  // ── Google Login ──
  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await googleLogin();
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    } catch (err) {
      if (err.message !== 'Login cancelled.') {
        setError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const isOtpFlow = mode === 'otp' || step === 'otp';

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
              type="login"
              onVerify={handleOtpVerify}
              onBack={handleOtpBack}
              loading={submitting}
            />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display text-charcoal dark:text-[#F0EDE8]">Welcome Back</h1>
                <p className="mt-2 text-charcoal-muted dark:text-[#9A9590]">Sign in to your account</p>
              </div>

              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error mb-5">{error}</div>
              )}

              {/* ── Mode Tabs ── */}
              <div className="flex mb-6 bg-cream dark:bg-[#252219] rounded-xl p-1">
                <button
                  onClick={() => { setMode('password'); setError(''); }}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-[0.2em] font-medium rounded-lg transition-all duration-200 ${
                    mode === 'password'
                      ? 'bg-ivory dark:bg-[#1e1c18] text-charcoal dark:text-[#F0EDE8] shadow-sm'
                      : 'text-charcoal-muted dark:text-[#9A9590] hover:text-charcoal dark:hover:text-[#F0EDE8]'
                  }`}
                >
                  Password
                </button>
                <button
                  onClick={() => { setMode('otp'); setError(''); }}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-[0.2em] font-medium rounded-lg transition-all duration-200 ${
                    mode === 'otp'
                      ? 'bg-ivory dark:bg-[#1e1c18] text-charcoal dark:text-[#F0EDE8] shadow-sm'
                      : 'text-charcoal-muted dark:text-[#9A9590] hover:text-charcoal dark:hover:text-[#F0EDE8]'
                  }`}
                >
                  OTP
                </button>
              </div>

              {/* ── Password Form ── */}
              {mode === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm text-charcoal-muted dark:text-[#9A9590] mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-transparent border border-border dark:border-white/10 rounded-lg text-charcoal dark:text-[#F0EDE8] focus:outline-none focus:border-charcoal-muted transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-charcoal-muted dark:text-[#9A9590] mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-3 bg-transparent border border-border dark:border-white/10 rounded-lg text-charcoal dark:text-[#F0EDE8] focus:outline-none focus:border-charcoal-muted transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814] text-sm uppercase tracking-wider rounded-lg hover:bg-charcoal-light dark:hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              )}

              {/* ── OTP Form ── */}
              {mode === 'otp' && (
                <form onSubmit={handleOtpSend} className="space-y-5">
                  <div>
                    <label className="block text-sm text-charcoal-muted dark:text-[#9A9590] mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-transparent border border-border dark:border-white/10 rounded-lg text-charcoal dark:text-[#F0EDE8] focus:outline-none focus:border-charcoal-muted transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814] text-sm uppercase tracking-wider rounded-lg hover:bg-charcoal-light dark:hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                </form>
              )}

              {/* ── Divider ── */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border dark:border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-xs text-charcoal-muted dark:text-[#9A9590] bg-ivory dark:bg-[#1A1814]">or</span>
                </div>
              </div>

              {/* ── Google Sign-In ── */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full py-3 flex items-center justify-center gap-3 border border-border dark:border-white/10 rounded-lg text-charcoal dark:text-[#F0EDE8] hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {googleLoading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-charcoal dark:border-[#F0EDE8] border-t-transparent animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="text-sm font-medium">
                  {googleLoading ? 'Connecting...' : 'Continue with Google'}
                </span>
              </button>

              <p className="mt-6 text-center text-sm text-charcoal-muted dark:text-[#9A9590]">
                Don't have an account?{' '}
                <Link to="/register" className="text-terracotta hover:underline">Create one</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}