import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are a legal expert specializing in photography business contracts. Review the provided contract template and provide 3-5 concise bullet points of feedback focusing on:

1. Clarity: Are terms clear and unambiguous?
2. Protection: Are there clauses for late fees, cancellation policies, equipment failure, weather contingencies?
3. Missing Elements: What professional clauses might be missing?
4. Risk Assessment: Are there any potential legal gaps?

Format your response as a bulleted list. Be specific and actionable. Each bullet point should be clear and focused on helping the photographer protect their business.`

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Please review this photography contract template and provide feedback:\n\n${contract_text}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent, professional responses
      max_tokens: 500, // Limit response length
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      )
    }

    // Parse bullet points from response
    // Handle both markdown bullets (-, *, •) and plain text bullets
    const feedbackLines = aiResponse
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        // Remove markdown bullet points and numbering
        return line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim()
      })
      .filter((line) => line.length > 0)

    return NextResponse.json({
      success: true,
      feedback: feedbackLines,
      rawResponse: aiResponse,
    })
  } catch (error: any) {
    console.error("Error in AI contract review:", error)

    // Handle specific OpenAI errors
    if (error.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      )
    }

    if (error.status === 401) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to review contract. Please try again.",
      },
      { status: 500 }
    )
  }
}

