"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Paperclip, X, FileText } from "lucide-react";

interface LLMResponse {
  provider: string;
  content: string;
  error?: string;
}

interface ConversationTurn {
  question: string;
  responses: LLMResponse[];
  evaluation: LLMResponse | null;
  attachedFile?: string;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || loading || parsingFile) return;

    const currentQuestion = input;
    const currentFile = selectedFile;

    setInput("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setLoading(true);

    try {
      let fileContext = "";

      if (currentFile) {
        setParsingFile(true);
        const formData = new FormData();
        formData.append("file", currentFile);

        const parseRes = await fetch("/api/parse-file", {
          method: "POST",
          body: formData,
        });

        if (!parseRes.ok) {
          const errorText = await parseRes.text();
          let errorMessage = "Unknown error";
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error;
          } catch (e) {
            errorMessage = errorText || parseRes.statusText;
          }
          throw new Error(`Server Error (${parseRes.status}): ${errorMessage}`);
        }

        const parseData = await parseRes.json();
        fileContext = `\n\n[Attached File Content: ${currentFile.name}]\n${parseData.text}\n[End of File Content]\n`;
        setParsingFile(false);
      }

      // Build context from previous conversation
      const contextPrompt = conversation.length > 0
        ? conversation.map(turn =>
          `Question: ${turn.question} ${turn.attachedFile ? `(Attached: ${turn.attachedFile})` : ""}\nAnswer: ${turn.evaluation?.content || turn.responses[0]?.content || ""}`
        ).join("\n\n") + `\n\nNew Question: ${currentQuestion}${fileContext}`
        : `${currentQuestion}${fileContext}`;

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
          question: currentQuestion + (currentFile ? ` [Attached: ${currentFile.name}]` : ""),
          responses: data.results,
          apiKeys
        }),
      });

      if (!evalRes.ok) throw new Error("Failed to evaluate responses");

      const evalData = await evalRes.json();

      const newTurn: ConversationTurn = {
        question: currentQuestion,
        responses: data.results,
        evaluation: evalData.evaluation,
        attachedFile: currentFile?.name
      };

      setConversation(prev => [...prev, newTurn]);
    } catch (err: any) {
      const errorTurn: ConversationTurn = {
        question: currentQuestion,
        responses: [],
        evaluation: {
          provider: "Error",
          content: `Przepraszam, wystąpił błąd: ${err.message}`
        },
        attachedFile: currentFile?.name
      };
      setConversation(prev => [...prev, errorTurn]);
    } finally {
      setLoading(false);
      setParsingFile(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Conversation */}
      <div className="max-w-7xl mx-auto px-4 py-6 pb-40">
        {conversation.length === 0 ? (
          <div className="text-center mt-20">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent">
                LLM Council
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Consult the council of ChatGPT, Claude, and Grok.
            </p>
            <p className="text-blue-400 font-medium mt-2">Chair: Claude</p>
          </div>
        ) : (
          conversation.map((turn, turnIndex) => (
            <div key={turnIndex} className="mb-12">
              {/* Question */}
              <div className="mb-6 flex justify-end">
                <div className="bg-purple-600/20 border border-purple-500/30 text-white rounded-xl px-6 py-4 max-w-2xl">
                  <p className="text-lg font-medium">{turn.question}</p>
                  {turn.attachedFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-purple-300 bg-purple-900/40 px-3 py-1.5 rounded-lg w-fit">
                      <FileText className="w-4 h-4" />
                      <span>{turn.attachedFile}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Individual Responses */}
              {turn.responses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {turn.responses.map((response, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl border p-6 ${response.error
                        ? "bg-red-900/20 border-red-800"
                        : "bg-gray-900 border-gray-800"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {response.provider.charAt(0)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white">
                            {response.provider}
                          </h3>
                        </div>
                        {!response.error && (
                          <span className="text-xs font-medium text-green-400 bg-green-900/30 px-2 py-1 rounded">
                            Success
                          </span>
                        )}
                        {response.error && (
                          <span className="text-xs font-medium text-red-400 bg-red-900/30 px-2 py-1 rounded">
                            Error
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {response.error || response.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chair's Verdict */}
              {turn.evaluation && (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700 rounded-xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/50">
                        <span className="text-white font-bold text-2xl">⚖️</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-white">
                          The Chair's Verdict
                        </h3>
                        <p className="text-sm text-purple-300">
                          Final Evaluation & Synthesis by Claude
                        </p>
                      </div>
                    </div>
                    <div className="text-base text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {turn.evaluation.content}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-900 rounded-xl border border-gray-800 p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
                  <div className="h-3 bg-gray-800 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-5/6"></div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 text-purple-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg">
                {parsingFile ? "Analyzing document..." : "The Council is deliberating..."}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-gray-800 p-6 z-20">
        <div className="max-w-4xl mx-auto">
          {selectedFile && (
            <div className="mb-3 flex items-center gap-2 bg-gray-800 w-fit px-3 py-1.5 rounded-lg border border-gray-700">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-200">{selectedFile.name}</span>
              <button onClick={removeFile} className="text-gray-400 hover:text-white ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="relative flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.docx,.xlsx,.xls"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 transition"
              title="Attach file (PDF, Word, Excel)"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question to the council..."
              className="flex-1 px-6 py-4 rounded-xl bg-gray-900 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder:text-gray-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={(loading || (!input.trim() && !selectedFile))}
              className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
