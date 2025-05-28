"use client"
import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, TrendingUp, DollarSign, BarChart3, RefreshCw, AlertCircle, Zap, TestTube } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useChat } from "@ai-sdk/react"
import { CryptoStatus } from "@/components/crypto-status"

interface CryptoData {
  symbol: string
  price: number
  change24h: number
  volume24h?: number
  marketCap?: number
  lastUpdated?: string
}

export default function CryptoChatbot() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  })

  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Test VoltAgent connection
  const testVoltAgentConnection = async () => {
    setIsTestingConnection(true)
    setError(null)

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

      if (result.success) {
        setError(null)
        // Auto-fetch some data to show it's working
        await fetchCryptoData(["btc"])
      } else {
        setError("VoltAgent server bağlantısı kurulamadı. SMITHERY_API_KEY ve server durumunu kontrol edin.")
      }
    } catch (error) {
      console.error("Connection test error:", error)
      setError("VoltAgent bağlantı testi başarısız oldu.")
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Fetch real crypto data from VoltAgent
  const fetchCryptoData = async (symbols: string[]) => {
    if (!symbols || symbols.length === 0) {
      return
    }

    setIsLoadingCrypto(true)
    setError(null)

    try {
      console.log("Fetching crypto data from VoltAgent for symbols:", symbols)

      const response = await fetch("/api/crypto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_multiple_prices",
          symbols: symbols,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Received crypto data from VoltAgent:", data)

      if (data.results) {
        const validData = data.results
          .filter((result: any) => result.success && result.data)
          .map((result: any) => result.data)

        setCryptoData(validData)

        if (validData.length === 0) {
          setError("VoltAgent'tan kripto verileri alınamadı. Server bağlantısını kontrol edin.")
        }
      } else if (data.error) {
        setError(`VoltAgent Hatası: ${data.error}`)
      }
    } catch (error) {
      console.error("Error fetching crypto data from VoltAgent:", error)
      setError("VoltAgent server ile bağlantı kurulamadı. Lütfen server durumunu kontrol edin.")
    } finally {
      setIsLoadingCrypto(false)
    }
  }

  // Quick action handlers
  const handleQuickAction = async (action: string) => {
    switch (action) {
      case "Bitcoin Fiyatı":
        await fetchCryptoData(["btc"])
        handleInputChange({ target: { value: "Bitcoin fiyatı nedir?" } } as any)
        break
      case "Ethereum Analizi":
        await fetchCryptoData(["eth"])
        handleInputChange({ target: { value: "Ethereum analizi yap" } } as any)
        break
      case "Piyasa Özeti":
        await fetchCryptoData(["btc", "eth", "ada", "sol"])
        handleInputChange({ target: { value: "Piyasa özeti ver" } } as any)
        break
    }
  }

  const refreshData = () => {
    if (cryptoData.length > 0) {
      const symbols = cryptoData.map((crypto) => crypto.symbol.toLowerCase())
      fetchCryptoData(symbols)
    }
  }

  const quickActions = [
    { label: "Bitcoin Fiyatı", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Ethereum Analizi", icon: <BarChart3 className="w-4 h-4" /> },
    { label: "Piyasa Özeti", icon: <DollarSign className="w-4 h-4" /> },
  ]

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Kripto AI Asistan</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">VoltAgent Server</p>
                <Zap className="w-3 h-3 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={testVoltAgentConnection} disabled={isTestingConnection}>
              <TestTube className={`w-4 h-4 ${isTestingConnection ? "animate-pulse" : ""}`} />
              <span className="ml-1">Test</span>
            </Button>

            {cryptoData.length > 0 && (
              <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoadingCrypto}>
                <RefreshCw className={`w-4 h-4 ${isLoadingCrypto ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* VoltAgent Status */}
      <div className="p-4 pb-0">
        <CryptoStatus />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Live Crypto Data */}
      {cryptoData.length > 0 && (
        <div className="p-4 bg-white border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">VoltAgent Canlı Veriler</h3>
            <Badge variant="outline" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Gerçek Zamanlı
            </Badge>
          </div>
          <div className="flex gap-3 overflow-x-auto">
            {cryptoData.map((crypto) => (
              <Card key={crypto.symbol} className="flex-shrink-0 p-3 min-w-[140px]">
                <div className="text-center">
                  <p className="font-semibold text-sm">{crypto.symbol}</p>
                  <p className="text-lg font-bold">${crypto.price.toLocaleString()}</p>
                  <Badge
                    variant={crypto.change24h >= 0 ? "default" : "destructive"}
                    className={`text-xs ${crypto.change24h >= 0 ? "bg-green-500" : ""}`}
                  >
                    {crypto.change24h >= 0 ? "+" : ""}
                    {crypto.change24h.toFixed(2)}%
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">VoltAgent Kripto Asistanı</h3>
            <p className="text-gray-500 mb-4">VoltAgent server üzerinden gerçek zamanlı kripto verileri!</p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.label)}
                  disabled={isLoading || isLoadingCrypto}
                >
                  {action.icon}
                  <span className="ml-1">{action.label}</span>
                </Button>
              ))}
            </div>
            <Button
              onClick={testVoltAgentConnection}
              disabled={isTestingConnection}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <TestTube className="w-4 h-4 mr-2" />
              VoltAgent Bağlantısını Test Et
            </Button>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-2 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user" ? "bg-blue-500" : "bg-gradient-to-r from-green-500 to-emerald-600"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="space-y-2">
                <Card
                  className={`p-3 ${message.role === "user" ? "bg-blue-500 text-white" : "bg-white text-gray-900"}`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </Card>

                <p className="text-xs text-gray-500 px-1">
                  {new Date(message.createdAt || Date.now()).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <Card className="p-3 bg-white">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </Card>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="flex-shrink-0 bg-white"
              onClick={() => handleQuickAction(action.label)}
              disabled={isLoading || isLoadingCrypto}
            >
              {action.icon}
              <span className="ml-1">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="VoltAgent ile kripto hakkında soru sorun..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} className="bg-blue-500 hover:bg-blue-600">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
