'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Masuk gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-6 space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">POS PRO</p>
          <h1 className="text-2xl font-semibold text-ink">Masuk ke akun Anda</h1>
          <p className="text-sm text-ink-muted">Gunakan akun demo untuk mencoba semua fitur.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Nama Pengguna"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="owner / manager / kasir1 / kasir2"
            required
          />
          <Input
            label="Kata Sandi"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="123"
            required
          />

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk'}
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-xs text-ink-muted">
          <p className="font-semibold text-ink">Akun Demo:</p>
          <div className="grid grid-cols-2 gap-2">
            <span>owner</span>
            <span>manager</span>
            <span>kasir1</span>
            <span>kasir2</span>
            <span>password: 123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
