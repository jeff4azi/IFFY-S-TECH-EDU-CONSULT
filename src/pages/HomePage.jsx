import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../contexts/AdminContext";
import IffysLogo from "../assets/IFFYS-TECH EDU-CONSULT-LOGO.png";

const PENDING_ORDER_KEY = "ace_pending_order";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const statsRef = useRef(null);
  const navigate = useNavigate();
  const {
    siteSettings,
    services,
    testimonials,
    addContactMessage,
    addTestimonial,
    loading,
  } = useAdmin();

  // Calculate total number of available services
  const totalServices = Object.values(services).reduce(
    (sum, categoryServices) => sum + categoryServices.length,
    0,
  );

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    message: "",
  });
  const [testimonialForm, setTestimonialForm] = useState({
    name: "",
    text: "",
    rating: 5,
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [shareToast, setShareToast] = useState("");

  useEffect(() => {
    const defaultTitle =
      "Ace Educational Consult - Your Trusted Partner for Educational & Digital Services";
    const defaultDescription =
      "Ace Educational Consult offers premium educational and digital services including admissions processing, document verification, CV writing, online courses, and more.";
    const url = `${window.location.origin}/`;
    const image = `${window.location.origin}/android-chrome-512x512.png`;

    document.title = defaultTitle;

    const setMeta = (selector, attr, name, content) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        if (attr === "property") el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta(
      'meta[name="description"]',
      "name",
      "description",
      defaultDescription,
    );
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[property="og:title"]', "property", "og:title", defaultTitle);
    setMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      defaultDescription,
    );
    setMeta('meta[property="og:image"]', "property", "og:image", image);
    setMeta('meta[name="twitter:url"]', "name", "twitter:url", url);
    setMeta(
      'meta[name="twitter:title"]',
      "name",
      "twitter:title",
      defaultTitle,
    );
    setMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      defaultDescription,
    );
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check for an unfinished pending order in localStorage
  useEffect(() => {
    const check = () => {
      try {
        setHasPendingOrder(!!localStorage.getItem(PENDING_ORDER_KEY));
      } catch {
        setHasPendingOrder(false);
      }
    };
    check();
    // Re-check whenever the tab regains focus (user returns from another tab)
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStatsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    if (statsRef.current) {
      observer.observe(statsRef.current);
    }
    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, [statsRef.current]);

  const Counter = ({ end, suffix }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let start = 0;
      const duration = 2000;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }, [end]);
    return (
      <span>
        {count.toLocaleString()}
        {suffix}
      </span>
    );
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    addContactMessage(contactForm);
    setSuccessMsg("Message sent successfully!");
    setContactForm({ name: "", email: "", phoneNumber: "", message: "" });
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleTestimonialSubmit = (e) => {
    e.preventDefault();
    addTestimonial(testimonialForm);
    setSuccessMsg("Testimonial submitted for approval!");
    setTestimonialForm({ name: "", text: "", rating: 5 });
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  useEffect(() => {
    if (shareToast) {
      const timer = setTimeout(() => setShareToast(""), 2500);
      return () => clearTimeout(timer);
    }
  }, [shareToast]);

  const getServiceUrl = (service) =>
    `${window.location.origin}/service-form/${service.id}`;

  const copyLinkToClipboard = async (service) => {
    const shareUrl = getServiceUrl(service);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setShareToast("Link copied to clipboard!");
      return true;
    } catch (err) {
      console.error("Copy failed:", err);
      setShareToast("Couldn't copy link.");
      return false;
    }
  };

  const handleShare = async (service, e) => {
    if (e) e.stopPropagation();
    const shareUrl = getServiceUrl(service);
    const shareData = {
      title: `${service.name} - Ace Educational Consult`,
      text: `Check out this service: ${service.name} - ${service.description}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareToast("Shared successfully!");
      } else {
        await copyLinkToClipboard(service);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        await copyLinkToClipboard(service);
      }
    }
  };

  const approvedTestimonials = testimonials.filter((t) => t.approved);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-5xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle case where siteSettings might be null initially
  const defaultSettings = {
    phoneNumber: "",
    email: "",
    address: "",
    businessHours: "",
    whatsappNumber: "",
    whatsappGroupLink: "",
    socialLinks: { facebook: "#", twitter: "#", instagram: "#", linkedin: "#" },
    paymentDetails: { bankName: "", accountNumber: "", accountName: "" },
  };
  const settings = siteSettings || defaultSettings;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-lg" : "bg-transparent"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => {
                scrollToSection("home");
                setMobileMenuOpen(false);
              }}
            >
              <img
                src={IffysLogo}
                alt="Ace Educational Consult Logo"
                className="h-16 object-contain"
              />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("home")}
                className="text-gray-700 hover:text-[#4169E1] font-medium transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("services")}
                className="text-gray-700 hover:text-[#4169E1] font-medium transition-colors"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("why-us")}
                className="text-gray-700 hover:text-[#4169E1] font-medium transition-colors"
              >
                Why Us
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="text-gray-700 hover:text-[#4169E1] font-medium transition-colors"
              >
                Testimonials
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-gray-700 hover:text-[#4169E1] font-medium transition-colors"
              >
                Contact
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="bg-[#4169E1] hover:bg-[#3658c9] text-white px-6 py-2.5 rounded-full font-semibold transition-all hover:shadow-lg hover:scale-105"
              >
                Get Started
              </button>
            </div>
            <button
              className="md:hidden text-gray-700 text-2xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i
                className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"}`}
              ></i>
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={() => {
                  scrollToSection("home");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-[#4169E1] font-medium transition-colors py-2"
              >
                Home
              </button>
              <button
                onClick={() => {
                  scrollToSection("services");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-[#4169E1] font-medium transition-colors py-2"
              >
                Services
              </button>
              <button
                onClick={() => {
                  scrollToSection("why-us");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-[#4169E1] font-medium transition-colors py-2"
              >
                Why Us
              </button>
              <button
                onClick={() => {
                  scrollToSection("testimonials");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-[#4169E1] font-medium transition-colors py-2"
              >
                Testimonials
              </button>
              <button
                onClick={() => {
                  scrollToSection("contact");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-[#4169E1] font-medium transition-colors py-2"
              >
                Contact
              </button>
              <button
                onClick={() => {
                  scrollToSection("contact");
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#4169E1] hover:bg-[#3658c9] text-white px-6 py-3 rounded-full font-semibold transition-all hover:shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Success Message */}
      {successMsg && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg">
          {successMsg}
        </div>
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <i className="fas fa-check-circle text-green-400"></i>
          {shareToast}
        </div>
      )}

      {/* Hero Section */}
      <section
        id="home"
        className="pt-32 pb-20 bg-gradient-to-br from-blue-50 to-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="fade-in-up">
              <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-gray-900 leading-tight mb-6">
                Your Trusted Partner for{" "}
                <span className="text-[#4169E1]">
                  Educational & Digital Services
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Fast, secure, and reliable assistance for examination
                registrations, result verification, admissions, identity
                services, utility payments, and more.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => scrollToSection("services")}
                  className="bg-[#4169E1] hover:bg-[#3658c9] text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-xl hover:scale-105"
                >
                  Get Started
                </button>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="border-2 border-[#4169E1] text-[#4169E1] hover:bg-[#4169E1] hover:text-white px-8 py-4 rounded-full font-semibold text-lg transition-all"
                >
                  Contact Us
                </button>
              </div>
            </div>
            <div className="floating">
              <img
                src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=students%20graduation%20certificates%20books%20university%20admissions%20happy%20education%20Nigeria&image_size=landscape_16_9"
                alt="Education"
                className="rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section ref={statsRef} id="stats" className="py-16 bg-[#4169E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#FFC107] mb-2">
                <Counter end={10000} suffix="+" />
              </div>
              <div className="text-white text-lg font-medium">
                Happy Clients
              </div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#FFC107] mb-2">
                <Counter end={98} suffix="%" />
              </div>
              <div className="text-white text-lg font-medium">
                Customer Satisfaction
              </div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#FFC107] mb-2">
                <Counter end={totalServices} suffix="+" />
              </div>
              <div className="text-white text-lg font-medium">
                Available Services
              </div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#FFC107] mb-2">
                24/7
              </div>
              <div className="text-white text-lg font-medium">
                Customer Support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-gray-900 mb-4">
              Why Choose Us
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              We provide exceptional services with professionalism and care
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "fa-bolt",
                title: "Fast Processing",
                desc: "Quick turnaround for all educational and digital services.",
              },
              {
                icon: "fa-lock",
                title: "Secure Transactions",
                desc: "Your information is handled with privacy and security.",
              },
              {
                icon: "fa-headset",
                title: "Trusted Support",
                desc: "Professional customer support whenever you need assistance.",
              },
              {
                icon: "fa-tags",
                title: "Affordable Pricing",
                desc: "Competitive pricing with transparent service charges.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#4169E1] to-[#3658c9] rounded-2xl flex items-center justify-center mb-6">
                  <i className={`fas ${feature.icon} text-white text-2xl`}></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explore our comprehensive range of educational and digital
              services
            </p>
          </div>
          {Object.entries(services).map(([category, items], catIdx) => (
            <div key={catIdx} className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-[#4169E1] pl-4">
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((service, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group flex flex-col"
                  >
                    <div
                      className="relative h-48 overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/service-form/${service.id}`)}
                    >
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <button
                        onClick={(e) => handleShare(service, e)}
                        className="absolute top-3 right-3 z-10 w-11 h-11 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-[#4169E1] shadow-lg transition-all active:scale-95"
                        aria-label={`Share ${service.name}`}
                        title="Share this service"
                      >
                        <i className="fas fa-share-nodes"></i>
                      </button>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent h-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h4
                        className="text-lg font-bold text-gray-900 mb-2 cursor-pointer hover:text-[#4169E1] transition-colors"
                        onClick={() => navigate(`/service-form/${service.id}`)}
                      >
                        {service.name}
                      </h4>
                      <p className="text-gray-600 text-sm mb-4 flex-1">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-bold text-[#4169E1]">
                          {service.price}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyLinkToClipboard(service);
                          }}
                          className="text-xs text-gray-400 hover:text-[#4169E1] transition-colors font-medium flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-gray-50 active:scale-95"
                          title="Copy direct link to this service"
                        >
                          <i className="fas fa-copy"></i>
                          Copy link
                        </button>
                      </div>
                      <button
                        onClick={() => navigate(`/service-form/${service.id}`)}
                        className="w-full bg-[#4169E1] hover:bg-[#3658c9] text-white py-3 rounded-xl font-semibold transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-arrow-right"></i>
                        Order Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Three simple steps to get your service
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Choose the service you need.",
                icon: "fa-list-check",
              },
              {
                step: 2,
                title: "Submit your request or contact us.",
                icon: "fa-paper-plane",
              },
              {
                step: 3,
                title: "Receive your completed service quickly and securely.",
                icon: "fa-check-circle",
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-20 h-20 bg-[#4169E1] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <i className={`fas ${item.icon} text-[#FFC107] text-4xl`}></i>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gray-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials + Submit Review */}
      <section
        id="testimonials"
        className="py-20 bg-gradient-to-br from-blue-50 to-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-gray-900 mb-4">
              Testimonials
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              What our clients say about us
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {approvedTestimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="text-[#FFC107] text-2xl mb-4">
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <i key={i} className="fas fa-star"></i>
                    ))}
                </div>
                <p className="text-gray-700 text-lg mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#4169E1] rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="text-gray-500 font-medium">
                    {testimonial.name}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Review Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Submit Your Review
            </h3>
            <form onSubmit={handleTestimonialSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={testimonialForm.name}
                  onChange={(e) =>
                    setTestimonialForm({
                      ...testimonialForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setTestimonialForm({ ...testimonialForm, rating: star })
                      }
                      className={`text-3xl ${star <= testimonialForm.rating ? "text-[#FFC107]" : "text-gray-300"}`}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  required
                  value={testimonialForm.text}
                  onChange={(e) =>
                    setTestimonialForm({
                      ...testimonialForm,
                      text: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#4169E1] hover:bg-[#3658c9] text-white py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:scale-105"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-20 bg-[#4169E1]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Contact Ace Educational Consult today for fast and reliable
            educational solutions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => scrollToSection("contact")}
              className="bg-white hover:bg-gray-100 text-[#4169E1] px-8 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-xl hover:scale-105"
            >
              Contact Us
            </button>
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1ebe57] text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2"
            >
              <i className="fab fa-whatsapp text-xl"></i>
              WhatsApp Support
            </a>
          </div>
        </div>
      </section>

      {/* Stay Updated - WhatsApp Group */}
      <section id="newsletter" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <i className="fab fa-whatsapp text-white text-4xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Stay Updated
          </h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Join our WhatsApp group to get the latest updates on admission
            opportunities, registration deadlines, educational news, and
            exclusive offers — directly on your phone.
          </p>
          {settings.whatsappGroupLink ? (
            <a
              href={settings.whatsappGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe57] text-white px-10 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-xl hover:scale-105"
            >
              <i className="fab fa-whatsapp text-2xl"></i>
              Join Our WhatsApp Group
            </a>
          ) : (
            <span className="inline-flex items-center gap-3 bg-[#25D366]/50 text-white px-10 py-4 rounded-full font-semibold text-lg cursor-not-allowed select-none">
              <i className="fab fa-whatsapp text-2xl"></i>
              Join Our WhatsApp Group
            </span>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Get in touch with us today
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                Office Information
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#4169E1] rounded-xl flex items-center justify-center text-white text-xl shrink-0">
                    <i className="fas fa-phone"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Phone Number
                    </h4>
                    <p className="text-gray-600">{settings.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#4169E1] rounded-xl flex items-center justify-center text-white text-xl shrink-0">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Email Address
                    </h4>
                    <p className="text-gray-600">{settings.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#4169E1] rounded-xl flex items-center justify-center text-white text-xl shrink-0">
                    <i className="fas fa-location-dot"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Office Address
                    </h4>
                    <p className="text-gray-600">{settings.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#4169E1] rounded-xl flex items-center justify-center text-white text-xl shrink-0">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Business Hours
                    </h4>
                    <p className="text-gray-600">{settings.businessHours}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
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
                    required
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={contactForm.phoneNumber}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        phoneNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        message: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#4169E1] hover:bg-[#3658c9] text-white py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:scale-105"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <img
                  src={IffysLogo}
                  alt="Ace Educational Consult Logo"
                  className="h-16 object-contain"
                />
              </div>
              <p className="text-gray-400 mb-6">
                Your trusted partner for educational and digital services in
                Nigeria.
              </p>
              <div className="flex gap-4">
                <a
                  href={settings.socialLinks.facebook}
                  className="w-10 h-10 bg-gray-800 hover:bg-[#4169E1] rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href={settings.socialLinks.twitter}
                  className="w-10 h-10 bg-gray-800 hover:bg-[#4169E1] rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fab fa-twitter"></i>
                </a>
                <a
                  href={settings.socialLinks.instagram}
                  className="w-10 h-10 bg-gray-800 hover:bg-[#4169E1] rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fab fa-instagram"></i>
                </a>
                <a
                  href={settings.socialLinks.linkedin}
                  className="w-10 h-10 bg-gray-800 hover:bg-[#4169E1] rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => scrollToSection("home")}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("services")}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Services
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("why-us")}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Why Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("contact")}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Contact Info</h4>
              <ul className="space-y-3 text-gray-400">
                <li>{settings.phoneNumber}</li>
                <li>{settings.email}</li>
                <li>{settings.address}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-400">
              <p>© 2026 Ace Educational Consult. All Rights Reserved.</p>

              <p className="text-center md:text-right text-xs">
                Website designed & developed by{" "}
                <span className="font-medium text-white">Code Jeffrey</span>.
                Need a professional website?{" "}
                <a
                  href="https://wa.me/2347015585397"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ffc517] hover:text-yellow-300 transition-colors font-medium"
                >
                  Chat on WhatsApp
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating My Orders Button */}
      <button
        onClick={() => navigate("/my-orders")}
        className="fixed bottom-28 right-6 z-50 group"
        aria-label="Track my orders"
      >
        <div className="relative flex items-center gap-2 bg-[#4169E1] hover:bg-[#3658c9] text-white pl-4 pr-5 py-3 rounded-full shadow-2xl hover:scale-105 transition-all">
          <i className="fas fa-receipt text-lg"></i>
          <span className="text-sm font-semibold">My Orders</span>
          {hasPendingOrder && (
            <span className="absolute -top-1.5 -right-1 size-4.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </div>
      </button>

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${settings.whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group"
      >
        <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center text-white text-3xl shadow-2xl pulse-whatsapp hover:scale-110 transition-transform">
          <i className="fab fa-whatsapp"></i>
        </div>
        <div className="absolute bottom-full right-0 mb-3 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Need Help? Chat with us!
        </div>
      </a>
    </div>
  );
}
