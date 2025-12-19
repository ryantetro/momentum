import { NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT = `You are a legal document generator for professional photographers. Rewrite the contract to include missing legal protections. Output ONLY the contract text in strict Markdown format.

CRITICAL RULES:
1. Output ONLY the contract text—no introductions, explanations, or conversational text
2. Use Markdown formatting:
   - ## for section headers (e.g., ## 1. Services and Scope of Work)
   - **text** for bold key terms and important phrases
   - - for bullet points in lists
   - Regular paragraphs for body text
3. Preserve ALL placeholder variables exactly as they appear (e.g., {{client_name}}, {{event_date}}, {{total_price}}, {{service_type}})
4. Never use brackets like [Insert Name] or [Amount]—only use the provided {{variables}}
5. Maintain the photographer's original writing style and tone
6. Keep the existing structure and organization
7. Add the missing clauses in appropriate sections that match the contract's style
8. Do not remove or modify existing clauses unless necessary
9. Ensure all added clauses are professional, legally sound, and appropriate for photography business

The missing clauses should be integrated naturally into the contract structure.`

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey || apiKey.includes("your_") || apiKey.includes("placeholder") || apiKey.length < 20) {
      return NextResponse.json(
        { 
          error: "Gemini API key not configured. Please set GEMINI_API_KEY in your .env.local file" 
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { contract_text, missingClauses } = body

    if (!contract_text || typeof contract_text !== "string") {
      return NextResponse.json(
        { error: "contract_text is required" },
        { status: 400 }
      )
    }

    if (!missingClauses || !Array.isArray(missingClauses) || missingClauses.length === 0) {
      return NextResponse.json(
        { error: "missingClauses array is required and must not be empty" },
        { status: 400 }
      )
    }

    if (contract_text.trim().length === 0) {
      return NextResponse.json(
        { error: "Contract text cannot be empty" },
        { status: 400 }
      )
    }

    // Build prompt with missing clauses
    const missingClausesList = missingClauses.join(", ")
    const prompt = `${SYSTEM_PROMPT}

Missing clauses to add: ${missingClausesList}

Rewrite the following photography contract to include these missing legal protections:

${contract_text}

IMPORTANT: Return the complete rewritten contract in Markdown format with all missing clauses integrated. Preserve all placeholder variables exactly as written. Output ONLY the contract text—no explanations or conversational text.`

    // Call Gemini API
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
            maxOutputTokens: 3000,
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
    const improvedContract = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!improvedContract) {
      return NextResponse.json(
        { error: "No improved contract generated from AI" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      improvedContract: improvedContract.trim(),
    })
  } catch (error: any) {
    console.error("Error in AI apply fixes:", error)

    return NextResponse.json(
      {
        error: error.message || "Failed to apply fixes. Please try again.",
      },
      { status: 500 }
    )
  }
}

