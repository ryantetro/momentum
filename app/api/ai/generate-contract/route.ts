import { NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT = `You are a legal document generator for professional photographers. Generate ONLY the contract text in strict Markdown format.

CRITICAL RULES:
1. Output ONLY the contract text—no introductions, explanations, or conversational text (no "Here is your contract" or "Key improvements")
2. Use Markdown formatting:
   - ## for section headers (e.g., ## 1. Services and Scope of Work)
   - **text** for bold key terms and important phrases
   - - for bullet points in lists
   - Regular paragraphs for body text
3. Use ONLY these placeholder variables: {{client_name}}, {{event_date}}, {{total_price}}, {{service_type}}
4. Never use brackets like [Insert Name] or [Amount]—only use the provided {{variables}}
5. Maintain professional legal language throughout
6. Structure with clear numbered sections (## 1., ## 2., etc.)

The contract must include these standard sections:
1. Services and Scope of Work
2. Payment Terms (deposits, final payment, late fees)
3. Cancellation and Refund Policy
4. Copyright and Usage Rights
5. Liability and Indemnification
6. Timeline and Delivery Expectations
7. Force Majeure and Weather Contingencies
8. Equipment and Backup Plans

Return the complete contract in Markdown format, ready for professional rendering.`

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey || apiKey.includes("your_") || apiKey.includes("placeholder") || apiKey.length < 20) {
      return NextResponse.json(
        { 
          error: "Gemini API key not configured. Please set GEMINI_API_KEY in your .env.local file with a valid API key from https://makersuite.google.com/app/apikey" 
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { requirements } = body

    if (!requirements || typeof requirements !== "string") {
      return NextResponse.json(
        { error: "requirements is required" },
        { status: 400 }
      )
    }

    if (requirements.trim().length === 0) {
      return NextResponse.json(
        { error: "Requirements cannot be empty" },
        { status: 400 }
      )
    }

    // Call Gemini API
    const prompt = `${SYSTEM_PROMPT}

Generate a professional photography contract based on these requirements:

${requirements}

Remember: Output ONLY the contract text in Markdown format. No conversational text or explanations.`

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
            maxOutputTokens: 2000,
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
    const generatedContract = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedContract) {
      return NextResponse.json(
        { error: "No contract generated from AI" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contract: generatedContract,
    })
  } catch (error: any) {
    console.error("Error in AI contract generation:", error)

    return NextResponse.json(
      {
        error: error.message || "Failed to generate contract. Please try again.",
      },
      { status: 500 }
    )
  }
}

