import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, ArrowLeft, AlertCircle, Lock, User as UserIcon } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, refresh } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await refresh();
      const redirect = (location.state as { from?: string } | null)?.from;
      navigate(redirect || "/");
    },
  });

  // If already logged in, redirect home
  useEffect(() => {
    if (state.status === "authenticated") {
      const redirect = (location.state as { from?: string } | null)?.from;
      navigate(redirect || "/");
    }
  }, [state.status, navigate, location.state]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!login || !password) return;
    loginMutation.mutate({ login, password });
  };

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex flex-col">
      <header className="border-b-[3px] border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
          <Link
            to="/"
            className="font-oswald text-xl font-bold uppercase tracking-tight"
          >
            OBSIDIAN <span className="text-[#FF0004]">ARTS</span>
          </Link>
          <Link
            to="/signup"
            className="font-oswald text-xs font-bold uppercase tracking-widest hover:text-[#FF0004]"
          >
            CREATE ACCOUNT
          </Link>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        {/* Left – pitch */}
        <aside className="lg:col-span-5 bg-[#1a1a1a] text-white p-10 md:p-16 flex flex-col justify-between">
          <div>
            <span className="inline-block bg-[#F9FF00] text-black px-3 py-1 font-oswald text-[10px] font-bold uppercase tracking-[0.2em] border-[3px] border-black mb-6">
              Patron Access
            </span>
            <h1 className="font-oswald text-4xl md:text-6xl font-bold uppercase leading-[0.95] tracking-[-0.03em] mb-6">
              WELCOME
              <br />
              BACK
            </h1>
            <p className="font-inter text-sm leading-relaxed text-white/70 max-w-md">
              Sign in to manage your acquisition inquiries, track commissions,
              message your advisor, and review studio events.
            </p>
          </div>
          <div className="mt-16 space-y-3">
            <FeatureRow label="Acquisition tracking" />
            <FeatureRow label="Direct messaging with curators" />
            <FeatureRow label="Commission status & history" />
            <FeatureRow label="Members-only previews" />
          </div>
        </aside>

        {/* Right – form */}
        <section className="lg:col-span-7 p-10 md:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-oswald text-xs font-bold uppercase tracking-widest text-[#1a1a1a]/60 hover:text-[#1a1a1a] mb-8"
            >
              <ArrowLeft size={14} /> BACK TO GALLERY
            </Link>

            <h2 className="font-oswald text-3xl md:text-4xl font-bold uppercase tracking-[-0.02em] mb-2">
              SIGN IN
            </h2>
            <p className="font-inter text-sm text-[#1a1a1a]/60 mb-10">
              Enter your credentials. Use your email address or registered
              member ID.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="font-oswald text-xs font-bold uppercase tracking-widest block mb-2">
                  EMAIL OR MEMBER ID
                </label>
                <div className="flex items-center border-[3px] border-black bg-white focus-within:bg-[#F9FF00] transition-colors">
                  <UserIcon size={18} className="ml-4 text-[#1a1a1a]/60" />
                  <input
                    type="text"
                    autoComplete="username"
                    required
                    className="flex-1 px-4 py-4 font-inter text-sm md:text-base bg-transparent outline-none"
                    placeholder="patron@studio.com"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-oswald text-xs font-bold uppercase tracking-widest block mb-2">
                  PASSWORD
                </label>
                <div className="flex items-center border-[3px] border-black bg-white focus-within:bg-[#F9FF00] transition-colors">
                  <Lock size={18} className="ml-4 text-[#1a1a1a]/60" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    className="flex-1 px-4 py-4 font-inter text-sm md:text-base bg-transparent outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {loginMutation.error && (
                <div className="flex items-start gap-3 border-[3px] border-[#FF0004] bg-[#FF0004]/5 p-4">
                  <AlertCircle size={18} className="text-[#FF0004] mt-0.5 flex-shrink-0" />
                  <p className="font-inter text-sm text-[#FF0004]">
                    {loginMutation.error.message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="btn-brutal btn-brutal-yellow w-full flex items-center justify-center gap-2"
              >
                {loginMutation.isPending ? "SIGNING IN…" : "SIGN IN"}
                {!loginMutation.isPending && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t-[3px] border-black">
              <p className="font-oswald text-xs font-bold uppercase tracking-widest mb-3">
                SEED CREDENTIALS (DEV)
              </p>
              <ul className="font-inter text-xs space-y-1 text-[#1a1a1a]/70">
                <li>
                  <span className="font-mono">admin@obsidianarts.com</span> /{" "}
                  <span className="font-mono">obsidian2026</span> (admin)
                </li>
                <li>
                  <span className="font-mono">elena@vasquez.studio</span> /{" "}
                  <span className="font-mono">patron2026</span>
                </li>
                <li>
                  <span className="font-mono">marcus@chen.studio</span> /{" "}
                  <span className="font-mono">patron2026</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 bg-[#F9FF00]" />
      <span className="font-oswald text-xs uppercase tracking-widest text-white/80">
        {label}
      </span>
    </div>
  );
}
