import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function Login() {
  const { isAuthenticated, initializing, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && isAuthenticated) {
    const dest = location.state?.from?.pathname || '/';
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter both your email and password.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success('Vault unlocked', 'Signed in to CertificateVault.');
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err?.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl cv-brand-gradient flex items-center justify-center shadow-card mb-4">
            <ShieldCheck className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary font-display">
            CertificateVault
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            One place for every achievement.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-card p-6 sm:p-7 shadow-card">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-ink-primary">Sign in to My Vault</h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Private personal access only.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-control bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-semantic-danger"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              autoComplete="email"
              leftIcon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              leftIcon={Lock}
              placeholder="Enter your vault password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              className="w-full mt-2"
            >
              Unlock Vault
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
