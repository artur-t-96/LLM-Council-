import { NextResponse } from "next/server";
import { ChatGPTClient, ClaudeClient, GrokClient, LLMClient } from "@/lib/llm-clients";

export async function POST(request: Request) {
    try {
        const { prompt, apiKeys } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const clients: LLMClient[] = [];

        const openaiKey = apiKeys?.openai || process.env.OPENAI_API_KEY;
        const anthropicKey = apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY;
        const xaiKey = apiKeys?.xai || process.env.XAI_API_KEY;

        if (openaiKey) clients.push(new ChatGPTClient(openaiKey));
        if (anthropicKey) clients.push(new ClaudeClient(anthropicKey));
        if (xaiKey) clients.push(new GrokClient(xaiKey));

        if (clients.length === 0) {
            return NextResponse.json({ error: "No LLM providers configured" }, { status: 500 });
        }

        const promises = clients.map(client => client.ask(prompt));
        const results = await Promise.all(promises);

        return NextResponse.json({ results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
