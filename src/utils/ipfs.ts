import axios from 'axios'

// 기존 JWT 대신 API 키/시크릿 사용
const PINATA_API_KEY_CLIENT = process.env.NEXT_PUBLIC_PINATA_API_KEY || ''
const PINATA_API_SECRET_CLIENT = process.env.NEXT_PUBLIC_PINATA_API_SECRET || ''

const PINATA_API_KEY_SERVER =
  process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY || ''
const PINATA_API_SECRET_SERVER =
  process.env.PINATA_API_SECRET ||
  process.env.NEXT_PUBLIC_PINATA_API_SECRET ||
  ''

function hasClientKeys() {
  return (
    typeof window !== 'undefined' &&
    !!PINATA_API_KEY_CLIENT &&
    !!PINATA_API_SECRET_CLIENT
  )
}

function hasServerKeys() {
  return (
    typeof window === 'undefined' &&
    !!PINATA_API_KEY_SERVER &&
    !!PINATA_API_SECRET_SERVER
  )
}

function getDirectAuthHeaders() {
  if (hasClientKeys()) {
    return {
      pinata_api_key: PINATA_API_KEY_CLIENT,
      pinata_secret_api_key: PINATA_API_SECRET_CLIENT,
    }
  }
  if (hasServerKeys()) {
    return {
      pinata_api_key: PINATA_API_KEY_SERVER,
      pinata_secret_api_key: PINATA_API_SECRET_SERVER,
    }
  }
  return null
}

export const uploadFileToIPFS = async (file: File) => {
  const authHeaders = getDirectAuthHeaders()

  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`

  let data = new FormData()
  data.append('file', file)
  data.append('pinataMetadata', JSON.stringify({ name: file.name }))
  data.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))

  try {
    if (authHeaders) {
      // 직접 Pinata에 업로드 (클라이언트에 키/시크릿이 있거나 서버사이드)
      const res = await axios.post(url, data, {
        maxBodyLength: Infinity,
        headers: {
          // multipart/form-data 헤더는 브라우저/axios가 boundary를 자동으로 추가하므로 Content-Type 생략 가능
          ...authHeaders,
        } as any,
      })
      return res.data.IpfsHash
    } else {
      // 프록시 API로 폴백
      const proxyRes = await fetch('/api/pinFile', {
        method: 'POST',
        body: data,
      })
      if (!proxyRes.ok) {
        const text = await proxyRes.text().catch(() => '')
        throw new Error(
          `프록시 업로드 실패: ${proxyRes.status} ${proxyRes.statusText} - ${text}\n클라이언트에서 직접 업로드하려면 .env.local에 NEXT_PUBLIC_PINATA_API_KEY / NEXT_PUBLIC_PINATA_API_SECRET를 설정하거나 서버사이드 API(/api/pinFile)를 구현하세요.`
        )
      }
      const proxyData = await proxyRes.json().catch(() => ({}))
      if (!proxyData.IpfsHash) {
        throw new Error(
          `프록시 응답에 IpfsHash가 없습니다. 응답: ${JSON.stringify(
            proxyData
          )}\n서버 API를 확인하세요.`
        )
      }
      return proxyData.IpfsHash
    }
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status
      const respData = err.response?.data
      console.error('Pinata 업로드 실패', status, respData)
      if (status === 401) {
        throw new Error(
          'Pinata 인증 실패 (401). API 키/시크릿이 없거나 잘못되었거나 만료되었습니다. 환경변수를 확인하세요.'
        )
      }
      throw new Error(
        `Pinata 업로드 실패: ${status} ${JSON.stringify(
          respData || err.message
        )}`
      )
    }
    throw err
  }
}

export const uploadJSONToIPFS = async (jsonData: any) => {
  const authHeaders = getDirectAuthHeaders()

  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`

  const body = {
    pinataContent: jsonData,
    pinataMetadata: { name: jsonData?.name || 'metadata' },
    pinataOptions: { cidVersion: 1 },
  }

  try {
    if (authHeaders) {
      const res = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        } as any,
      })
      return res.data.IpfsHash
    } else {
      const proxyRes = await fetch('/api/pinJSON', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!proxyRes.ok) {
        const text = await proxyRes.text().catch(() => '')
        throw new Error(
          `프록시 메타데이터 업로드 실패: ${proxyRes.status} ${proxyRes.statusText} - ${text}\n서버 API(/api/pinJSON)를 구현하거나 NEXT_PUBLIC_PINATA_API_KEY / NEXT_PUBLIC_PINATA_API_SECRET를 설정하세요.`
        )
      }
      const proxyData = await proxyRes.json().catch(() => ({}))
      if (!proxyData.IpfsHash) {
        throw new Error(
          `프록시 응답에 IpfsHash가 없습니다. 응답: ${JSON.stringify(
            proxyData
          )}\n서버 API를 확인하세요.`
        )
      }
      return proxyData.IpfsHash
    }
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status
      const respData = err.response?.data
      console.error('Pinata 메타데이터 업로드 실패', status, respData)
      if (status === 401) {
        throw new Error('Pinata 인증 실패 (401). API 키/시크릿을 확인하세요.')
      }
      throw new Error(
        `Pinata 메타데이터 업로드 실패: ${status} ${JSON.stringify(
          respData || err.message
        )}`
      )
    }
    throw err
  }
}
