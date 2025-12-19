import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY

        if (!apiKey || apiKey.includes("your_") || apiKey.includes("placeholder") || apiKey.length < 20) {
            return NextResponse.json(
                { error: "Gemini API key not configured. Please set GEMINI_API_KEY in your .env.local file." },
                { status: 500 }
            )
        }

        const { fileName, fileType } = await responseToJSON(req)

        const prompt = `
      You are a legal document expert for professional photographers. 
      I have an uploaded contract named "${fileName}". 
      Convert this into a professional Markdown contract template.
      
      CRITICAL: Identify placeholders for:
      - Client Name -> replace with {{client_name}}
      - Event Date -> replace with {{event_date}}
      - Total Price -> replace with {{total_price}}
      - Service Type -> replace with {{service_type}}
      
      Make the output professional, clear, and formatted with Markdown headers.
      Output ONLY the contract text in Markdown format. No conversational text or explanations.
    `

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
            throw new Error(errorData?.error?.message || "Failed to parse contract with AI")
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text

        // Mock content for the demo if API key is missing or for speed
        const mockContent = `
# PHOTOGRAPHY SERVICES AGREEMENT

This agreement is between **{{photographer_name}}** ("Photographer") and **{{client_name}}** ("Client").

## 1. EVENT DETAILS
- **Service Type:** {{service_type}}
- **Event Date:** {{event_date}}
- **Total Investment:** {{total_price}}

## 2. PAYMENTS
A non-refundable deposit of **{{deposit_amount}}** is required to secure the date. The remaining balance is due 30 days before the event.

## 3. CANCELLATION
In the event of cancellation by the Client, the deposit shall be retained by the Photographer.

## 4. DELIVERY
Final images will be delivered via an online gallery within 6 weeks of the event date.

---
*Signed on behalf of the Photographer:*
**{{photographer_name}}**
    `

        return NextResponse.json({
            success: true,
            content: text || mockContent
        })

    } catch (error: any) {
        console.error("Error parsing contract:", error)
        return NextResponse.json({ error: "Failed to parse contract" }, { status: 500 })
    }
}

async function responseToJSON(req: Request) {
    try {
        return await req.json()
    } catch {
        return {}
    }
}
