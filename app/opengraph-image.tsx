import { ImageResponse } from 'next/og';

export const alt = 'Ahmed Fouad Hashem — Data Analyst & Applied AI Specialist';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #080d08 0%, #0d1a0f 55%, #080d08 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 700,
            height: 500,
            background:
              'radial-gradient(ellipse at center, rgba(63,125,87,0.22) 0%, transparent 68%)',
            borderRadius: '50%',
          }}
        />

        {/* Monogram badge */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            border: '2px solid rgba(63,125,87,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 36,
            background: 'rgba(63,125,87,0.08)',
          }}
        >
          <span style={{ color: '#4a9463', fontSize: 32, fontWeight: 700, letterSpacing: 2 }}>
            AFH
          </span>
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 66,
            fontWeight: 700,
            color: '#f0f5f0',
            letterSpacing: -1,
            marginBottom: 18,
            textAlign: 'center',
          }}
        >
          Ahmed Fouad Hashem
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 28,
            color: '#4a9463',
            fontWeight: 500,
            letterSpacing: 1.5,
            marginBottom: 52,
            textAlign: 'center',
          }}
        >
          Data Analyst&nbsp;&nbsp;·&nbsp;&nbsp;Applied AI Specialist
        </div>

        {/* Accent rule */}
        <div
          style={{
            width: 72,
            height: 2,
            background: 'rgba(63,125,87,0.5)',
            borderRadius: 2,
          }}
        />

        {/* Bottom edge bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(63,125,87,0.7) 50%, transparent 100%)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
