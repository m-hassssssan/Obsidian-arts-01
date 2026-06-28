import { useEffect, useRef, useState } from "react";

const steps = [
  {
    num: "01",
    title: "BRIEFING",
    desc: "Define the project scope, deliverables, timeline, and budget. Upload visual references and specify rights usage requirements.",
    status: "INITIATE",
    color: "yellow",
    details: [
      "Project type identification",
      "Deliverable specification",
      "Budget range selection",
      "Rights usage agreement",
    ],
  },
  {
    num: "02",
    title: "CONCEPTING",
    desc: "Our art directors review your brief and match you with the ideal illustrator from our roster. Initial sketches and mood boards presented.",
    status: "MATCH",
    color: "red",
    details: [
      "Artist-Client matching",
      "Mood board development",
      "Initial sketch review",
      "Direction approval",
    ],
  },
  {
    num: "03",
    title: "EXECUTION",
    desc: "Full illustration production with structured review rounds. Final files delivered in all specified formats with complete usage rights.",
    status: "DELIVER",
    color: "yellow",
    details: [
      "Production & revisions",
      "Quality assurance review",
      "Final file delivery",
      "Rights documentation",
    ],
  },
];

export function Process() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute("data-step") || "0");
            setActiveStep(idx);
          }
        });
      },
      { threshold: 0.5 }
    );

    const cards = sectionRef.current?.querySelectorAll("[data-step]");
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="process"
      ref={sectionRef}
      className="border-b-[3px] border-black"
    >
      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Sticky Left Column */}
        <div className="md:col-span-4 lg:col-span-3 border-r-[3px] border-black md:sticky md:top-0 md:h-screen flex flex-col justify-center px-6 md:px-10 py-12 md:py-0 bg-white">
          <span className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#FF0004] block mb-4">
            How We Work
          </span>
          <h2 className="font-oswald text-4xl md:text-5xl font-bold uppercase tracking-[-0.03em] leading-[0.95] mb-6">
            OUR
            <br />
            APPROACH
          </h2>
          <p className="font-inter text-sm leading-relaxed text-[#1a1a1a]/70 mb-8">
            A structured three-phase workflow designed to deliver exceptional
            editorial illustration with zero friction.
          </p>
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-3 flex-1 border-[3px] border-black transition-colors ${
                  i === activeStep ? "bg-[#F9FF00]" : "bg-white"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Column - Steps */}
        <div className="md:col-span-8 lg:col-span-9">
          {steps.map((step, i) => (
            <div
              key={i}
              data-step={i}
              className="border-b-[3px] border-black px-6 md:px-12 py-12 md:py-16 min-h-[60vh] flex flex-col justify-center hover:bg-[#F9FF00]/20 transition-colors"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="font-oswald text-6xl md:text-8xl font-bold text-[#1a1a1a]/10 leading-none">
                      {step.num}
                    </span>
                    <span
                      className={`font-oswald text-xs font-bold uppercase tracking-widest px-3 py-1 border-[3px] border-black ${
                        step.color === "yellow"
                          ? "bg-[#F9FF00]"
                          : "bg-[#FF0004] text-white"
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <h3 className="font-oswald text-3xl md:text-4xl font-bold uppercase tracking-[-0.02em] mb-4">
                    {step.title}
                  </h3>
                  <p className="font-inter text-sm leading-relaxed text-[#1a1a1a]/70 max-w-md">
                    {step.desc}
                  </p>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="border-[3px] border-black">
                    {step.details.map((detail, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-4 px-4 py-3 border-b-[3px] border-black last:border-b-0 hover:bg-[#F9FF00] transition-colors"
                      >
                        <span className="font-oswald text-xs font-bold text-[#FF0004]">
                          {step.num}.{j + 1}
                        </span>
                        <span className="font-inter text-sm font-medium uppercase tracking-wide">
                          {detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
