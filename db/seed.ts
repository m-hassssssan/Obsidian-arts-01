import { getDb } from "../api/queries/connection";
import * as schema from "./schema";
import { hashPassword } from "../api/lib/password";
import { nanoid } from "nanoid";

type CommissionSeed = {
  title: string;
  projectType:
    | "editorial"
    | "brand"
    | "publishing"
    | "packaging"
    | "motion"
    | "other";
  description: string;
  deliverables: string[];
  budget:
    | "under5k"
    | "5to10k"
    | "10to25k"
    | "25to50k"
    | "over50k"
    | "undisclosed";
  rightsUsage:
    | "oneTime"
    | "limited"
    | "exclusive"
    | "fullBuyout"
    | "toBeDiscussed";
  status:
    | "draft"
    | "submitted"
    | "inReview"
    | "approved"
    | "inProgress"
    | "revision"
    | "completed"
    | "cancelled";
  notes?: string;
  deadline?: string;
  events: Array<{
    type: "statusChange" | "note" | "message" | "file" | "milestone";
    content: string;
    byAdmin?: boolean;
  }>;
  thread?: Array<{ byAdmin?: boolean; content: string }>;
};

const SEED_USERS = [
  {
    name: "Studio Admin",
    email: "admin@obsidianarts.com",
    password: "obsidian2026",
    role: "admin" as const,
    bio: "Curator-in-chief at OBSIDIAN.ARTS — Berlin & New York.",
  },
  {
    name: "Elena Vasquez",
    email: "elena@vasquez.studio",
    password: "patron2026",
    role: "user" as const,
    bio: "Collector, focused on painting & canvas acquisitions.",
  },
  {
    name: "Marcus Chen",
    email: "marcus@chen.studio",
    password: "patron2026",
    role: "user" as const,
    bio: "Generative art collector and corporate consultant.",
  },
  {
    name: "Amara Diop",
    email: "amara@diop.studio",
    password: "patron2026",
    role: "user" as const,
    bio: "Curator at the Hudson Yards institutional program.",
  },
];

const SEED_COMMISSIONS: CommissionSeed[] = [
  {
    title: "Composition En Rouge et Bleu — Private Acquisition",
    projectType: "editorial",
    description:
      "Looking to acquire a 180x180 cm Composition En Rouge et Bleu by Elena Vasquez for our new SoHo lobby installation.",
    deliverables: [
      "Framing & Mounting",
      "Professional Installation",
      "Certificate of Authenticity (COA)",
      "Insured White-Glove Shipping",
    ],
    budget: "25to50k",
    rightsUsage: "exclusive",
    status: "inReview",
    deadline: "2026-09-15",
    notes: "Client is willing to wait for the next studio release window.",
    events: [
      {
        type: "statusChange",
        content: "Commission submitted for review",
      },
      {
        type: "note",
        content: "Studio matched artwork from current inventory — confirmed availability.",
        byAdmin: true,
      },
      {
        type: "statusChange",
        content: "Status updated to inReview",
        byAdmin: true,
      },
    ],
    thread: [
      { byAdmin: true, content: "Hi Elena — we have a Vasquez piece for you. What wall orientation are you planning?" },
      { content: "Vertical, 12ft ceiling, north-facing window. Would you recommend matte or satin framing?" },
      { byAdmin: true, content: "Satin for the SoHo light. We'll send a proof rendering this week." },
    ],
  },
  {
    title: "Chrono-Pulse Kinetic Stage — Corporate HQ",
    projectType: "motion",
    description:
      "Acquisition of Chrono-Pulse Kinetic Stage for our corporate HQ atrium. Need to discuss installation logistics and power requirements.",
    deliverables: [
      "Professional Installation",
      "Custom Lighting Consultation",
      "Insured White-Glove Shipping",
    ],
    budget: "over50k",
    rightsUsage: "limited",
    status: "approved",
    deadline: "2026-08-30",
    events: [
      { type: "statusChange", content: "Commission submitted for review" },
      {
        type: "note",
        content: "Client is a returning corporate partner. Move to approved.",
        byAdmin: true,
      },
      { type: "statusChange", content: "Status updated to approved", byAdmin: true },
    ],
    thread: [
      {
        byAdmin: true,
        content: "We can ship with a 240V step-down module. Crating scheduled for August 12.",
      },
    ],
  },
  {
    title: "Structural Dissolution III — Museum Loan",
    projectType: "publishing",
    description:
      "Discussing a 6-month loan of Structural Dissolution III for our upcoming NeoMondrian exhibition.",
    deliverables: [
      "Certificate of Authenticity (COA)",
      "Insured White-Glove Shipping",
    ],
    budget: "10to25k",
    rightsUsage: "toBeDiscussed",
    status: "inProgress",
    deadline: "2026-11-01",
    events: [
      { type: "statusChange", content: "Commission submitted for review" },
      {
        type: "note",
        content: "Loan agreement drafted, sent for legal review.",
        byAdmin: true,
      },
      { type: "statusChange", content: "Status updated to inProgress", byAdmin: true },
    ],
  },
  {
    title: "Grid & Axis Monolith — Permanent Collection",
    projectType: "packaging",
    description:
      "Acquiring Grid & Axis Monolith (steel + oak, 240x80x80) for our permanent collection. Need site survey first.",
    deliverables: [
      "Professional Installation",
      "Insured White-Glove Shipping",
      "Certificate of Authenticity (COA)",
      "Custom Lighting Consultation",
    ],
    budget: "over50k",
    rightsUsage: "fullBuyout",
    status: "submitted",
    deadline: "2026-12-20",
    events: [{ type: "statusChange", content: "Commission submitted for review" }],
    thread: [
      {
        byAdmin: true,
        content: "Could you send us photos of the intended space and floor-load capacity?",
      },
    ],
  },
  {
    title: "Deconstruct Flux (Generative V) — Curatorial Notes",
    projectType: "brand",
    description:
      "Curator request: include a generative work from the Deconstruct Flux series in our Q3 catalog.",
    deliverables: ["Digital Provenance (NFT Registration)"],
    budget: "undisclosed",
    rightsUsage: "toBeDiscussed",
    status: "completed",
    deadline: "2026-07-15",
    events: [
      { type: "statusChange", content: "Commission submitted for review" },
      {
        type: "statusChange",
        content: "Status updated to inReview",
        byAdmin: true,
      },
      {
        type: "statusChange",
        content: "Status updated to approved",
        byAdmin: true,
      },
      { type: "milestone", content: "Catalog entry published", byAdmin: true },
      { type: "statusChange", content: "Status updated to completed", byAdmin: true },
    ],
  },
  {
    title: "Prism Reflection Study — Acquisition Inquiry",
    projectType: "editorial",
    description:
      "Interested in Prism Reflection Study. Please advise on archival mounting options for a south-facing room.",
    deliverables: ["Certificate of Authenticity (COA)", "Custom Lighting Consultation"],
    budget: "5to10k",
    rightsUsage: "oneTime",
    status: "draft",
    events: [],
  },
  {
    title: "Yuki Tanaka — Group Showing 2026",
    projectType: "other",
    description:
      "General inquiry about including Yuki Tanaka in our late-summer group show.",
    deliverables: ["Framing & Mounting"],
    budget: "10to25k",
    rightsUsage: "limited",
    status: "revision",
    deadline: "2026-08-01",
    events: [
      { type: "statusChange", content: "Commission submitted for review" },
      {
        type: "note",
        content: "Need to confirm which two works from the Tanaka studio will be released.",
        byAdmin: true,
      },
      { type: "statusChange", content: "Status updated to revision", byAdmin: true },
    ],
  },
];

async function seed() {
  const db = getDb();
  console.log("Seeding database…");

  // Wipe in dependency order
  await db.delete(schema.commissionEvents);
  await db.delete(schema.messages);
  await db.delete(schema.commissions);
  await db.delete(schema.users);

  // Users
  const userIds: number[] = [];
  for (const u of SEED_USERS) {
    const passwordHash = await hashPassword(u.password);
    const unionId = `local-${nanoid(16)}`;
    const [result] = await db.insert(schema.users).values({
      name: u.name,
      email: u.email,
      passwordHash,
      unionId,
      role: u.role,
      bio: u.bio,
      status: "active",
    });
    userIds.push(Number(result.insertId));
    console.log(`  ✓ user: ${u.email} (${u.role})`);
  }
  const adminId = userIds[0];

  // Commissions
  let i = 0;
  for (const c of SEED_COMMISSIONS) {
    const userId = userIds[1 + (i % (userIds.length - 1))]; // skip admin
    const [result] = await db.insert(schema.commissions).values({
      userId,
      title: c.title,
      projectType: c.projectType,
      description: c.description,
      deliverables: c.deliverables,
      budget: c.budget,
      rightsUsage: c.rightsUsage,
      status: c.status,
      notes: c.notes ?? null,
      deadline: c.deadline ? new Date(c.deadline) : null,
    });
    const commissionId = Number(result.insertId);

    for (const ev of c.events) {
      await db.insert(schema.commissionEvents).values({
        commissionId,
        type: ev.type,
        content: ev.content,
        createdBy: ev.byAdmin ? adminId : userId,
      });
    }
    for (const m of c.thread ?? []) {
      await db.insert(schema.messages).values({
        commissionId,
        userId: m.byAdmin ? adminId : userId,
        content: m.content,
        isStaffReply: !!m.byAdmin,
      });
    }
    console.log(`  ✓ commission: ${c.title} (${c.status})`);
    i++;
  }

  // Sample direct-to-admin thread
  await db.insert(schema.messages).values({
    commissionId: null,
    userId: userIds[1],
    content:
      "Hi! Quick question — do you ship to Switzerland? Looking at the Chrono-Pulse piece for our Geneva office.",
    isStaffReply: false,
  });
  await db.insert(schema.messages).values({
    commissionId: null,
    userId: adminId,
    content:
      "Yes — we have a Geneva routing partner. We'll send white-glove shipping quotes by tomorrow.",
    isStaffReply: true,
  });

  console.log("Done.");
  console.log("\nLogin credentials:");
  console.log("  admin: admin@obsidianarts.com / obsidian2026");
  console.log("  user:  elena@vasquez.studio / patron2026");
  console.log("  user:  marcus@chen.studio / patron2026");
  console.log("  user:  amara@diop.studio / patron2026");
  // The pool will be closed by the process exit
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
