import { NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT = `You are a legal expert specializing in photography business contracts. Analyze the provided contract template and provide feedback in a structured format.

First, check for the presence of these critical legal protections:
1. Cancellation Policy (with fees/penalties)
2. Copyright and Image Usage Rights clause
3. Liability Waiver / Indemnification clause
4. Payment Terms (deposits, late fees, payment schedule)
5. Force Majeure / Weather Contingencies clause

Then provide general feedback on:
- Clarity and readability
- Missing professional clauses
- Risk assessment
- Recommendations for improvement

Format your response EXACTLY as follows:

LEGAL PROTECTION CHECKLIST:
✓ Cancellation Policy: [Present/Missing] - [brief note if missing]
✓ Copyright Clause: [Present/Missing] - [brief note if missing]
✓ Liability Waiver: [Present/Missing] - [brief note if missing]
✓ Payment Terms: [Present/Missing] - [brief note if missing]
✓ Force Majeure: [Present/Missing] - [brief note if missing]

GENERAL FEEDBACK:
- [3-5 bullet points with specific, actionable feedback]

Use ✓ for present items and ⚠ for missing items. Be specific and actionable.`

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
    const { contract_text } = body

    if (!contract_text || typeof contract_text !== "string") {
      return NextResponse.json(
        { error: "contract_text is required" },
        { status: 400 }
      )
    }

    if (contract_text.trim().length === 0) {
      return NextResponse.json(
        { error: "Contract text cannot be empty" },
        { status: 400 }
      )
    }

    // Call Gemini API
    const prompt = `${SYSTEM_PROMPT}\n\nPlease review this photography contract template and provide feedback:\n\n${contract_text}`

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
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiResponse) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      )
    }

    // Parse structured response
    const lines = aiResponse.split("\n").map((line) => line.trim()).filter((line) => line.length > 0)

    const legalProtections: Array<{ name: string; present: boolean; notes?: string }> = []
    const generalFeedback: string[] = []
    let inChecklist = false
    let inGeneralFeedback = false

    for (const line of lines) {
      // Check if we're in the checklist section
      if (line.toUpperCase().includes("LEGAL PROTECTION CHECKLIST") || line.toUpperCase().includes("CHECKLIST:")) {
        inChecklist = true
        inGeneralFeedback = false
        continue
      }

      // Check if we're in the general feedback section
      if (line.toUpperCase().includes("GENERAL FEEDBACK") || line.toUpperCase().includes("FEEDBACK:")) {
        inChecklist = false
        inGeneralFeedback = true
        continue
      }

      if (inChecklist) {
        // Parse checklist items (format: ✓/⚠ Name: [Present/Missing] - notes)
        const checklistMatch = line.match(/^[✓⚠]\s*(.+?):\s*(Present|Missing)(?:\s*-\s*(.+))?$/i)
        if (checklistMatch) {
          const name = checklistMatch[1].trim()
          const present = checklistMatch[2].toLowerCase() === "present"
          const notes = checklistMatch[3]?.trim()
          legalProtections.push({ name, present, notes })
        }
      } else if (inGeneralFeedback) {
        // Parse general feedback bullets
        const cleaned = line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim()
        if (cleaned.length > 0) {
          generalFeedback.push(cleaned)
        }
      }
    }

    // Fallback: if structured parsing didn't work, use old format
    if (legalProtections.length === 0 && generalFeedback.length === 0) {
      const feedbackLines = lines
        .map((line) => {
          return line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim()
        })
        .filter((line) => line.length > 0)

      return NextResponse.json({
        success: true,
        feedback: feedbackLines,
        rawResponse: aiResponse,
      })
    }

    return NextResponse.json({
      success: true,
      legalProtections,
      generalFeedback,
      rawResponse: aiResponse,
    })
  } catch (error: any) {
    console.error("Error in AI contract review:", error)

    return NextResponse.json(
      {
        error: error.message || "Failed to review contract. Please try again.",
      },
      { status: 500 }
    )
  }
}


