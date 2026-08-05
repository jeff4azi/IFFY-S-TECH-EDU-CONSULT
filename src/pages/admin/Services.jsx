import { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { uploadImage } from '../../lib/imageUpload';
import ConfirmModal from '../../components/ConfirmModal';

export default function ServicesManager() {
  const { services, addService, updateService, deleteService, addServiceCategory, loading } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(Object.keys(services)[0] || 'Examination Services');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    fields: []
  });
  const [imagePreview, setImagePreview] = useState('');
  const [newField, setNewField] = useState({ name: '', type: 'text', required: false });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const categories = Object.keys(services);

  const handleAddCategory = async () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      await addServiceCategory(newCategoryName.trim());
      setCurrentCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowNewCategory(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
      
      // Upload the image
      setIsUploading(true);
      try {
        const publicUrl = await uploadImage(file);
        setFormData(prev => ({ ...prev, image: publicUrl }));
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddField = () => {
    if (newField.name) {
      setFormData(prev => ({
        ...prev,
        fields: [...prev.fields, newField]
      }));
      setNewField({ name: '', type: 'text', required: false });
    }
  };

  const handleRemoveField = (index) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) {
      alert('Please wait for the image to finish uploading.');
      return;
    }
    if (editingService) {
      await updateService(currentCategory, editingService.id, formData);
    } else {
      await addService(currentCategory, formData);
    }
    setShowModal(false);
    setEditingService(null);
    setFormData({ name: '', price: '', description: '', image: '', fields: [] });
    setImagePreview('');
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price,
      description: service.description,
      image: service.image,
      fields: service.fields || [],
    });
    setImagePreview(service.image);
    setShowModal(true);
  };

  const handleDelete = (serviceId) => {
    setServiceToDelete(serviceId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (serviceToDelete) {
      await deleteService(currentCategory, serviceToDelete);
      setIsConfirmModalOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsConfirmModalOpen(false);
    setServiceToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-[#4169E1] mb-4"></i>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Services Manager</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#4169E1] hover:bg-[#3658c9] text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-xl hover:scale-105"
        >
          <i className="fas fa-plus mr-2"></i> Add Service
        </button>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap items-center">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCurrentCategory(cat)}
            className={`px-4 py-2 rounded-full font-medium transition-all ${currentCategory === cat ? 'bg-[#4169E1] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            {cat}
          </button>
        ))}
        {!showNewCategory ? (
          <button
            onClick={() => setShowNewCategory(true)}
            className="px-4 py-2 rounded-full font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            <i className="fas fa-plus mr-2"></i> Add Category
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
              autoFocus
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 rounded-full font-medium bg-[#4169E1] text-white hover:bg-[#3658c9] transition-all"
            >
              Save
            </button>
            <button
              onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
              className="px-4 py-2 rounded-full font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services[currentCategory]?.map(service => (
          <div key={service.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {service.image && (
              <img src={service.image} alt={service.name} className="w-full h-40 object-cover" />
            )}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h3>
              <p className="text-2xl font-bold text-[#4169E1] mb-2">{service.price}</p>
              <p className="text-gray-600 text-sm mb-4">{service.description}</p>
              {service.fields.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Custom Fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {service.fields.map((field, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{field.name}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-medium hover:bg-blue-200 transition-colors"
                >
                  <i className="fas fa-edit mr-1"></i> Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-xl font-medium hover:bg-red-200 transition-colors"
                >
                  <i className="fas fa-trash mr-1"></i> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{editingService ? 'Edit Service' : 'Add New Service'}</h3>
              <button onClick={() => { setShowModal(false); setEditingService(null); setFormData({ name: '', price: '', description: '', image: '', fields: [] }); setImagePreview(''); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="space-y-2">
                  <select
                    value={currentCategory}
                    onChange={(e) => setCurrentCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {!showNewCategory ? (
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(true)}
                      className="text-[#4169E1] hover:text-[#3658c9] text-sm font-medium"
                    >
                      <i className="fas fa-plus mr-1"></i> Add New Category
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="New category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-4 py-2 rounded-xl bg-[#4169E1] text-white hover:bg-[#3658c9] transition-all"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                        className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input
                  type="text"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isUploading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20 disabled:opacity-50"
                />
                {isUploading && (
                  <p className="text-sm text-[#4169E1] mt-2">
                    <i className="fas fa-spinner fa-spin mr-2"></i> Uploading image...
                  </p>
                )}
                {imagePreview && (
                  <div className="mt-4">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full max-h-64 object-contain rounded-xl border border-gray-200" 
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Fields</label>
                <div className="space-y-3 mb-4">
                  {formData.fields.map((field, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl flex-wrap">
                      <input
                        type="text"
                        placeholder="Field name"
                        value={field.name}
                        onChange={(e) => {
                          const updatedFields = [...formData.fields];
                          updatedFields[i] = { ...updatedFields[i], name: e.target.value };
                          setFormData(prev => ({ ...prev, fields: updatedFields }));
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1]/20"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const updatedFields = [...formData.fields];
                          updatedFields[i] = { ...updatedFields[i], type: e.target.value };
                          setFormData(prev => ({ ...prev, fields: updatedFields }));
                        }}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1]/20"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="number">Number</option>
                        <option value="file">File</option>
                        <option value="image">Image</option>
                        <option value="textarea">Textarea</option>
                      </select>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => {
                            const updatedFields = [...formData.fields];
                            updatedFields[i] = { ...updatedFields[i], required: e.target.checked };
                            setFormData(prev => ({ ...prev, fields: updatedFields }));
                          }}
                          className="w-4 h-4 text-[#4169E1] border-gray-300 rounded focus:ring-[#4169E1]"
                        />
                        <span className="text-sm text-gray-700">Required</span>
                      </label>
                      <button type="button" onClick={() => handleRemoveField(i)} className="text-red-500 hover:text-red-700 p-1"><i className="fas fa-times"></i></button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={newField.name}
                    onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                    className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                  />
                  <div className="flex gap-2 items-center">
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="number">Number</option>
                      <option value="file">File</option>
                      <option value="image">Image</option>
                      <option value="textarea">Textarea</option>
                    </select>
                    <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                        className="w-4 h-4 text-[#4169E1] border-gray-300 rounded focus:ring-[#4169E1]"
                      />
                      <span className="text-sm text-gray-700">Required</span>
                    </label>
                  </div>
                  <button type="button" onClick={handleAddField} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors">Add</button>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingService(null); setFormData({ name: '', price: '', description: '', image: '', fields: [] }); setImagePreview(''); }}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 bg-[#4169E1] hover:bg-[#3658c9] text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {editingService ? 'Update' : 'Add'} Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Service"
        message="Are you sure you want to delete this service?"
      />
    </div>
  );
}
