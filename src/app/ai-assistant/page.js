"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

import ReactMarkdown from "react-markdown";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function AIAssistantPage() {
  const [user, setUser] = useState(null);

  const [prompt, setPrompt] = useState("");

  const [response, setResponse] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const askAI = async () => {
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/ai-assistant",
        {
          prompt: prompt,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      setResponse(res.data.answer);
    } catch (error) {
      console.error(error);

      if (error.response?.data?.error) {
        setResponse(error.response.data.error);
      } else {
        setResponse("AI server not running.");
      }
    }

    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-[#050816] text-white flex overflow-hidden">

      {/* Sidebar */}

      <div
        className="
          w-[280px]
          h-screen
          overflow-y-auto
          border-r
          border-[#1E293B]
          bg-[#081020]
          flex-shrink-0
        "
      >
        <Sidebar user={user} />
      </div>

      {/* Main Content */}

      <main
        className="
          flex-1
          h-screen
          overflow-y-auto
          px-10
          py-8
        "
      >

        {/* Header */}

        <div className="pb-6">

          <div className="flex items-center justify-between">

            <div>

              <h1
                className="
                  text-5xl
                  font-black
                  bg-gradient-to-r
                  from-violet-400
                  via-blue-400
                  to-cyan-400
                  bg-clip-text
                  text-transparent
                "
              >
                AI Assistant
              </h1>

              <p className="text-[#94A3B8] mt-3 text-lg">
                Powered by Ollama + Qwen
              </p>

            </div>

            <div
              className="
                hidden md:flex
                items-center
                gap-3
                bg-[#0F172A]
                border border-[#1E293B]
                px-5 py-3
                rounded-2xl
              "
            >
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>

              <span className="text-sm text-[#CBD5E1]">
                AI Connected
              </span>

            </div>

          </div>

        </div>

        {/* Prompt Section */}

        <div
          className="
            mt-6
            bg-[#0F172A]/80
            backdrop-blur-xl
            border border-[#1E293B]
            rounded-[30px]
            p-8
            shadow-[0_0_40px_rgba(59,130,246,.15)]
          "
        >

          <div className="flex items-center justify-between mb-5">

            <label className="text-[#CBD5E1] text-lg font-semibold">
              Ask Anything
            </label>

            <div
              className="
                px-4
                py-2
                rounded-xl
                bg-[#111827]
                border border-[#1E293B]
                text-sm
                text-[#94A3B8]
              "
            >
              Qwen 2.5
            </div>

          </div>

          <textarea
            rows={7}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Write a futuristic admin dashboard using Next.js and Tailwind CSS..."
            className="
              w-full
              bg-[#050816]
              border border-[#1E293B]
              rounded-3xl
              p-6
              outline-none
              resize-none
              text-white
              text-[15px]
              leading-7
              focus:border-blue-500
              transition-all
            "
          />

          <div className="flex items-center justify-between mt-6">

            <p className="text-[#64748B] text-sm">
              AI can generate code, UI, backend, dashboards & more
            </p>

            <button
              onClick={askAI}
              disabled={loading}
              className="
                px-8
                py-4
                rounded-2xl
                font-semibold
                text-white
                transition-all
                hover:scale-[1.03]
                disabled:opacity-50
                shadow-[0_0_25px_rgba(59,130,246,.35)]
              "
              style={{
                background:
                  "linear-gradient(135deg,#7C3AED,#2563EB,#06B6D4)",
              }}
            >
              {loading ? "Thinking..." : "Ask AI"}
            </button>

          </div>

        </div>

        {/* Response Section */}

        <div
          className="
            mt-8
            mb-20
            bg-[#0F172A]/80
            backdrop-blur-xl
            border border-[#1E293B]
            rounded-[30px]
            p-8
            min-h-[500px]
            shadow-[0_0_40px_rgba(59,130,246,.08)]
          "
        >

          <div className="flex items-center justify-between mb-8">

            <h2 className="text-3xl font-bold">
              Response
            </h2>

            {response && (
              <div
                className="
                  px-4
                  py-2
                  rounded-xl
                  bg-[#111827]
                  border border-[#1E293B]
                  text-sm
                  text-[#94A3B8]
                "
              >
                Generated by AI
              </div>
            )}

          </div>

          {!response ? (

            <div
              className="
                flex
                items-center
                justify-center
                h-[300px]
                text-[#64748B]
                text-lg
              "
            >
              AI response will appear here...
            </div>

          ) : (

            <div
              className="
                prose
                prose-invert
                max-w-none
                text-[#E2E8F0]
                prose-headings:text-white
                prose-p:text-[#CBD5E1]
                prose-strong:text-white
                prose-code:text-cyan-400
              "
            >

              <ReactMarkdown
                components={{
                  code({
                    inline,
                    className,
                    children,
                    ...props
                  }) {

                    const match = /language-(\w+)/.exec(
                      className || ""
                    );

                    return !inline && match ? (

                      <div
                        className="
                          my-8
                          rounded-3xl
                          overflow-hidden
                          border border-[#1E293B]
                          shadow-[0_0_30px_rgba(59,130,246,.08)]
                        "
                      >

                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            bg-[#111827]
                            px-5
                            py-3
                            border-b
                            border-[#1E293B]
                          "
                        >

                          <span className="text-[#94A3B8] text-sm">
                            {match[1]}
                          </span>

                          <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          </div>

                        </div>

                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            padding: "25px",
                            background: "#050816",
                            fontSize: "14px",
                            borderRadius: "0px",
                          }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>

                      </div>

                    ) : (

                      <code
                        className="
                          bg-[#111827]
                          px-2
                          py-1
                          rounded-lg
                          text-cyan-400
                        "
                        {...props}
                      >
                        {children}
                      </code>

                    );
                  },
                }}
              >
                {response}
              </ReactMarkdown>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}