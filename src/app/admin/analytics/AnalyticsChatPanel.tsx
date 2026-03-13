"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Sparkles, ChevronDown } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const SUGGESTED_QUESTIONS = [
    "How many users do I have?",
    "Which pages get the most traffic?",
    "How many alerts were created this week?",
    "Is my system healthy?",
    "What's the trend in user signups?",
    "How many alerts have been triggered?",
];

function formatMarkdown(text: string): React.ReactNode {
    // Split into lines and render basic markdown
    const lines = text.split("\n");
    return lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
            return <p key={i} className="font-semibold text-white mt-2">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
            return (
                <div key={i} className="flex gap-2 mt-1">
                    <span className="text-[#F0B429] mt-0.5 shrink-0">•</span>
                    <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                </div>
            );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
            <p key={i} className="mt-1"
                dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
            />
        );
    });
}

export default function AnalyticsChatPanel({ adminKey }: { adminKey: string }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hi! I'm your RemitIQ analytics assistant. Ask me anything about your users, traffic, alerts, or system health — I have live access to your database.",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMessage: Message = { role: "user", content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        setShowSuggestions(false);

        try {
            const res = await fetch("/api/admin/analytics-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    history: messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0),
                    key: adminKey,
                }),
            });

            const data = await res.json();
            const reply = data.reply || data.error || "AI service error. Please try again.";
            setMessages(prev => [...prev, { role: "assistant", content: reply }]);
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Network error. Please check your connection and try again.",
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setOpen(true)}
                className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-semibold text-sm shadow-2xl transition-all duration-300 ${open ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"}`}
                style={{ background: "linear-gradient(135deg, #F0B429, #FF6B35)", color: "#0A1628" }}
            >
                <Sparkles className="w-4 h-4" />
                Ask AI
            </button>

            {/* Chat panel — slide up from bottom right */}
            <div
                className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl border border-[#1E3A5F] transition-all duration-300 origin-bottom-right ${open ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}`}
                style={{ width: "min(420px, calc(100vw - 32px))", height: "min(580px, calc(100vh - 120px))", background: "#0D1B2E" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#1E3A5F] shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F0B429, #FF6B35)" }}>
                            <Sparkles className="w-4 h-4 text-[#0A1628]" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Analytics AI</p>
                            <p className="text-xs text-[#7A9CC4]">Live database access</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {messages.length > 1 && (
                            <button
                                onClick={() => { setMessages([messages[0]]); setShowSuggestions(true); }}
                                className="text-xs text-[#7A9CC4] hover:text-white px-2 py-1 rounded-lg hover:bg-[#1E3A5F] transition-colors"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={() => setOpen(false)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A9CC4] hover:text-white hover:bg-[#1E3A5F] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            {msg.role === "assistant" && (
                                <div className="w-6 h-6 rounded-lg shrink-0 mr-2 mt-0.5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F0B429, #FF6B35)" }}>
                                    <Sparkles className="w-3 h-3 text-[#0A1628]" />
                                </div>
                            )}
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-[#F0B429] text-[#0A1628] font-medium rounded-br-sm"
                                    : "bg-[#111D32] border border-[#1E3A5F] text-[#C8D8E8] rounded-bl-sm"
                                }`}
                            >
                                {msg.role === "assistant" ? formatMarkdown(msg.content) : msg.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="w-6 h-6 rounded-lg shrink-0 mr-2 mt-0.5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F0B429, #FF6B35)" }}>
                                <Sparkles className="w-3 h-3 text-[#0A1628]" />
                            </div>
                            <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl rounded-bl-sm px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-[#F0B429] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-1.5 h-1.5 bg-[#F0B429] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-1.5 h-1.5 bg-[#F0B429] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Suggested questions */}
                {showSuggestions && messages.length <= 1 && (
                    <div className="px-4 pb-2 shrink-0">
                        <p className="text-xs text-[#4A6A8A] mb-2 flex items-center gap-1">
                            <ChevronDown className="w-3 h-3" /> Try asking...
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(q)}
                                    className="text-xs px-3 py-1.5 rounded-full border border-[#1E3A5F] text-[#7A9CC4] hover:text-white hover:border-[#F0B429] hover:bg-[#F0B42910] transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-3 border-t border-[#1E3A5F] shrink-0">
                    <div className="flex items-center gap-2 bg-[#111D32] border border-[#1E3A5F] rounded-xl px-3 py-2 focus-within:border-[#F0B429] transition-colors">
                        <MessageSquare className="w-4 h-4 text-[#4A6A8A] shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask about users, traffic, alerts..."
                            disabled={loading}
                            className="flex-1 bg-transparent text-sm text-white placeholder-[#4A6A8A] outline-none min-w-0"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                            style={{ background: (input.trim() && !loading) ? "linear-gradient(135deg, #F0B429, #FF6B35)" : undefined }}
                        >
                            {loading
                                ? <Loader2 className="w-3.5 h-3.5 text-[#7A9CC4] animate-spin" />
                                : <Send className="w-3.5 h-3.5 text-[#0A1628]" />
                            }
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
