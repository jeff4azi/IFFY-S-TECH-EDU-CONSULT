import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState(null);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [services, setServices] = useState({}); // { [categoryId]: [...services] }
  const [testimonials, setTestimonials] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);

  // Lightweight order summary for the dashboard — no user_data blobs.
  // Shape: { counts: { pending, processing, completed, cancelled, total },
  //          recent: { pending: [], processing: [], completed: [], cancelled: [] } }
  const [orderSummary, setOrderSummary] = useState({
    counts: {
      pending_verification: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
    },
    recent: {
      pending_verification: [],
      pending: [],
      processing: [],
      completed: [],
      cancelled: [],
    },
  });

  // Check session and load data on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Check auth session first
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // Load public data in parallel — these unblock the homepage
        await Promise.all([
          loadSiteSettings(),
          loadServiceCategories(),
          loadServices(),
          loadTestimonials(),
        ]);

        // Load admin-only data after public data — doesn't block homepage render
        if (session?.user) {
          Promise.all([loadContactMessages(), loadOrderSummary()]).catch((e) =>
            console.error("Error loading admin data:", e),
          );
        }
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        // Public data is ready — unblock the UI
        setLoading(false);
      }
    };

    init();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load admin-only data when user logs in
  useEffect(() => {
    const loadAdminData = async () => {
      if (user) {
        try {
          await Promise.all([loadContactMessages(), loadOrderSummary()]);
        } catch (error) {
          console.error("Error loading admin data:", error);
        }
      }
    };
    loadAdminData();
  }, [user]);

  // Load site settings
  const loadSiteSettings = async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .single();
    if (!error && data) {
      setSiteSettings({
        phoneNumber: data.phone_number,
        email: data.email,
        address: data.address,
        businessHours: data.business_hours,
        whatsappNumber: data.whatsapp_number,
        whatsappGroupLink: data.whatsapp_group_link || "",
        socialLinks: data.social_links,
        paymentDetails: data.payment_details,
      });
    }
  };

  // Load service categories
  const loadServiceCategories = async () => {
    const { data, error } = await supabase
      .from("service_categories")
      .select("*")
      .order("name");
    if (!error && data) {
      setServiceCategories(data);
    }
  };

  // Load services
  const loadServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*, category: service_categories(name)");
    if (!error && data) {
      // Group services by category
      const groupedServices = {};
      data.forEach((service) => {
        const categoryName = service.category?.name;
        if (categoryName) {
          if (!groupedServices[categoryName]) {
            groupedServices[categoryName] = [];
          }
          groupedServices[categoryName].push({
            id: service.id,
            name: service.name,
            price: service.price,
            description: service.description,
            image: service.image_url,
            fields: service.fields || [],
          });
        }
      });
      setServices(groupedServices);
    }
  };

  // Load testimonials
  const loadTestimonials = async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setTestimonials(data);
    }
  };

  // Load contact messages
  const loadContactMessages = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setContactMessages(data);
    }
  };

  // Load lightweight order summary — never fetches user_data
  const loadOrderSummary = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_id, status, created_at, service:services(name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const counts = {
        pending_verification: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        total: data.length,
      };
      const recent = {
        pending_verification: [],
        pending: [],
        processing: [],
        completed: [],
        cancelled: [],
      };

      data.forEach((o) => {
        if (counts[o.status] !== undefined) counts[o.status]++;
        if (recent[o.status] && recent[o.status].length < 5) {
          recent[o.status].push(o);
        }
      });

      setOrderSummary({ counts, recent });
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Site settings
  const updateSiteSettings = async (newSettings) => {
    const updatedSettings = {
      phone_number: newSettings.phoneNumber,
      email: newSettings.email,
      address: newSettings.address,
      business_hours: newSettings.businessHours,
      whatsapp_number: newSettings.whatsappNumber,
      whatsapp_group_link: newSettings.whatsappGroupLink,
      social_links: newSettings.socialLinks,
      payment_details: newSettings.paymentDetails,
    };
    const { data, error } = await supabase
      .from("site_settings")
      .select("id")
      .single();
    if (error) {
      console.error("Error fetching site settings:", error);
      return;
    }
    if (data) {
      await supabase
        .from("site_settings")
        .update(updatedSettings)
        .eq("id", data.id);
    } else {
      await supabase.from("site_settings").insert(updatedSettings);
    }
    setSiteSettings(newSettings);
  };

  // Service categories
  const addServiceCategory = async (categoryName) => {
    const { data, error } = await supabase
      .from("service_categories")
      .insert({ name: categoryName })
      .select()
      .single();
    if (!error && data) {
      setServiceCategories((prev) => [...prev, data]);
      setServices((prev) => ({ ...prev, [categoryName]: [] }));
    }
  };

  // Services
  const addService = async (categoryName, service) => {
    // Get category id
    const category = serviceCategories.find((cat) => cat.name === categoryName);
    if (!category) return;

    const { data, error } = await supabase
      .from("services")
      .insert({
        category_id: category.id,
        name: service.name,
        price: service.price,
        description: service.description,
        image_url: service.image,
        fields: service.fields || [],
      })
      .select()
      .single();

    if (!error && data) {
      const newService = {
        id: data.id,
        name: data.name,
        price: data.price,
        description: data.description,
        image: data.image_url,
        fields: data.fields || [],
      };
      setServices((prev) => ({
        ...prev,
        [categoryName]: [...(prev[categoryName] || []), newService],
      }));
    }
  };

  const updateService = async (categoryName, serviceId, updatedService) => {
    const category = serviceCategories.find((cat) => cat.name === categoryName);
    if (!category) return;

    try {
      // Get the current service to check if the image is changing
      const { data: currentService } = await supabase
        .from("services")
        .select("image_url")
        .eq("id", serviceId)
        .single();

      // If the image is being updated, delete the old one
      if (
        currentService?.image_url &&
        updatedService.image &&
        currentService.image_url !== updatedService.image
      ) {
        const urlParts = new URL(currentService.image_url);
        const pathParts = urlParts.pathname.split("/");
        const oldFileName = pathParts[pathParts.length - 1];

        if (oldFileName) {
          await supabase.storage.from("service-images").remove([oldFileName]);
        }
      }

      // Update the service
      const { data, error } = await supabase
        .from("services")
        .update({
          category_id: category.id,
          name: updatedService.name,
          price: updatedService.price,
          description: updatedService.description,
          image_url: updatedService.image,
          fields: updatedService.fields || [],
        })
        .eq("id", serviceId)
        .select();

      if (error) {
        console.error("Error updating service:", error);
      } else {
        // Reload all services to ensure grouping is correct if category changed
        await loadServices();
      }
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const deleteService = async (categoryName, serviceId) => {
    try {
      // First get the service to retrieve the image_url
      const { data: service } = await supabase
        .from("services")
        .select("image_url")
        .eq("id", serviceId)
        .single();

      if (service?.image_url) {
        // Extract file path from public URL
        // Example URL: https://<project>.supabase.co/storage/v1/object/public/service-images/filename.jpg
        const urlParts = new URL(service.image_url);
        const pathParts = urlParts.pathname.split("/");
        const fileName = pathParts[pathParts.length - 1]; // Get the last part which is the filename

        if (fileName) {
          // Delete from storage
          await supabase.storage.from("service-images").remove([fileName]);
        }
      }

      // Delete the service from the database
      await supabase.from("services").delete().eq("id", serviceId);

      // Update local state
      setServices((prev) => ({
        ...prev,
        [categoryName]: prev[categoryName].filter((s) => s.id !== serviceId),
      }));
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  // Testimonials
  const addTestimonial = async (testimonial) => {
    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        name: testimonial.name,
        text: testimonial.text,
        rating: testimonial.rating,
      })
      .select()
      .single();

    if (!error && data) {
      setTestimonials((prev) => [data, ...prev]);
    }
  };

  const approveTestimonial = async (id) => {
    await supabase.from("testimonials").update({ approved: true }).eq("id", id);
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, approved: true } : t)),
    );
  };

  const deleteTestimonial = async (id) => {
    await supabase.from("testimonials").delete().eq("id", id);
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
  };

  // Contact messages
  const addContactMessage = async (message) => {
    const { data, error } = await supabase
      .from("contact_messages")
      .insert({
        name: message.name,
        email: message.email,
        phone_number: message.phoneNumber,
        message: message.message,
      })
      .select()
      .single();

    if (!error && data) {
      setContactMessages((prev) => [data, ...prev]);
    }
  };

  const markMessageRead = async (id) => {
    const message = contactMessages.find((m) => m.id === id);
    const newReadStatus = !message?.read;
    await supabase
      .from("contact_messages")
      .update({ read: newReadStatus })
      .eq("id", id);
    setContactMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: newReadStatus } : m)),
    );
  };

  const deleteMessage = async (id) => {
    await supabase.from("contact_messages").delete().eq("id", id);
    setContactMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // Orders — no global state; the Orders page manages its own fetched data
  const addOrder = async (order) => {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_id: order.orderId,
        service_id: order.serviceId,
        user_data: order.formData,
        receipt_url: order.receiptUrl || null,
        status: "pending_verification",
      })
      .select()
      .single();
    return { data, error };
  };

  const updateOrderStatus = async (id, status) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    return { error };
  };

  const deleteOrder = async (id) => {
    try {
      // Fetch user_data, receipt_url and deliverable_urls so we can clean up all uploaded files
      const { data: order } = await supabase
        .from("orders")
        .select("user_data, receipt_url, deliverable_urls")
        .eq("id", id)
        .single();

      if (order) {
        const urlsToDelete = [];

        // Collect order-files storage URLs from user_data
        if (order.user_data) {
          Object.values(order.user_data).forEach((val) => {
            if (typeof val === "string" && val.includes("/order-files/")) {
              const match = val.match(/\/order-files\/(.+)$/);
              if (match) urlsToDelete.push(match[1]);
            }
          });
        }

        // Collect receipt URL
        if (order.receipt_url && order.receipt_url.includes("/order-files/")) {
          const match = order.receipt_url.match(/\/order-files\/(.+)$/);
          if (match) urlsToDelete.push(match[1]);
        }

        // Collect deliverable URLs
        if (Array.isArray(order.deliverable_urls)) {
          order.deliverable_urls.forEach((item) => {
            const url = typeof item === "string" ? item : item?.url;
            if (url && url.includes("/order-files/")) {
              const match = url.match(/\/order-files\/(.+)$/);
              if (match) urlsToDelete.push(match[1]);
            }
          });
        }

        if (urlsToDelete.length > 0) {
          await supabase.storage.from("order-files").remove(urlsToDelete);
        }
      }

      const { error } = await supabase.from("orders").delete().eq("id", id);
      return { error };
    } catch (error) {
      console.error("Error deleting order:", error);
      return { error };
    }
  };

  const findServiceById = (serviceId) => {
    const id = String(serviceId);
    for (const categoryServices of Object.values(services)) {
      const found = categoryServices.find((s) => String(s.id) === id);
      if (found) return found;
    }
    return null;
  };

  return (
    <AdminContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        siteSettings,
        serviceCategories,
        services,
        testimonials,
        contactMessages,
        orderSummary,
        loading,
        login,
        logout,
        updateSiteSettings,
        addServiceCategory,
        addService,
        updateService,
        deleteService,
        addTestimonial,
        approveTestimonial,
        deleteTestimonial,
        addContactMessage,
        markMessageRead,
        deleteMessage,
        addOrder,
        updateOrderStatus,
        deleteOrder,
        refreshOrderSummary: loadOrderSummary,
        findServiceById,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
