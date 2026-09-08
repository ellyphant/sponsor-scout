import { useState, useRef, useEffect } from 'react';
import { auth } from '@mindstudio-ai/interface';
import { IconArrowRight, IconLock, IconArrowLeft, IconTerminal2 } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Button, LOCKUP } from './ui';
import { messageOf } from '../store';
export function Login() {
  const [email, setEmail] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const verifying = useRef(false);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown > 0]);
  async function send() {
    if (!auth.email.isValid(email) || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await auth.sendEmailCode(email.trim());
      setVerificationId(result.verificationId);
      setDigits(Array(6).fill(''));
      setCooldown(30);
      requestAnimationFrame(() => refs.current[0]?.focus());
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(
        code === 'email_not_allowed'
          ? 'This console is restricted to its operator.'
          : code === 'rate_limited'
            ? 'Too many code requests. Wait before trying again.'
            : messageOf(err),
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify(code: string) {
    if (code.length !== 6 || verifying.current) return;
    verifying.current = true;
    setBusy(true);
    setError('');
    try {
      await auth.verifyEmailCode(verificationId, code);
    } catch (err) {
      const id = (err as { code?: string }).code;
      setError(
        id === 'invalid_code'
          ? 'That code is not correct. Try again.'
          : id === 'verification_expired'
            ? 'That code expired. Request a new one.'
            : messageOf(err),
      );
      setDigits(Array(6).fill(''));
      refs.current[0]?.focus();
    } finally {
      setBusy(false);
      verifying.current = false;
    }
  }
  function change(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < 5) refs.current[index + 1]?.focus();
    if (next.every(Boolean)) void verify(next.join(''));
  }
  return (
    <main className="auth-screen">
      <div className="auth-top">
        <span>
          <IconTerminal2 size={16} /> PRIVATE OPERATOR CONSOLE
        </span>
        <span>GPT-6 ASTRA</span>
      </div>
      <div className="auth-orbit" aria-hidden="true" />
      <motion.section
        className="auth-panel"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
      >
        <img className="auth-lockup" src={LOCKUP} alt="Sponsor Scout" width="288" height="80" />
        <div className="auth-divider" />
        <span className="eyebrow">OPERATOR ACCESS</span>
        <h1>{verificationId ? 'Check your inbox.' : 'Open your desk.'}</h1>
        <p className="auth-description">
          {verificationId ? (
            <>
              A one-time code was sent to
              <br />
              <strong>{email}</strong>.
            </>
          ) : (
            'Astra researches sponsors, matches them to CoHost Club events, and drafts your outreach. You decide what sends.'
          )}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (verificationId ? verify(digits.join('')) : send());
          }}
        >
          {!verificationId ? (
            <label className="field">
              <span className="field-label">OPERATOR EMAIL</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>
          ) : (
            <div
              className={`code-boxes ${error ? 'has-error' : ''} ${busy ? 'verifying' : ''}`}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                if (text.length === 6) {
                  e.preventDefault();
                  setDigits(text.split(''));
                  void verify(text);
                }
              }}
            >
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    refs.current[index] = node;
                  }}
                  value={digit}
                  aria-label={`Code digit ${index + 1}`}
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => change(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && index) refs.current[index - 1]?.focus();
                    if (e.key === 'ArrowLeft' && index) refs.current[index - 1]?.focus();
                    if (e.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus();
                  }}
                  disabled={busy}
                />
              ))}
            </div>
          )}
          <div className="form-error" role="status">
            {error || '\u00a0'}
          </div>
          <Button
            type="submit"
            variant="primary"
            className="full-width"
            loading={busy}
            disabled={verificationId ? digits.join('').length !== 6 : !auth.email.isValid(email)}
          >
            {verificationId ? 'VERIFY & ENTER' : 'SEND CODE'}
            <IconArrowRight size={16} />
          </Button>
        </form>
        {verificationId && (
          <div className="auth-secondary">
            <button
              onClick={() => {
                setVerificationId('');
                setError('');
              }}
            >
              <IconArrowLeft size={13} />
              Change email
            </button>
            <button disabled={busy || cooldown > 0} onClick={() => void send()}>
              {cooldown ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        )}
        <div className="auth-security">
          <IconLock size={13} />
          Private console. Passwordless access.
        </div>
      </motion.section>
      <footer className="auth-footer">
        <span>RESEARCH. QUALIFY. MATCH. DRAFT.</span>
        <span>YOU MAKE THE INTRODUCTION.</span>
      </footer>
    </main>
  );
}
