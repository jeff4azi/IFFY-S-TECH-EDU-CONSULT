import { useState } from "react";
import { useAdmin } from "../../contexts/AdminContext";
import ConfirmModal from "../../components/ConfirmModal";

export default function TestimonialsManager() {
  const { testimonials, approveTestimonial, deleteTestimonial, loading } =
    useAdmin();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState(null);
  const [filter, setFilter] = useState("all"); // all | pending | approved

  const handleDelete = (id) => {
    setTestimonialToDelete(id);
    setConfirmOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (testimonialToDelete) {
      await deleteTestimonial(testimonialToDelete);
      setConfirmOpen(false);
      setTestimonialToDelete(null);
    }
  };

  const pendingCount = testimonials.filter((t) => !t.approved).length;
  const approvedCount = testimonials.filter((t) => t.approved).length;

  const filtered = testimonials
    .slice()
    .sort((a, b) => {
      // pending first within each group
      if (!a.approved && b.approved) return -1;
      if (a.approved && !b.approved) return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    })
    .filter((t) => {
      if (filter === "pending") return !t.approved;
      if (filter === "approved") return t.approved;
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
            Loading testimonials…
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
            Testimonials
          </h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-[var(--text-muted)]">
              {testimonials.length} total
            </span>
            {pendingCount > 0 && (
              <span
                className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200
                text-xs font-bold rounded-full"
              >
                {pendingCount} awaiting approval
              </span>
            )}
            {approvedCount > 0 && (
              <span
                className="px-2 py-0.5 bg-[#e8f0eb] text-[var(--primary)] border border-[#c0d4c7]
                text-xs font-bold rounded-full"
              >
                {approvedCount} approved
              </span>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 bg-[var(--background)] border border-[var(--border)] rounded-xl p-1">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "approved", label: "Approved" },
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
            <i className="fas fa-star text-[var(--text-muted)] text-2xl opacity-30" />
          </div>
          <h3 className="font-bold text-[var(--text)] mb-1">No testimonials</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {filter !== "all"
              ? `No ${filter} testimonials.`
              : "No testimonials yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const initial = (t.name || "?").charAt(0).toUpperCase();
            const date = t.created_at
              ? new Date(t.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null;

            return (
              <div
                key={t.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200
                  hover:-translate-y-0.5 hover:shadow-md
                  ${
                    !t.approved
                      ? "border-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]"
                      : "border-[var(--border)]"
                  }`}
              >
                {/* Top bar */}
                <div
                  className={`h-1 w-full ${t.approved ? "bg-[var(--primary)]" : "bg-amber-400"}`}
                />

                <div className="p-4">
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5
                      ${
                        t.approved
                          ? "bg-[#e8f0eb] text-[var(--primary)] border border-[#c0d4c7]"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0
                        ${t.approved ? "bg-[var(--primary)]" : "bg-amber-400"}`}
                      />
                      {t.approved ? "Approved" : "Pending Approval"}
                    </span>
                    {date && (
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">
                        {date}
                      </span>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <i
                          key={i}
                          className={`fas fa-star text-sm
                        ${i < t.rating ? "text-[var(--secondary)]" : "text-[var(--border)]"}`}
                        />
                      ))}
                    <span className="text-xs text-[var(--text-muted)] font-bold ml-1.5">
                      {t.rating}/5
                    </span>
                  </div>

                  {/* Review text */}
                  <p className="text-sm text-[var(--text)] italic leading-relaxed line-clamp-3 mb-4">
                    "{t.text}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-2.5 pt-3 border-t border-[var(--border)]">
                    <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-[var(--secondary)] font-extrabold text-xs">
                        {initial}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[var(--text)] truncate">
                      {t.name}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    {!t.approved && (
                      <button
                        onClick={() => approveTestimonial(t.id)}
                        className="flex-1 flex items-center justify-center gap-1.5
                          bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white
                          py-2 rounded-xl text-xs font-bold transition-all hover:shadow-md"
                      >
                        <i className="fas fa-circle-check text-[var(--secondary)] text-[10px]" />
                        Approve
                      </button>
                    )}
                    {t.approved && (
                      <div
                        className="flex-1 flex items-center justify-center gap-1.5
                        bg-[#e8f0eb] text-[var(--primary)] border border-[#c0d4c7]
                        py-2 rounded-xl text-xs font-bold cursor-default"
                      >
                        <i className="fas fa-circle-check text-[10px]" />
                        Published
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="flex items-center justify-center gap-1.5
                        px-3 py-2 rounded-xl text-xs font-bold transition-all
                        bg-red-50 text-red-500 border border-red-100
                        hover:bg-red-100 hover:text-red-700"
                    >
                      <i className="fas fa-trash-can text-[10px]" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setTestimonialToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Testimonial"
        message="Are you sure you want to delete this testimonial? This action cannot be undone."
      />
    </div>
  );
}
