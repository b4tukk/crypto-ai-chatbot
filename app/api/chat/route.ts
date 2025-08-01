import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
// Import VoltAgent client utilities
import * as voltAgentClient from "@/lib/mcp-client"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const lastMessage = messages[messages.length - 1]?.content || ""

    // Extract crypto symbols from the message
    const cryptoSymbols = extractCryptoSymbols(lastMessage)
    let contextData = ""

    // Get real crypto data from VoltAgent if symbols are mentioned
    if (cryptoSymbols.length > 0) {
      try {
        const pricePromises = cryptoSymbols.map((symbol) => voltAgentClient.getCryptoPrice(symbol))
        const priceResults = await Promise.all(pricePromises)

        const validResults = priceResults.filter((result) => result.success && result.data)

        if (validResults.length > 0) {
          contextData = `\n\nVoltAgent'tan güncel kripto verileri:\n${validResults
            .map((result) => {
              const data = result.data!
              return `${data.symbol}: $${data.price.toLocaleString()} (24s değişim: ${data.change24h.toFixed(2)}%)`
            })
            .join("\n")}`
        }
      } catch (error) {
        console.error("Error fetching crypto data from VoltAgent:", error)
        // Continue without crypto data
      }
    }

    // Check if user wants market summary
    if (lastMessage.toLowerCase().includes("piyasa") || lastMessage.toLowerCase().includes("market")) {
      try {
        const summaryResult = await voltAgentClient.getMarketSummary()
        if (summaryResult.success) {
          contextData += `\n\nVoltAgent piyasa özeti: ${JSON.stringify(summaryResult.data)}`
        }
      } catch (error) {
        console.error("Error fetching market summary from VoltAgent:", error)
        // Continue without market summary
      }
    }

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: `Sen kripto para uzmanı bir AI asistansın. Local VoltAgent server (http://localhost:3141) üzerinden gerçek zamanlı kripto verilerine erişimin var. 

Kullanıcılara şu konularda yardım edebilirsin:
- Kripto para fiyatları ve analizi
- Piyasa trendleri
- Yatırım tavsiyeleri (risk uyarıları ile)
- Teknik analiz

Her zaman güncel VoltAgent verilerini kullan ve risk uyarılarını unutma.${contextData}`,
        },
        ...messages,
      ],
      temperature: 0.7,
      maxTokens: 1000,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

function extractCryptoSymbols(message: string): string[] {
  const cryptoPatterns = [
    /\b(bitcoin|btc)\b/gi,
    /\b(ethereum|eth)\b/gi,
    /\b(cardano|ada)\b/gi,
    /\b(solana|sol)\b/gi,
    /\b(polkadot|dot)\b/gi,
    /\b(chainlink|link)\b/gi,
    /\b(polygon|matic)\b/gi,
    /\b(avalanche|avax)\b/gi,
  ]

  const symbols: string[] = []

  cryptoPatterns.forEach((pattern) => {
    const matches = message.match(pattern)
    if (matches) {
      matches.forEach((match) => {
        const symbol = normalizeSymbol(match.toLowerCase())
        if (symbol && !symbols.includes(symbol)) {
          symbols.push(symbol)
        }
      })
    }
  })

  return symbols
}

function normalizeSymbol(input: string): string {
  const symbolMap: { [key: string]: string } = {
    bitcoin: "btc",
    ethereum: "eth",
    cardano: "ada",
    solana: "sol",
    polkadot: "dot",
    chainlink: "link",
    polygon: "matic",
    avalanche: "avax",
  }

  return symbolMap[input] || input
}
