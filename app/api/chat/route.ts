import { db } from "@/lib/db";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface ChatRequest {
    message: string;
    history: ChatMessage[];
}

async function generateAIResponse(messages: ChatMessage[]): Promise<string> {
    const systemPrompt = `You are a helpful AI coding assistant. You help developers with:
- Code explanations and debugging
- Best practices and architecture advice
- Writing clean, efficient code
- Troubleshooting errors
- Code reviews and optimizations

Always provide clear, practical answers. Use proper code formatting when showing examples.`;

    const fullMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
    ];

    const prompt = fullMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n\n");

    try {
        const response = await fetch("http://127.0.0.1:11434/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "deepseek-coder:latest",
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.3,
                    num_predict: 300,
                    top_p: 0.9,
                },
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Ollama HTTP error:", err);
            throw new Error("Ollama request failed");
        }

        const data = await response.json();

        const result = data?.response ?? "";

        if (!result.trim()) {
            return "AI did not return a response.";
        }

        return result.trim();
    } catch (error) {
        console.error("AI generation error:", error);
        throw new Error("Failed to generate AI response");
    }
}

export async function POST(req: NextRequest) {
    try {
        const body: ChatRequest = await req.json();
        const { message, history = [] } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message must be a valid string" },
                { status: 400 },
            );
        }

        const validHistory = Array.isArray(history)
            ? history.filter(
                  (msg) =>
                      msg &&
                      typeof msg === "object" &&
                      typeof msg.role === "string" &&
                      typeof msg.content === "string" &&
                      ["user", "assistant"].includes(msg.role),
              )
            : [];

        const recentHistory = validHistory.slice(-10);

        const messages: ChatMessage[] = [
            ...recentHistory,
            { role: "user", content: message },
        ];

        const aiResponse = await generateAIResponse(messages);

        return NextResponse.json({
            response: aiResponse,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Chat API Error:", error);

        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

        return NextResponse.json(
            {
                error: "Failed to generate AI response",
                details: errorMessage,
                timestamp: new Date().toISOString(),
            },
            { status: 500 },
        );
    }
}
