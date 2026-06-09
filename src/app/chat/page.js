"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import Sidebar from "@/components/Sidebar";
import { Send, User } from "lucide-react";

// ✅ ONLY CHANGE: Updated fallback URL from localhost to production
const socket = io(
  process.env.NEXT_PUBLIC_API_URL ||
    "https://my-app-2lpp.onrender.com"
);

export default function ChatPage() {
  const [user, setUser] =
    useState(null);

  const [users, setUsers] =
    useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [message, setMessage] =
    useState("");

  // ✅ ONLY CHANGE: Updated fallback URL from localhost to production
  const API_URL =
    process.env
      .NEXT_PUBLIC_API_URL ||
    "https://my-app-2lpp.onrender.com";

  // ======================
  // AUTH + USERS
  // ======================
  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const savedUser =
      localStorage.getItem("user");

    if (!token || !savedUser) {
      window.location.href =
        "/login";
      return;
    }

    const parsedUser =
      JSON.parse(savedUser);

    setUser(parsedUser);

    fetchUsers(token);

    socket.on(
      "receiveMessage",
      (newMessage) => {
        if (
          selectedUser &&
          (newMessage.sender_id ===
            selectedUser.id ||
            newMessage.receiver_id ===
              selectedUser.id)
        ) {
          setMessages((prev) => [
            ...prev,
            newMessage,
          ]);
        }
      }
    );

    return () => {
      socket.off(
        "receiveMessage"
      );
    };
  }, [selectedUser]);

  // ======================
  // FETCH USERS
  // ======================
  const fetchUsers =
    async (token) => {
      try {
        const res =
          await axios.get(
            `${API_URL}/all-users`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        const filtered =
          res.data.filter(
            (u) =>
              u.id !== user?.id
          );

        setUsers(filtered);
      } catch (error) {
        console.error(error);
      }
    };

  // ======================
  // LOAD CHAT
  // ======================
  const loadMessages =
    async (receiverId) => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        const res =
          await axios.get(
            `${API_URL}/get-messages/${receiverId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        setMessages(
          res.data
        );
      } catch (error) {
        console.error(error);
      }
    };

  // ======================
  // SEND MESSAGE
  // ======================
  const sendMessage =
    async () => {
      if (
        !message.trim() ||
        !selectedUser
      )
        return;

      try {
        const token =
          localStorage.getItem(
            "token"
          );

        await axios.post(
          `${API_URL}/send-message`,
          {
            receiver_id:
              selectedUser.id,
            message,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMessage("");

        loadMessages(
          selectedUser.id
        );
      } catch (error) {
        console.error(error);
      }
    };

  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden bg-[#050816] text-white">

      {/* FIXED SIDEBAR */}
      <aside
        className="
          fixed
          left-0
          top-0
          h-screen
          w-[280px]
          z-50
          overflow-y-auto
          border-r
          border-[#1E293B]
          bg-[#050816]
        "
      >
        <Sidebar user={user} />
      </aside>

      {/* MAIN CONTENT */}
      <main
        className="
          ml-[280px]
          h-screen
          flex
          overflow-hidden
        "
      >

        {/* USERS PANEL */}
        <div
          className="
            w-[340px]
            h-screen
            overflow-y-auto
            border-r
            border-[#1E293B]
            bg-[#0B1120]
          "
        >

          {/* HEADER */}
          <div
            className="
              sticky
              top-0
              z-20
              bg-[#0B1120]/95
              backdrop-blur-xl
              border-b
              border-[#1E293B]
              p-6
            "
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#06B6D4] bg-clip-text text-transparent">
              Team Chat
            </h1>

            <p className="text-[#94A3B8] mt-2 text-sm">
              Real-time communication
            </p>
          </div>

          {/* USERS */}
          <div className="p-4 space-y-3">

            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setSelectedUser(u);

                  loadMessages(u.id);
                }}
                className={`w-full rounded-3xl border transition-all duration-300 ${
                  selectedUser?.id === u.id
                    ? "border-[#8B5CF6] bg-gradient-to-r from-[#111827] to-[#172554] shadow-[0_0_25px_rgba(139,92,246,0.25)]"
                    : "border-[#1E293B] bg-[#0F172A] hover:border-[#334155] hover:bg-[#131D33]"
                }`}
              >
                <div className="flex items-center gap-4 p-5">

                  <div
                    className="
                      w-14
                      h-14
                      rounded-2xl
                      bg-gradient-to-br
                      from-[#8B5CF6]
                      via-[#6366F1]
                      to-[#06B6D4]
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <User size={20} />
                  </div>

                  <div className="text-left flex-1">
                    <p className="font-semibold text-white">
                      {u.name}
                    </p>

                    <p className="text-sm text-[#94A3B8] mt-1">
                      {u.role}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CHAT SECTION */}
        <div className="flex-1 h-screen flex flex-col bg-[#050816]">

          {/* CHAT HEADER */}
          <div
            className="
              sticky
              top-0
              z-20
              border-b
              border-[#1E293B]
              bg-[#0B1120]/90
              backdrop-blur-xl
              px-8
              py-5
            "
          >
            {selectedUser ? (
              <div className="flex items-center gap-4">

                <div
                  className="
                    w-14
                    h-14
                    rounded-2xl
                    bg-gradient-to-br
                    from-[#8B5CF6]
                    to-[#06B6D4]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <User size={20} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedUser.name}
                  </h2>

                  <p className="text-[#94A3B8] text-sm mt-1">
                    Active Team Member
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold">
                  Select a User
                </h2>

                <p className="text-[#94A3B8] mt-1">
                  Start chatting with your team
                </p>
              </div>
            )}
          </div>

          {/* MESSAGES */}
          <div
            className="
              flex-1
              overflow-y-auto
              px-8
              py-8
              space-y-5
            "
          >
            {messages.map(
              (msg, index) => {
                const mine =
                  msg.sender_id ===
                  user.id;

                return (
                  <div
                    key={index}
                    className={`flex ${
                      mine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[500px] px-6 py-4 rounded-[28px] border ${
                        mine
                          ? "bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#2563EB] border-[#8B5CF6]"
                          : "bg-[#111827] border-[#1E293B]"
                      }`}
                    >
                      <p className="text-white break-words">
                        {msg.message}
                      </p>

                      <p className="text-[11px] text-white/50 mt-2">
                        {new Date(
                          msg.created_at
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* INPUT */}
          {selectedUser && (
            <div
              className="
                border-t
                border-[#1E293B]
                bg-[#0B1120]
                p-6
              "
            >
              <div className="flex items-center gap-4">

                <input
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) =>
                    setMessage(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) =>
                    e.key ===
                      "Enter" &&
                    sendMessage()
                  }
                  className="
                    flex-1
                    h-16
                    bg-[#111827]
                    border
                    border-[#1E293B]
                    focus:border-[#8B5CF6]
                    rounded-3xl
                    px-6
                    outline-none
                    text-white
                    placeholder:text-[#64748B]
                  "
                />

                <button
                  onClick={
                    sendMessage
                  }
                  className="
                    w-16
                    h-16
                    rounded-3xl
                    bg-gradient-to-r
                    from-[#8B5CF6]
                    via-[#6366F1]
                    to-[#2563EB]
                    flex
                    items-center
                    justify-center
                    hover:scale-105
                    transition-all
                  "
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}