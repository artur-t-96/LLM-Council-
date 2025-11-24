"use client";

import { useState, useEffect } from "react";
import { Send, Bot, Gavel, Loader2, AlertCircle, Settings, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [responses, setResponses] = useState<LLMResponse[]>([]);
  const [evaluation, setEvaluation] = useState<LLMResponse | null>(null);
  const [error, setError] = useState("");

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: "",
    anthropic: "",
    xai: "",
  });

  // Load keys from localStorage on mount
  useEffect(() => {
    const storedKeys = localStorage.getItem("llm_council_keys");
    if (storedKeys) {
      try {
        const parsed = JSON.parse(storedKeys);
        // Clean up old keys if they exist
        const { google, ...rest } = parsed;
        setApiKeys(rest);
      } catch (e) {
        console.error("Failed to parse stored keys", e);
      }
    }
  }, []);

  const saveKeys = () => {
    localStorage.setItem("llm_council_keys", JSON.stringify(apiKeys));
    setShowSettings(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setResponses([]);
    setEvaluation(null);
    setError("");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question, apiKeys }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch responses");
      }

      const data = await res.json();
      setResponses(data.results);

      // Trigger evaluation automatically after responses are received
      handleEvaluate(data.results);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes("No LLM providers configured")) {
        setShowSettings(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (currentResponses: LLMResponse[]) => {
    setEvaluating(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, responses: currentResponses, apiKeys }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to evaluate responses");
      }

      const data = await res.json();
      setEvaluation(data.evaluation);
    } catch (err: any) {
      console.error("Evaluation failed:", err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-12 relative">

        {/* Header */}
        <header className="text-center space-y-4 relative">
          <button
            onClick={() => setShowSettings(true)}
            className="absolute right-0 top-0 p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Configure API Keys"
          >
            <Settings className="w-6 h-6" />
          </button>

          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full ring-1 ring-indigo-500/50 mb-4">
            <Gavel className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            LLM Council
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Consult the council of ChatGPT, Claude, and Grok.
            <span className="block mt-2 text-indigo-400 font-medium">Chair: Claude</span>
          </p>
        </header>

        {/* Input Section */}
        <section className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative flex items-center bg-neutral-900 rounded-xl p-2 ring-1 ring-white/10 focus-within:ring-indigo-500/50 shadow-2xl">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask the council a question..."
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-lg placeholder:text-neutral-600"
                disabled={loading || evaluating}
              />
              <button
                type="submit"
                disabled={loading || evaluating || !question.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
              {error.includes("No LLM providers configured") && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="ml-auto text-sm underline hover:text-red-300"
                >
                  Configure Keys
                </button>
              )}
            </div>
          )}
        </section>

        {/* Results Grid */}
        {(responses.length > 0 || loading) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              // Loading Skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-neutral-900/50 rounded-2xl border border-white/5 animate-pulse" />
              ))
            ) : (
              responses.map((response, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "group relative bg-neutral-900/50 rounded-2xl border border-white/5 p-6 transition hover:border-white/10",
                    response.error && "border-red-500/20 bg-red-500/5"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/5 rounded-lg">
                      <Bot className="w-5 h-5 text-neutral-400" />
                    </div>
                    <h3 className="font-semibold text-lg text-neutral-200">{response.provider}</h3>
                    {response.error ? (
                      <span className="ml-auto text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded">Error</span>
                    ) : (
                      <span className="ml-auto text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded">Success</span>
                    )}
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none max-h-96 overflow-y-auto custom-scrollbar">
                    {response.error ? (
                      <p className="text-red-400 text-sm">{response.error}</p>
                    ) : (
                      <p className="whitespace-pre-wrap text-neutral-300 leading-relaxed">{response.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* The Chair's Verdict */}
        {(evaluation || evaluating) && (
          <section className="relative mt-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl blur opacity-20"></div>
            <div className="relative bg-neutral-900 rounded-3xl border border-amber-500/20 p-8 md:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Gavel className="w-64 h-64 text-amber-500" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-amber-500/10 rounded-xl ring-1 ring-amber-500/30">
                    <Gavel className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-amber-100">The Chair's Verdict</h2>
                    <p className="text-amber-500/60 font-medium">Final Evaluation & Synthesis by Claude</p>
                  </div>
                </div>

                {evaluating ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4 text-amber-500/50">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>Claude is deliberating...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-lg max-w-none text-neutral-300">
                    <div className="whitespace-pre-wrap">{evaluation?.content}</div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  API Configuration
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-neutral-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-400">OpenAI API Key</label>
                  <input
                    type="password"
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="sk-..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-400">Anthropic API Key</label>
                  <input
                    type="password"
                    value={apiKeys.anthropic}
                    onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="sk-ant-..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-400">xAI Grok API Key</label>
                  <input
                    type="password"
                    value={apiKeys.xai}
                    onChange={(e) => setApiKeys({ ...apiKeys, xai: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="xai-..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveKeys}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  Save Keys
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
