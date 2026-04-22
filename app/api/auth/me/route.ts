import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  const authContext = await getAuthContext(req);
  if (!authContext) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, username: authContext.username });
}
