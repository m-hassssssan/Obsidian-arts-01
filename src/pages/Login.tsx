import { Link } from "react-router";
import { ArrowLeft, LogIn } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Bar */}
      <div className="border-b-[3px] border-black px-6 md:px-12 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-oswald text-sm uppercase tracking-wider hover:text-[#FF0004] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Gallery
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="border-[3px] border-black">
            {/* Header */}
            <div className="border-b-[3px] border-black bg-[#1a1a1a] text-white px-8 py-6">
              <span className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#F9FF00] block mb-3">
                Client Portal
              </span>
              <h1 className="font-oswald text-3xl font-bold uppercase tracking-[-0.02em]">
                LOG IN
              </h1>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              <p className="font-inter text-sm text-[#1a1a1a]/70 leading-relaxed mb-8">
                Log in to save acquisition drafts, track your inquiries, and
                communicate with our gallery advisory team.
              </p>

              <button
                onClick={() => {
                  window.location.href = getOAuthUrl();
                }}
                className="w-full btn-brutal btn-brutal-yellow flex items-center justify-center gap-3 py-4 text-base"
              >
                <LogIn size={20} />
                SIGN IN WITH KIMI
              </button>

              <div className="mt-6 pt-6 border-t border-black/10 text-center">
                <p className="font-inter text-xs text-[#1a1a1a]/50">
                  New to the gallery?{" "}
                  <Link
                    to="/"
                    className="underline font-medium hover:text-[#FF0004] transition-colors"
                  >
                    Start an acquisition inquiry
                  </Link>{" "}
                  first.
                </p>
              </div>
            </div>
          </div>

          {/* Decorative blocks */}
          <div className="grid grid-cols-3 gap-0 mt-4">
            <div className="h-4 bg-[#F9FF00] border-[3px] border-black" />
            <div className="h-4 bg-[#FF0004] border-[3px] border-black" />
            <div className="h-4 bg-[#1a1a1a] border-[3px] border-black" />
          </div>
        </div>
      </div>
    </div>
  );
}
