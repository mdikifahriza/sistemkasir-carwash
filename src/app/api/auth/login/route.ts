import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Nama pengguna dan kata sandi wajib diisi' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Nama pengguna atau kata sandi salah' }, { status: 401 });
    }

    const stored = user.password || '';
    const isHashed = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');
    const isMatch = isHashed ? await bcrypt.compare(password, stored) : stored === password;

    if (!isMatch) {
      return NextResponse.json({ error: 'Nama pengguna atau kata sandi salah' }, { status: 401 });
    }

    return NextResponse.json({
      data: {
        user,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
