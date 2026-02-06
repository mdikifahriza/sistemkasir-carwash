'use client';

import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-6 space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Atur Ulang Kata Sandi</p>
          <h1 className="text-2xl font-semibold text-ink">Lupa kata sandi</h1>
          <p className="text-sm text-ink-muted">Masukkan email Anda, kami akan mengirim tautan atur ulang.</p>
        </div>

        <form className="space-y-4">
          <Input label="Email" type="email" placeholder="nama@tokomu.com" />
          <Button className="w-full" type="button">
            Kirim tautan atur ulang
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link className="text-sm text-primary" href="/login">
            Kembali ke masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
