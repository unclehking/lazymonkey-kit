import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'

const AUDIO_PROXY_PATH = '/audio-proxy'
const FORWARDED_RESPONSE_HEADERS = [
  'accept-ranges',
  'cache-control',
  'content-length',
  'content-range',
  'content-type',
  'etag',
  'last-modified'
]

const isPrivateHostname = (hostname) => {
  const normalized = hostname.toLowerCase()
  if (normalized === 'localhost' || normalized.endsWith('.localhost')) return true

  const ipVersion = net.isIP(normalized)
  if (ipVersion === 4) {
    const octets = normalized.split('.').map(Number)
    return octets[0] === 10
      || octets[0] === 127
      || (octets[0] === 169 && octets[1] === 254)
      || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
      || (octets[0] === 192 && octets[1] === 168)
  }
  if (ipVersion === 6) {
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')
  }
  return false
}

const proxyAudioRequest = (request, response, redirectCount = 0, referer = 'https://www.thttt.com/') => {
  let target
  try {
    const requestUrl = new URL(request.url, 'http://localhost')
    target = new URL(requestUrl.searchParams.get('url') || '')
  } catch (error) {
    response.writeHead(400).end('Invalid audio URL')
    return
  }

  if (!['http:', 'https:'].includes(target.protocol) || isPrivateHostname(target.hostname)) {
    response.writeHead(403).end('Audio host is not allowed')
    return
  }

  const client = target.protocol === 'https:' ? https : http
  const headers = {
    accept: request.headers.accept || '*/*',
    'accept-encoding': 'identity',
    'user-agent': request.headers['user-agent'] || 'Mozilla/5.0',
    referer
  }
  if (request.headers.range) headers.range = request.headers.range

  const upstreamRequest = client.get(target, { headers }, (upstreamResponse) => {
    const location = upstreamResponse.headers.location
    if (location && [301, 302, 303, 307, 308].includes(upstreamResponse.statusCode)) {
      upstreamResponse.resume()
      if (redirectCount >= 5) {
        response.writeHead(508).end('Too many redirects')
        return
      }
      request.url = `${AUDIO_PROXY_PATH}?url=${encodeURIComponent(new URL(location, target).href)}`
      proxyAudioRequest(request, response, redirectCount + 1, `${target.origin}/`)
      return
    }

    FORWARDED_RESPONSE_HEADERS.forEach((header) => {
      const value = upstreamResponse.headers[header]
      if (value !== undefined) response.setHeader(header, value)
    })
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
    response.writeHead(upstreamResponse.statusCode || 502)
    upstreamResponse.pipe(response)
  })

  upstreamRequest.setTimeout(15000, () => upstreamRequest.destroy(new Error('Audio proxy timeout')))
  upstreamRequest.on('error', () => {
    if (!response.headersSent) response.writeHead(502)
    response.end('Audio proxy failed')
  })
  response.on('close', () => upstreamRequest.destroy())
}

const audioProxyPlugin = () => ({
  name: 'audio-proxy',
  configureServer(server) {
    server.middlewares.use(AUDIO_PROXY_PATH, proxyAudioRequest)
  },
  configurePreviewServer(server) {
    server.middlewares.use(AUDIO_PROXY_PATH, proxyAudioRequest)
  }
})

export default defineConfig({
  plugins: [vue(), audioProxyPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/thttt': {
        target: 'https://www.thttt.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/thttt/, '')
      }
    }
  }
}) 
