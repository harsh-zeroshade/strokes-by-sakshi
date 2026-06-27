import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authAPI } from '../../api';

/**
 * This page opens in the Google OAuth popup window.
 * It receives the callback URL from the backend (with code + state),
 * then sends the auth result back to the opener window via postMessage.
 */
export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      authAPI.googleCallback({ code, state })
        .then(({ data }) => {
          if (window.opener) {
            window.opener.postMessage({
              type: 'google-auth',
              token: data.token,
              user: data.user,
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
    } else {
      // Close if no code — likely an error
      if (window.opener) {
        window.opener.postMessage({
          type: 'google-auth',
          error: 'No authorization code received.',
        }, window.location.origin);
      }
      window.close();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory dark:bg-[#1A1814]">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-terracotta border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-charcoal-muted dark:text-[#9A9590]">Completing Google sign-in...</p>
      </div>
    </div>
  );
}