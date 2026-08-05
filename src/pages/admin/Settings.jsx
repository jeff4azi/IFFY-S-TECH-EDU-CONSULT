import { useState, useEffect } from "react";
import { useAdmin } from "../../contexts/AdminContext";

export default function SiteSettings() {
  const { siteSettings, updateSiteSettings, loading } = useAdmin();
  const [formData, setFormData] = useState(siteSettings);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (siteSettings) {
      setFormData(siteSettings);
    }
  }, [siteSettings]);

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

  // Set default values if formData is null
  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSiteSettings(formData);
    setSuccess("Settings saved successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Site Settings</h2>
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-xl mb-6">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Contact Information
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Hours
            </label>
            <input
              type="text"
              value={formData.businessHours}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  businessHours: e.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number (digits only, e.g., 2348000000000)
            </label>
            <input
              type="text"
              value={formData.whatsappNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  whatsappNumber: e.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Group Link
            </label>
            <input
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              value={formData.whatsappGroupLink || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  whatsappGroupLink: e.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
            />
            <p className="text-xs text-gray-500 mt-1">
              This link will appear on the "Stay Updated" section of the
              homepage.
            </p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 pt-4">
            Social Media Links
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook
              </label>
              <input
                type="url"
                value={formData.socialLinks.facebook}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    socialLinks: {
                      ...prev.socialLinks,
                      facebook: e.target.value,
                    },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Channel Link
              </label>
              <input
                type="url"
                placeholder="https://whatsapp.com/channel/..."
                value={formData.socialLinks.whatsappChannel || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    socialLinks: {
                      ...prev.socialLinks,
                      whatsappChannel: e.target.value,
                    },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <input
                type="url"
                value={formData.socialLinks.instagram}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    socialLinks: {
                      ...prev.socialLinks,
                      instagram: e.target.value,
                    },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TikTok
              </label>
              <input
                type="url"
                placeholder="https://tiktok.com/@..."
                value={formData.socialLinks.tiktok || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    socialLinks: {
                      ...prev.socialLinks,
                      tiktok: e.target.value,
                    },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 pt-4">
            Payment Details
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.paymentDetails.bankName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentDetails: {
                      ...prev.paymentDetails,
                      bankName: e.target.value,
                    },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={formData.paymentDetails.accountNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentDetails: {
                      ...prev.paymentDetails,
                      accountNumber: e.target.value,
                    },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={formData.paymentDetails.accountName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentDetails: {
                      ...prev.paymentDetails,
                      accountName: e.target.value,
                    },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto bg-[#4169E1] hover:bg-[#3658c9] text-white px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-xl hover:scale-105"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}
