import { useState, useEffect, type ReactNode } from "react";
import { Link, NavLink, useLocation, Outlet, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Inbox,
  Users as UsersIcon,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  Loader2,
  ShieldAlert,
  Github,
} from "lucide-react";

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
  end?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: <LayoutDashboard size={16} />, end: true },
  { label: "Commissions", to: "/admin/commissions", icon: <Inbox size={16} /> },
  { label: "Messages", to: "/admin/messages", icon: <MessageSquare size={16} /> },
  { label: "Users", to: "/admin/users", icon: <UsersIcon size={16} /> },
  { label: "GitHub", to: "/admin/github", icon: <Github size={16} /> },
  { label: "Settings", to: "/admin/settings", icon: <Settings size={16} /> },
];

export default function AdminLayout() {
  const { state, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [bootChecked, setBootChecked] = useState(false);

  // Gate: only admins allowed
  useEffect(() => {
    if (state.status === "loading") return;
    if (state.status === "anonymous") {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (state.user.role !== "admin") {
      // Logged in but not admin
      return;
    }
    setBootChecked(true);
  }, [state.status, state.user, navigate, location.pathname]);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (state.status === "anonymous") {
    return null; // navigating
  }

  if (state.user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-md w-full border-[3px] border-[#FF0004] p-10 text-center">
          <ShieldAlert size={48} className="mx-auto text-[#FF0004] mb-4" />
          <h1 className="font-oswald text-3xl font-bold uppercase mb-3">
            FORBIDDEN
          </h1>
          <p className="font-inter text-sm text-[#1a1a1a]/70 mb-6">
            You are signed in as <strong>{state.user.email}</strong> which does
            not have access to the admin panel.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-brutal btn-brutal-black">
              BACK TO GALLERY
            </Link>
            <button
              onClick={() => signOut()}
              className="btn-brutal btn-brutal-yellow flex items-center gap-2"
            >
              <LogOut size={16} /> SIGN OUT
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bootChecked) return null;

  const currentPage = NAV.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] flex">
      <Sidebar onSignOut={signOut} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentPageLabel={currentPage?.label ?? "Admin"}
          userName={state.user.name}
          userEmail={state.user.email}
        />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Sidebar({ onSignOut }: { onSignOut: () => Promise<void> }) {
  return (
    <aside className="w-64 bg-[#1a1a1a] text-white border-r-[3px] border-black hidden md:flex flex-col">
      <div className="p-6 border-b-[3px] border-white/10">
        <Link to="/" className="font-oswald text-lg font-bold uppercase tracking-tight block">
          OBSIDIAN <span className="text-[#F9FF00]">ARTS</span>
        </Link>
        <span className="font-oswald text-[10px] font-bold uppercase tracking-widest text-white/40 mt-2 block">
          ADMIN CONSOLE
        </span>
      </div>
      <nav className="flex-1 py-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 font-oswald text-xs font-bold uppercase tracking-widest border-l-[6px] transition-colors ${
                isActive
                  ? "bg-[#F9FF00] text-black border-[#FF0004]"
                  : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t-[3px] border-white/10 space-y-2">
        <Link
          to="/"
          className="block text-center font-oswald text-[10px] font-bold uppercase tracking-widest py-2 border-[2px] border-white/30 hover:bg-white/10"
        >
          ← Back to Gallery
        </Link>
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 font-oswald text-[10px] font-bold uppercase tracking-widest py-2 border-[2px] border-[#FF0004] text-[#FF0004] hover:bg-[#FF0004] hover:text-white"
        >
          <LogOut size={12} /> SIGN OUT
        </button>
      </div>
    </aside>
  );
}

function TopBar({
  currentPageLabel,
  userName,
  userEmail,
}: {
  currentPageLabel: string;
  userName: string | null;
  userEmail: string | null;
}) {
  return (
    <header className="bg-white border-b-[3px] border-black sticky top-0 z-30">
      <div className="px-6 md:px-10 py-4 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1 font-oswald text-[10px] uppercase tracking-widest text-[#1a1a1a]/50">
            <span>Admin</span>
            <ChevronRight size={10} />
            <span>{currentPageLabel}</span>
          </div>
          <h1 className="font-oswald text-xl md:text-2xl font-bold uppercase tracking-tight">
            {currentPageLabel}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <div className="font-oswald text-xs font-bold uppercase">
              {userName || "Admin"}
            </div>
            <div className="font-inter text-[10px] text-[#1a1a1a]/50">
              {userEmail}
            </div>
          </div>
          <div className="w-10 h-10 border-[3px] border-black bg-[#F9FF00] flex items-center justify-center font-oswald font-bold text-sm">
            {(userName || userEmail || "A").charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
