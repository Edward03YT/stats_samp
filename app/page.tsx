'use client'

import { useState, useEffect, useRef } from 'react'

interface ServerInfo {
  hostname: string
  address: string
  port: number
  players: number
  maxPlayers: number
  gamemode: string
  language: string
  version: string
  password: boolean
  ping: number
  online: boolean
}

export default function Home() {
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('7777')
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(5)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchServerData = async (showLoading = true) => {
    if (!ip.trim()) return

    if (showLoading) setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/server?ip=${encodeURIComponent(ip)}&port=${port}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Eroare la obținerea datelor')
      }

      setServerInfo(data)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare necunoscută')
      // Oprește auto-refresh dacă apare o eroare
      setAutoRefresh(false)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetchServerData()
  }

  // Effect pentru auto-refresh
  useEffect(() => {
    if (autoRefresh && serverInfo) {
      intervalRef.current = setInterval(() => {
        fetchServerData(false)
      }, refreshInterval * 1000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, serverInfo, ip, port, refreshInterval])

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-2 border-b border-gray-700 last:border-0">
      <span className="text-gray-400">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )

  const getPlayerCountColor = (players: number, maxPlayers: number) => {
    const percentage = (players / maxPlayers) * 100
    if (percentage >= 90) return 'text-red-400'
    if (percentage >= 70) return 'text-yellow-400'
    if (percentage >= 50) return 'text-green-400'
    return 'text-blue-400'
  }

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds} secunde`
    const minutes = Math.floor(seconds / 60)
    return `${minutes} ${minutes === 1 ? 'minut' : 'minute'}`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="container mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl font-bold text-blue-400">
            SA-MP Server Checker
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Form */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">
              Caută Server SA-MP
            </h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="ip" className="block text-sm font-medium mb-2">
                  IP Server sau DNS
                </label>
                <input
                  type="text"
                  id="ip"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="Ex: 127.0.0.1 sau og.b-hood.ro"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label htmlFor="port" className="block text-sm font-medium mb-2">
                  Port (opțional)
                </label>
                <input
                  type="number"
                  id="port"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="7777"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Se caută...
                  </>
                ) : (
                  'Caută Server'
                )}
              </button>
            </form>
          </div>

          {/* Auto-refresh controls */}
          {serverInfo && (
            <div className="bg-gray-800 rounded-lg p-4 mt-4 border border-gray-700">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">Actualizare automată</span>
                  </label>
                  {autoRefresh && (
                    <select
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>5 secunde</option>
                      <option value={10}>10 secunde</option>
                      <option value={15}>15 secunde</option>
                      <option value={30}>30 secunde</option>
                    </select>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  {lastUpdate && (
                    <span>
                      Ultima actualizare: acum {formatTimeSince(lastUpdate)}
                    </span>
                  )}
                  {autoRefresh && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Live</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 mt-6 backdrop-blur">
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Eroare
              </h3>
              <p>{error}</p>
            </div>
          )}

          {/* Server Info Display */}
          {serverInfo && (
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl mt-6 border border-gray-700">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-blue-400 mb-2">
                    {serverInfo.hostname}
                  </h3>
                  <p className="text-gray-400">{serverInfo.address}:{serverInfo.port}</p>
                </div>
                <div className="text-right">
                  <span className={`font-bold text-lg ${serverInfo.online ? 'text-green-400' : 'text-red-400'}`}>
                    {serverInfo.online ? '● Online' : '● Offline'}
                  </span>
                  {serverInfo.online && (
                    <p className="text-sm text-gray-400 mt-1">{serverInfo.ping}ms ping</p>
                  )}
                </div>
              </div>

              {serverInfo.online && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold mb-3 text-blue-300">Informații Server</h4>
                      <InfoRow label="Gamemode" value={serverInfo.gamemode} />
                      <InfoRow label="Limbă" value={serverInfo.language} />
                      <InfoRow label="Versiune" value={serverInfo.version} />
                      <InfoRow label="Parolă" value={serverInfo.password ? 'Da' : 'Nu'} />
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold mb-3 text-blue-300">Statistici</h4>
                      <div className="mb-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Jucători:</span>
                          <span className={`font-bold ${getPlayerCountColor(serverInfo.players, serverInfo.maxPlayers)}`}>
                            {serverInfo.players}/{serverInfo.maxPlayers}
                          </span>
                        </div>
                        <div className="bg-gray-600 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                            style={{ width: `${Math.min((serverInfo.players / serverInfo.maxPlayers) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-center">
                          {Math.round((serverInfo.players / serverInfo.maxPlayers) * 100)}% plin
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Player Distribution Chart with Animation */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-3 text-blue-300">Distribuție Jucători</h4>
                    <div className="flex items-center justify-center h-32">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="16"
                            fill="none"
                            className="text-gray-600"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="16"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - serverInfo.players / serverInfo.maxPlayers)}`}
                            className="text-blue-500 transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{serverInfo.players}</p>
                            <p className="text-xs text-gray-400">jucători</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {/* Recent Searches - Optional */}
          {!serverInfo && !loading && !error && (
            <div className="mt-8 text-center text-gray-400">
              <p className="mb-4">Exemple de servere populare:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['og.b-hood.ro', 'rpg.b-hood.ro', 'rpg.b-zone.ro', 'rpg.crowland.ro'].map((server) => (
                  <button
                    key={server}
                    onClick={() => {
                      setIp(server)
                      setPort('7777')
                    }}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
                  >
                    {server}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}