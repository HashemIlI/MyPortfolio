import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Certification from '@/models/Certification';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { readSanitizedJsonObject } from '@/lib/security';

const MONTH_MAP: Record<string, number> = {
  Jan: 0, January: 0, Feb: 1, February: 1, Mar: 2, March: 2,
  Apr: 3, April: 3, May: 4, Jun: 5, June: 5, Jul: 6, July: 6,
  Aug: 7, August: 7, Sep: 8, September: 8, Oct: 9, October: 9,
  Nov: 10, November: 10, Dec: 11, December: 11,
};

function parseCertDate(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  const yyyyMm = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (yyyyMm) return new Date(parseInt(yyyyMm[1], 10), parseInt(yyyyMm[2], 10) - 1, 1).getTime();
  const monthYear = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const month = MONTH_MAP[monthYear[1]];
    const year = parseInt(monthYear[2], 10);
    if (month !== undefined && !isNaN(year)) return new Date(year, month, 1).getTime();
  }
  const yearOnly = dateStr.match(/^(\d{4})$/);
  if (yearOnly) return new Date(parseInt(yearOnly[1], 10), 0, 1).getTime();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminMode = searchParams.get('admin') === 'true';
    if (adminMode) {
      const authError = await requireAuth(request);
      if (authError) return authError;
    }

    await connectDB();
    const query = adminMode ? {} : { visible: true };
    const certs = await Certification.find(query).sort({ order: 1 }).lean();

    if (!adminMode) {
      certs.sort((a, b) => parseCertDate(a.date) - parseCertDate(b.date));
    }

    return NextResponse.json(JSON.parse(JSON.stringify(certs)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const authContext = await getAuthContext(request);
    await connectDB();
    const body = await readSanitizedJsonObject<Record<string, unknown>>(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const cert = await Certification.create(body);
    revalidatePath('/');
    revalidatePath('/', 'layout');

    await logAuditEvent({
      request,
      action: 'create',
      entityType: 'certification',
      entityId: String(cert._id),
      actorUsername: authContext?.username ?? '',
      success: true,
      details: { nameEn: cert.nameEn, issuer: cert.issuer },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(cert.toObject())), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create certification' }, { status: 500 });
  }
}
