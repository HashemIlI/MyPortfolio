import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#080d08',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          border: '1.5px solid rgba(63,125,87,0.55)',
        }}
      >
        <span
          style={{
            color: '#4a9463',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'sans-serif',
            letterSpacing: 0.5,
          }}
        >
          A
        </span>
      </div>
    ),
    { ...size }
  );
}
