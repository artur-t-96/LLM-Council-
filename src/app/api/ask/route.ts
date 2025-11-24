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

        console.log("API Keys presence:", {
            openai: !!openaiKey,
            anthropic: !!anthropicKey,
            xai: !!xaiKey
        });

        if (openaiKey) {
            clients.push(new ChatGPTClient(openaiKey));
        } else {
            clients.push({ ask: async () => ({ provider: "ChatGPT", content: "", error: "Configuration Error: Missing OPENAI_API_KEY" }) });
        }

        if (anthropicKey) {
            clients.push(new ClaudeClient(anthropicKey));
        } else {
            clients.push({ ask: async () => ({ provider: "Claude", content: "", error: "Configuration Error: Missing ANTHROPIC_API_KEY" }) });
        }

        if (xaiKey) {
            clients.push(new GrokClient(xaiKey));
        } else {
            clients.push({ ask: async () => ({ provider: "Grok", content: "", error: "Configuration Error: Missing XAI_API_KEY" }) });
        }

        const promises = clients.map(client => client.ask(prompt));
        const results = await Promise.all(promises);

        return NextResponse.json({ results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
