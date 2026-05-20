import { NextRequest, NextResponse } from 'next/server';
import { executeMockQueryServer } from '@/lib/supabase/mock-db-server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const result = executeMockQueryServer(payload);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: { message: error.message || 'Internal mock DB error' } },
      { status: 500 }
    );
  }
}
