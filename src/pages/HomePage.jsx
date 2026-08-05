import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../contexts/AdminContext";
import IffysLogo from "../assets/IFFYS-TECH EDU-CONSULT-LOGO.png";

const PENDING_ORDER_KEY = "ace_pending_order";

/* ─── tiny animated counter ─── */
function Counter({ end, suffix }) {
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
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end]);
  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
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

  const totalServices = Object.values(services).reduce(
    (sum, cat) => sum + cat.length,
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

  /* ── SEO meta ── */
  useEffect(() => {
    const title = "IFFY'S TECH EDU CONSULT – Tech & Education, Simplified";
    const desc =
      "IFFY'S TECH EDU CONSULT delivers modern technology and educational consulting services — admissions, digital skills, certifications, document processing and more.";
    const url = `${window.location.origin}/`;
    const image = `${window.location.origin}/android-chrome-512x512.png`;
    document.title = title;
    const setMeta = (sel, attr, name, content) => {
      let el = document.head.querySelector(sel);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      desc,
    );
    setMeta('meta[property="og:image"]', "property", "og:image", image);
    setMeta('meta[name="twitter:url"]', "name", "twitter:url", url);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      desc,
    );
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const check = () => {
      try {
        setHasPendingOrder(!!localStorage.getItem(PENDING_ORDER_KEY));
      } catch {
        setHasPendingOrder(false);
      }
    };
    check();
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setStatsVisible(true);
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => {
      if (statsRef.current) observer.unobserve(statsRef.current);
    };
  }, [loading]);

  useEffect(() => {
    if (shareToast) {
      const t = setTimeout(() => setShareToast(""), 2500);
      return () => clearTimeout(t);
    }
  }, [shareToast]);

  /* initialise activeCategory once services load */
  useEffect(() => {
    const cats = Object.keys(services);
    if (cats.length && !activeCategory) setActiveCategory(cats[0]);
  }, [services]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    addContactMessage(contactForm);
    setSuccessMsg("Message sent! We'll be in touch soon.");
    setContactForm({ name: "", email: "", phoneNumber: "", message: "" });
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleTestimonialSubmit = (e) => {
    e.preventDefault();
    addTestimonial(testimonialForm);
    setSuccessMsg("Review submitted — thank you!");
    setTestimonialForm({ name: "", text: "", rating: 5 });
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const getServiceUrl = (s) => `${window.location.origin}/service-form/${s.id}`;

  const copyLink = async (s) => {
    const url = getServiceUrl(s);
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
      else {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setShareToast("Link copied!");
      return true;
    } catch {
      setShareToast("Couldn't copy link.");
      return false;
    }
  };

  const handleShare = async (s, e) => {
    if (e) e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({
          title: s.name,
          text: s.description,
          url: getServiceUrl(s),
        });
        setShareToast("Shared!");
      } else await copyLink(s);
    } catch (err) {
      if (err.name !== "AbortError") await copyLink(s);
    }
  };

  const approvedTestimonials = testimonials.filter((t) => t.approved);

  const defaultSettings = {
    phoneNumber: "",
    email: "",
    address: "",
    businessHours: "",
    whatsappNumber: "",
    whatsappGroupLink: "",
    socialLinks: {
      facebook: "#",
      whatsappChannel: "#",
      instagram: "#",
      tiktok: "#",
    },
    paymentDetails: { bankName: "", accountNumber: "", accountName: "" },
  };
  const settings = siteSettings || defaultSettings;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <i
            className="fas fa-circle-notch fa-spin"
            style={{
              fontSize: "3rem",
              color: "var(--primary)",
              marginBottom: "1rem",
              display: "block",
            }}
          ></i>
          <p
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            Loading…
          </p>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────── RENDER ───────────────────────────────── */
  return (
    <div
      style={{
        background: "var(--background)",
        overflowX: "hidden",
        minHeight: "100vh",
      }}
    >
      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: "all 0.3s",
          background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          boxShadow: scrolled ? "0 2px 20px rgba(26,67,40,0.10)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 72,
          }}
        >
          {/* Logo */}
          <button
            onClick={() => {
              scrollTo("home");
              setMobileMenuOpen(false);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 0,
            }}
          >
            <img
              src={IffysLogo}
              alt="IFFY'S TECH EDU CONSULT"
              style={{ height: 52, objectFit: "contain" }}
            />
          </button>

          {/* Desktop nav */}
          <div
            className="hide-mobile"
            style={{ display: "flex", alignItems: "center", gap: "2rem" }}
          >
            {["home", "services", "why-us", "testimonials", "contact"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => scrollTo(s)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: scrolled ? "var(--text)" : "#fff",
                    textTransform: "capitalize",
                    letterSpacing: "0.03em",
                    transition: "color 0.2s",
                    padding: "4px 0",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--secondary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = scrolled
                      ? "var(--text)"
                      : "#fff")
                  }
                >
                  {s.replace("-", " ")}
                </button>
              ),
            )}
            <button
              onClick={() => scrollTo("services")}
              style={{
                background: "var(--secondary)",
                color: "#fff",
                border: "none",
                borderRadius: 50,
                padding: "10px 24px",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                letterSpacing: "0.04em",
                transition: "all 0.2s",
                boxShadow: "0 4px 14px rgba(196,159,52,0.35)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--secondary-hover)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--secondary)";
                e.currentTarget.style.transform = "none";
              }}
            >
              Explore Services
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="show-mobile"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              color: scrolled ? "var(--text)" : "#fff",
              display: "none",
            }}
          >
            <i className={`fas ${mobileMenuOpen ? "fa-xmark" : "fa-bars"}`}></i>
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
              padding: "1rem 1.5rem",
            }}
          >
            {["home", "services", "why-us", "testimonials", "contact"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => {
                    scrollTo(s);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "10px 0",
                    fontWeight: 600,
                    color: "var(--text)",
                    textTransform: "capitalize",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {s.replace("-", " ")}
                </button>
              ),
            )}
            <button
              onClick={() => {
                scrollTo("services");
                setMobileMenuOpen(false);
              }}
              style={{
                marginTop: "1rem",
                width: "100%",
                background: "var(--secondary)",
                color: "#fff",
                border: "none",
                borderRadius: 50,
                padding: "12px 0",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Explore Services
            </button>
          </div>
        )}
      </nav>

      {/* ── Toast notifications ── */}
      {successMsg && (
        <div
          style={{
            position: "fixed",
            top: 88,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            background: "var(--primary)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(26,67,40,0.3)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <i className="fas fa-circle-check"></i> {successMsg}
        </div>
      )}
      {shareToast && (
        <div
          style={{
            position: "fixed",
            top: 88,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            background: "var(--text)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <i
            className="fas fa-circle-check"
            style={{ color: "var(--secondary)" }}
          ></i>{" "}
          {shareToast}
        </div>
      )}

      {/* ══════════════════ HERO ══════════════════ */}
      <section
        id="home"
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Background image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1800&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
        {/* Multi-layer overlay — dark at bottom, lighter in center for readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(to bottom, rgba(10,28,18,0.55) 0%, rgba(10,28,18,0.72) 50%, rgba(10,28,18,0.88) 100%)",
          }}
        />
        {/* Subtle radial glow in the center */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(196,159,52,0.08) 0%, transparent 70%)",
          }}
        />

        {/* ── Centered hero content ── */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: 860,
            margin: "0 auto",
            padding: "140px 1.5rem 100px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Eyebrow pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(8px)",
              borderRadius: 50,
              padding: "7px 18px",
              marginBottom: "1.75rem",
            }}
          >
            <i
              className="fas fa-microchip"
              style={{ color: "var(--secondary)", fontSize: "0.8rem" }}
            ></i>
            <span
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Technology &amp; Education Consulting
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(2.4rem,7vw,5rem)",
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.1,
              marginBottom: "1.5rem",
              letterSpacing: "-0.03em",
              maxWidth: 780,
            }}
          >
            Empowering Your Future Through{" "}
            <span style={{ color: "var(--secondary)" }}>
              Tech &amp; Education
            </span>
          </h1>

          {/* Sub-headline */}
          <p
            style={{
              fontSize: "clamp(1rem,2.5vw,1.2rem)",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.75,
              marginBottom: "2.5rem",
              maxWidth: 580,
            }}
          >
            From admissions processing and digital certifications to utility
            payments and document verification — fast, secure, and handled by
            experts.
          </p>

          {/* CTA buttons */}
          <div
            className="hero-cta-row"
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => scrollTo("services")}
              style={{
                background: "#fff",
                color: "var(--primary)",
                border: "none",
                borderRadius: 50,
                padding: "15px 36px",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.25s",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                minWidth: 200,
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 14px 40px rgba(0,0,0,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.25)";
              }}
            >
              Get started now <i className="fas fa-arrow-right"></i>
            </button>
            <button
              onClick={() => scrollTo("contact")}
              style={{
                background: "rgba(10,28,18,0.75)",
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(8px)",
                borderRadius: 50,
                padding: "15px 36px",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.25s",
                minWidth: 200,
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
                e.currentTarget.style.background = "rgba(10,28,18,0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                e.currentTarget.style.background = "rgba(10,28,18,0.75)";
              }}
            >
              Consult an expert
            </button>
          </div>

          {/* Trust badges row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1.5rem",
              marginTop: "3.5rem",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {[
              { icon: "fa-shield-halved", text: "Secure & Verified" },
              { icon: "fa-bolt-lightning", text: "Fast Delivery" },
              { icon: "fa-headset", text: "24/7 Support" },
            ].map((b, i) => (
              <div
                key={b.text}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                {i > 0 && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.3)",
                      marginRight: 8,
                    }}
                  />
                )}
                <i
                  className={`fas ${b.icon}`}
                  style={{ color: "var(--secondary)", fontSize: "0.95rem" }}
                ></i>
                <span
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.88rem",
                    fontWeight: 500,
                  }}
                >
                  {b.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Scroll
          </span>
          <i
            className="fas fa-chevron-down"
            style={{
              color: "var(--secondary)",
              animation: "bounce 1.5s infinite",
            }}
          ></i>
        </div>
      </section>

      {/* ══════════════════ STATS STRIP ══════════════════ */}
      <section
        ref={statsRef}
        style={{ background: "var(--primary)", padding: "3.5rem 1.5rem" }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
            gap: "2rem",
            textAlign: "center",
          }}
        >
          {[
            {
              end: 10000,
              suffix: "+",
              label: "Clients Served",
              icon: "fa-users",
            },
            {
              end: 98,
              suffix: "%",
              label: "Satisfaction Rate",
              icon: "fa-face-smile",
            },
            {
              end: totalServices,
              suffix: "+",
              label: "Active Services",
              icon: "fa-layer-group",
            },
            {
              end: 5,
              suffix: "+",
              label: "Years Experience",
              icon: "fa-calendar-check",
            },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(196,159,52,0.2)",
                  border: "1px solid rgba(196,159,52,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 0.75rem",
                }}
              >
                <i
                  className={`fas ${s.icon}`}
                  style={{ color: "var(--secondary)", fontSize: "1.2rem" }}
                ></i>
              </div>
              <div
                style={{
                  fontSize: "clamp(2rem,4vw,2.8rem)",
                  fontWeight: 800,
                  color: "var(--secondary)",
                  lineHeight: 1,
                }}
              >
                {statsVisible ? (
                  <Counter end={s.end} suffix={s.suffix} />
                ) : (
                  <span>
                    {s.end.toLocaleString()}
                    {s.suffix}
                  </span>
                )}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 500,
                  marginTop: "0.35rem",
                  fontSize: "0.95rem",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ FEATURES / WHY US ══════════════════ */}
      <section
        id="why-us"
        style={{ padding: "6rem 1.5rem", background: "var(--background)" }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* heading */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "3rem",
              alignItems: "center",
              marginBottom: "4rem",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(26,67,40,0.08)",
                  border: "1px solid rgba(26,67,40,0.15)",
                  borderRadius: 50,
                  padding: "5px 14px",
                  marginBottom: "1rem",
                }}
              >
                <i
                  className="fas fa-star"
                  style={{ color: "var(--secondary)", fontSize: "0.8rem" }}
                ></i>
                <span
                  style={{
                    color: "var(--primary)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Why Choose Us
                </span>
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.8rem,3.5vw,2.6rem)",
                  fontWeight: 800,
                  color: "var(--text)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                Where Technology Meets
                <br />
                <span style={{ color: "var(--primary)" }}>
                  Educational Excellence
                </span>
              </h2>
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1.05rem",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              We combine cutting-edge digital tools with deep educational
              expertise to deliver services that are fast, reliable, and built
              for the modern learner and professional.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                icon: "fa-bolt-lightning",
                color: "#1A4328",
                title: "Rapid Processing",
                desc: "Most services are completed within 24 hours. No waiting, no delays — just results.",
              },
              {
                icon: "fa-lock",
                color: "#C49F34",
                title: "Bank-Level Security",
                desc: "Your personal data and transactions are protected with enterprise-grade encryption.",
              },
              {
                icon: "fa-graduation-cap",
                color: "#1A4328",
                title: "Educational Experts",
                desc: "Our consultants have years of experience navigating academic institutions and requirements.",
              },
              {
                icon: "fa-headset",
                color: "#C49F34",
                title: "Always-On Support",
                desc: "Reach our team via WhatsApp, phone, or email any time — day or night.",
              },
              {
                icon: "fa-tags",
                color: "#1A4328",
                title: "Transparent Pricing",
                desc: "No hidden charges. What you see is exactly what you pay — clear and upfront.",
              },
              {
                icon: "fa-certificate",
                color: "#C49F34",
                title: "Verified Results",
                desc: "98% satisfaction. Our track record speaks for itself — thousands of happy clients.",
              },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  background: "var(--surface)",
                  borderRadius: 16,
                  padding: "2rem",
                  border: "1px solid var(--border)",
                  transition: "all 0.3s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 40px rgba(26,67,40,0.10)";
                  e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background:
                      f.color === "#1A4328"
                        ? "rgba(26,67,40,0.1)"
                        : "rgba(196,159,52,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <i
                    className={`fas ${f.icon}`}
                    style={{ color: f.color, fontSize: "1.25rem" }}
                  ></i>
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: "0.5rem",
                    fontSize: "1.05rem",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ SERVICES ══════════════════ */}
      <section
        id="services"
        style={{ padding: "6rem 1.5rem", background: "var(--primary)" }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(196,159,52,0.15)",
                border: "1px solid rgba(196,159,52,0.3)",
                borderRadius: 50,
                padding: "5px 14px",
                marginBottom: "1rem",
              }}
            >
              <i
                className="fas fa-layer-group"
                style={{ color: "var(--secondary)", fontSize: "0.8rem" }}
              ></i>
              <span
                style={{
                  color: "var(--secondary)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Our Services
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem,3.5vw,2.6rem)",
                fontWeight: 800,
                color: "#fff",
                margin: "0 0 0.75rem",
                letterSpacing: "-0.02em",
              }}
            >
              Everything You Need, Under One Roof
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "1.05rem",
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              Browse our full catalogue of technology and educational services —
              all available online.
            </p>
          </div>

          {/* Category tabs */}
          {Object.keys(services).length > 1 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                justifyContent: "center",
                marginBottom: "2.5rem",
              }}
            >
              {Object.keys(services).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    background:
                      activeCategory === cat
                        ? "var(--secondary)"
                        : "rgba(255,255,255,0.08)",
                    color:
                      activeCategory === cat ? "#fff" : "rgba(255,255,255,0.7)",
                    border:
                      activeCategory === cat
                        ? "none"
                        : "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 50,
                    padding: "8px 20px",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Service cards */}
          {Object.entries(services).map(
            ([category, items]) =>
              (activeCategory === null || activeCategory === category) && (
                <div key={category}>
                  {Object.keys(services).length === 1 && (
                    <h3
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        fontWeight: 700,
                        fontSize: "1.2rem",
                        marginBottom: "1.5rem",
                        paddingLeft: "0.75rem",
                        borderLeft: "3px solid var(--secondary)",
                      }}
                    >
                      {category}
                    </h3>
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(260px,1fr))",
                      gap: "1.25rem",
                    }}
                  >
                    {items.map((service, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--surface)",
                          borderRadius: 16,
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.08)",
                          transition: "all 0.3s",
                          display: "flex",
                          flexDirection: "column",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-5px)";
                          e.currentTarget.style.boxShadow =
                            "0 16px 48px rgba(0,0,0,0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {/* Image */}
                        <div
                          style={{
                            position: "relative",
                            height: 180,
                            overflow: "hidden",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            navigate(`/service-form/${service.id}`)
                          }
                        >
                          <img
                            src={service.image}
                            alt={service.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              transition: "transform 0.5s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.transform = "scale(1.08)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.transform = "none")
                            }
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "linear-gradient(to top, rgba(26,67,40,0.5), transparent)",
                            }}
                          />
                          <button
                            onClick={(e) => handleShare(service, e)}
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              width: 36,
                              height: 36,
                              background: "rgba(255,255,255,0.9)",
                              backdropFilter: "blur(4px)",
                              border: "none",
                              borderRadius: "50%",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--primary)",
                              fontSize: "0.85rem",
                              transition: "all 0.2s",
                            }}
                            aria-label={`Share ${service.name}`}
                          >
                            <i className="fas fa-share-nodes"></i>
                          </button>
                        </div>

                        {/* Content */}
                        <div
                          style={{
                            padding: "1.25rem",
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                          }}
                        >
                          <h4
                            style={{
                              fontWeight: 700,
                              color: "var(--text)",
                              marginBottom: "0.4rem",
                              fontSize: "1rem",
                              cursor: "pointer",
                              transition: "color 0.2s",
                            }}
                            onClick={() =>
                              navigate(`/service-form/${service.id}`)
                            }
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "var(--primary)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = "var(--text)")
                            }
                          >
                            {service.name}
                          </h4>
                          <p
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "0.85rem",
                              lineHeight: 1.6,
                              flex: 1,
                              marginBottom: "1rem",
                            }}
                          >
                            {service.description}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "0.85rem",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 800,
                                color: "var(--primary)",
                                fontSize: "1.2rem",
                              }}
                            >
                              {service.price}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyLink(service);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                fontSize: "0.78rem",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <i className="fas fa-copy"></i> Copy link
                            </button>
                          </div>
                          <button
                            onClick={() =>
                              navigate(`/service-form/${service.id}`)
                            }
                            style={{
                              width: "100%",
                              background: "var(--primary)",
                              color: "#fff",
                              border: "none",
                              borderRadius: 10,
                              padding: "11px 0",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 8,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "var(--primary-hover)";
                              e.currentTarget.style.transform =
                                "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "var(--primary)";
                              e.currentTarget.style.transform = "none";
                            }}
                          >
                            <i className="fas fa-arrow-right-long"></i> Order
                            Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
          )}
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section
        id="how-it-works"
        style={{ padding: "6rem 1.5rem", background: "var(--background)" }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(26,67,40,0.08)",
                border: "1px solid rgba(26,67,40,0.15)",
                borderRadius: 50,
                padding: "5px 14px",
                marginBottom: "1rem",
              }}
            >
              <i
                className="fas fa-circle-nodes"
                style={{ color: "var(--primary)", fontSize: "0.8rem" }}
              ></i>
              <span
                style={{
                  color: "var(--primary)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                How It Works
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem,3.5vw,2.6rem)",
                fontWeight: 800,
                color: "var(--text)",
                margin: "0 0 0.75rem",
                letterSpacing: "-0.02em",
              }}
            >
              Three Steps to Get Started
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1.05rem",
                maxWidth: 460,
                margin: "0 auto",
              }}
            >
              Simple, fast, and stress-free from start to finish.
            </p>
          </div>

          {/* Cards — fixed equal heights, centered grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.5rem",
              alignItems: "stretch",
            }}
            className="how-it-works-grid"
          >
            {[
              {
                step: "01",
                icon: "fa-magnifying-glass",
                color: "var(--primary)",
                title: "Choose a Service",
                desc: "Browse our full catalogue and pick exactly the service that matches your need.",
                badge: "Step 1",
              },
              {
                step: "02",
                icon: "fa-file-signature",
                color: "var(--secondary)",
                title: "Submit Your Details",
                desc: "Fill out the short request form with your information. Takes under 3 minutes.",
                badge: "Step 2",
              },
              {
                step: "03",
                icon: "fa-circle-check",
                color: "var(--primary)",
                title: "Receive Your Result",
                desc: "We process your request and deliver it to you securely and swiftly.",
                badge: "Step 3",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: "var(--surface)",
                  borderRadius: 20,
                  border: "1.5px solid var(--border)",
                  padding: "2.25rem 2rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  transition: "all 0.3s",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow =
                    i === 1
                      ? "0 16px 48px rgba(196,159,52,0.18)"
                      : "0 16px 48px rgba(26,67,40,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Large watermark step number */}
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 16,
                    fontSize: "6rem",
                    fontWeight: 900,
                    lineHeight: 1,
                    color:
                      i === 1 ? "rgba(196,159,52,0.07)" : "rgba(26,67,40,0.05)",
                    userSelect: "none",
                    pointerEvents: "none",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {item.step}
                </span>

                {/* Step badge */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background:
                      i === 1 ? "rgba(196,159,52,0.12)" : "rgba(26,67,40,0.07)",
                    border: `1px solid ${i === 1 ? "rgba(196,159,52,0.25)" : "rgba(26,67,40,0.12)"}`,
                    borderRadius: 50,
                    padding: "4px 12px",
                    marginBottom: "1.25rem",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: item.color,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Icon */}
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    background: item.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.5rem",
                    flexShrink: 0,
                    boxShadow:
                      i === 1
                        ? "0 8px 24px rgba(196,159,52,0.35)"
                        : "0 8px 24px rgba(26,67,40,0.22)",
                  }}
                >
                  <i
                    className={`fas ${item.icon}`}
                    style={{
                      color: i === 1 ? "#fff" : "var(--secondary)",
                      fontSize: "1.4rem",
                    }}
                  ></i>
                </div>

                {/* Text */}
                <h3
                  style={{
                    fontWeight: 800,
                    color: "var(--text)",
                    fontSize: "1.1rem",
                    marginBottom: "0.65rem",
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.92rem",
                    lineHeight: 1.7,
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {item.desc}
                </p>

                {/* Bottom accent line */}
                <div
                  style={{
                    marginTop: "1.75rem",
                    height: 3,
                    width: "2.5rem",
                    borderRadius: 99,
                    background: item.color,
                    opacity: 0.5,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA BAND ══════════════════ */}
      <section
        style={{
          padding: "5rem 1.5rem",
          background: "var(--secondary)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -40,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.8rem,4vw,2.8rem)",
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 1rem",
              letterSpacing: "-0.02em",
            }}
          >
            Ready to Take the Next Step?
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "1.1rem",
              marginBottom: "2.5rem",
              lineHeight: 1.7,
            }}
          >
            Join thousands of clients who trust IFFY'S TECH EDU CONSULT for
            their educational and digital needs.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <button
              onClick={() => scrollTo("services")}
              style={{
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: 50,
                padding: "14px 32px",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(26,67,40,0.35)",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(26,67,40,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(26,67,40,0.35)";
              }}
            >
              Browse Services
            </button>
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#25D366",
                color: "#fff",
                borderRadius: 50,
                padding: "14px 32px",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.25s",
                boxShadow: "0 8px 24px rgba(37,211,102,0.35)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
              }}
            >
              <i className="fab fa-whatsapp" style={{ fontSize: "1.2rem" }}></i>{" "}
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section
        id="testimonials"
        style={{ padding: "6rem 1.5rem", background: "var(--background)" }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(26,67,40,0.08)",
                border: "1px solid rgba(26,67,40,0.15)",
                borderRadius: 50,
                padding: "5px 14px",
                marginBottom: "1rem",
              }}
            >
              <i
                className="fas fa-comments"
                style={{ color: "var(--primary)", fontSize: "0.8rem" }}
              ></i>
              <span
                style={{
                  color: "var(--primary)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Client Reviews
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem,3.5vw,2.6rem)",
                fontWeight: 800,
                color: "var(--text)",
                margin: "0 0 0.75rem",
                letterSpacing: "-0.02em",
              }}
            >
              What Our Clients Say
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1.05rem",
                maxWidth: 480,
                margin: "0 auto",
              }}
            >
              Real experiences from real people who rely on us every day.
            </p>
          </div>

          {approvedTestimonials.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))",
                gap: "1.5rem",
                marginBottom: "4rem",
              }}
            >
              {approvedTestimonials.map((t, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--surface)",
                    borderRadius: 18,
                    padding: "2rem",
                    border: "1px solid var(--border)",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 40px rgba(26,67,40,0.08)";
                    e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  {/* quote icon */}
                  <i
                    className="fas fa-quote-left"
                    style={{
                      color: "var(--secondary)",
                      fontSize: "1.5rem",
                      marginBottom: "0.75rem",
                      display: "block",
                      opacity: 0.7,
                    }}
                  ></i>
                  {/* stars */}
                  <div
                    style={{ display: "flex", gap: 3, marginBottom: "0.85rem" }}
                  >
                    {Array(5)
                      .fill(0)
                      .map((_, si) => (
                        <i
                          key={si}
                          className="fas fa-star"
                          style={{
                            color:
                              si < t.rating
                                ? "var(--secondary)"
                                : "var(--border)",
                            fontSize: "0.85rem",
                          }}
                        ></i>
                      ))}
                  </div>
                  <p
                    style={{
                      color: "var(--text)",
                      fontSize: "0.95rem",
                      lineHeight: 1.7,
                      fontStyle: "italic",
                      marginBottom: "1.5rem",
                    }}
                  >
                    "{t.text}"
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--secondary)",
                        fontWeight: 800,
                        fontSize: "1.1rem",
                      }}
                    >
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--text)",
                          fontSize: "0.95rem",
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.8rem",
                        }}
                      >
                        Verified Client
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "var(--text-muted)",
                marginBottom: "4rem",
              }}
            >
              <i
                className="fas fa-comment-dots"
                style={{
                  fontSize: "2.5rem",
                  marginBottom: "0.75rem",
                  display: "block",
                  opacity: 0.3,
                }}
              ></i>
              No reviews yet. Be the first to share your experience!
            </div>
          )}

          {/* Submit review */}
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              background: "var(--surface)",
              borderRadius: 20,
              padding: "2.5rem",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 40px rgba(26,67,40,0.06)",
            }}
          >
            <h3
              style={{
                fontWeight: 800,
                color: "var(--text)",
                fontSize: "1.4rem",
                marginBottom: "0.4rem",
                textAlign: "center",
              }}
            >
              Share Your Experience
            </h3>
            <p
              style={{
                color: "var(--text-muted)",
                textAlign: "center",
                marginBottom: "2rem",
                fontSize: "0.92rem",
              }}
            >
              Your feedback helps us serve you better.
            </p>
            <form
              onSubmit={handleTestimonialSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 6,
                    fontSize: "0.9rem",
                  }}
                >
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
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    borderRadius: 10,
                    border: "1.5px solid var(--border)",
                    background: "var(--background)",
                    color: "var(--text)",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 6,
                    fontSize: "0.9rem",
                  }}
                >
                  Rating
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setTestimonialForm({ ...testimonialForm, rating: star })
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1.75rem",
                        color:
                          star <= testimonialForm.rating
                            ? "var(--secondary)"
                            : "var(--border)",
                        transition: "color 0.15s",
                        padding: 0,
                      }}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 6,
                    fontSize: "0.9rem",
                  }}
                >
                  Your Review
                </label>
                <textarea
                  required
                  rows={4}
                  value={testimonialForm.text}
                  onChange={(e) =>
                    setTestimonialForm({
                      ...testimonialForm,
                      text: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    borderRadius: 10,
                    border: "1.5px solid var(--border)",
                    background: "var(--background)",
                    color: "var(--text)",
                    fontSize: "0.95rem",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    transition: "border 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                />
              </div>
              <button
                type="submit"
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "13px 0",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--primary-hover)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--primary)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <i className="fas fa-paper-plane"></i> Submit Review
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ══════════════════ WHATSAPP COMMUNITY ══════════════════ */}
      <section
        id="newsletter"
        style={{
          padding: "5rem 1.5rem",
          background: "var(--primary)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "rgba(196,159,52,0.06)",
          }}
        />
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#25D366",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              boxShadow: "0 8px 30px rgba(37,211,102,0.4)",
            }}
          >
            <i
              className="fab fa-whatsapp"
              style={{ color: "#fff", fontSize: "2rem" }}
            ></i>
          </div>
          <h2
            style={{
              fontWeight: 800,
              color: "#fff",
              fontSize: "clamp(1.6rem,3vw,2.2rem)",
              margin: "0 0 0.75rem",
              letterSpacing: "-0.02em",
            }}
          >
            Stay Ahead — Join Our Community
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.75,
              marginBottom: "2rem",
              fontSize: "1.02rem",
              maxWidth: 520,
              margin: "0 auto 2rem",
            }}
          >
            Get instant alerts on new services, registration deadlines,
            admission openings and exclusive offers straight to your WhatsApp.
          </p>
          {settings.whatsappGroupLink ? (
            <a
              href={settings.whatsappGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: "#25D366",
                color: "#fff",
                borderRadius: 50,
                padding: "14px 36px",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 8px 28px rgba(37,211,102,0.4)",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 36px rgba(37,211,102,0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow =
                  "0 8px 28px rgba(37,211,102,0.4)";
              }}
            >
              <i className="fab fa-whatsapp" style={{ fontSize: "1.3rem" }}></i>{" "}
              Join Our WhatsApp Group
            </a>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(37,211,102,0.4)",
                color: "#fff",
                borderRadius: 50,
                padding: "14px 36px",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "not-allowed",
                opacity: 0.6,
              }}
            >
              <i className="fab fa-whatsapp" style={{ fontSize: "1.3rem" }}></i>{" "}
              Join Our WhatsApp Group
            </span>
          )}
        </div>
      </section>

      {/* ══════════════════ CONTACT ══════════════════ */}
      <section
        id="contact"
        style={{ padding: "6rem 1.5rem", background: "var(--background)" }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(26,67,40,0.08)",
                border: "1px solid rgba(26,67,40,0.15)",
                borderRadius: 50,
                padding: "5px 14px",
                marginBottom: "1rem",
              }}
            >
              <i
                className="fas fa-envelope"
                style={{ color: "var(--primary)", fontSize: "0.8rem" }}
              ></i>
              <span
                style={{
                  color: "var(--primary)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Contact Us
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem,3.5vw,2.6rem)",
                fontWeight: 800,
                color: "var(--text)",
                margin: "0 0 0.75rem",
                letterSpacing: "-0.02em",
              }}
            >
              Let's Start a Conversation
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1.05rem",
                maxWidth: 460,
                margin: "0 auto",
              }}
            >
              Have a question or need help? Reach us through any of the channels
              below.
            </p>
          </div>

          <div
            className="contact-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              alignItems: "start",
            }}
          >
            {/* Info panel */}
            <div>
              <div
                style={{
                  background: "var(--primary)",
                  borderRadius: 20,
                  padding: "2.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h3
                  style={{
                    fontWeight: 700,
                    color: "#fff",
                    fontSize: "1.2rem",
                    marginBottom: "2rem",
                  }}
                >
                  Office Information
                </h3>
                {[
                  {
                    icon: "fa-phone",
                    label: "Phone Number",
                    value: settings.phoneNumber,
                  },
                  {
                    icon: "fa-envelope",
                    label: "Email Address",
                    value: settings.email,
                  },
                  {
                    icon: "fa-location-dot",
                    label: "Office Address",
                    value: settings.address,
                  },
                  {
                    icon: "fa-clock",
                    label: "Business Hours",
                    value: settings.businessHours,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      marginBottom: i < 3 ? "1.5rem" : 0,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "rgba(196,159,52,0.15)",
                        border: "1px solid rgba(196,159,52,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className={`fas ${item.icon}`}
                        style={{ color: "var(--secondary)", fontSize: "1rem" }}
                      ></i>
                    </div>
                    <div>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.55)",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 3,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          color: "#fff",
                          fontWeight: 500,
                          fontSize: "0.95rem",
                        }}
                      >
                        {item.value || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social links */}
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 16,
                  padding: "1.5rem",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    marginRight: "0.5rem",
                  }}
                >
                  Follow us:
                </span>
                {[
                  {
                    icon: "fa-facebook-f",
                    href: settings.socialLinks?.facebook,
                    label: "Facebook",
                  },
                  {
                    icon: "fa-whatsapp",
                    href: settings.socialLinks?.whatsappChannel,
                    label: "WhatsApp Channel",
                  },
                  {
                    icon: "fa-instagram",
                    href: settings.socialLinks?.instagram,
                    label: "Instagram",
                  },
                  {
                    icon: "fa-tiktok",
                    href: settings.socialLinks?.tiktok,
                    label: "TikTok",
                  },
                ].map((s) => (
                  <a
                    key={s.icon}
                    href={s.href || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--primary)";
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.borderColor = "var(--primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--background)";
                      e.currentTarget.style.color = "var(--text-muted)";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    <i className={`fab ${s.icon}`}></i>
                  </a>
                ))}
              </div>
            </div>

            {/* Contact form */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 20,
                padding: "2.5rem",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 40px rgba(26,67,40,0.06)",
              }}
            >
              <h3
                style={{
                  fontWeight: 800,
                  color: "var(--text)",
                  fontSize: "1.25rem",
                  marginBottom: "1.75rem",
                }}
              >
                Send Us a Message
              </h3>
              <form
                onSubmit={handleContactSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.2rem",
                }}
              >
                {[
                  {
                    label: "Full Name",
                    type: "text",
                    key: "name",
                    required: true,
                  },
                  {
                    label: "Email Address",
                    type: "email",
                    key: "email",
                    required: true,
                  },
                  {
                    label: "Phone Number",
                    type: "tel",
                    key: "phoneNumber",
                    required: false,
                  },
                ].map((f) => (
                  <div key={f.key}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: 600,
                        color: "var(--text)",
                        marginBottom: 6,
                        fontSize: "0.9rem",
                      }}
                    >
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      required={f.required}
                      value={contactForm[f.key]}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          [f.key]: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "11px 16px",
                        borderRadius: 10,
                        border: "1.5px solid var(--border)",
                        background: "var(--background)",
                        color: "var(--text)",
                        fontSize: "0.95rem",
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "border 0.2s",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "var(--border)")
                      }
                    />
                  </div>
                ))}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: 6,
                      fontSize: "0.9rem",
                    }}
                  >
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
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: 10,
                      border: "1.5px solid var(--border)",
                      background: "var(--background)",
                      color: "var(--text)",
                      fontSize: "0.95rem",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                      transition: "border 0.2s",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    background: "var(--secondary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "13px 0",
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--secondary-hover)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--secondary)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <i className="fas fa-paper-plane"></i> Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer
        style={{
          background: "#0D1F14",
          color: "#fff",
          padding: "4rem 1.5rem 0",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div
            className="footer-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: "3rem",
              paddingBottom: "3rem",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Brand col */}
            <div>
              <img
                src={IffysLogo}
                alt="IFFY'S TECH EDU CONSULT"
                style={{
                  height: 56,
                  objectFit: "contain",
                  marginBottom: "1.25rem",
                }}
              />
              <p
                style={{
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.75,
                  fontSize: "0.92rem",
                  maxWidth: 320,
                  marginBottom: "1.5rem",
                }}
              >
                IFFY'S TECH EDU CONSULT — your trusted partner for technology
                and educational consulting services across Nigeria.
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[
                  {
                    icon: "fa-facebook-f",
                    href: settings.socialLinks?.facebook,
                  },
                  {
                    icon: "fa-whatsapp",
                    href: settings.socialLinks?.whatsappChannel,
                  },
                  {
                    icon: "fa-instagram",
                    href: settings.socialLinks?.instagram,
                  },
                  {
                    icon: "fa-tiktok",
                    href: settings.socialLinks?.tiktok,
                  },
                ].map((s) => (
                  <a
                    key={s.icon}
                    href={s.href || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.6)",
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--secondary)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                    }}
                  >
                    <i className={`fab ${s.icon}`}></i>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4
                style={{
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "1.25rem",
                  fontSize: "0.95rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Quick Links
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                {[
                  { label: "Home", id: "home" },
                  { label: "Services", id: "services" },
                  { label: "Why Us", id: "why-us" },
                  { label: "Testimonials", id: "testimonials" },
                  { label: "Contact", id: "contact" },
                ].map((l) => (
                  <li key={l.id}>
                    <button
                      onClick={() => scrollTo(l.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "0.92rem",
                        transition: "color 0.2s",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--secondary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
                      }
                    >
                      <i
                        className="fas fa-chevron-right"
                        style={{ fontSize: "0.65rem" }}
                      ></i>
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact info */}
            <div>
              <h4
                style={{
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "1.25rem",
                  fontSize: "0.95rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Get in Touch
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                {[
                  { icon: "fa-phone", value: settings.phoneNumber },
                  { icon: "fa-envelope", value: settings.email },
                  { icon: "fa-location-dot", value: settings.address },
                ].map(
                  (item, i) =>
                    item.value && (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <i
                          className={`fas ${item.icon}`}
                          style={{
                            color: "var(--secondary)",
                            marginTop: 3,
                            fontSize: "0.85rem",
                            flexShrink: 0,
                          }}
                        ></i>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.55)",
                            fontSize: "0.9rem",
                            lineHeight: 1.5,
                          }}
                        >
                          {item.value}
                        </span>
                      </li>
                    ),
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="footer-bottom"
            style={{
              padding: "1.5rem 0",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.85rem",
                margin: 0,
              }}
            >
              © {new Date().getFullYear()} IFFY'S TECH EDU CONSULT. All Rights
              Reserved.
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: "0.82rem",
                margin: 0,
              }}
            >
              Designed &amp; developed by{" "}
              <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                Code Jeffrey
              </span>
              . Need a professional website?{" "}
              <a
                href="https://wa.me/2347015585397"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--secondary)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Chat on WhatsApp
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* ══════════════════ FLOATING BUTTONS ══════════════════ */}

      {/* My Orders — pill with glass morphism style */}
      <button
        onClick={() => navigate("/my-orders")}
        aria-label="Track my orders"
        style={{
          position: "fixed",
          bottom: 100,
          right: 24,
          zIndex: 50,
          background: "var(--primary)",
          color: "#fff",
          border: "none",
          borderRadius: 16,
          padding: "10px 18px 10px 14px",
          fontWeight: 700,
          fontSize: "0.85rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 8px 28px rgba(26,67,40,0.45)",
          transition: "all 0.25s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--primary-hover)";
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 14px 36px rgba(26,67,40,0.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--primary)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(26,67,40,0.45)";
        }}
      >
        {/* Icon box */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <i
            className="fas fa-bag-shopping"
            style={{ color: "#fff", fontSize: "0.85rem" }}
          ></i>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            lineHeight: 1.2,
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 500,
            }}
          >
            Track
          </span>
          <span style={{ fontSize: "0.88rem", fontWeight: 800 }}>
            My Orders
          </span>
        </div>
        {hasPendingOrder && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#C84B31",
              border: "2.5px solid white",
              boxShadow: "0 0 0 3px rgba(200,75,49,0.3)",
              animation: "pulse-whatsapp 2s infinite",
            }}
          />
        )}
      </button>

      {/* WhatsApp — square-ish card with label */}
      <a
        href={`https://wa.me/${settings.whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#111",
          borderRadius: 18,
          padding: "11px 20px 11px 14px",
          textDecoration: "none",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          transition: "all 0.25s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.5)";
          e.currentTarget.style.background = "#1a1a1a";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
          e.currentTarget.style.background = "#111";
        }}
      >
        {/* WhatsApp icon circle */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#25D366",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(37,211,102,0.45)",
          }}
        >
          <i
            className="fab fa-whatsapp"
            style={{ color: "#fff", fontSize: "1.2rem" }}
          ></i>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            lineHeight: 1.2,
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "rgba(255,255,255,0.5)",
              fontWeight: 500,
            }}
          >
            Need help?
          </span>
          <span style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 800 }}>
            Chat with us
          </span>
        </div>
        {/* Online dot */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginLeft: 4,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#25D366",
              boxShadow: "0 0 0 2px rgba(37,211,102,0.3)",
              animation: "pulse-whatsapp 2s infinite",
              display: "block",
            }}
          />
        </div>
      </a>
    </div>
  );
}
