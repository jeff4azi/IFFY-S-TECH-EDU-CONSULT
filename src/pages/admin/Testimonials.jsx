import { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import ConfirmModal from '../../components/ConfirmModal';

export default function TestimonialsManager() {
  const { testimonials, approveTestimonial, deleteTestimonial, loading } = useAdmin();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState(null);

  const handleDelete = (id) => {
    setTestimonialToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (testimonialToDelete) {
      await deleteTestimonial(testimonialToDelete);
      setIsConfirmModalOpen(false);
      setTestimonialToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsConfirmModalOpen(false);
    setTestimonialToDelete(null);
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
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Testimonials Manager</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="text-[#FFC107] text-xl mb-3">
              {Array(t.rating).fill(0).map((_, i) => <i key={i} className="fas fa-star"></i>)}
            </div>
            <p className="text-gray-700 mb-4 italic">"{t.text}"</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
              {!t.approved && (
                <button
                  onClick={() => approveTestimonial(t.id)}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                >
                  Approve
                </button>
              )}
              <button
                onClick={() => handleDelete(t.id)}
                className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Testimonial"
        message="Are you sure you want to delete this testimonial?"
      />
    </div>
  );
}
