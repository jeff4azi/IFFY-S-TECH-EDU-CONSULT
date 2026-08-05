import { useState } from "react";
import { useAdmin } from "../../contexts/AdminContext";
import ConfirmModal from "../../components/ConfirmModal";

export default function ContactMessages() {
  const { contactMessages, markMessageRead, deleteMessage, loading } =
    useAdmin();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const handleDelete = (id, e) => {
    e?.stopPropagation(); // Prevent card click
    setMessageToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (messageToDelete) {
      await deleteMessage(messageToDelete);
      setIsConfirmModalOpen(false);
      setMessageToDelete(null);
      if (selectedMessage?.id === messageToDelete) {
        setSelectedMessage(null);
      }
    }
  };

  const handleCloseModal = () => {
    setIsConfirmModalOpen(false);
    setMessageToDelete(null);
  };

  const handleToggleRead = (msg, e) => {
    e?.stopPropagation();
    markMessageRead(msg.id);
  };

  const handleCardClick = (msg) => {
    setSelectedMessage(msg);
    // Auto mark as read when opened
    if (!msg.read) {
      markMessageRead(msg.id);
    }
  };

  const truncateText = (text, maxLength = 60) => {
    if (!text) return "N/A";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-5xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Contact Messages
      </h2>

      {/* Message Cards Grid */}
      {contactMessages.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-lg text-center text-gray-500">
          <i className="fas fa-inbox text-5xl mb-4 text-gray-300"></i>
          <p className="text-lg">No messages yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {contactMessages
            .slice()
            .reverse()
            .map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleCardClick(msg)}
                className={`
                relative bg-white rounded-2xl shadow-lg border-l-4 p-5 
                cursor-pointer transition-all duration-200 
                hover:shadow-xl hover:-translate-y-1
                ${!msg.read ? "border-[#4169E1] bg-blue-50/30" : "border-gray-200"}
              `}
              >
                {/* New Badge */}
                {!msg.read && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-[#4169E1] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      New
                    </span>
                  </div>
                )}

                {/* Card Content */}
                <div className="space-y-3">
                  {/* Name */}
                  <h3 className="text-lg font-bold text-gray-900 pr-12 truncate">
                    {msg.name || "Anonymous"}
                  </h3>

                  {/* Email */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-envelope w-4"></i>
                    <span className="truncate">
                      {truncateText(msg.email, 30)}
                    </span>
                  </div>

                  {/* Phone */}
                  {msg.phone_number && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="fas fa-phone w-4"></i>
                      <span>{msg.phone_number}</span>
                    </div>
                  )}

                  {/* Message Preview */}
                  <p className="text-sm text-gray-700 line-clamp-2 min-h-[2.5rem]">
                    {msg.message}
                  </p>

                  {/* Timestamp */}
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <i className="far fa-clock mr-1"></i>
                    Received:{" "}
                    {new Date(msg.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => handleToggleRead(msg, e)}
                    className="flex-1 text-xs sm:text-sm text-[#4169E1] hover:text-[#3658c9] font-medium transition-colors"
                  >
                    {!msg.read ? "Mark Read" : "Mark Unread"}
                  </button>
                  <button
                    onClick={(e) => handleDelete(msg.id, e)}
                    className="flex-1 text-xs sm:text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900">
                Message Details
              </h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-gray-500"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Sender Info */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#4169E1] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(selectedMessage.name || "A").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {selectedMessage.name || "Anonymous"}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedMessage.created_at).toLocaleString(
                        "en-US",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-gray-700">
                    <i className="fas fa-envelope w-5 text-[#4169E1]"></i>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="hover:underline break-all"
                    >
                      {selectedMessage.email}
                    </a>
                  </div>
                  {selectedMessage.phone_number && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <i className="fas fa-phone w-5 text-[#4169E1]"></i>
                      <a
                        href={`tel:${selectedMessage.phone_number}`}
                        className="hover:underline"
                      >
                        {selectedMessage.phone_number}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Message
                </h5>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => {
                    markMessageRead(selectedMessage.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#4169E1] hover:bg-[#3658c9] text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg"
                >
                  <i
                    className={`fas ${selectedMessage.read ? "fa-envelope" : "fa-envelope-open"}`}
                  ></i>
                  {selectedMessage.read ? "Mark as Unread" : "Mark as Read"}
                </button>
                <button
                  onClick={(e) => {
                    handleDelete(selectedMessage.id, e);
                    setSelectedMessage(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg"
                >
                  <i className="fas fa-trash"></i>
                  Delete Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
      />
    </div>
  );
}
