import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
    } catch {}
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-charcoal-muted">Please sign in to view your profile.</p>
          <Link to="/login" className="inline-block mt-4 text-sm text-terracotta hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen px-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center text-xl font-display text-charcoal">
            {user.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-display text-charcoal">{user.name}</h1>
            <p className="text-sm text-charcoal-muted">{user.email}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <nav className="space-y-1">
            {[
              { label: 'Profile', path: '/account' },
              { label: 'Orders', path: '/account/orders' },
              { label: 'Custom Orders', path: '/account/custom-orders' },
              { label: 'Wishlist', path: '/account/wishlist' },
            ].map(link => (
              <Link key={link.path} to={link.path}
                className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === link.path ? 'bg-cream text-charcoal font-medium' : 'text-charcoal-muted hover:text-charcoal'
                }`}>
                {link.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded-lg text-sm text-charcoal-muted hover:text-error transition-colors">
              Sign Out
            </button>
          </nav>

          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-charcoal-muted mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted" />
              </div>
              <div>
                <label className="block text-sm text-charcoal-muted mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted" />
              </div>
              <div>
                <label className="block text-sm text-charcoal-muted mb-1">Bio</label>
                <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3}
                  className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted resize-none" />
              </div>
              <button type="submit" disabled={saving}
                className="px-8 py-3 bg-charcoal text-ivory text-sm uppercase tracking-wider rounded-lg hover:bg-charcoal-light transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}