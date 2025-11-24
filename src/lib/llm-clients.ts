import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export interface LLMResponse {
    provider: string;
    content: string;
    error?: string;
}

export interface LLMClient {
    ask(prompt: string): Promise<LLMResponse>;
}

export class ChatGPTClient implements LLMClient {
    private client: OpenAI;

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey });
    }

    async ask(prompt: string): Promise<LLMResponse> {
        try {
            const completion = await this.client.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-5.1",
            });
            return { provider: "ChatGPT", content: completion.choices[0].message.content || "" };
        } catch (error: any) {
            return { provider: "ChatGPT", content: "", error: error.message };
        }
    }
}

export class ClaudeClient implements LLMClient {
    private client: Anthropic;

    constructor(apiKey: string) {
        this.client = new Anthropic({ apiKey });
    }

    async ask(prompt: string): Promise<LLMResponse> {
        try {
            const message = await this.client.messages.create({
                max_tokens: 4096,
                messages: [{ role: "user", content: prompt }],
                model: "claude-sonnet-4-5-20250929",
            });
            // @ts-ignore - Anthropic types can be tricky with content blocks
            return { provider: "Claude", content: message.content[0].text };
        } catch (error: any) {
            return { provider: "Claude", content: "", error: error.message };
        }
    }
}

export class GrokClient implements LLMClient {
    private client: OpenAI;

    constructor(apiKey: string) {
        this.client = new OpenAI({
            apiKey,
            baseURL: "https://api.x.ai/v1",
        });
    }

    async ask(prompt: string): Promise<LLMResponse> {
        try {
            const completion = await this.client.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "grok-4-1-fast-reasoning",
            });
            return { provider: "Grok", content: completion.choices[0].message.content || "" };
        } catch (error: any) {
            return { provider: "Grok", content: "", error: error.message };
        }
    }
}
