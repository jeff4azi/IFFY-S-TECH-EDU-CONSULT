import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAdmin } from "../../contexts/AdminContext";
import IffysLogo from "../../assets/IFFYS-TECH EDU-CONSULT-LOGO.png";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isLoggedIn } = useAdmin();
  const navigate = useNavigate();

  if (isLoggedIn) return <Navigate to="/admin/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] " +
    "text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] " +
    "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(26,67,40,0.12)] " +
    "transition-all duration-200";

  return (
    <div className="min-h-screen bg-[var(--background)] flex overflow-hidden">
      {/* ── Left panel — decorative ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--primary)] flex-col items-center justify-center relative overflow-hidden p-12">
        {/* Decorative rings */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full border border-white/5" />
        <div className="absolute -top-8 -left-8 w-56 h-56 rounded-full border border-white/8" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full border border-[var(--secondary)]/10" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full border border-white/5" />
        {/* Glow blob */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-80 h-80 rounded-full bg-[var(--secondary)]/5 blur-3xl pointer-events-none"
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-sm">
          <div className="bg-white rounded-2xl px-6 py-4 shadow-xl inline-block mb-10">
            <img
              src={IffysLogo}
              alt="IFFY'S TECH EDU CONSULT"
              className="h-12 object-contain"
            />
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Admin Control Centre
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-10">
            Manage services, orders, testimonials, messages and site settings —
            all from one place.
          </p>

          {/* Feature chips */}
          <div className="space-y-3">
            {[
              {
                icon: "fa-layer-group",
                text: "Manage all services & categories",
              },
              {
                icon: "fa-bag-shopping",
                text: "Track and update customer orders",
              },
              {
                icon: "fa-sliders",
                text: "Configure site settings & payments",
              },
            ].map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-xl px-4 py-3 text-left"
              >
                <div className="w-8 h-8 bg-[var(--secondary)] rounded-lg flex items-center justify-center shrink-0">
                  <i className={`fas ${f.icon} text-white text-xs`} />
                </div>
                <span className="text-white/80 text-sm font-medium">
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom credit */}
        <p className="absolute bottom-6 text-white/25 text-xs">
          IFFY'S TECH EDU CONSULT — Admin Portal
        </p>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-white border border-[var(--border)] rounded-2xl px-5 py-3 shadow-sm">
              <img
                src={IffysLogo}
                alt="IFFY'S TECH EDU CONSULT"
                className="h-10 object-contain"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                <i className="fas fa-shield-halved text-[var(--secondary)] text-sm" />
              </div>
              <span className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">
                Secure Access
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-1.5">
              Sign in to access the admin dashboard.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">
              <i className="fas fa-circle-exclamation text-red-400 text-sm mt-0.5 shrink-0" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">
                Email address
              </label>
              <div className="relative">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6
                  bg-[var(--primary)] rounded-md flex items-center justify-center pointer-events-none"
                >
                  <i className="fas fa-envelope text-[var(--secondary)] text-[9px]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  className={`${inputBase} pl-12`}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">
                Password
              </label>
              <div className="relative">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6
                  bg-[var(--primary)] rounded-md flex items-center justify-center pointer-events-none"
                >
                  <i className="fas fa-lock text-[var(--secondary)] text-[9px]" />
                </div>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={`${inputBase} pl-12 pr-12`}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7
                    flex items-center justify-center rounded-lg
                    text-[var(--text-muted)] hover:text-[var(--primary)]
                    hover:bg-[var(--background)] transition-all"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  <i
                    className={`fas ${showPw ? "fa-eye-slash" : "fa-eye"} text-xs`}
                  />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3
                bg-[var(--primary)] hover:bg-[var(--primary-hover)]
                disabled:opacity-50 disabled:cursor-not-allowed
                text-white py-3.5 rounded-xl font-bold text-sm
                transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
                mt-2"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <i className="fas fa-arrow-right text-[var(--secondary)]" />
                </>
              )}
            </button>
          </form>

          {/* Back link */}
          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]
                hover:text-[var(--primary)] font-medium transition-colors"
            >
              <i className="fas fa-arrow-left text-xs" />
              Back to website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
