import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Menu, X, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/providers/trpc";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { state, signOut } = useAuth();
  const utils = trpc.useUtils();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const navItems = [
    { label: "GALLERY", action: () => scrollToSection("portfolio") },
    { label: "ARTISTS", action: () => scrollToSection("roster") },
    { label: "ACQUISITIONS", action: () => scrollToSection("inquiry") },
  ];

  async function handleSignOut() {
    await signOut();
    utils.auth.me.invalidate();
    navigate("/");
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white border-b-[3px] border-black"
          : "bg-transparent"
      }`}
    >
      <div className="w-full">
        {/* Desktop Nav */}
        <div className="hidden md:grid grid-cols-12">
          <div className="col-span-3 border-r-[3px] border-black px-6 py-4 flex items-center">
            <Link
              to="/"
              className="font-oswald text-xl font-bold tracking-tight-oswald uppercase"
            >
              OBSIDIAN ARTS
            </Link>
          </div>
          <div className="col-span-5 flex">
            {navItems.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="flex-1 border-r-[3px] last:border-r-0 border-black px-4 py-4 font-oswald text-sm font-semibold uppercase tracking-wide hover:bg-[#F9FF00] transition-colors text-center"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="col-span-4 flex items-stretch">
            {state.status === "authenticated" && state.user.role === "admin" && (
              <Link
                to="/admin"
                className="flex-1 flex items-center justify-center gap-2 border-r-[3px] border-black px-4 py-4 font-oswald text-sm font-semibold uppercase tracking-wide hover:bg-[#F9FF00] transition-colors"
              >
                <ShieldCheck size={14} /> ADMIN
              </Link>
            )}
            {state.status === "authenticated" ? (
              <div className="relative flex-1 flex items-stretch">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-4 font-oswald text-sm font-semibold uppercase tracking-wide hover:bg-[#F9FF00] transition-colors"
                >
                  <UserIcon size={14} /> {state.user.name || state.user.email}
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full right-0 w-56 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="px-4 py-3 border-b-[2px] border-black">
                      <div className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50">
                        Signed in as
                      </div>
                      <div className="font-oswald text-xs font-bold uppercase truncate">
                        {state.user.name || state.user.email}
                      </div>
                      <div className="font-inter text-[10px] text-[#1a1a1a]/50 truncate">
                        {state.user.email}
                      </div>
                    </div>
                    {state.user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="block px-4 py-3 font-oswald text-xs font-bold uppercase tracking-widest hover:bg-[#F9FF00] border-b-[2px] border-black"
                      >
                        → Admin Console
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-3 font-oswald text-xs font-bold uppercase tracking-widest text-[#FF0004] hover:bg-[#FF0004] hover:text-white"
                    >
                      <LogOut size={12} className="inline mr-2" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex-1 flex items-center justify-center px-4 py-4 font-oswald text-sm font-semibold uppercase tracking-wide hover:bg-[#F9FF00] transition-colors border-r-[3px] border-black"
                >
                  SIGN IN
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 flex items-center justify-center px-4 py-4 font-oswald text-sm font-semibold uppercase tracking-wide bg-[#F9FF00] hover:bg-[#1a1a1a] hover:text-[#F9FF00] transition-colors"
                >
                  JOIN
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b-[3px] border-black">
          <Link
            to="/"
            className="font-oswald text-lg font-bold tracking-tight-oswald uppercase"
          >
            OBSIDIAN ARTS
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t-[3px] border-black">
            {navItems.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full text-left px-6 py-4 border-b-[3px] border-black font-oswald text-lg font-semibold uppercase hover:bg-[#F9FF00] transition-colors"
              >
                {item.label}
              </button>
            ))}
            {state.status === "authenticated" ? (
              <>
                {state.user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="block px-6 py-4 border-b-[3px] border-black font-oswald text-lg font-semibold uppercase hover:bg-[#F9FF00]"
                  >
                    <ShieldCheck size={14} className="inline mr-2" /> ADMIN
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-6 py-4 border-b-[3px] border-black font-oswald text-lg font-semibold uppercase text-[#FF0004] hover:bg-[#FF0004] hover:text-white"
                >
                  <LogOut size={14} className="inline mr-2" /> SIGN OUT
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-6 py-4 border-b-[3px] border-black font-oswald text-lg font-semibold uppercase hover:bg-[#F9FF00]"
                >
                  SIGN IN
                </Link>
                <Link
                  to="/signup"
                  className="block px-6 py-4 border-b-[3px] border-black font-oswald text-lg font-semibold uppercase bg-[#F9FF00]"
                >
                  JOIN
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
