import { NextResponse } from "next/server";
import { ClaudeClient, LLMResponse } from "@/lib/llm-clients";

export async function POST(request: Request) {
    try {
        const { question, responses, apiKeys } = await request.json();

        if (!question || !responses || !Array.isArray(responses)) {
            return NextResponse.json({ error: "Question and responses array are required" }, { status: 400 });
        }

        const anthropicKey = apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY;

        if (!anthropicKey) {
            return NextResponse.json({ error: "Claude (Anthropic) API Key is required for the Chair" }, { status: 500 });
        }

        const chairClient = new ClaudeClient(anthropicKey);

        const formattedResponses = responses.map((r: LLMResponse) => `
---
Provider: ${r.provider}
Response: ${r.content}
---
`).join("\n");

        const chairPrompt = `
You are Claude, the Chair of the LLM Council. 
You have received the following responses to the question: "${question}".

${formattedResponses}

Your task is to synthesize these perspectives into one unified, authoritative answer. 
Do not compare or evaluate the individual responses. 
Simply provide the best possible answer to the question, drawing from all the insights provided.

Format your response in Markdown.
`;

        const chairResponse = await chairClient.ask(chairPrompt);

        return NextResponse.json({ evaluation: chairResponse });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
