import { useState } from "react";
import { CheckCircle2, Clock, Circle } from "lucide-react";

const artists = [
  {
    id: 1,
    name: "ELENA VASQUEZ",
    discipline: "Painting & Canvas",
    status: "Represented",
    availability: "Solo (July 2026)",
    specialties: ["Acrylic", "Portraiture", "Murals"],
  },
  {
    id: 2,
    name: "MARCUS CHEN",
    discipline: "Digital & New Media",
    status: "Resident",
    availability: "Group (Aug 2026)",
    specialties: ["Generative", "LED Array", "Code Art"],
  },
  {
    id: 3,
    name: "SOPHIE ANDERSSON",
    discipline: "Sculpture & Form",
    status: "Guest Artist",
    availability: "Solo (Oct 2026)",
    specialties: ["Minimalist", "Steel", "Wood"],
  },
  {
    id: 4,
    name: "JAMES O'BRIEN",
    discipline: "Avant-Garde Photography",
    status: "Represented",
    availability: "Permanent Coll.",
    specialties: ["Archival", "Contrast", "Monochromatic"],
  },
  {
    id: 5,
    name: "YUKI TANAKA",
    discipline: "Mixed Media & Painting",
    status: "Represented",
    availability: "Group (July 2026)",
    specialties: ["Gesso", "Canvas", "Textures"],
  },
  {
    id: 6,
    name: "AMARA DIOP",
    discipline: "Photography & Prints",
    status: "Resident",
    availability: "Solo (Nov 2026)",
    specialties: ["Color", "Landscape", "Portraiture"],
  },
];

export function Roster() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Represented":
        return <CheckCircle2 size={16} className="text-green-600" />;
      case "Guest Artist":
        return <Circle size={16} className="text-[#FF0004]" />;
      case "Resident":
        return <Clock size={16} className="text-[#1a1a1a]" />;
      default:
        return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "Represented":
        return "bg-green-50 text-green-700 border-green-200";
      case "Guest Artist":
        return "bg-red-50 text-red-700 border-red-200";
      case "Resident":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      default:
        return "";
    }
  };

  return (
    <section id="roster" className="py-16 md:py-24 border-b-[3px] border-black bg-white">
      <div className="px-6 md:px-12 lg:px-16 mb-12">
        <div className="flex items-end justify-between">
          <div>
            <span className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#FF0004] block mb-2">
              Representative Gallery Roster
            </span>
            <h2 className="font-oswald text-4xl md:text-6xl font-bold uppercase tracking-[-0.03em]">
              REPRESENTED ARTISTS
            </h2>
          </div>
          <span className="hidden md:block font-oswald text-sm uppercase tracking-widest">
            {artists.length} REPRESENTED
          </span>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-16 overflow-x-auto">
        <div className="border-[3px] border-black min-w-[800px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 border-b-[3px] border-black bg-[#1a1a1a] text-white">
            <div className="col-span-3 px-6 py-4 font-oswald text-xs md:text-sm font-bold uppercase tracking-widest">
              Artist Name
            </div>
            <div className="col-span-3 px-6 py-4 font-oswald text-xs md:text-sm font-bold uppercase tracking-widest border-l-[3px] border-white/20">
              Primary Medium
            </div>
            <div className="col-span-2 px-6 py-4 font-oswald text-xs md:text-sm font-bold uppercase tracking-widest border-l-[3px] border-white/20">
              Affiliation
            </div>
            <div className="col-span-2 px-6 py-4 font-oswald text-xs md:text-sm font-bold uppercase tracking-widest border-l-[3px] border-white/20">
              Next Exhibition
            </div>
            <div className="col-span-2 px-6 py-4 font-oswald text-xs md:text-sm font-bold uppercase tracking-widest border-l-[3px] border-white/20">
              Specialties / Focus
            </div>
          </div>

          {/* Table Rows */}
          {artists.map((artist, i) => (
            <div
              key={artist.id}
              className={`grid grid-cols-12 border-b-[3px] border-black last:border-b-0 transition-colors cursor-pointer ${
                hoveredRow === artist.id
                  ? "bg-[#F9FF00]"
                  : i % 2 === 0
                  ? "bg-white"
                  : "bg-[#fafafa]"
              }`}
              onMouseEnter={() => setHoveredRow(artist.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <div className="col-span-3 px-6 py-5 md:py-6 flex items-center gap-3">
                <span className="font-oswald text-lg md:text-xl font-bold uppercase tracking-wide">
                  {artist.name}
                </span>
              </div>
              <div className="col-span-3 px-6 py-5 md:py-6 border-l-[3px] border-black flex items-center">
                <span className="font-inter text-sm md:text-base">{artist.discipline}</span>
              </div>
              <div className="col-span-2 px-6 py-5 md:py-6 border-l-[3px] border-black flex items-center gap-2">
                {getStatusIcon(artist.status)}
                <span className="font-inter text-sm md:text-base font-semibold">
                  {artist.status}
                </span>
              </div>
              <div className="col-span-2 px-6 py-5 md:py-6 border-l-[3px] border-black flex items-center">
                <span
                  className={`font-inter text-xs border-[2px] border-black px-3 py-1 font-bold uppercase ${getStatusBg(
                    artist.status
                  )}`}
                >
                  {artist.availability}
                </span>
              </div>
              <div className="col-span-2 px-6 py-5 md:py-6 border-l-[3px] border-black flex items-center flex-wrap gap-2">
                {artist.specialties.map((s, j) => (
                  <span
                    key={j}
                    className="font-inter text-[10px] md:text-xs font-semibold uppercase tracking-wider border-[2px] border-black px-2.5 py-0.5 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
