"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Mic } from "lucide-react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

export function BhumiBot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "Namaste! I am Bhumi-Bot, your AI Legal Assistant. You can ask me legal questions or tell me to navigate somewhere (e.g. 'Take me to register a parcel').",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleListen = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch AI response");
      }

      let botReply = data.reply;
      
      // Parse Navigation Intent
      const navRegex = /\[NAVIGATE:(.*?)\]/;
      const match = botReply.match(navRegex);
      if (match && match[1]) {
        const path = match[1].trim();
        botReply = botReply.replace(navRegex, "").trim();
        // Redirect
        router.push(path);
      }

      if (botReply) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "bot",
          content: botReply,
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: "Sorry, I am having trouble connecting to the network right now.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gov-blue hover:bg-gov-blue-dark text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center animate-fade-up"
          aria-label="Open Bhumi-Bot"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[350px] sm:w-[400px] h-[550px] max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-up border border-gov-border">
          
          {/* Header */}
          <div className="bg-gov-navy text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-gov-saffron" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Bhumi-Bot</h3>
                <p className="text-[10px] text-white/70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  AI Legal Assistant & Navigator
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gov-grey custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-gov-blue text-white"
                      : "bg-white border border-gov-border text-gov-navy"
                  }`}
                >
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`p-3 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-gov-blue text-white rounded-tr-none"
                      : "bg-white border border-gov-border text-gov-text rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-white border border-gov-border text-gov-navy flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-lg bg-white border border-gov-border rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-gov-muted animate-spin" />
                  <span className="text-xs text-gov-muted">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gov-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2 items-center"
            >
              <div className="flex-1 flex items-center bg-gov-grey border border-gov-border rounded-full px-2 py-1 focus-within:border-gov-blue focus-within:ring-1 focus-within:ring-gov-blue">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a legal question or navigate..."
                  className="flex-1 bg-transparent px-2 py-1 text-sm focus:outline-none"
                  disabled={isLoading}
                />
                {speechSupported && (
                  <button
                    type="button"
                    onClick={handleListen}
                    disabled={isLoading || isListening}
                    className={`p-1.5 rounded-full transition-colors ${
                      isListening ? "bg-red-100 text-red-500 animate-pulse" : "text-gov-muted hover:text-gov-blue hover:bg-gov-blue/10"
                    }`}
                    title="Speak"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-gov-blue text-white flex items-center justify-center hover:bg-gov-blue-dark disabled:opacity-50 disabled:hover:bg-gov-blue transition-colors shrink-0"
              >
                <Send className="w-4 h-4 -ml-0.5" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
