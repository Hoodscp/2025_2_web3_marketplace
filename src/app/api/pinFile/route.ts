export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    const pinataMetadata = form.get('pinataMetadata')
    const pinataOptions = form.get('pinataOptions')

    if (!file) {
      return new Response(JSON.stringify({ error: 'file is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    }

    const PINATA_API_KEY = process.env.PINATA_API_KEY
    const PINATA_API_SECRET = process.env.PINATA_API_SECRET
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Pinata 서버 키가 설정되어 있지 않습니다.' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    const proxyForm = new FormData()
    // file은 Request.formData()에서 온 File/Blob 객체를 그대로 사용
    proxyForm.append('file', file as any)
    if (pinataMetadata)
      proxyForm.append('pinataMetadata', String(pinataMetadata))
    if (pinataOptions) proxyForm.append('pinataOptions', String(pinataOptions))

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      body: proxyForm,
      headers: {
        // Content-Type 생략(브라우저/Node가 boundary를 처리)
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      } as any,
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
