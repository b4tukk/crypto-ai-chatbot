"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Zap, ZapOff, Server, Globe, Settings } from "lucide-react"

interface VoltAgentStatus {
  connected: boolean
  lastCheck: Date
  error?: string
  responseTime?: number
  serverUrl?: string
  agentInfo?: any
}

export function CryptoStatus() {
  const [voltAgentStatus, setVoltAgentStatus] = useState<VoltAgentStatus>({
    connected: false,
    lastCheck: new Date(),
    serverUrl: "http://localhost:3141",
  })

  const checkVoltAgentConnection = async () => {
    const startTime = Date.now()

    try {
      const response = await fetch("/api/crypto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "test_connection",
        }),
      })

      const result = await response.json()
      const responseTime = Date.now() - startTime

      // Also get agent info
      let agentInfo = null
      try {
        const agentsResponse = await fetch("/api/crypto", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "get_agents",
          }),
        })
        const agentsResult = await agentsResponse.json()
        if (agentsResult.success && agentsResult.data && agentsResult.data.data) {
          agentInfo = agentsResult.data.data.find((agent: any) => agent.id === "crypto-mcp")
        }
      } catch (e) {
        console.log("Could not fetch agent info")
      }

      setVoltAgentStatus({
        connected: result.success,
        lastCheck: new Date(),
        error: result.success ? undefined : result.error || result.message,
        responseTime: responseTime,
        serverUrl: "http://localhost:3141",
        agentInfo: agentInfo,
      })
    } catch (error) {
      setVoltAgentStatus({
        connected: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : "VoltAgent server bağlantı hatası",
        responseTime: Date.now() - startTime,
        serverUrl: "http://localhost:3141",
      })
    }
  }

  useEffect(() => {
    checkVoltAgentConnection()
    const interval = setInterval(checkVoltAgentConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {voltAgentStatus.connected ? (
            <Zap className="w-4 h-4 text-green-500" />
          ) : (
            <ZapOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm font-medium">VoltAgent Server</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Server className="w-3 h-3 mr-1" />
            crypto-mcp
          </Badge>
          <Badge variant={voltAgentStatus.connected ? "default" : "destructive"}>
            {voltAgentStatus.connected ? "Bağlı" : "Bağlantı Yok"}
          </Badge>
        </div>
      </div>

      {voltAgentStatus.error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{voltAgentStatus.error}</span>
        </div>
      )}

      <div className="mt-1 text-xs text-gray-500">
        Son kontrol: {voltAgentStatus.lastCheck.toLocaleTimeString("tr-TR")}
        {voltAgentStatus.connected && voltAgentStatus.responseTime && (
          <span className="ml-2 text-green-600">• {voltAgentStatus.responseTime}ms</span>
        )}
      </div>

      {voltAgentStatus.connected && (
        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
          <Globe className="w-3 h-3" />
          <span>localhost:3141 - crypto-mcp agent aktif</span>
        </div>
      )}

      {voltAgentStatus.agentInfo && (
        <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
          <Settings className="w-3 h-3" />
          <span>
            Model: {voltAgentStatus.agentInfo.model} • Status: {voltAgentStatus.agentInfo.status} • Tools:{" "}
            {voltAgentStatus.agentInfo.tools?.length || 0}
          </span>
        </div>
      )}

      {voltAgentStatus.serverUrl && (
        <div className="mt-1 text-xs text-gray-400">Endpoint: {voltAgentStatus.serverUrl}</div>
      )}
    </Card>
  )
}
