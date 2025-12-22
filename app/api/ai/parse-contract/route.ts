import { NextResponse } from "next/server"
// Replaced pdf-parse with pdf2json for server compatibility
import { GoogleGenerativeAI } from "@google/generative-ai"
import PDFParser from "pdf2json"
import mammoth from "mammoth"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Helper to parse PDF buffer
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true); // true = enable raw text parsing in some versions

        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            // Manual text extraction to avoid library bugs with getRawTextContent
            try {
                let text = "";
                if (pdfData && pdfData.Pages) {
                    for (const page of pdfData.Pages) {
                        if (page.Texts) {
                            for (const textItem of page.Texts) {
                                let line = "";
                                if (textItem.R) {
                                    for (const run of textItem.R) {
                                        if (run.T) {
                                            try {
                                                line += decodeURIComponent(run.T);
                                            } catch (e) {
                                                line += run.T;
                                            }
                                        }
                                    }
                                }
                                text += line + "\n";
                            }
                        }
                        text += "\n\n"; // Newline between pages
                    }
                }
                resolve(text);
            } catch (err) {
                reject(err);
            }
        });

        pdfParser.parseBuffer(buffer);
    })
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File
        const skipAI = formData.get("skipAI") === "true"

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        // 1. Extract Text from File
        const buffer = Buffer.from(await file.arrayBuffer())
        let extractedText = ""

        if (file.type === "application/pdf") {
            try {
                extractedText = await parsePdfBuffer(buffer)
            } catch (e: any) {
                console.error("PDF Parse Error:", e)
                extractedText = "Error extracting PDF text. Please look at the raw file."
            }
        } else if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.name.endsWith(".docx")
        ) {
            const result = await mammoth.extractRawText({ buffer })
            extractedText = result.value
        } else {
            // Fallback for text files
            extractedText = await file.text()
        }

        // 2. Return Raw Text if Skip AI (Default: false)
        if (skipAI) {
            return NextResponse.json({
                success: true,
                content: extractedText
            })
        }

        // 3. Process with AI (if enabled)
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey || apiKey.includes("placeholder")) {
            // If no API key, return raw text anyway to prevent blocking
            return NextResponse.json({
                success: true,
                content: extractedText
            })
        }

        const prompt = `
      You are a legal document expert for professional photographers. 
      I have an uploaded contract text.
      Convert this into a professional Markdown contract template.
      
      CRITICAL INSTRUCTIONS:
      1. DO NOT CHANGE ANY WORDS. Your job is ONLY formatting and structure.
      2. Keep the EXACT legal wording. Do not summarize or rewrite.
      3. Use Markdown headers (#, ##, ###) to match the visual hierarchy (Title = #, Sections = ##).
      4. Use bolding (**) for section titles or emphasized terms exactly as they appear.
      5. Maintain lists and bullet points exactly as they appear.
      6. ONLY replace specific names/dates/prices/services with these placeholders (do not replace generic terms):
         - Client Name -> {{client_name}}
         - Event Date -> {{event_date}}
         - Total Price -> {{total_price}}
         - Service Type -> {{service_type}}
      
      Here is the contract text:
      """
      ${extractedText.substring(0, 30000)} 
      """
      
      Output ONLY the contract text in Markdown format. No conversational text.
    `
        // Note: Truncated text to avoid token limits if file is massive

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
            const result = await model.generateContent(prompt)
            const responseText = result.response.text()

            return NextResponse.json({
                success: true,
                content: responseText
            })
        } catch (aiError: any) {
            console.warn("AI generation failed, falling back to raw text:", aiError)

            // Fallback: Return raw text with a warning note
            return NextResponse.json({
                success: true,
                content: extractedText,
                warning: "AI formatting unavailable. Showing raw text."
            })
        }
    } catch (error: any) {
        console.error("Error parsing contract:", error)
        return NextResponse.json({ error: "Failed to parse contract: " + error.message }, { status: 500 })
    }
}
