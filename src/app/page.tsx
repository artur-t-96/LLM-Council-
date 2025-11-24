"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
  verifiedModels?: string[];
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
      const conversationHistory = [...messages, userMessage];
      const contextPrompt = conversationHistory
        .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n\n");

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: contextPrompt, apiKeys }),
      });

      if (!res.ok) throw new Error("Failed to fetch responses");

      const data = await res.json();
      const verifiedModels = data.results
        .filter((r: any) => !r.error && r.content)
        .map((r: any) => r.provider);

      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          responses: data.results,
          apiKeys
        }),
      });

      if (!evalRes.ok) throw new Error("Failed to evaluate responses");

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
    <main className="flex flex-col h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-gradient"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="glass-strong sticky top-0 z-20 border-b border-white/10">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="relative w-full h-28 mb-4 rounded-2xl overflow-hidden glass glow">
              <Image
                src="/board-banner.png"
                alt="Wirtualna Rada Nadzorcza AI"
                fill
                className="object-cover opacity-90"
                priority
              />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Wirtualna Rada Nadzorcza AI
              </h1>
              <p className="text-sm text-purple-200/80 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Konsultuj się z najlepszymi modelami AI
              </p>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center mt-20 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-strong glow mb-4">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-xl text-purple-100 font-medium">
                  Witaj w Wirtualnej Radzie Nadzorczej AI
                </p>
                <p className="text-sm text-purple-300/60 max-w-md mx-auto">
                  Zadaj pytanie, a rada doradcza złożona z GPT-5.1, Claude 4.5 i Grok 4.1 udzieli Ci odpowiedzi
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`message-enter ${message.role === "user" ? "flex justify-end" : ""
                    }`}
                >
                  <div className={`max-w-[85%] ${message.role === "user" ? "ml-auto" : ""}`}>
                    <div
                      className={`rounded-2xl px-5 py-4 ${message.role === "user"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                          : "glass-strong"
                        }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>

                    {message.role === "assistant" && message.verifiedModels && (
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-purple-300/60">Zweryfikowano:</span>
                        <div className="flex gap-2">
                          {message.verifiedModels.includes("ChatGPT") && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full border border-green-500/30 flex items-center gap-1.5 hover:bg-green-500/30 transition-colors">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                              GPT-5.1
                            </span>
                          )}
                          {message.verifiedModels.includes("Claude") && (
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 flex items-center gap-1.5 hover:bg-purple-500/30 transition-colors">
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
                              Claude 4.5
                            </span>
                          )}
                          {message.verifiedModels.includes("Grok") && (
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 flex items-center gap-1.5 hover:bg-blue-500/30 transition-colors">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                              Grok 4.1
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="message-enter">
                <div className="max-w-[85%]">
                  <div className="glass-strong rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-3 text-purple-300">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Rada Nadzorcza analizuje pytanie...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 glass-strong border-t border-white/10 backdrop-blur-2xl">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <form onSubmit={handleSubmit} className="relative">
              <div className="glass-strong rounded-2xl p-1.5 glow-strong hover:glow transition-all duration-300">
                <div className="flex items-center gap-3 px-4 py-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Zadaj pytanie Radzie Nadzorczej..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-purple-300/40 text-sm"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
            <p className="text-center text-xs text-purple-300/40 mt-3">
              Powered by GPT-5.1, Claude Sonnet 4.5 & Grok 4.1
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
