import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminSettings() {
  const { state, refresh } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => refresh(),
  });

  useEffect(() => {
    if (state.status === "authenticated") {
      setName(state.user.name ?? "");
    }
  }, [state.status, state.user]);

  if (state.status !== "authenticated") return null;

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-3xl">
      <div>
        <h2 className="font-oswald text-lg font-bold uppercase tracking-tight mb-1">
          Your Profile
        </h2>
        <p className="font-inter text-sm text-[#1a1a1a]/60">
          Update your public-facing information. Email changes are not currently
          supported from this view — contact a developer if you need to change
          your email.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile.mutate({ name, bio });
        }}
        className="border-[3px] border-black bg-white p-6 space-y-4"
      >
        <div>
          <label className="font-oswald text-[10px] font-bold uppercase tracking-widest block mb-1">
            Display Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-brutal w-full text-sm"
            required
          />
        </div>
        <div>
          <label className="font-oswald text-[10px] font-bold uppercase tracking-widest block mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input-brutal w-full text-sm min-h-[100px]"
          />
        </div>
        <div className="text-xs text-[#1a1a1a]/50">
          Signed in as <span className="font-mono">{state.user.email}</span> ·
          role <span className="font-mono">{state.user.role}</span>
        </div>
        <div className="flex items-center justify-end gap-3">
          {updateProfile.error && (
            <span className="font-inter text-xs text-[#FF0004] flex items-center gap-1">
              <AlertCircle size={12} /> {updateProfile.error.message}
            </span>
          )}
          {updateProfile.isSuccess && !updateProfile.isPending && (
            <span className="font-inter text-xs text-green-700 flex items-center gap-1">
              <CheckCircle2 size={12} /> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="btn-brutal btn-brutal-yellow text-xs"
          >
            {updateProfile.isPending ? "SAVING…" : "SAVE"}
          </button>
        </div>
      </form>

      <section className="border-[3px] border-black bg-[#1a1a1a] text-white p-6">
        <h3 className="font-oswald text-sm font-bold uppercase tracking-widest mb-2 text-[#F9FF00]">
          Studio Configuration
        </h3>
        <p className="font-inter text-xs text-white/70 mb-3">
          Server-side environment variables (set in <code>.env</code>):
        </p>
        <ul className="font-mono text-xs space-y-1 text-white/80">
          <li>· DATABASE_URL — MySQL connection</li>
          <li>· APP_SECRET — JWT signing secret</li>
          <li>· APP_ID — Issued by Kimi OAuth</li>
          <li>· OWNER_UNION_ID — Union ID granted admin on first login</li>
        </ul>
      </section>
    </div>
  );
}
