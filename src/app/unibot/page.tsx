"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/database/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import BackButton from "@/components/BackButton";

// --- Interfaces ---
interface Site {
  id: string;
  name: string;
  materials: { name: string; amount: number; unit: string }[];
}

interface Store {
  id: string;
  name: string;
  materials: { name: string; amount: number; unit: string }[];
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

// --- Main Component ---
export default function UniBotPage() {
  const { user } = useAuth();
  const [apiKey] = useState(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
  const [genAI, setGenAI] = useState<GoogleGenerativeAI | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chat, setChat] = useState<any | null>(null); // Simplified for now

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Initialize Gemini AI
  useEffect(() => {
    if (apiKey) {
      const ai = new GoogleGenerativeAI(apiKey);
      setGenAI(ai);
    }
  }, [apiKey]);


  // Load initial data and start chat
  useEffect(() => {
    if (genAI && user && !initialDataLoaded) {
      const loadInitialData = async () => {
        setIsLoading(true);
        try {
          // 1. Fetch Sites and Stores
          const sitesQuery = query(collection(db, 'sites'), where('members', 'array-contains', user.uid));
          const storesQuery = query(collection(db, 'stores'), where('members', 'array-contains', user.uid));

          const [sitesSnapshot, storesSnapshot] = await Promise.all([
            getDocs(sitesQuery),
            getDocs(storesQuery),
          ]);

          const sitesData = sitesSnapshot.docs.map(doc => doc.data() as Site);
          const storesData = storesSnapshot.docs.map(doc => doc.data() as Store);

          // 2. Construct the initial context
          const initialContext = `
            You are UniBot, a specialized AI assistant for the UniMan application. Your purpose is to help users with material management across their construction sites and storage locations.

            **IMPORTANT RULES:**
            1.  **ONLY** answer questions related to the user's material data provided below. 
            2.  If a user asks an unrelated question (e.g., "What is the capital of France?", "Who are you?"), politely decline by saying: "I can only help with questions about your material management in UniMan."
            3.  Be concise and clear in your answers.
            4.  When asked for a summary, provide a clear, itemized list.

            Here is the user's current material data:

            **SITES:**
            ${sitesData.map(s => `- ${s.name}: ${s.materials.length > 0 ? s.materials.map(m => `${m.name} (${m.amount} ${m.unit})`).join(', ') : 'No materials'}`).join('\n')}

            **STORES:**
            ${storesData.map(s => `- ${s.name}: ${s.materials.length > 0 ? s.materials.map(m => `${m.name} (${m.amount} ${m.unit})`).join(', ') : 'No materials'}`).join('\n')}
          `;

          // 3. Initialize the Gemini Chat
          const chatSession = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }).startChat({
            history: [{ role: "user", parts: [{ text: initialContext }] }],
            generationConfig: {
              maxOutputTokens: 500,
            },
          });
          setChat(chatSession);

          // 4. Set initial bot message
          setMessages([
            {
              role: "model",
              text: "Hi, I'm UniBot, here to help you with material management.",
            },
          ]);

          setInitialDataLoaded(true);
        } catch (error) {
          console.error("Error loading initial data:", error);
          setMessages([
            {
              role: "model",
              text: "Sorry, I couldn't load your data. Please try again later.",
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      };

      loadInitialData();
    }
  }, [genAI, user, initialDataLoaded]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handlers ---

  const handleSendMessage = async () => {
    if (!userInput.trim() || !chat) return;

    const userMessage: ChatMessage = { role: "user", text: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      const result = await chat.sendMessage(userInput);
      const response = await result.response;
      const botMessage: ChatMessage = { role: "model", text: response.text() };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      const errorMessage: ChatMessage = {
        role: "model",
        text: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render ---

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {/* Header */}
      <div className="relative z-10 px-4 pt-3 pb-3 border-b border-gray-700/30 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BackButton />
            <h1 className="text-xl font-semibold text-white">UniBot</h1>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-sm md:max-w-md lg:max-w-lg px-5 py-3 rounded-2xl shadow-md ${msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700/50 text-gray-200'
                }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-sm md:max-w-md lg:max-w-lg px-5 py-3 rounded-2xl shadow-md bg-gray-700/50 text-gray-200 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 pt-3 border-t border-gray-700/30 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Ask UniBot..."
            className="flex-1 bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="h-20"></div>
    </div>
  );
}