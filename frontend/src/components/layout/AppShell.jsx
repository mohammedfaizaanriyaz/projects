import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ activePage, onNavigate, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const sidebarRef = useRef(null);
  const opener = useRef(null);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 900px)");
    const change = () => { setIsMobile(query.matches); if (!query.matches) setMobileOpen(false); };
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!mobileOpen || !isMobile) return;
    const previous = opener.current || document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () => [...sidebarRef.current.querySelectorAll("button:not(:disabled), select, a[href]")].filter((element) => element.getClientRects().length);
    // Wait until the browser applies the removed inert state before focusing.
    const focusFrame = requestAnimationFrame(() => controls()[0]?.focus({ preventScroll: true }));
    const handleKey = (event) => {
      if (event.key === "Escape") { event.preventDefault(); setMobileOpen(false); }
      if (event.key === "Tab") {
        const items = controls();
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      requestAnimationFrame(() => {
        if (previous?.isConnected && !previous.closest("[inert]")) previous.focus({ preventScroll: true });
      });
    };
  }, [mobileOpen, isMobile]);
  return (
    <div className="app-shell">
      <div className="space-texture" /><div className="grid-texture" />
      <div className="aurora aurora--one" /><div className="aurora aurora--two" />
      <Sidebar sidebarRef={sidebarRef} isMobile={isMobile} activePage={activePage} onNavigate={onNavigate}
        mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <main className="main-shell" inert={isMobile && mobileOpen}>
        <Topbar opener={opener} mobileOpen={mobileOpen} onOpenMobile={() => setMobileOpen(true)} onNavigate={onNavigate} />
        <div className="main-content">{children}</div>
      </main>
    </div>
  );
}
