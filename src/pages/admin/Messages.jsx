import { useState } from "react";
import { useAdmin } from "../../contexts/AdminContext";
import ConfirmModal from "../../components/ConfirmModal";

export default function ContactMessages() {
  const { contactMessages, markMessageRead, deleteMessage, loading } =
    useAdmin();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all"); // all | unread | read

  const handleDelete = (id, e) => {
    e?.stopPropagation();
    setMessageToDelete(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (messageToDelete) {
      await deleteMessage(messageToDelete);
      setConfirmOpen(false);
      setMessageToDelete(null);
      if (selected?.id === messageToDelete) setSelected(null);
    }
  };

  const handleCardClick = (msg) => {
    setSelected(msg);
    if (!msg.read) markMessageRead(msg.id);
  };

  const unreadCount = contactMessages.filter((m) => !m.read).length;

  const filtered = contactMessages
    .slice()
    .reverse()
    .filter((m) => {
      if (filter === "unread") return !m.read;
      if (filter === "read") return m.read;
      return true;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-white border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <i className="fas fa-spinner fa-spin text-[var(--primary)] text-xl" />
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">
            Loading messages…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
            Messages
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {contactMessages.length} total
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-[var(--danger)] text-white text-xs font-bold rounded-full">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-[var(--background)] border border-[var(--border)] rounded-xl p-1">
          {[
            { key: "all", label: "All" },
            { key: "unread", label: "Unread" },
            { key: "read", label: "Read" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${
                  filter === f.key
                    ? "bg-white text-[var(--primary)] shadow-sm border border-[var(--border)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty ── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-16 text-center">
          <div
            className="w-16 h-16 bg-[var(--background)] border border-[var(--border)] rounded-2xl
            flex items-center justify-center mx-auto mb-4"
          >
            <i className="fas fa-inbox text-[var(--text-muted)] text-2xl opacity-40" />
          </div>
          <h3 className="font-bold text-[var(--text)] mb-1">No messages</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {filter !== "all" ? `No ${filter} messages.` : "No messages yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((msg) => {
            const date = new Date(msg.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const initial = (msg.name || "A").charAt(0).toUpperCase();

            return (
              <div
                key={msg.id}
                onClick={() => handleCardClick(msg)}
                className={`relative bg-white rounded-2xl border overflow-hidden cursor-pointer
                  transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group
                  ${
                    !msg.read
                      ? "border-[var(--primary)] shadow-[0_0_0_1px_rgba(26,67,40,0.08)]"
                      : "border-[var(--border)]"
                  }`}
              >
                {/* Top accent */}
                <div
                  className={`h-0.5 w-full ${!msg.read ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
                />

                <div className="p-4">
                  {/* Avatar + name row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-[var(--secondary)] font-extrabold text-sm">
                        {initial}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[var(--text)] text-sm truncate">
                          {msg.name || "Anonymous"}
                        </h3>
                        {!msg.read && (
                          <span className="w-2 h-2 bg-[var(--primary)] rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {msg.email}
                      </p>
                    </div>
                    {!msg.read && (
                      <span className="px-2 py-0.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-full shrink-0">
                        New
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  {msg.phone_number && (
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-phone text-[var(--text-muted)] text-[10px] w-3" />
                      <span className="text-xs text-[var(--text-muted)]">
                        {msg.phone_number}
                      </span>
                    </div>
                  )}

                  {/* Message preview */}
                  <p className="text-sm text-[var(--text)] line-clamp-2 leading-relaxed mb-3">
                    {msg.message}
                  </p>

                  {/* Date + actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">
                      {date}
                    </p>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markMessageRead(msg.id);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg
                          text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--primary)] transition-all"
                        title={msg.read ? "Mark unread" : "Mark read"}
                      >
                        <i
                          className={`fas ${msg.read ? "fa-envelope" : "fa-envelope-open"} text-xs`}
                        />
                      </button>
                      <button
                        onClick={(e) => handleDelete(msg.id, e)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg
                          text-[var(--text-muted)] hover:bg-red-50 hover:text-[var(--danger)] transition-all"
                        title="Delete"
                      >
                        <i className="fas fa-trash-can text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-[var(--primary)] px-5 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--secondary)] rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white font-extrabold text-sm">
                    {(selected.name || "A").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight">
                    {selected.name || "Anonymous"}
                  </h3>
                  <p className="text-white/60 text-xs">
                    {new Date(selected.created_at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/15
                  rounded-xl flex items-center justify-center text-white transition-all"
              >
                <i className="fas fa-xmark text-sm" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Contact info */}
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-[var(--primary)] rounded-lg flex items-center justify-center shrink-0">
                    <i className="fas fa-envelope text-[var(--secondary)] text-[9px]" />
                  </div>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-sm font-semibold text-[var(--primary)] hover:underline break-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {selected.email}
                  </a>
                </div>
                {selected.phone_number && (
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-[var(--primary)] rounded-lg flex items-center justify-center shrink-0">
                      <i className="fas fa-phone text-[var(--secondary)] text-[9px]" />
                    </div>
                    <a
                      href={`tel:${selected.phone_number}`}
                      className="text-sm font-semibold text-[var(--text)] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {selected.phone_number}
                    </a>
                  </div>
                )}
              </div>

              {/* Message body */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 bg-[var(--primary)] rounded-md flex items-center justify-center">
                    <i className="fas fa-message text-[var(--secondary)] text-[9px]" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-widest">
                    Message
                  </h4>
                </div>
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4">
                  <p className="text-[var(--text)] text-sm leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => markMessageRead(selected.id)}
                  className="flex-1 flex items-center justify-center gap-2
                    bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white
                    py-3 rounded-xl text-sm font-bold transition-all hover:shadow-md"
                >
                  <i
                    className={`fas ${selected.read ? "fa-envelope" : "fa-envelope-open"} text-[var(--secondary)] text-xs`}
                  />
                  {selected.read ? "Mark Unread" : "Mark Read"}
                </button>
                <button
                  onClick={(e) => {
                    handleDelete(selected.id, e);
                    setSelected(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2
                    bg-red-50 hover:bg-red-100 text-red-600 border border-red-200
                    py-3 rounded-xl text-sm font-bold transition-all"
                >
                  <i className="fas fa-trash-can text-xs" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setMessageToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
      />
    </div>
  );
}
