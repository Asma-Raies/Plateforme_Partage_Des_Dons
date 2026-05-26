import { useEffect, useState, useRef } from "react";
import axios from "../../api/axios";

export default function Messages() {
  const [view, setView] = useState("conversations");
  const [conversations, setConversations] = useState([]);
  const [availableAssociations, setAvailableAssociations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [initiating, setInitiating] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(stored);
    loadConversations();
    if (stored.role === "donor") loadAvailableAssociations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/messages/conversations");
      setConversations(data);
    } catch (err) {
      console.error("loadConversations error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAssociations = async () => {
    try {
      const { data } = await axios.get("/messages/associations/available");
      setAvailableAssociations(data);
    } catch (err) {
      console.error("loadAvailableAssociations error:", err);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/messages/conversations/${conversationId}/messages`);
      setMessages(data);
      setSelectedConversation(conversationId);
      setView("conversations");
      // Reset unread badge locally
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error("loadMessages error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateConversation = async (associationId) => {
    try {
      setInitiating(true);
      const { data } = await axios.post("/messages/conversations/start", { associationId });
      await loadConversations();
      await loadAvailableAssociations();
      await loadMessages(data._id);
    } catch (err) {
      console.error("handleInitiateConversation error:", err);
    } finally {
      setInitiating(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      setError(null);
      const { data } = await axios.post("/messages/send", {
        conversationId: selectedConversation,
        content: newMessage,
      });

      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConversation
            ? { ...c, lastMessage: newMessage, lastMessageAt: new Date(), unreadCount: 0 }
            : c
        )
      );
    } catch (err) {
      console.error("handleSendMessage error:", err);
      setError(err.response?.data?.message || "Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  const getConversationTitle = (conversation) => {
    if (!conversation) return "";
    return (
      conversation.otherParticipant?.organizationName ||
      conversation.otherParticipant?.name ||
      conversation.association?.organizationName ||
      conversation.association?.name ||
      "Conversation"
    );
  };

  // Check sender — schema stores _id as string in localStorage sometimes
  const isMyMessage = (message) => {
    const myId = user?.id || user?._id;
    return message.sender?._id?.toString() === myId?.toString();
  };

  const selectedConvObj = conversations.find((c) => c._id === selectedConversation);

  return (
    <div className="h-full flex bg-white rounded-2xl overflow-hidden shadow-lg">
      {/* ── Sidebar ── */}
      <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setView("conversations")}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                view === "conversations"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              Conversations
            </button>
            <button
              onClick={() => setView("associations")}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                view === "associations"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              Contacter
            </button>
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            {view === "conversations" ? "Conversations" : "Associations"}
          </h2>
          <p className="text-xs text-slate-500">
            {view === "conversations"
              ? `${conversations.length} conversation(s)`
              : `${availableAssociations.length} association(s)`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {view === "conversations" ? (
            loading && conversations.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">Chargement...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                <p className="mb-2">Aucune conversation</p>
                <p className="text-xs">Cliquez sur "Contacter" pour démarrer</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => loadMessages(conv._id)}
                  className={`w-full p-4 border-b border-slate-200 text-left transition-colors hover:bg-slate-100 ${
                    selectedConversation === conv._id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-slate-900 truncate text-sm">
                      {getConversationTitle(conv)}
                    </h3>
                    {conv.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-2 flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 truncate">
                    {conv.lastMessage || "Pas de message"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(conv.lastMessageAt).toLocaleDateString("fr-FR")}
                  </p>
                </button>
              ))
            )
          ) : availableAssociations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              Aucune association disponible
            </div>
          ) : (
            availableAssociations.map((assoc) => (
              <div
                key={assoc._id}
                className="p-4 border-b border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <h3 className="font-semibold text-slate-900 text-sm mb-1">
                  {assoc.organizationName || assoc.name}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                  {assoc.description || "Pas de description"}
                </p>
                {assoc.hasConversation ? (
                  <button
                    onClick={() => loadMessages(assoc.conversationId)}
                    className="w-full px-3 py-2 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition"
                  >
                    Ouvrir conversation
                  </button>
                ) : (
                  <button
                    onClick={() => handleInitiateConversation(assoc._id)}
                    disabled={initiating}
                    className="w-full px-3 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 disabled:bg-slate-300 transition"
                  >
                    {initiating ? "Démarrage..." : "Démarrer conversation"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                {getConversationTitle(selectedConvObj)}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedConvObj?.otherParticipant?.email || ""}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  ⚠️ {error}
                </div>
              )}
              {loading ? (
                <div className="text-center text-slate-500">Chargement des messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-500 mt-8">Commencez la conversation</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${isMyMessage(message) ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-xs lg:max-w-md">
                      <p
                        className={`text-xs font-bold mb-1 ${
                          isMyMessage(message)
                            ? "text-right text-blue-600"
                            : "text-left text-slate-700"
                        }`}
                      >
                        {message.senderName || message.sender?.name}
                      </p>
                      <div
                        className={`px-4 py-3 rounded-lg ${
                          isMyMessage(message)
                            ? "bg-blue-500 text-white rounded-br-none"
                            : "bg-slate-200 text-slate-900 rounded-bl-none"
                        }`}
                      >
                        <p className="break-words text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="h-20 border-t border-slate-200 px-6 py-4 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); setError(null); }}
                  placeholder="Tapez votre message..."
                  disabled={sending}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-100"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Envoyer
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">
                {view === "conversations"
                  ? "Sélectionnez une conversation"
                  : "Choisissez une association pour commencer"}
              </p>
              <p className="text-sm">
                {view === "conversations"
                  ? 'ou cliquez sur "Contacter" pour en démarrer une nouvelle'
                  : "Cliquez sur une association pour initier le contact"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}