import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, ArrowLeft, AlertCircle, Lock, User as UserIcon, Mail } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const { state, refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: async () => {
      await refresh();
      navigate("/");
    },
  });

  useEffect(() => {
    if (state.status === "authenticated") navigate("/");
  }, [state.status, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;
    signupMutation.mutate({ name, email, password });
  };

  const passwordMismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;

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
            to="/login"
            className="font-oswald text-xs font-bold uppercase tracking-widest hover:text-[#FF0004]"
          >
            ALREADY A MEMBER? SIGN IN
          </Link>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        <aside className="lg:col-span-5 bg-[#1a1a1a] text-white p-10 md:p-16 flex flex-col justify-between">
          <div>
            <span className="inline-block bg-[#FF0004] text-white px-3 py-1 font-oswald text-[10px] font-bold uppercase tracking-[0.2em] border-[3px] border-black mb-6">
              New Patron
            </span>
            <h1 className="font-oswald text-4xl md:text-6xl font-bold uppercase leading-[0.95] tracking-[-0.03em] mb-6">
              JOIN
              <br />
              THE
              <br />
              ROSTER
            </h1>
            <p className="font-inter text-sm leading-relaxed text-white/70 max-w-md">
              Create a patron account to start acquisition inquiries, save
              favorite works, and follow represented artists.
            </p>
          </div>
          <div className="mt-16 border-[3px] border-white/20 p-6">
            <p className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#F9FF00] mb-2">
              Studio Advisory
            </p>
            <p className="font-inter text-xs text-white/70 leading-relaxed">
              By creating an account, you will be assigned a personal art
              advisor. They will reach out within 24 hours to walk you through
              upcoming releases and private viewings.
            </p>
          </div>
        </aside>

        <section className="lg:col-span-7 p-10 md:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-oswald text-xs font-bold uppercase tracking-widest text-[#1a1a1a]/60 hover:text-[#1a1a1a] mb-8"
            >
              <ArrowLeft size={14} /> BACK TO GALLERY
            </Link>

            <h2 className="font-oswald text-3xl md:text-4xl font-bold uppercase tracking-[-0.02em] mb-2">
              CREATE ACCOUNT
            </h2>
            <p className="font-inter text-sm text-[#1a1a1a]/60 mb-10">
              Three fields. We'll take it from there.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="font-oswald text-xs font-bold uppercase tracking-widest block mb-2">
                  FULL NAME
                </label>
                <div className="flex items-center border-[3px] border-black bg-white focus-within:bg-[#F9FF00] transition-colors">
                  <UserIcon size={18} className="ml-4 text-[#1a1a1a]/60" />
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    className="flex-1 px-4 py-4 font-inter text-sm md:text-base bg-transparent outline-none"
                    placeholder="Elena Vasquez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-oswald text-xs font-bold uppercase tracking-widest block mb-2">
                  EMAIL
                </label>
                <div className="flex items-center border-[3px] border-black bg-white focus-within:bg-[#F9FF00] transition-colors">
                  <Mail size={18} className="ml-4 text-[#1a1a1a]/60" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    className="flex-1 px-4 py-4 font-inter text-sm md:text-base bg-transparent outline-none"
                    placeholder="patron@studio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="flex-1 px-4 py-4 font-inter text-sm md:text-base bg-transparent outline-none"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {tooShort && (
                  <p className="font-inter text-xs text-[#FF0004] mt-2">
                    Password must be at least 8 characters.
                  </p>
                )}
              </div>

              <div>
                <label className="font-oswald text-xs font-bold uppercase tracking-widest block mb-2">
                  CONFIRM PASSWORD
                </label>
                <div className="flex items-center border-[3px] border-black bg-white focus-within:bg-[#F9FF00] transition-colors">
                  <Lock size={18} className="ml-4 text-[#1a1a1a]/60" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    className="flex-1 px-4 py-4 font-inter text-sm md:text-base bg-transparent outline-none"
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                {passwordMismatch && (
                  <p className="font-inter text-xs text-[#FF0004] mt-2">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {signupMutation.error && (
                <div className="flex items-start gap-3 border-[3px] border-[#FF0004] bg-[#FF0004]/5 p-4">
                  <AlertCircle size={18} className="text-[#FF0004] mt-0.5 flex-shrink-0" />
                  <p className="font-inter text-sm text-[#FF0004]">
                    {signupMutation.error.message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  signupMutation.isPending || tooShort || passwordMismatch
                }
                className="btn-brutal btn-brutal-yellow w-full flex items-center justify-center gap-2"
              >
                {signupMutation.isPending ? "CREATING…" : "CREATE ACCOUNT"}
                {!signupMutation.isPending && <ArrowRight size={16} />}
              </button>
            </form>

            <p className="mt-8 font-inter text-xs text-[#1a1a1a]/50 text-center">
              By creating an account you agree to receive acquisition-related
              correspondence from the studio. You can opt out at any time.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
