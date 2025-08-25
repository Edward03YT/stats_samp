import { NextRequest, NextResponse } from 'next/server'
import dgram from 'dgram'
import { promisify } from 'util'
import dns from 'dns'

const dnsResolve = promisify(dns.resolve4)

interface SAMPResponse {
  hostname: string
  gamemode: string
  language: string
  password: boolean
  players: number
  maxPlayers: number
  version?: string
}

async function querySAMPServer(host: string, port: number): Promise<SAMPResponse | null> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4')
    const timeout = setTimeout(() => {
      socket.close()
      resolve(null)
    }, 5000)

    // Construiește pachetul de query SA-MP
    const packet = Buffer.alloc(11)
    packet.write('SAMP', 0)
    const ipParts = host.split('.').map(part => parseInt(part))
    packet[4] = ipParts[0]
    packet[5] = ipParts[1]
    packet[6] = ipParts[2]
    packet[7] = ipParts[3]
    packet[8] = port & 0xFF
    packet[9] = (port >> 8) & 0xFF
    packet[10] = 'i'.charCodeAt(0)

    socket.send(packet, 0, packet.length, port, host, (err) => {
      if (err) {
        clearTimeout(timeout)
        socket.close()
        resolve(null)
      }
    })

    socket.on('message', (msg) => {
      clearTimeout(timeout)
      socket.close()

      try {
        let offset = 11
        if (msg.toString('ascii', 0, 4) !== 'SAMP') {
          resolve(null)
          return
        }
        const passwordFlag = msg[offset++]
        const players = msg.readUInt16LE(offset)
        offset += 2
        const maxPlayers = msg.readUInt16LE(offset)
        offset += 2
        const hostnameLength = msg.readUInt32LE(offset)
        offset += 4
        const hostname = msg.toString('ascii', offset, offset + hostnameLength)
        offset += hostnameLength
        const gamemodeLength = msg.readUInt32LE(offset)
        offset += 4
        const gamemode = msg.toString('ascii', offset, offset + gamemodeLength)
        offset += gamemodeLength
        const languageLength = msg.readUInt32LE(offset)
        offset += 4
        const language = msg.toString('ascii', offset, offset + languageLength)

        resolve({
          hostname,
          gamemode,
          language,
          password: passwordFlag === 1,
          players,
          maxPlayers,
          version: '0.3.7'
        })
      } catch (error) {
        resolve(null)
      }
    })

    socket.on('error', () => {
      clearTimeout(timeout)
      socket.close()
      resolve(null)
    })
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ip = searchParams.get('ip')
  const port = parseInt(searchParams.get('port') || '7777')

  if (!ip) {
    return NextResponse.json(
      { error: 'IP-ul este necesar' },
      { status: 400 }
    )
  }

  try {
    let resolvedIp = ip
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
      try {
        const ips = await dnsResolve(ip)
        resolvedIp = ips[0]
      } catch (error) {
        return NextResponse.json(
          { error: 'Nu s-a putut rezolva DNS-ul' },
          { status: 400 }
        )
      }
    }

    const startTime = Date.now()
    const serverData = await querySAMPServer(resolvedIp, port)
    const ping = Date.now() - startTime

    if (!serverData) {
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

    return NextResponse.json({
      ...serverData,
      address: ip,
      port: port,
      ping: ping,
      online: true
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Eroare la interogarea serverului' },
      { status: 500 }
    )
  }
}