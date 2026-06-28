import { useState, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import {
  Send,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  ImagePlus,
  X,
} from "lucide-react";

const projectTypes = [
  { value: "editorial", label: "PAINTING & CANVAS" },
  { value: "brand", label: "SCULPTURE & FORM" },
  { value: "publishing", label: "DIGITAL & NEW MEDIA" },
  { value: "packaging", label: "AVANT-GARDE PHOTOGRAPHY" },
  { value: "motion", label: "KINETIC & MOTION ART" },
  { value: "other", label: "OTHER / MIXED MEDIA" },
] as const;

const budgetRanges = [
  { value: "under5k", label: "UNDER $5,000" },
  { value: "5to10k", label: "$5,000 — $10,000" },
  { value: "10to25k", label: "$10,000 — $25,000" },
  { value: "25to50k", label: "$25,000 — $50,000" },
  { value: "over50k", label: "OVER $50,000" },
  { value: "undisclosed", label: "PREFER NOT TO SAY / DISCUSS" },
] as const;

const rightsOptions = [
  { value: "oneTime", label: "PRIVATE COLLECTION" },
  { value: "limited", label: "CORPORATE / OFFICE DISPLAY" },
  { value: "exclusive", label: "MUSEUM / INSTITUTIONAL EXHIBITION" },
  { value: "fullBuyout", label: "PERMANENT ACQUISITION (WITH RESALE RIGHTS)" },
  { value: "toBeDiscussed", label: "TO BE DISCUSSED WITH ADVISORY" },
] as const;

const deliverableOptions = [
  "Framing & Mounting",
  "Professional Installation",
  "Insured White-Glove Shipping",
  "Certificate of Authenticity (COA)",
  "Custom Lighting Consultation",
  "Private Artist Meet & Greet",
  "Digital Provenance (NFT Registration)",
];

type FormData = {
  title: string;
  projectType: string;
  description: string;
  deliverables: string[];
  deadline: string;
  budget: string;
  rightsUsage: string;
  visualReferences: string[];
};

const initialForm: FormData = {
  title: "",
  projectType: "",
  description: "",
  deliverables: [],
  deadline: "",
  budget: "undisclosed",
  rightsUsage: "toBeDiscussed",
  visualReferences: [],
};

export function InquiryForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [refInput, setRefInput] = useState("");

  const createMutation = trpc.commission.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        setSubmitted(true);
      }
    },
  });

  const setField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleDeliverable = (d: string) => {
    setForm((prev) => ({
      ...prev,
      deliverables: prev.deliverables.includes(d)
        ? prev.deliverables.filter((x) => x !== d)
        : [...prev.deliverables, d],
    }));
  };

  const addReference = () => {
    if (refInput.trim()) {
      setForm((prev) => ({
        ...prev,
        visualReferences: [...prev.visualReferences, refInput.trim()],
      }));
      setRefInput("");
    }
  };

  const removeReference = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      visualReferences: prev.visualReferences.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.projectType) return;
    createMutation.mutate({
      title: form.title,
      projectType: form.projectType as "editorial" | "brand" | "publishing" | "packaging" | "motion" | "other",
      description: form.description || undefined,
      deliverables: form.deliverables.length > 0 ? form.deliverables : undefined,
      deadline: form.deadline || undefined,
      budget: form.budget as "under5k" | "5to10k" | "10to25k" | "25to50k" | "over50k" | "undisclosed" | undefined,
      rightsUsage: form.rightsUsage as "oneTime" | "limited" | "exclusive" | "fullBuyout" | "toBeDiscussed" | undefined,
      visualReferences: form.visualReferences.length > 0 ? form.visualReferences : undefined,
    });
  };

  if (submitted) {
    return (
      <section id="inquiry" className="py-16 md:py-24 border-b-[3px] border-black">
        <div className="px-6 md:px-12 lg:px-16 max-w-2xl mx-auto text-center">
          <div className="border-[3px] border-black p-12">
            <CheckCircle size={48} className="mx-auto mb-6 text-[#F9FF00]" />
            <h3 className="font-oswald text-3xl md:text-4xl font-bold uppercase tracking-[-0.02em] mb-4">
              INQUIRY RECEIVED
            </h3>
            <p className="font-inter text-sm leading-relaxed text-[#1a1a1a]/70 mb-8">
              Your acquisition inquiry has been successfully transmitted. Our art advisors
              and curators will review your submission and respond within 24 to 48 hours.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm(initialForm);
                  setStep(0);
                }}
                className="btn-brutal btn-brutal-black"
              >
                SUBMIT NEW INQUIRY
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const steps = [
    { label: "PROJECT", num: 0 },
    { label: "DETAILS", num: 1 },
    { label: "BUDGET", num: 2 },
    { label: "REVIEW", num: 3 },
  ];

  return (
    <section id="inquiry" className="border-b-[3px] border-black">
      {/* Section Header */}
      <div className="border-b-[3px] border-black px-6 md:px-12 lg:px-16 py-14">
        <span className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#FF0004] block mb-2">
          Patron Services
        </span>
        <h2 className="font-oswald text-4xl md:text-6xl font-bold uppercase tracking-[-0.03em]">
          ACQUISITION & ADVISORY
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column - Instructions */}
        <div className="lg:col-span-3 border-r-[3px] border-black border-b-[3px] lg:border-b-0 px-6 md:px-8 py-10 bg-[#fafafa]">
          <h3 className="font-oswald text-lg font-bold uppercase tracking-tight mb-4">
            INSTRUCTIONS
          </h3>
          <p className="font-inter text-xs leading-relaxed text-[#1a1a1a]/70 mb-8">
            Complete all steps to submit your acquisition or private viewing request. 
            Our curators will review your request and get back to you.
          </p>

          {/* Step indicator */}
          <div className="space-y-0">
            {steps.map((s) => (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`w-full text-left px-5 py-4 border-[3px] border-black mb-[-3px] relative transition-colors ${
                  step === s.num
                    ? "bg-[#F9FF00] z-10"
                    : step > s.num
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-white hover:bg-[#F9FF00]/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-oswald text-sm font-bold uppercase tracking-wider">
                    {s.label}
                  </span>
                  {step > s.num && <CheckCircle size={14} />}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 border-[3px] border-black p-5 bg-white">
            <h4 className="font-oswald text-xs font-bold uppercase tracking-widest mb-2">
              NEED HELP?
            </h4>
            <p className="font-inter text-[11px] leading-relaxed text-[#1a1a1a]/60">
              Contact our art advisory team directly via email or phone for questions 
              about artwork availability and private viewings.
            </p>
          </div>
        </div>

        {/* Middle Column - Form */}
        <div className="lg:col-span-6 border-r-[3px] border-black px-6 md:px-12 py-10">

          {/* Step 1: Project */}
          {step === 0 && (
            <div className="space-y-8">
              <div>
                <label className="font-oswald text-xs md:text-sm font-bold uppercase tracking-widest block mb-3">
                  Artwork Reference / Artist Title *
                </label>
                <input
                  type="text"
                  className="input-brutal py-4 px-5 text-sm md:text-base"
                  placeholder="e.g., Composition En Rouge et Bleu / Elena Vasquez"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                />
              </div>

              <div>
                <label className="font-oswald text-xs md:text-sm font-bold uppercase tracking-widest block mb-3">
                  Project Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-[3px] border-black">
                  {projectTypes.map((pt) => (
                    <button
                      key={pt.value}
                      onClick={() => setField("projectType", pt.value)}
                      className={`px-4 py-4 font-oswald text-xs md:text-sm font-bold uppercase tracking-wider border-[3px] border-black m-[-1.5px] relative transition-colors ${
                        form.projectType === pt.value
                          ? "bg-[#F9FF00] z-10"
                          : "bg-white hover:bg-[#F9FF00]/30"
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-oswald text-xs md:text-sm font-bold uppercase tracking-widest block mb-3">
                  Acquisition / curatorial description
                </label>
                <textarea
                  className="input-brutal min-h-[180px] resize-none py-4 px-5 text-sm md:text-base leading-relaxed"
                  placeholder="Describe your installation space, specific request requirements, or curatorial notes..."
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <label className="font-oswald text-xs md:text-sm font-bold uppercase tracking-widest block mb-3">
                  PATRON & GALLERY SERVICES REQUESTED
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {deliverableOptions.map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleDeliverable(d)}
                      className={`px-4 py-3 font-inter text-xs md:text-sm font-semibold border-[3px] border-black transition-colors ${
                        form.deliverables.includes(d)
                          ? "bg-[#1a1a1a] text-white"
                          : "bg-white hover:bg-[#F9FF00]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-oswald text-xs md:text-sm font-bold uppercase tracking-widest block mb-3">
                  Expected Acquisition / Delivery Date
                </label>
                <input
                  type="date"
                  className="input-brutal py-4 px-5 text-sm md:text-base"
                  value={form.deadline}
                  onChange={(e) => setField("deadline", e.target.value)}
                />
              </div>

              <div>
                <label className="font-oswald text-xs md:text-sm font-bold uppercase tracking-widest block mb-3">
                  Visual References
                </label>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    className="input-brutal flex-1 py-4 px-5 text-sm md:text-base"
                    placeholder="Paste image URL..."
                    value={refInput}
                    onChange={(e) => setRefInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addReference()}
                  />
                  <button
                    onClick={addReference}
                    className="btn-brutal btn-brutal-black px-6"
                  >
                    <ImagePlus size={18} />
                  </button>
                </div>
                {form.visualReferences.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.visualReferences.map((ref, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-[#fafafa] border-[3px] border-black px-3 py-2"
                      >
                        <span className="font-inter text-xs truncate max-w-[200px]">
                          {ref}
                        </span>
                        <button onClick={() => removeReference(i)}>
                          <X size={14} className="hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <label className="font-oswald text-xs md:text-sm font-bold uppercase tracking-widest block mb-3">
                  Art Valuation / Budget Range
                </label>
                <div className="space-y-0 border-[3px] border-black">
                  {budgetRanges.map((br) => (
                    <button
                      key={br.value}
                      onClick={() => setField("budget", br.value)}
                      className={`w-full text-left px-6 py-4 border-b-[3px] border-black last:border-b-0 font-oswald text-sm md:text-base uppercase tracking-wider transition-colors ${
                        form.budget === br.value
                          ? "bg-[#F9FF00] font-bold"
                          : "bg-white hover:bg-[#F9FF00]/30"
                      }`}
                    >
                      {br.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-oswald text-xs md:text-sm font-bold uppercase tracking-widest block mb-3">
                  Collection Intention / Acquisition Type
                </label>
                <div className="grid grid-cols-1 gap-0 border-[3px] border-black">
                  {rightsOptions.map((ro) => (
                    <button
                      key={ro.value}
                      onClick={() => setField("rightsUsage", ro.value)}
                      className={`text-left px-6 py-4 border-b-[3px] border-black last:border-b-0 font-oswald text-sm md:text-base uppercase tracking-wider transition-colors ${
                        form.rightsUsage === ro.value
                          ? "bg-[#1a1a1a] text-white font-bold"
                          : "bg-white hover:bg-[#1a1a1a]/5"
                      }`}
                    >
                      {ro.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-oswald text-xl font-bold uppercase tracking-tight mb-4">
                REVIEW YOUR INQUIRY
              </h3>
              <div className="border-[3px] border-black">
                <ReviewRow label="Title" value={form.title} />
                <ReviewRow
                  label="Type"
                  value={
                    projectTypes.find((p) => p.value === form.projectType)
                      ?.label || ""
                  }
                />
                <ReviewRow
                  label="Description"
                  value={form.description || "—"}
                />
                <ReviewRow
                  label="Deliverables"
                  value={
                    form.deliverables.length > 0
                      ? form.deliverables.join(", ")
                      : "—"
                  }
                />
                <ReviewRow label="Deadline" value={form.deadline || "—"} />
                <ReviewRow
                  label="Budget"
                  value={
                    budgetRanges.find((b) => b.value === form.budget)?.label ||
                    ""
                  }
                />
                <ReviewRow
                  label="Rights"
                  value={
                    rightsOptions.find((r) => r.value === form.rightsUsage)
                      ?.label || ""
                  }
                />
                <ReviewRow
                  label="References"
                  value={
                    form.visualReferences.length > 0
                      ? `${form.visualReferences.length} reference(s)`
                      : "—"
                  }
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className={`btn-brutal flex items-center gap-2 ${
                step === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "btn-brutal-black"
              }`}
            >
              <ArrowLeft size={16} />
              BACK
            </button>

            <div className="flex gap-3">
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="btn-brutal btn-brutal-yellow flex items-center gap-2"
                >
                  NEXT
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="btn-brutal btn-brutal-yellow flex items-center gap-2"
                >
                  <Send size={16} />
                  {createMutation.isPending
                    ? "SUBMITTING..."
                    : "SUBMIT INQUIRY"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Decorative / Info */}
        <div className="lg:col-span-3 px-6 md:px-8 py-10 bg-[#1a1a1a] text-white">
          <div className="mb-8">
            <h4 className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#F9FF00] mb-3">
              Typical Process
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#F9FF00] text-black flex items-center justify-center font-oswald text-xs font-bold flex-shrink-0">
                  24h
                </div>
                <div>
                  <p className="font-inter text-xs font-medium">
                    Inquiry Review
                  </p>
                  <p className="font-inter text-[10px] text-white/50">
                    Curators review your request and credentials
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#FF0004] text-white flex items-center justify-center font-oswald text-xs font-bold flex-shrink-0">
                  48h
                </div>
                <div>
                  <p className="font-inter text-xs font-medium">
                    Art Advisory
                  </p>
                  <p className="font-inter text-[10px] text-white/50">
                    Art advisors contact you with catalog & details
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-oswald text-xs font-bold flex-shrink-0">
                  7d
                </div>
                <div>
                  <p className="font-inter text-xs font-medium">
                    Secure Shipping
                  </p>
                  <p className="font-inter text-[10px] text-white/50">
                    Artwork released for white-glove transit
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-6">
            <h4 className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#F9FF00] mb-3">
              Contact Gallery
            </h4>
            <p className="font-inter text-xs text-white/70 leading-relaxed">
              gallery@obsidianarts.com
              <br />
              +1 (212) 555-8900
              <br />
              <br />
              256 Brutalist Ave, Floor 1
              <br />
              New York, NY 10001
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b-[3px] border-black last:border-b-0">
      <div className="w-1/3 px-6 py-4 bg-[#fafafa] border-r-[3px] border-black">
        <span className="font-oswald text-xs font-bold uppercase tracking-wider text-[#1a1a1a]/50">
          {label}
        </span>
      </div>
      <div className="w-2/3 px-6 py-4">
        <span className="font-inter text-sm md:text-base">{value}</span>
      </div>
    </div>
  );
}
