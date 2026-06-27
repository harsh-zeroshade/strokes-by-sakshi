import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

const SEND_COOLDOWN = 30; // seconds before user can request resend

export default function OtpInput({ email, type, onVerify, onBack, loading }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newCode.every(d => d !== '') && index === 5) {
      onVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);

    // Focus the next empty field or the last field
    const nextEmpty = newCode.findIndex(d => d === '');
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs.current[focusIdx]?.focus();

    // Auto-submit if complete
    if (newCode.every(d => d !== '')) {
      onVerify(newCode.join(''));
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setCooldown(SEND_COOLDOWN);
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    // Trigger resend via parent
    onBack('resend');
  };

  const isComplete = code.every(d => d !== '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display text-charcoal dark:text-[#F0EDE8]">
          {type === 'register' ? 'Verify Your Email' : 'Two-Step Verification'}
        </h2>
        <p className="mt-2 text-sm text-charcoal-muted dark:text-[#9A9590]">
          Enter the 6-digit code sent to{' '}
          <span className="font-medium text-charcoal dark:text-[#D8D4CE]">{email}</span>
        </p>
      </div>

      {/* OTP Inputs */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            className={`w-10 sm:w-12 h-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold bg-transparent border-2 rounded-xl transition-all duration-200 outline-none
              ${digit
                ? 'border-terracotta text-charcoal dark:text-[#F0EDE8] shadow-[0_0_0_3px_rgba(199,105,79,0.12)]'
                : 'border-border dark:border-white/10 text-charcoal dark:text-[#F0EDE8]'
              }
              focus:border-terracotta focus:shadow-[0_0_0_3px_rgba(199,105,79,0.12)]
              dark:focus:border-terracotta`}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      {/* Verify Button */}
      <button
        onClick={() => onVerify(code.join(''))}
        disabled={!isComplete || loading}
        className="w-full py-3 bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814] text-sm uppercase tracking-wider rounded-xl hover:bg-charcoal-light dark:hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-ivory dark:border-[#1A1814] border-t-transparent animate-spin" />
            Verifying...
          </span>
        ) : (
          'Verify & Continue'
        )}
      </button>

      {/* Back & Resend */}
      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          onClick={() => onBack('back')}
          className="text-charcoal-muted dark:text-[#9A9590] hover:text-charcoal dark:hover:text-[#F0EDE8] transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="text-terracotta hover:underline transition-all disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
        </button>
      </div>
    </motion.div>
  );
}