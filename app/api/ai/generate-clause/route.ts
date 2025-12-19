import { NextRequest, NextResponse } from "next/server"

const CLAUSE_PROMPTS: Record<string, string> = {
  "Cancellation Policy": `Generate a professional Cancellation Policy clause in Markdown format. Include:
- Non-refundable deposit terms
- Cancellation fees based on timing (e.g., 30 days, 14 days before event)
- Refund policies
- Force majeure considerations
Use ## for section header, **text** for bold terms, and - for lists. Output ONLY the clause text.`,

  "Copyright Clause": `Generate a professional Copyright and Image Usage Rights clause in Markdown format. Include:
- Photographer retains copyright
- Client receives personal use rights
- Commercial use requires additional licensing
- Model release permissions
- Portfolio usage rights
Use ## for section header, **text** for bold terms, and - for lists. Output ONLY the clause text.`,

  "Liability Waiver": `Generate a professional Liability Waiver and Indemnification clause in Markdown format. Include:
- Limitation of liability to total contract amount
- Indemnification by client
- Equipment damage exclusions
- Missed shots due to client delays
- Circumstances beyond photographer's control
Use ## for section header, **text** for bold terms, and - for lists. Output ONLY the clause text.`,

  "Payment Terms": `Generate a professional Payment Terms clause in Markdown format. Include:
- Deposit amount and non-refundable terms
- Payment schedule (e.g., deposit, final payment due date)
- Late payment fees
- Payment methods accepted
- Refund policies
Use ## for section header, **text** for bold terms, and - for lists. Output ONLY the clause text.`,

  "Force Majeure": `Generate a professional Force Majeure and Weather Contingencies clause in Markdown format. Include:
- Definition of force majeure events
- Weather-related contingencies
- Rescheduling policies
- Liability limitations for uncontrollable events
- Client and photographer obligations
Use ## for section header, **text** for bold terms, and - for lists. Output ONLY the clause text.`,
}

const SYSTEM_PROMPT = `You are a legal document generator for photography business contracts. Generate professional, legally sound clauses in strict Markdown format.

CRITICAL RULES:
1. Output ONLY the clause text—no introductions, explanations, or conversational text
2. Use Markdown formatting:
   - ## for section header
   - **text** for bold key terms
   - - for bullet points in lists
3. Use ONLY placeholder variables if needed: {{client_name}}, {{event_date}}, {{total_price}}, {{service_type}}
4. Never use brackets like [Insert Name] or [Amount]`

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
    const { clauseName, contractContext } = body

    if (!clauseName || typeof clauseName !== "string") {
      return NextResponse.json(
        { error: "clauseName is required" },
        { status: 400 }
      )
    }

    // Get specific prompt for the clause, or use generic one
    const clausePrompt = CLAUSE_PROMPTS[clauseName] || `Generate a professional ${clauseName} clause in Markdown format. Make it legally sound and appropriate for photography business. Use ## for header, **text** for bold, and - for lists. Output ONLY the clause text.`

    // Build full prompt
    let prompt = `${SYSTEM_PROMPT}

${clausePrompt}`
    
    if (contractContext && typeof contractContext === "string" && contractContext.trim().length > 0) {
      prompt += `\n\nContext from existing contract (to match style and tone):\n${contractContext.substring(0, 500)}`
    }
    
    prompt += `\n\nRemember: Output ONLY the clause text in Markdown format. No conversational text or explanations.`

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
            maxOutputTokens: 1000,
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
    const clause = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!clause) {
      return NextResponse.json(
        { error: "No clause generated from AI" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      clause: clause.trim(),
    })
  } catch (error: any) {
    console.error("Error in AI clause generation:", error)

    return NextResponse.json(
      {
        error: error.message || "Failed to generate clause. Please try again.",
      },
      { status: 500 }
    )
  }
}

