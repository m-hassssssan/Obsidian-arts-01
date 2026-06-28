import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
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
          <div className="col-span-4 border-r-[3px] border-black px-6 py-4 flex items-center">
            <Link
              to="/"
              className="font-oswald text-xl font-bold tracking-tight-oswald uppercase"
            >
              OBSIDIAN ARTS
            </Link>
          </div>
          <div className="col-span-8 flex">
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
          </div>
        )}
      </div>
    </nav>
  );
}
