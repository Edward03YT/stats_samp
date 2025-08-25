import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'

const dnsResolve = promisify(dns.resolve4)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ip = searchParams.get('ip')
  const port = parseInt(searchParams.get('port') || '22005')

  if (!ip) {
    return NextResponse.json({ error: 'IP-ul este necesar' }, { status: 400 })
  }

  let resolvedIp = ip
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    try {
      const ips = await dnsResolve(ip)
      resolvedIp = ips[0]
    } catch {
      return NextResponse.json({ error: 'Nu s-a putut rezolva DNS-ul' }, { status: 400 })
    }
  }

  // Portul web este port+1
  const webPort = port + 1

  try {
    // Fetch info.json
    const infoRes = await fetch(`http://${resolvedIp}:${webPort}/info.json`, { cache: 'no-store' })
    const infoContentType = infoRes.headers.get('content-type') || ''
    if (!infoRes.ok || !infoContentType.includes('application/json')) {
      throw new Error('Serverul nu răspunde cu JSON')
    }
    const info = await infoRes.json()

    // Fetch players.json
    const playersRes = await fetch(`http://${resolvedIp}:${webPort}/players.json`, { cache: 'no-store' })
    const playersContentType = playersRes.headers.get('content-type') || ''
    if (!playersRes.ok || !playersContentType.includes('application/json')) {
      throw new Error('Serverul nu răspunde cu JSON')
    }
    const players = await playersRes.json()

    return NextResponse.json({
      hostname: info.name,
      address: ip,
      port: port,
      players: Array.isArray(players) ? players.length : 0,
      maxPlayers: info.maxplayers,
      gamemode: info.gamemode,
      language: info.language || 'N/A',
      version: info.version || 'N/A',
      password: info.password || false,
      ping: 0,
      online: true
    })
  } catch (err) {
    return NextResponse.json({
      hostname: 'Server Offline',
      address: ip,
      port: port,
      players: 0,
      maxPlayers: 0,
      gamemode: 'N/A',
      language: 'N/A',
      version: 'N/A',
      password: false,
      ping: 0,
      online: false
    })
  }
}