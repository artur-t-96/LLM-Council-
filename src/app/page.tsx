"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Settings, MessageSquare } from "lucide-react";
import Image from "next/image";

interface LLMResponse {
  provider: string;
  content: string;
  error?: string;
}

interface ConversationTurn {
  question: string;
  responses: LLMResponse[];
  evaluation: LLMResponse | null;
}

interface ApiKeys {
  openai: string;
  anthropic: string;
  xai: string;
}

export default function Home() {
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
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
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const currentQuestion = input;
    setInput("");
    setLoading(true);

    try {
      // Build context from previous conversation
      const contextPrompt = conversation.length > 0
        ? conversation.map(turn =>
          `Question: ${turn.question}\nAnswer: ${turn.evaluation?.content || turn.responses[0]?.content || ""}`
        ).join("\n\n") + `\n\nNew Question: ${currentQuestion}`
        : currentQuestion;

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: contextPrompt, apiKeys }),
      });

      if (!res.ok) throw new Error("Failed to fetch responses");

      const data = await res.json();

      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          responses: data.results,
          apiKeys
        }),
      });

      if (!evalRes.ok) throw new Error("Failed to evaluate responses");

      const evalData = await evalRes.json();

      const newTurn: ConversationTurn = {
        question: currentQuestion,
        responses: data.results,
        evaluation: evalData.evaluation
      };

      setConversation(prev => [...prev, newTurn]);
    } catch (err: any) {
      const errorTurn: ConversationTurn = {
        question: currentQuestion,
        responses: [],
        evaluation: {
          provider: "Error",
          content: `Przepraszam, wystąpił błąd: ${err.message}`
        }
      };
      setConversation(prev => [...prev, errorTurn]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden">
            <Image
              src="/board-banner.png"
              alt="Wirtualna Rada Nadzorcza AI"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Wirtualna Rada Nadzorcza AI
          </h1>
          <p className="text-sm text-gray-400 text-center mt-1">
            Konsultuj się z GPT-5.1, Claude Sonnet 4.5 i Grok 4.1
          </p>
        </div>
      </header>

      {/* Conversation */}
      <div className="max-w-7xl mx-auto px-4 py-6 pb-32">
        {conversation.length === 0 ? (
          <div className="text-center mt-20">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <p className="text-xl text-gray-300 mb-2">Witaj w Wirtualnej Radzie Nadzorczej AI</p>
            <p className="text-sm text-gray-500">
              Zadaj pytanie, a rada doradcza udzieli Ci odpowiedzi
            </p>
          </div>
        ) : (
          conversation.map((turn, turnIndex) => (
            <div key={turnIndex} className="mb-8">
              {/* Question */}
              <div className="mb-4 flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-2xl">
                  <p className="text-sm font-medium">{turn.question}</p>
                </div>
              </div>

              {/* Individual Responses */}
              {turn.responses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {turn.responses.map((response, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-4 ${response.error
                          ? "bg-red-900/20 border-red-800"
                          : "bg-gray-800 border-gray-700"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm">{response.provider}</h3>
                        {!response.error && (
                          <span className="text-xs text-green-400">Success</span>
                        )}
                        {response.error && (
                          <span className="text-xs text-red-400">Error</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap">
                        {response.error || response.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chair's Verdict */}
              {turn.evaluation && (
                <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">The Chair's Verdict</h3>
                      <p className="text-xs text-purple-300">Final Evaluation & Synthesis by Claude</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {turn.evaluation.content}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-1/3 mb-3"></div>
                  <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Rada Nadzorcza analizuje pytanie...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Zadaj pytanie Radzie Nadzorczej..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
