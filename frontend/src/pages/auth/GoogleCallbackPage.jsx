import { useEffect, useRef } from 'react';
import { authAPI } from '../../api';

/**
 * Opens in the Google OAuth popup.
 * Reads code+state directly from window.location.search (no React Router dependency)
 * so it works regardless of router hydration timing.
 */
export default function GoogleCallbackPage() {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    // Read directly from the real URL — bypasses any router parsing issues
    const params = new URLSearchParams(window.location.search);
    const code  = params.get('code');
    const state = params.get('state');

    const sendError = (msg) => {
      if (window.opener) {
        window.opener.postMessage({ type: 'google-auth', error: msg }, window.location.origin);
      }
      window.close();
    };

    if (!code) {
      // Log what we actually got for debugging
      console.error('GoogleCallback: no code found. search=', window.location.search, 'href=', window.location.href);
      sendError('No authorization code received.');
      return;
    }

    authAPI.googleCallback({ code, state })
      .then(({ data }) => {
        if (window.opener) {
          window.opener.postMessage({
            type: 'google-auth',
            token: data.token,
            user:  data.user,
          }, window.location.origin);
        }
      })
      .catch((err) => {
        if (window.opener) {
          window.opener.postMessage({
            type: 'google-auth',
            error: err.response?.data?.message || 'Google authentication failed.',
          }, window.location.origin);
        }
      })
      .finally(() => {
        window.close();
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#FAF7F2',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid #C7694F', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ fontSize: 14, color: '#6B6B6B', fontFamily: 'Inter, sans-serif' }}>
          Completing Google sign-in…
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
