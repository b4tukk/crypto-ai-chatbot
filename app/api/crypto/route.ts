import { type NextRequest, NextResponse } from "next/server"
import {
  getCryptoPrice,
  getMultipleCryptoPrices,
  getMarketSummary,
  testVoltAgentConnection,
  getAvailableAgents,
} from "@/lib/mcp-client"

export async function POST(request: NextRequest) {
  try {
    const { action, symbol, symbols } = await request.json()

    console.log(`VoltAgent API called with action: ${action}`, { symbol, symbols })

    switch (action) {
      case "get_price":
        if (!symbol) {
          return NextResponse.json({ error: "Symbol is required" }, { status: 400 })
        }

        console.log(`Fetching price from VoltAgent server for symbol: ${symbol}`)
        const priceResult = await getCryptoPrice(symbol)
        console.log(`VoltAgent server price result for ${symbol}:`, priceResult)
        return NextResponse.json(priceResult)

      case "get_multiple_prices":
        if (!symbols || !Array.isArray(symbols)) {
          return NextResponse.json({ error: "Symbols array is required" }, { status: 400 })
        }

        console.log(`Fetching prices from VoltAgent server for symbols: ${symbols.join(", ")}`)
        const multipleResults = await getMultipleCryptoPrices(symbols)
        console.log(`VoltAgent server multiple price results:`, multipleResults)
        return NextResponse.json({ results: multipleResults })

      case "get_market_summary":
        console.log("Fetching market summary from VoltAgent server")
        const summaryResult = await getMarketSummary()
        console.log("VoltAgent server market summary result:", summaryResult)
        return NextResponse.json(summaryResult)

      case "test_connection":
        console.log("Testing VoltAgent server connection")
        const connectionTest = await testVoltAgentConnection()
        return NextResponse.json({
          success: connectionTest,
          message: connectionTest ? "VoltAgent server bağlantısı başarılı" : "VoltAgent server bağlantısı başarısız",
        })

      case "get_agents":
        console.log("Fetching available agents from VoltAgent server")
        const agentsResult = await getAvailableAgents()
        return NextResponse.json(agentsResult)

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("VoltAgent server API error:", error)
    return NextResponse.json(
      {
        error: "VoltAgent server error",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Local VoltAgent server durumunu kontrol edin: http://localhost:3141",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ error: "Symbol parameter is required" }, { status: 400 })
  }

  try {
    const result = await getCryptoPrice(symbol)
    return NextResponse.json(result)
  } catch (error) {
    console.error("VoltAgent server GET API error:", error)
    return NextResponse.json({ error: "VoltAgent server error" }, { status: 500 })
  }
}
