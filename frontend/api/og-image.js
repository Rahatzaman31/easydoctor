import { ImageResponse } from '@vercel/og'

export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url)
    
    const name = searchParams.get('name') || 'Doctor Name'
    const category = searchParams.get('category') || 'Specialist'
    const degrees = searchParams.get('degrees') || ''
    const imageUrl = searchParams.get('image') || ''
    const rating = searchParams.get('rating') || '5.0'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            backgroundColor: '#ffffff',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              width: '400px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0d9488',
              padding: '40px',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                style={{
                  width: '280px',
                  height: '280px',
                  borderRadius: '20px',
                  objectFit: 'cover',
                  border: '6px solid white',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '280px',
                  height: '280px',
                  borderRadius: '20px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '6px solid white',
                }}
              >
                <svg
                  width="140"
                  height="140"
                  viewBox="0 0 24 24"
                  fill="#0d9488"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
            )}
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '50px 60px',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#0d9488',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: '30px',
                  fontSize: '24px',
                  fontWeight: '600',
                }}
              >
                {category}
              </div>
            </div>

            <div
              style={{
                fontSize: '52px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '16px',
                lineHeight: 1.2,
              }}
            >
              {name}
            </div>

            <div
              style={{
                fontSize: '28px',
                color: '#4b5563',
                marginBottom: '24px',
                lineHeight: 1.4,
              }}
            >
              {degrees}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  width="32"
                  height="32"
                  viewBox="0 0 20 20"
                  fill={star <= Math.round(parseFloat(rating)) ? '#facc15' : '#d1d5db'}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginLeft: '8px',
                }}
              >
                {rating}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '40px',
                paddingTop: '30px',
                borderTop: '2px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: '#0d9488',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: '26px',
                    fontWeight: '600',
                    color: '#0d9488',
                  }}
                >
                  ইজি ডক্টর রংপুর
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e) {
    console.error('OG Image generation error:', e)
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}
