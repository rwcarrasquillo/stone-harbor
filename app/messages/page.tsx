"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Cormorant_Garamond, Inter } from "next/font/google";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type ConversationListItem = {
  id: string;
  title: string;
  updated_at: string;
  otherMember?: Profile | null;
  lastMessage?: string;
};

type MessageItem = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function MessagesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageBody, setMessageBody] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const activeConversation = useMemo(() => {
    return conversations.find((item) => item.id === activeConversationId);
  }, [conversations, activeConversationId]);

  async function loadPage() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUserId(user.id);
    await loadConversations(user.id);
    setLoading(false);
  }

  async function loadConversations(currentUserId: string) {
    const { data: memberships, error: membershipError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    if (membershipError) {
      console.error("Could not load memberships:", membershipError.message);
      setConversations([]);
      return;
    }

    const conversationIds =
      memberships?.map((item) => item.conversation_id) ?? [];

    if (conversationIds.length === 0) {
      setConversations([]);
      return;
    }

    const { data: conversationRows, error: conversationError } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (conversationError) {
      console.error("Could not load conversations:", conversationError.message);
      return;
    }

    const { data: memberRows, error: memberError } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds);

    if (memberError) {
      console.error(
        "Could not load conversation members:",
        memberError.message,
      );
      return;
    }

    const otherUserIds =
      memberRows
        ?.filter((member) => member.user_id !== currentUserId)
        .map((member) => member.user_id) ?? [];

    const uniqueOtherUserIds = Array.from(new Set(otherUserIds));

    let profiles: Profile[] = [];

    if (uniqueOtherUserIds.length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, username, avatar_url")
        .in("id", uniqueOtherUserIds);

      if (error) {
        console.error("Could not load profiles:", error.message);
      }

      profiles = data ?? [];
    }

    const { data: recentMessages, error: recentMessageError } = await supabase
      .from("messages")
      .select("conversation_id, body, created_at")
      .in("conversation_id", conversationIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (recentMessageError) {
      console.error(
        "Could not load recent messages:",
        recentMessageError.message,
      );
    }

    const list =
      conversationRows?.map((conversation) => {
        const otherMemberId = memberRows?.find(
          (member) =>
            member.conversation_id === conversation.id &&
            member.user_id !== currentUserId,
        )?.user_id;

        const otherMember =
          profiles.find((profile) => profile.id === otherMemberId) ?? null;

        const lastMessage = recentMessages?.find(
          (message) => message.conversation_id === conversation.id,
        );

        return {
          id: conversation.id,
          title:
            conversation.title ||
            otherMember?.display_name ||
            otherMember?.username ||
            otherMember?.email ||
            "Stone Harbor Member",
          updated_at: conversation.updated_at,
          otherMember,
          lastMessage: lastMessage?.body ?? "No messages yet.",
        };
      }) ?? [];

    setConversations(list);

    if (!activeConversationId && list.length > 0) {
      setActiveConversationId(list[0].id);
      await loadMessages(list[0].id, true);
    }
  }

  async function markConversationAsRead(conversationId: string) {
    if (!userId) return;

    const { error } = await supabase
      .from("conversation_members")
      .update({
        last_read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Could not mark conversation as read:", error.message);
    }
  }

  async function loadMessages(conversationId: string, markRead = false) {
    const { data, error } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Could not load messages:", error.message);
      setMessages([]);
      return;
    }

    setMessages(data ?? []);

    if (markRead) {
      await markConversationAsRead(conversationId);
    }
  }

  async function searchMembers(value: string) {
    setMemberSearch(value);
    setSearchError("");

    const query = value.trim();

    if (query.length < 2 || !userId) {
      setMemberResults([]);
      return;
    }

    setSearching(true);

    const safeQuery = query.replaceAll(",", "").replaceAll("%", "");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, username, avatar_url")
      .or(
        `display_name.ilike.%${safeQuery}%,username.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%`,
      )
      .neq("id", userId)
      .limit(10);

    if (error) {
      console.error("Member search failed:", error.message);
      setSearchError(error.message);
      setMemberResults([]);
      setSearching(false);
      return;
    }

    setMemberResults(data ?? []);
    setSearching(false);
  }

  async function startConversation(otherUserId: string) {
    const { data, error } = await supabase.rpc("create_direct_conversation", {
      other_user_id: otherUserId,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const conversationId = data as string;

    setMemberSearch("");
    setMemberResults([]);
    setActiveConversationId(conversationId);

    if (userId) {
      await loadConversations(userId);
    }

    await loadMessages(conversationId, true);
  }

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!activeConversationId || !messageBody.trim()) return;

    setSending(true);

    const { error } = await supabase.rpc("send_message", {
      conversation_uuid: activeConversationId,
      message_body: messageBody,
    });

    if (error) {
      alert(error.message);
      setSending(false);
      return;
    }

    setMessageBody("");
    await loadMessages(activeConversationId, true);

    if (userId) {
      await loadConversations(userId);
    }

    setSending(false);
  }

  function formatMessageTime(value: string) {
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;

    loadMessages(activeConversationId, true);

    const channel = supabase
      .channel(`messages-${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async () => {
          await loadMessages(activeConversationId, true);

          if (userId) {
            await loadConversations(userId);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, userId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3efe7]">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-stone-600">
          Loading Messages...
        </p>
      </main>
    );
  }

  return (
    <main
      className={`${sans.className} min-h-screen bg-[#f3efe7] px-4 py-8 text-stone-900 md:px-8`}
    >
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="/dashboard"
            className="text-sm font-bold uppercase tracking-[0.35em] text-[#a9793d]"
          >
            ← Dashboard
          </a>

          <a
            href="/"
            className="text-sm font-bold uppercase tracking-[0.35em] text-stone-500"
          >
            Stone Harbor
          </a>
        </div>

        <div className="grid min-h-[760px] gap-8 lg:grid-cols-[0.42fr_0.58fr]">
          <aside className="rounded-none border border-white/70 bg-white p-7 shadow-[0_16px_60px_rgba(0,0,0,0.06)]">
            <div className="mb-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-[#a9793d]">
                Member Messages
              </p>

              <h1
                className={`${serif.className} text-5xl font-medium leading-tight text-stone-900`}
              >
                Private inbox.
              </h1>

              <p className="mt-4 leading-relaxed text-stone-600">
                Search for another Stone Harbor member to begin a private
                conversation.
              </p>
            </div>

            <div className="mb-8">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-stone-500">
                Find Member
              </label>

              <input
                value={memberSearch}
                onChange={(e) => searchMembers(e.target.value)}
                className="w-full rounded-none border border-stone-300 bg-[#f8f4ed] px-5 py-4 outline-none transition focus:border-[#a9793d]"
                placeholder="Search name, username, or email"
              />

              {searching && (
                <div className="mt-3 border border-stone-200 bg-[#f8f4ed] px-4 py-4 text-sm text-stone-500">
                  Searching members...
                </div>
              )}

              {searchError && (
                <div className="mt-3 border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                  Search error: {searchError}
                </div>
              )}

              {memberResults.length > 0 && (
                <div className="mt-3 max-h-72 overflow-y-auto border border-stone-300 bg-white shadow-lg">
                  {memberResults.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => startConversation(member.id)}
                      className="flex w-full items-center gap-4 border-b border-stone-200 px-4 py-4 text-left transition last:border-b-0 hover:bg-[#f8f4ed]"
                    >
                      <Avatar profile={member} />

                      <div className="min-w-0">
                        <p className="truncate font-bold text-stone-900">
                          {member.display_name ||
                            member.username ||
                            member.email ||
                            "Stone Harbor Member"}
                        </p>

                        <p className="truncate text-sm text-stone-500">
                          {member.username
                            ? `@${member.username}`
                            : member.email}
                        </p>

                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#a9793d]">
                          Start Conversation
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {memberSearch.trim().length >= 2 &&
                !searching &&
                !searchError &&
                memberResults.length === 0 && (
                  <div className="mt-3 border border-stone-200 bg-[#f8f4ed] px-4 py-4 text-sm text-stone-500">
                    No members found.
                  </div>
                )}
            </div>

            <div className="border-t border-stone-200 pt-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-stone-500">
                Conversations
              </p>

              {conversations.length === 0 ? (
                <div className="border border-stone-200 bg-[#f8f4ed] p-6 text-stone-600">
                  No conversations yet. Search for a member to begin.
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => {
                        setActiveConversationId(conversation.id);
                        loadMessages(conversation.id, true);
                      }}
                      className={`w-full border px-4 py-4 text-left transition ${
                        activeConversationId === conversation.id
                          ? "border-[#a9793d] bg-[#f3efe7]"
                          : "border-stone-200 bg-[#f8f4ed] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar profile={conversation.otherMember ?? null} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-stone-900">
                            {conversation.title}
                          </p>

                          <p className="mt-1 truncate text-sm text-stone-500">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[760px] flex-col rounded-none border border-white/70 bg-white shadow-[0_16px_60px_rgba(0,0,0,0.06)]">
            {activeConversation ? (
              <>
                <div className="border-b border-stone-200 bg-[#f8f4ed] px-7 py-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a9793d]">
                    Conversation
                  </p>

                  <h2
                    className={`${serif.className} mt-2 text-4xl font-medium text-stone-900`}
                  >
                    {activeConversation.title}
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto px-7 py-6">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center border border-stone-200 bg-[#f8f4ed] p-8 text-center text-stone-600">
                      No messages yet. Send the first one.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {messages.map((message) => {
                        const isMine = message.sender_id === userId;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[78%] border px-5 py-4 ${
                                isMine
                                  ? "border-[#a9793d] bg-[#a9793d] text-white"
                                  : "border-stone-200 bg-[#f8f4ed] text-stone-800"
                              }`}
                            >
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {message.body}
                              </p>

                              <p
                                className={`mt-3 text-[11px] font-bold uppercase tracking-[0.18em] ${
                                  isMine ? "text-white/70" : "text-stone-400"
                                }`}
                              >
                                {formatMessageTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={sendMessage}
                  className="border-t border-stone-200 bg-[#f8f4ed] p-6"
                >
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-stone-500">
                    Message
                  </label>

                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-none border border-stone-300 bg-white px-5 py-4 outline-none transition focus:border-[#a9793d]"
                      placeholder="Write a private message..."
                    />

                    <button
                      type="submit"
                      disabled={sending || !messageBody.trim()}
                      className="rounded-none border border-[#c4934e] bg-[#a9793d] px-8 py-4 text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#8d6432] disabled:opacity-60"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-10 text-center">
                <div>
                  <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-[#a9793d]">
                    No Conversation Selected
                  </p>

                  <h2
                    className={`${serif.className} text-5xl font-medium text-stone-900`}
                  >
                    Choose a member to begin.
                  </h2>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function Avatar({ profile }: { profile: Profile | null }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-[#efe8dc]">
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt="Member avatar"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-lg text-[#a9793d]">⚓</span>
      )}
    </div>
  );
}
