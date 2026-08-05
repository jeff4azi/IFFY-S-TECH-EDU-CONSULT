import { useState } from "react";
import { useAdmin } from "../../contexts/AdminContext";
import { uploadImage } from "../../lib/imageUpload";
import ConfirmModal from "../../components/ConfirmModal";

const FIELD_TYPES = ["text", "email", "number", "file", "image", "textarea"];
const FIELD_TYPE_ICONS = {
  text: "fa-pen-line",
  email: "fa-envelope",
  number: "fa-hashtag",
  file: "fa-file-arrow-up",
  image: "fa-image",
  textarea: "fa-align-left",
};

const EMPTY_FORM = {
  name: "",
  price: "",
  description: "",
  image: "",
  fields: [],
};
const EMPTY_FIELD = { name: "", type: "text", required: false };

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] " +
  "text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] " +
  "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(26,67,40,0.12)] transition-all";

export default function ServicesManager() {
  const {
    services,
    addService,
    updateService,
    deleteService,
    addServiceCategory,
    loading,
  } = useAdmin();

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(
    Object.keys(services)[0] || "",
  );
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState("");
  const [newField, setNewField] = useState(EMPTY_FIELD);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const categories = Object.keys(services);
  const activeCatServices = services[currentCategory] || [];
  const totalServices = Object.values(services).reduce(
    (s, a) => s + a.length,
    0,
  );

  /* ── category ── */
  const handleAddCategory = async () => {
    if (newCatName.trim() && !categories.includes(newCatName.trim())) {
      await addServiceCategory(newCatName.trim());
      setCurrentCategory(newCatName.trim());
      setNewCatName("");
      setShowNewCat(false);
    }
  };

  /* ── image ── */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData((p) => ({ ...p, image: url }));
    } catch {
      alert("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  /* ── fields ── */
  const handleAddField = () => {
    if (!newField.name.trim()) return;
    setFormData((p) => ({ ...p, fields: [...p.fields, { ...newField }] }));
    setNewField(EMPTY_FIELD);
  };
  const handleRemoveField = (i) =>
    setFormData((p) => ({
      ...p,
      fields: p.fields.filter((_, idx) => idx !== i),
    }));
  const updateField = (i, key, val) =>
    setFormData((p) => {
      const f = [...p.fields];
      f[i] = { ...f[i], [key]: val };
      return { ...p, fields: f };
    });

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) {
      alert("Please wait for image upload.");
      return;
    }
    editingService
      ? await updateService(currentCategory, editingService.id, formData)
      : await addService(currentCategory, formData);
    closeModal();
  };

  /* ── edit / delete ── */
  const handleEdit = (svc) => {
    setEditingService(svc);
    setFormData({
      name: svc.name,
      price: svc.price,
      description: svc.description,
      image: svc.image,
      fields: svc.fields || [],
    });
    setImagePreview(svc.image || "");
    setShowModal(true);
  };
  const handleDelete = (id) => {
    setServiceToDelete(id);
    setConfirmOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (serviceToDelete) {
      await deleteService(currentCategory, serviceToDelete);
      setConfirmOpen(false);
      setServiceToDelete(null);
    }
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData(EMPTY_FORM);
    setImagePreview("");
    setShowNewCat(false);
    setNewCatName("");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-white border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <i className="fas fa-spinner fa-spin text-[var(--primary)] text-xl" />
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">
            Loading services…
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-w-0">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
            Services
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {categories.length}{" "}
            {categories.length === 1 ? "category" : "categories"} &middot;{" "}
            {totalServices} services
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)]
            text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-md"
        >
          <i className="fas fa-plus text-[var(--secondary)] text-xs" />
          Add Service
        </button>
      </div>

      {/* ── Category tabs + Add Category ── */}
      <div className="flex flex-wrap gap-2 items-center mb-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCurrentCategory(cat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border
              ${
                currentCategory === cat
                  ? "bg-[var(--primary)] text-white border-transparent shadow-sm"
                  : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              }`}
          >
            {cat}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
              ${currentCategory === cat ? "bg-white/20 text-white" : "bg-[var(--background)] text-[var(--text-muted)]"}`}
            >
              {services[cat]?.length ?? 0}
            </span>
          </button>
        ))}

        {!showNewCat ? (
          <button
            onClick={() => setShowNewCat(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all
              bg-white border border-dashed border-[var(--border)] text-[var(--text-muted)]
              hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <i className="fas fa-plus text-xs" /> Category
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              autoFocus
              className="px-4 py-2 rounded-xl border border-[var(--border)] bg-white text-[var(--text)]
                text-sm focus:outline-none focus:border-[var(--primary)] transition-all"
            />
            <button
              onClick={handleAddCategory}
              className="px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowNewCat(false);
                setNewCatName("");
              }}
              className="px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-muted)] text-xs font-bold hover:text-[var(--danger)] transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ── Service cards ── */}
      {activeCatServices.length === 0 ? (
        <div className="bg-white border border-dashed border-[var(--border)] rounded-2xl p-16 text-center">
          <div
            className="w-16 h-16 bg-[var(--background)] border border-[var(--border)] rounded-2xl
            flex items-center justify-center mx-auto mb-4"
          >
            <i className="fas fa-layer-group text-[var(--text-muted)] text-2xl opacity-40" />
          </div>
          <h3 className="font-bold text-[var(--text)] mb-1">No services yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Add your first service to this category.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)]
              text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            <i className="fas fa-plus text-[var(--secondary)] text-xs" /> Add
            Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCatServices.map((svc) => (
            <div
              key={svc.id}
              className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden
                transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
            >
              {/* Image */}
              <div className="relative h-40 bg-[var(--background)] overflow-hidden">
                {svc.image ? (
                  <img
                    src={svc.image}
                    alt={svc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-image text-[var(--border)] text-4xl" />
                  </div>
                )}
                {/* Fields badge */}
                {svc.fields?.length > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                    <span className="text-white text-[10px] font-bold">
                      {svc.fields.length} field
                      {svc.fields.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-bold text-[var(--text)] text-sm leading-tight line-clamp-1">
                    {svc.name}
                  </h3>
                  <span className="text-base font-extrabold text-[var(--primary)] shrink-0">
                    {svc.price}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-3">
                  {svc.description || (
                    <span className="italic opacity-60">No description</span>
                  )}
                </p>

                {/* Field chips */}
                {svc.fields?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {svc.fields.slice(0, 4).map((f, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 px-2 py-0.5 bg-[var(--background)]
                        border border-[var(--border)] rounded-full text-[10px] font-semibold text-[var(--text-muted)]"
                      >
                        <i
                          className={`fas ${FIELD_TYPE_ICONS[f.type] || "fa-pen-line"} text-[8px] text-[var(--primary)]`}
                        />
                        {f.name}
                        {f.required && (
                          <span className="text-[var(--danger)]">*</span>
                        )}
                      </span>
                    ))}
                    {svc.fields.length > 4 && (
                      <span
                        className="px-2 py-0.5 bg-[var(--background)] border border-[var(--border)]
                        rounded-full text-[10px] font-semibold text-[var(--text-muted)]"
                      >
                        +{svc.fields.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    onClick={() => handleEdit(svc)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold
                      border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
                  >
                    <i className="fas fa-pen text-[10px]" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(svc.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold
                      bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 hover:text-red-700 transition-all"
                  >
                    <i className="fas fa-trash-can text-[10px]" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════ ADD / EDIT MODAL ════════ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl
            max-h-[95vh] sm:max-h-[90vh] overflow-y-auto flex flex-col"
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-[var(--primary)] px-5 py-4 sm:rounded-t-2xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[var(--secondary)] rounded-xl flex items-center justify-center shrink-0">
                  <i
                    className={`fas ${editingService ? "fa-pen" : "fa-plus"} text-white text-sm`}
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight">
                    {editingService ? "Edit Service" : "Add New Service"}
                  </h3>
                  <p className="text-white/55 text-xs">{currentCategory}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/15
                  rounded-xl flex items-center justify-center text-white transition-all"
              >
                <i className="fas fa-xmark text-sm" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5 flex-1">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-widest mb-2">
                  Category
                </label>
                <select
                  value={currentCategory}
                  onChange={(e) => setCurrentCategory(e.target.value)}
                  className={inputCls}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {!showNewCat ? (
                  <button
                    type="button"
                    onClick={() => setShowNewCat(true)}
                    className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline transition-colors"
                  >
                    <i className="fas fa-plus text-[10px]" /> Add New Category
                  </button>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddCategory())
                      }
                      className={inputCls + " flex-1"}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCat(false);
                        setNewCatName("");
                      }}
                      className="px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-xs font-bold hover:text-[var(--danger)] transition-all"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Name + Price row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-widest mb-2">
                    Service Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. WAEC Registration"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-widest mb-2">
                    Price
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, price: e.target.value }))
                    }
                    placeholder="e.g. ₦5,000"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-widest mb-2">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Brief description of this service…"
                  className={inputCls + " resize-none"}
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-widest mb-2">
                  Service Image
                </label>
                <label
                  className={`flex flex-col items-center justify-center gap-3 w-full rounded-xl border-2
                  border-dashed cursor-pointer transition-all py-5 px-4
                  ${
                    imagePreview
                      ? "border-[var(--primary)] bg-[#e8f0eb]"
                      : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)] hover:bg-[#f0f4f2]"
                  }
                  ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-36 object-contain rounded-lg"
                      />
                      <p className="text-xs text-[var(--primary)] font-semibold flex items-center gap-1">
                        <i className="fas fa-check-circle text-[10px]" /> Tap to
                        change image
                      </p>
                    </>
                  ) : isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <i className="fas fa-spinner fa-spin text-[var(--primary)] text-xl" />
                      <p className="text-sm text-[var(--text-muted)]">
                        Uploading…
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white border border-[var(--border)] rounded-xl flex items-center justify-center shadow-sm">
                        <i className="fas fa-image text-[var(--primary)] text-xl" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-[var(--text)]">
                          Upload image
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          JPG, PNG, WEBP
                        </p>
                      </div>
                    </>
                  )}
                </label>
              </div>

              {/* Custom fields */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-[var(--primary)] rounded-md flex items-center justify-center">
                    <i className="fas fa-list-check text-[var(--secondary)] text-[9px]" />
                  </div>
                  <label className="text-xs font-bold text-[var(--text)] uppercase tracking-widest">
                    Custom Fields
                    {formData.fields.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-[var(--background)] border border-[var(--border)] rounded-full text-[10px] font-bold text-[var(--text-muted)]">
                        {formData.fields.length}
                      </span>
                    )}
                  </label>
                </div>

                {/* Existing fields */}
                {formData.fields.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.fields.map((field, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-2.5 flex-wrap"
                      >
                        <div className="w-7 h-7 bg-[var(--primary)] rounded-lg flex items-center justify-center shrink-0">
                          <i
                            className={`fas ${FIELD_TYPE_ICONS[field.type] || "fa-pen-line"} text-[var(--secondary)] text-[9px]`}
                          />
                        </div>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) =>
                            updateField(i, "name", e.target.value)
                          }
                          className="flex-1 min-w-[80px] px-3 py-1.5 rounded-lg border border-[var(--border)] bg-white text-[var(--text)] text-xs focus:outline-none focus:border-[var(--primary)] transition-all"
                        />
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(i, "type", e.target.value)
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white text-[var(--text)] text-xs focus:outline-none focus:border-[var(--primary)] transition-all"
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer
                            ${field.required ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border)] bg-white"}`}
                            onClick={() =>
                              updateField(i, "required", !field.required)
                            }
                          >
                            {field.required && (
                              <i className="fas fa-check text-white text-[8px]" />
                            )}
                          </div>
                          <span className="text-[11px] text-[var(--text-muted)] font-semibold">
                            Required
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(i)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <i className="fas fa-xmark text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new field row */}
                <div className="flex items-center gap-2 bg-[var(--background)] border border-dashed border-[var(--border)] rounded-xl p-2.5 flex-wrap">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={newField.name}
                    onChange={(e) =>
                      setNewField((p) => ({ ...p, name: e.target.value }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddField())
                    }
                    className="flex-1 min-w-[100px] px-3 py-1.5 rounded-lg border border-[var(--border)] bg-white text-[var(--text)] text-xs focus:outline-none focus:border-[var(--primary)] transition-all"
                  />
                  <select
                    value={newField.type}
                    onChange={(e) =>
                      setNewField((p) => ({ ...p, type: e.target.value }))
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white text-[var(--text)] text-xs focus:outline-none focus:border-[var(--primary)] transition-all"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer
                      ${newField.required ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border)] bg-white"}`}
                      onClick={() =>
                        setNewField((p) => ({ ...p, required: !p.required }))
                      }
                    >
                      {newField.required && (
                        <i className="fas fa-check text-white text-[8px]" />
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold">
                      Required
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)]
                      text-white text-xs font-bold transition-all shrink-0"
                  >
                    <i className="fas fa-plus text-[10px]" /> Add
                  </button>
                </div>
              </div>

              {/* Form actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]
                    text-[var(--text-muted)] text-sm font-bold hover:text-[var(--danger)] hover:border-red-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                    bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50
                    text-white text-sm font-bold transition-all hover:shadow-md"
                >
                  {isUploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-xs" />{" "}
                      Uploading…
                    </>
                  ) : (
                    <>
                      <i
                        className={`fas ${editingService ? "fa-floppy-disk" : "fa-plus"} text-[var(--secondary)] text-xs`}
                      />
                      {editingService ? "Save Changes" : "Add Service"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setServiceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
      />
    </div>
  );
}
