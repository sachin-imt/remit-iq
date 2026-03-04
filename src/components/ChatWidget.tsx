"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "bot";
    text: string;
    suggestions?: string[];
}

const STARTER_SUGGESTIONS = [
    "What does confidence % mean?",
    "What's the current AUD/INR rate?",
    "Is now a good time to send?",
    "Which platform is cheapest?",
];

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const handleOpen = () => {
        setOpen(true);
        if (!hasOpened) {
            setHasOpened(true);
            setMessages([
                {
                    id: "welcome",
                    role: "bot",
                    text: "G'day! 👋 I'm the **RemitIQ assistant** — I can help you understand AUD/INR exchange rates, explain our timing signals, and answer questions about sending money from Australia to India.\n\nWhat would you like to know?",
                    suggestions: STARTER_SUGGESTIONS,
                },
            ]);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: text.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text.trim() }),
            });

            const data = await res.json();
            const botMsg: Message = {
                id: `b-${Date.now()}`,
                role: "bot",
                text: data.reply || "Sorry, I couldn't process that.",
                suggestions: data.suggestions,
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { id: `e-${Date.now()}`, role: "bot", text: "Sorry, something went wrong. Please try again." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    // Simple markdown-to-HTML for bold, tables, and line breaks
    const renderMarkdown = (text: string) => {
        const lines = text.split("\n");
        const result: (string | JSX.Element)[] = [];
        let inTable = false;
        let tableRows: string[][] = [];
        let tableHeaders: string[] = [];

        const processInline = (line: string): string => {
            return line
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#F0B429] underline hover:text-yellow-300" target="_blank">$1</a>')
                .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 rounded text-xs">$1</code>');
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Table detection
            if (line.includes("|") && line.trim().startsWith("|")) {
                if (!inTable) {
                    inTable = true;
                    tableHeaders = line.split("|").filter(c => c.trim()).map(c => c.trim());
                    continue;
                }
                // Skip separator row
                if (line.replace(/[\s|:-]/g, "") === "") continue;
                tableRows.push(line.split("|").filter(c => c.trim()).map(c => c.trim()));
                continue;
            }

            // End table
            if (inTable && !line.includes("|")) {
                result.push(
                    <div key={`t-${i}`} className="overflow-x-auto my-2">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    {tableHeaders.map((h, hi) => (
                                        <th key={hi} className="text-left p-1.5 text-slate-500 font-semibold" dangerouslySetInnerHTML={{ __html: processInline(h) }} />
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map((row, ri) => (
                                    <tr key={ri} className="border-b border-slate-200/30">
                                        {row.map((cell, ci) => (
                                            <td key={ci} className="p-1.5 text-slate-700" dangerouslySetInnerHTML={{ __html: processInline(cell) }} />
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                inTable = false;
                tableRows = [];
                tableHeaders = [];
            }

            if (inTable) continue;

            // Empty line
            if (!line.trim()) {
                result.push(<div key={`br-${i}`} className="h-2" />);
                continue;
            }

            // Regular line
            result.push(
                <p key={`p-${i}`} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: processInline(line) }} />
            );
        }

        // Flush remaining table
        if (inTable && tableHeaders.length > 0) {
            result.push(
                <div key="t-end" className="overflow-x-auto my-2">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-slate-200">
                                {tableHeaders.map((h, hi) => (
                                    <th key={hi} className="text-left p-1.5 text-slate-500 font-semibold" dangerouslySetInnerHTML={{ __html: processInline(h) }} />
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row, ri) => (
                                <tr key={ri} className="border-b border-slate-200/30">
                                    {row.map((cell, ci) => (
                                        <td key={ci} className="p-1.5 text-slate-700" dangerouslySetInnerHTML={{ __html: processInline(cell) }} />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        return result;
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => (open ? setOpen(false) : handleOpen())}
                className={`fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${open
                        ? "bg-slate-100 hover:bg-[#2A4A6F] rotate-0"
                        : "bg-[#F0B429] hover:bg-yellow-400 hover:scale-110 glow-gold"
                    }`}
                aria-label={open ? "Close chat" : "Open RemitIQ assistant"}
            >
                {open ? (
                    <X className="w-6 h-6 text-slate-900" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-slate-900" />
                )}
            </button>

            {/* Pulse ring when closed */}
            {!open && !hasOpened && (
                <div className="fixed bottom-6 right-6 z-[99] w-14 h-14 rounded-full animate-ping bg-[#F0B429]/30 pointer-events-none" />
            )}

            {/* Chat Window */}
            {open && (
                <div className="fixed bottom-24 right-6 z-[100] w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#111D32] to-[#0D1B2E] border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F0B429]/15 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-[#F0B429]" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-slate-900 font-semibold text-sm">Ask RemitIQ</h3>
                            <p className="text-slate-500 text-xs">AUD/INR rates & remittance help</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-emerald-400 text-xs font-medium">Online</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                {msg.role === "bot" && (
                                    <div className="w-7 h-7 rounded-lg bg-[#F0B429]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Bot className="w-4 h-4 text-[#F0B429]" />
                                    </div>
                                )}
                                <div className={`max-w-[85%] ${msg.role === "user" ? "ml-auto" : ""}`}>
                                    <div
                                        className={`rounded-2xl px-3.5 py-2.5 ${msg.role === "user"
                                                ? "bg-[#F0B429] text-slate-900 rounded-br-md"
                                                : "bg-slate-50 border border-slate-200 text-slate-700 rounded-bl-md"
                                            }`}
                                    >
                                        {msg.role === "user" ? (
                                            <p className="text-sm font-medium">{msg.text}</p>
                                        ) : (
                                            <div className="space-y-1">{renderMarkdown(msg.text)}</div>
                                        )}
                                    </div>
                                    {/* Suggestions */}
                                    {msg.role === "bot" && msg.suggestions && msg.suggestions.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {msg.suggestions.map((s, si) => (
                                                <button
                                                    key={si}
                                                    onClick={() => sendMessage(s)}
                                                    disabled={loading}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100/40 text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/50 transition-all disabled:opacity-50"
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <User className="w-4 h-4 text-slate-500" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {loading && (
                            <div className="flex gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#F0B429]/15 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-[#F0B429]" />
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#7A9CC4] animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 rounded-full bg-[#7A9CC4] animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 rounded-full bg-[#7A9CC4] animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="border-t border-slate-200 px-3 py-3 bg-white">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about AUD/INR rates..."
                                disabled={loading}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-[#7A9CC4]/60 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-colors disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="w-10 h-10 rounded-xl bg-[#F0B429] text-slate-900 flex items-center justify-center hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:hover:bg-[#F0B429] flex-shrink-0"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-slate-500/50 text-[10px] text-center mt-2">Guidance only — not financial advice</p>
                    </form>
                </div>
            )}

            {/* CSS for animation */}
            <style jsx>{`
        .animate-in {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 4px; }
      `}</style>
        </>
    );
}
