import { NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT = "You are a legal writing assistant for photography business contracts. Rewrite the provided text according to the user's instruction. Return only the improved text, without explanations or additional commentary."

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey || apiKey.includes("your_") || apiKey.includes("placeholder") || apiKey.length < 20) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Please set GEMINI_API_KEY in your .env.local file" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { text, instruction } = body

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      )
    }

    if (!instruction || typeof instruction !== "string") {
      return NextResponse.json(
        { error: "instruction is required" },
        { status: 400 }
      )
    }

    // Call Gemini API
    const prompt = `${SYSTEM_PROMPT}\n\n${instruction}\n\nText to improve:\n${text}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Gemini API error:", errorData)
      
      // Parse Gemini error response
      const geminiError = errorData?.error
      let errorMessage = "Gemini API error"
      
      if (geminiError?.message) {
        errorMessage = geminiError.message
        
        // Check if it's a quota/rate limit issue
        if (geminiError.message.includes("quota") || geminiError.message.includes("exceeded")) {
          // Extract retry time if available
          const retryMatch = geminiError.message.match(/Please retry in ([\d.]+)s/)
          const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null
          
          if (retrySeconds) {
            errorMessage = `Rate limit exceeded. Please try again in ${retrySeconds} seconds.`
          } else {
            errorMessage = "API quota exceeded. Please check your Gemini API billing and quota limits at https://ai.dev/usage?tab=rate-limit. You may need to enable billing or wait for quota reset."
          }
        }
      }
      
      if (response.status === 429 || geminiError?.code === 429 || geminiError?.status === "RESOURCE_EXHAUSTED") {
        return NextResponse.json(
          { error: errorMessage },
          { status: 429 }
        )
      }

      if (response.status === 400 || response.status === 401) {
        return NextResponse.json(
          { error: errorMessage || "Invalid Gemini API key or request" },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      )
    }

    const data = await response.json()
    const improvedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!improvedText) {
      return NextResponse.json(
        { error: "No improved text generated from AI" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      improvedText: improvedText.trim(),
    })
  } catch (error: any) {
    console.error("Error in AI text improvement:", error)

    return NextResponse.json(
      {
        error: error.message || "Failed to improve text. Please try again.",
      },
      { status: 500 }
    )
  }
}

