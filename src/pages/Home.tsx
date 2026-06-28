import { Navigation } from "@/components/Navigation";
import { Hero } from "@/sections/Hero";
import { Portfolio } from "@/sections/Portfolio";
import { Roster } from "@/sections/Roster";
import { InquiryForm } from "@/sections/InquiryForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <Portfolio />
      <Roster />
      <InquiryForm />

      {/* Footer */}
      <footer className="border-t-[3px] border-black bg-[#1a1a1a] text-white">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-4 border-r-[3px] border-white/10 px-6 md:px-10 py-10">
            <h3 className="font-oswald text-2xl font-bold uppercase tracking-tight mb-4 text-[#F9FF00]">
              OBSIDIAN ARTS
            </h3>
            <p className="font-inter text-xs text-white/60 leading-relaxed max-w-sm">
              A contemporary vanguard exhibition space dedicated to showcasing
              boundary-pushing fine art, sculpture, digital media, and photography.
              Based in Berlin & New York.
            </p>
          </div>
          <div className="md:col-span-3 border-r-[3px] border-white/10 px-6 md:px-10 py-10">
            <h4 className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#F9FF00] mb-4">
              Explore
            </h4>
            <div className="space-y-2">
              {[
                { label: "Gallery", href: "#portfolio" },
                { label: "Artists", href: "#roster" },
                { label: "Acquisitions", href: "#inquiry" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block font-inter text-sm text-white/70 hover:text-[#F9FF00] transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className="md:col-span-3 border-r-[3px] border-white/10 px-6 md:px-10 py-10">
            <h4 className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#F9FF00] mb-4">
              Mediums
            </h4>
            <div className="space-y-2">
              {[
                "Painting & Canvas",
                "Sculpture & Form",
                "Digital & New Media",
                "Avant-Garde Photography",
                "Kinetic & Motion Art",
              ].map((item) => (
                <span
                  key={item}
                  className="block font-inter text-sm text-white/70"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 px-6 md:px-10 py-10">
            <h4 className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#F9FF00] mb-4">
              Social
            </h4>
            <div className="space-y-2">
              {["Instagram", "Artsy", "MutualArt", "LinkedIn"].map(
                (item) => (
                  <span
                    key={item}
                    className="block font-inter text-sm text-white/70 hover:text-[#F9FF00] transition-colors cursor-pointer"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 md:px-10 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <span className="font-inter text-[10px] text-white/40">
            &copy; 2026 OBSIDIAN ARTS. ALL RIGHTS RESERVED.
          </span>
          <span className="font-inter text-[10px] text-white/40">
            RAW DESIGN BY SWISS EDITORIAL
          </span>
        </div>
      </footer>
    </div>
  );
}
