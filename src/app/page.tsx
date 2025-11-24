"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
  verifiedModels?: string[]; // Track which models contributed
}

interface ApiKeys {
  openai: string;
  anthropic: string;
  xai: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API keys from environment
  const apiKeys: ApiKeys = {
    openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
    anthropic: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "",
    xai: process.env.NEXT_PUBLIC_XAI_API_KEY || "",
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Get all previous messages for context
      const conversationHistory = [...messages, userMessage];

      // Build context from conversation
      const contextPrompt = conversationHistory
        .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n\n");

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: contextPrompt, apiKeys }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch responses");
      }

      const data = await res.json();

      // Track which models successfully responded
      const verifiedModels = data.results
        .filter((r: any) => !r.error && r.content)
        .map((r: any) => r.provider);

      // Get evaluation from Chair
      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          responses: data.results,
          apiKeys
        }),
      });

      if (!evalRes.ok) {
        throw new Error("Failed to evaluate responses");
      }

      const evalData = await evalRes.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: evalData.evaluation.content,
        verifiedModels: verifiedModels
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Przepraszam, wystąpił błąd: ${err.message}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-white">
      {/* Header with Banner */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden">
            <Image
              src="/board-banner.png"
              alt="Wirtualna Rada Nadzorcza AI"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 text-center">
            Wirtualna Rada Nadzorcza AI
          </h1>
          <p className="text-sm text-gray-600 text-center mt-2">
            Konsultuj się z najlepszymi modelami AI: GPT-5.1, Claude Sonnet 4.5 i Grok 4.1
          </p>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-lg mb-2">Witaj w Wirtualnej Radzie Nadzorczej AI</p>
              <p className="text-sm">Zadaj pytanie, a rada doradcza złożona z najlepszych modeli AI udzieli Ci odpowiedzi</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`mb-6 ${message.role === "user" ? "flex justify-end" : ""
                  }`}
              >
                <div
                  className={`max-w-[80%] ${message.role === "user"
                      ? "ml-auto"
                      : ""
                    }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 ${message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                      }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>

                  {/* Verification badges for assistant messages */}
                  {message.role === "assistant" && message.verifiedModels && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span>Skonsultowano z:</span>
                      {message.verifiedModels.includes("ChatGPT") && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          GPT-5.1
                        </span>
                      )}
                      {message.verifiedModels.includes("Claude") && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                          Claude 4.5
                        </span>
                      )}
                      {message.verifiedModels.includes("Grok") && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          Grok 4.1
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="mb-6">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Rada Nadzorcza analizuje pytanie...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Zadaj pytanie Radzie Nadzorczej..."
                className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
