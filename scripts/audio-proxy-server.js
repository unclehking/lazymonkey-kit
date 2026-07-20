const http = require('http')
const https = require('https')
const net = require('net')

const HOST = '127.0.0.1'
const PORT = Number(process.env.AUDIO_PROXY_PORT || 8090)
const MAX_REDIRECTS = 5
const RESPONSE_HEADERS = [
  'accept-ranges',
  'cache-control',
  'content-length',
  'content-range',
  'content-type',
  'etag',
  'last-modified'
]

function isPrivateHostname(hostname) {
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

function send(response, status, message) {
  if (!response.headersSent) {
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' })
  }
  response.end(message)
}

function proxyAudio(request, response, target, redirectCount, referer) {
  if (!['http:', 'https:'].includes(target.protocol) || isPrivateHostname(target.hostname)) {
    send(response, 403, 'Audio host is not allowed')
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
      if (redirectCount >= MAX_REDIRECTS) {
        send(response, 508, 'Too many redirects')
        return
      }
      proxyAudio(request, response, new URL(location, target), redirectCount + 1, `${target.origin}/`)
      return
    }

    RESPONSE_HEADERS.forEach((header) => {
      const value = upstreamResponse.headers[header]
      if (value !== undefined) response.setHeader(header, value)
    })
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
    response.writeHead(upstreamResponse.statusCode || 502)
    upstreamResponse.pipe(response)
  })

  upstreamRequest.setTimeout(15000, () => upstreamRequest.destroy(new Error('Audio proxy timeout')))
  upstreamRequest.on('error', () => send(response, 502, 'Audio proxy failed'))
  response.on('close', () => upstreamRequest.destroy())
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    send(response, 405, 'Method not allowed')
    return
  }

  let target
  try {
    const requestUrl = new URL(request.url, `http://${HOST}:${PORT}`)
    target = new URL(requestUrl.searchParams.get('url') || '')
  } catch (error) {
    send(response, 400, 'Invalid audio URL')
    return
  }

  proxyAudio(request, response, target, 0, 'https://www.thttt.com/')
})

server.listen(PORT, HOST, () => {
  console.log(`Audio proxy listening on http://${HOST}:${PORT}`)
})
