import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

const artworks = [
  {
    id: 1,
    title: "COMPOSITION EN ROUGE ET BLEU",
    artist: "ELENA VASQUEZ",
    year: "2025",
    category: "PAINTING & CANVAS",
    medium: "Acrylic and Archival Ink on Canvas",
    dimensions: "180 x 180 cm",
    image: "./portfolio-1.png",
    size: "tall",
    section: "painting",
  },
  {
    id: 3,
    title: "STRUCTURAL DISSOLUTION III",
    artist: "YUKI TANAKA",
    year: "2026",
    category: "PAINTING & CANVAS",
    medium: "Mixed Media and Gesso on Linen",
    dimensions: "150 x 200 cm",
    image: "./portfolio-3.png",
    size: "tall",
    section: "painting",
  },
  {
    id: 4,
    title: "GRID & AXIS MONOLITH",
    artist: "SOPHIE ANDERSSON",
    year: "2026",
    category: "SCULPTURE & FORM",
    medium: "Welded Powder-Coated Steel and Oak",
    dimensions: "240 x 80 x 80 cm",
    image: "./portfolio-4.png",
    size: "wide",
    section: "sculpture",
  },
  {
    id: 2,
    title: "DECONSTRUCT FLUX (GENERATIVE V)",
    artist: "MARCUS CHEN",
    year: "2026",
    category: "DIGITAL & NEW MEDIA",
    medium: "Generative Code & Plotter Drawing",
    dimensions: "Dimensions Variable",
    image: "./portfolio-2.png",
    size: "tall",
    section: "digital",
  },
  {
    id: 5,
    title: "CHRONO-PULSE KINETIC STAGE",
    artist: "MARCUS CHEN",
    year: "2025",
    category: "DIGITAL & NEW MEDIA",
    medium: "Kinetic Video & LED Panel Array",
    dimensions: "300 x 150 cm",
    image: "./portfolio-5.png",
    size: "tall",
    section: "digital",
  },
  {
    id: 6,
    title: "PRISM REFLECTION STUDY",
    artist: "AMARA DIOP",
    year: "2025",
    category: "AVANT-GARDE PHOTOGRAPHY",
    medium: "Archival Pigment Print",
    dimensions: "120 x 160 cm",
    image: "./portfolio-6.png",
    size: "tall",
    section: "photography",
  },
  {
    id: 10,
    title: "SHADOW & CONCRETE GRID I",
    artist: "JAMES O'BRIEN",
    year: "2026",
    category: "AVANT-GARDE PHOTOGRAPHY",
    medium: "Archival Pigment Print",
    dimensions: "120 x 180 cm",
    image: "./portfolio-10.png",
    size: "tall",
    section: "photography",
  },
  {
    id: 11,
    title: "DOUBLE EXPOSURE STUDY IV",
    artist: "AMARA DIOP",
    year: "2026",
    category: "AVANT-GARDE PHOTOGRAPHY",
    medium: "Giclée Fine Art Print",
    dimensions: "100 x 150 cm",
    image: "./portfolio-11.png",
    size: "tall",
    section: "photography",
  },
  {
    id: 7,
    title: "GEOMETRIC DISSONANCE V",
    artist: "YUKI TANAKA",
    year: "2026",
    category: "PAINTING & CANVAS",
    medium: "Acrylic on Raw Canvas",
    dimensions: "160 x 160 cm",
    image: "./portfolio-7.png",
    size: "tall",
    section: "painting",
  },
  {
    id: 8,
    title: "AXIS & VOID III",
    artist: "SOPHIE ANDERSSON",
    year: "2025",
    category: "SCULPTURE & FORM",
    medium: "Welded Steel and Concrete Base",
    dimensions: "190 x 60 x 60 cm",
    image: "./portfolio-8.png",
    size: "tall",
    section: "sculpture",
  },
  {
    id: 9,
    title: "GLITCH DYNAMICS IV",
    artist: "MARCUS CHEN",
    year: "2026",
    category: "DIGITAL & NEW MEDIA",
    medium: "Generative Software & LED Display",
    dimensions: "Dimensions Variable",
    image: "./portfolio-9.png",
    size: "tall",
    section: "digital",
  },
];

const categories = [
  { id: "all", label: "ALL WORKS" },
  { id: "painting", label: "PAINTINGS" },
  { id: "sculpture", label: "SCULPTURES" },
  { id: "digital", label: "DIGITAL & NEW MEDIA" },
  { id: "photography", label: "PHOTOGRAPHY" },
];

export function Portfolio() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const getFilteredArtworks = (sectionId: string) => {
    if (sectionId === "all") return artworks;
    return artworks.filter((art) => art.section === sectionId);
  };

  const sectionsToRender = activeFilter === "all" 
    ? [
        { id: "painting", label: "SECTION 01 // PAINTING & CANVAS" },
        { id: "sculpture", label: "SECTION 02 // SCULPTURE & FORM" },
        { id: "digital", label: "SECTION 03 // DIGITAL & NEW MEDIA" },
        { id: "photography", label: "SECTION 04 // AVANT-GARDE PHOTOGRAPHY" },
      ]
    : [
        { 
          id: activeFilter, 
          label: categories.find(c => c.id === activeFilter)?.label || "" 
        }
      ];

  return (
    <section id="portfolio" className="py-16 md:py-24 border-b-[3px] border-black bg-white">
      {/* Section Header */}
      <div className="px-6 md:px-12 lg:px-16 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#FF0004] block mb-2">
              The Permanent Collection
            </span>
            <h2 className="font-oswald text-4xl md:text-6xl font-bold uppercase tracking-[-0.03em]">
              GALLERY COLLECTION
            </h2>
          </div>
          
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-0 border-[3px] border-black">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`px-4 py-2 font-oswald text-xs font-bold uppercase tracking-wider border-r-[3px] last:border-r-0 border-black transition-colors ${
                  activeFilter === cat.id
                    ? "bg-[#F9FF00] text-black"
                    : "bg-white text-black hover:bg-black hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Art Sections */}
      <div className="px-6 md:px-12 lg:px-16 space-y-16">
        {sectionsToRender.map((section) => {
          const items = getFilteredArtworks(section.id);
          if (items.length === 0) return null;

          return (
            <div key={section.id} className="space-y-6">
              {/* Category Subheading */}
              <div className="border-b-[3px] border-black pb-2 flex items-center justify-between">
                <h3 className="font-oswald text-lg md:text-xl font-bold tracking-tight uppercase">
                  {section.label}
                </h3>
                <span className="font-inter text-xs text-[#1a1a1a]/50 uppercase">
                  {items.length} {items.length === 1 ? "Artwork" : "Artworks"}
                </span>
              </div>

              {/* Art Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-[3px] border-black">
                {items.map((art) => (
                  <div
                    key={art.id}
                    className={`relative border-[3px] border-black cursor-pointer overflow-hidden group ${
                      art.size === "wide" ? "md:col-span-2 lg:col-span-2" : ""
                    }`}
                    onMouseEnter={() => setHoveredId(art.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div
                      className={`relative overflow-hidden ${
                        art.size === "wide"
                          ? "aspect-[2/1]"
                          : "aspect-[3/4]"
                      }`}
                    >
                      <img
                        src={art.image}
                        alt={art.title}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          hoveredId === art.id
                            ? "scale-105 saturate-0"
                            : "scale-100 saturate-100"
                        }`}
                      />
                      {/* Overlay */}
                      <div
                        className={`absolute inset-0 transition-all duration-300 ${
                          hoveredId === art.id
                            ? "bg-[#FF0004]/90"
                            : "bg-transparent"
                        }`}
                      />
                      {/* Info on Hover */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                        <div
                          className={`transition-all duration-300 ${
                            hoveredId === art.id
                              ? "opacity-100 translate-y-0"
                              : "opacity-0 translate-y-4"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-oswald text-xl md:text-2xl font-bold uppercase text-white leading-tight">
                                {art.title}
                              </h4>
                              <p className="font-inter text-xs text-white/80 mt-1 uppercase tracking-wider">
                                {art.artist} &middot; {art.year}
                              </p>
                              <p className="font-inter text-[10px] text-white/60 mt-1">
                                {art.medium}
                              </p>
                              <p className="font-inter text-[10px] text-[#F9FF00] mt-1 font-semibold">
                                {art.dimensions}
                              </p>
                            </div>
                            <ArrowUpRight className="text-white flex-shrink-0" size={24} />
                          </div>
                        </div>
                      </div>
                      {/* Border indicator on hover */}
                      {hoveredId === art.id && (
                        <div className="absolute inset-0 border-[6px] border-[#FF0004] pointer-events-none" />
                      )}
                    </div>
                    {/* Label bar */}
                    <div className="border-t-[3px] border-black bg-white px-4 py-3 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-oswald text-sm font-bold uppercase tracking-wide">
                          {art.artist}
                        </span>
                        <span className="font-inter text-[10px] uppercase text-[#1a1a1a]/50">
                          {art.title} ({art.year})
                        </span>
                      </div>
                      <span className="font-inter text-xs font-semibold px-2 py-0.5 border border-black bg-[#fafafa]">
                        {art.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* View Full Gallery Case Button */}
      <div className="flex justify-center mt-12 px-6 md:px-12 lg:px-16">
        <a
          href="./gallery.html"
          className="btn-brutal btn-brutal-yellow inline-flex items-center gap-2 group text-center no-underline"
        >
          VIEW FULL CASE GALLERY (50+ WORKS)
          <ArrowUpRight
            size={18}
            className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
          />
        </a>
      </div>
    </section>
  );
}
