export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    const PINATA_API_KEY = process.env.PINATA_API_KEY
    const PINATA_API_SECRET = process.env.PINATA_API_SECRET
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Pinata 서버 키가 설정되어 있지 않습니다.' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    // 클라이언트가 이미 pinataContent 형태로 보냈는지 확인
    const forwardBody =
      body && body.pinataContent
        ? body
        : {
            pinataContent: body,
            pinataMetadata: { name: (body && body.name) || 'metadata' },
            pinataOptions: { cidVersion: 1 },
          }

    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      } as any,
      body: JSON.stringify(forwardBody),
    })

    const data = await res.json().catch(() => ({}))
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}
