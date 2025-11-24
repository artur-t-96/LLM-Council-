"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface LLMResponse {
  provider: string;
  content: string;
  error?: string;
}

interface ApiKeys {
  openai: string;
  anthropic: string;
  xai: string;
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [responses, setResponses] = useState<LLMResponse[]>([]);
  const [evaluation, setEvaluation] = useState<LLMResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const apiKeys: ApiKeys = {
    openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
    anthropic: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "",
    xai: process.env.NEXT_PUBLIC_XAI_API_KEY || "",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setResponses([]);
    setEvaluation(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question, apiKeys }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch responses");
      }

      const data = await res.json();
      setResponses(data.results);

      setEvaluating(true);
      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          responses: data.results,
          apiKeys,
        }),
      });

      if (!evalRes.ok) {
        throw new Error("Failed to evaluate responses");
      }

      const evalData = await evalRes.json();
      setEvaluation(evalData.evaluation);
    } catch (err: any) {
      console.error(err);
      setEvaluation({
        provider: "Error",
        content: `Error: ${err.message}`,
        error: err.message,
      });
    } finally {
      setLoading(false);
      setEvaluating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-2">
            LLM Council
          </h1>
          <p className="text-gray-600">
            Consult the council of ChatGPT, Claude, and Grok.
          </p>
          <p className="text-sm text-blue-600 font-medium mt-1">
            Chair: Claude
          </p>
        </div>

        {/* Input Form */}
        <div className="max-w-3xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question to the council..."
              className="w-full px-6 py-4 pr-14 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-gray-900 placeholder:text-gray-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && responses.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        )}

        {/* Individual Responses */}
        {responses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {responses.map((response, index) => (
              <div
                key={index}
                className={`rounded-xl border p-6 ${response.error
                    ? "bg-red-50 border-red-300"
                    : "bg-white border-gray-200"
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-700">
                        {response.provider.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {response.provider}
                    </h3>
                  </div>
                  {!response.error && (
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                      Success
                    </span>
                  )}
                  {response.error && (
                    <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                      Error
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {response.error || response.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Evaluation Loading */}
        {evaluating && !evaluation && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    The Chair's Verdict
                  </h3>
                  <p className="text-xs text-purple-600">
                    Claude is evaluating the responses...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chair's Verdict */}
        {evaluation && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">⚖️</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    The Chair's Verdict
                  </h3>
                  <p className="text-xs text-purple-600">
                    Final Evaluation & Synthesis by Claude
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {evaluation.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
