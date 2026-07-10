"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { GovEmblem } from "@/components/GovEmblem";
import { WalletButton } from "@/components/WalletButton";
import { cn } from "@/lib/utils";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/verify", label: "Verify" },
];

const CITIZEN_LINKS = [
  { href: "/portal/parcels", label: "My Parcels" },
  { href: "/portal/transfer", label: "Transfer" },
  { href: "/portal/approvals", label: "Approvals" },
];

const REGISTRAR_LINKS = [
  { href: "/dashboard", label: "Fraud War-Room" },
  { href: "/dashboard/register", label: "Register Parcel" },
  { href: "/dashboard/transfers", label: "Transfer Queue" },
];

const ADMIN_LINKS = [{ href: "/admin", label: "Admin" }];

const PORTAL_GROUPS = [
  { label: "Citizen Portal", links: CITIZEN_LINKS },
  { label: "Registrar", links: REGISTRAR_LINKS },
  { label: "Administration", links: ADMIN_LINKS },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const portalActive = PORTAL_GROUPS.some((g) => g.links.some((l) => isActive(l.href)));

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="gov-topbar">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Government of India</span>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="font-hindi hidden md:inline">भारत सरकार</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#main-content" className="hover:text-gov-saffron transition-colors">
              Skip to main content
            </a>
            <span className="text-white/40 hidden sm:inline">|</span>
            <button className="hover:text-gov-saffron transition-colors hidden sm:inline">
              English
            </button>
            <span className="text-white/40 hidden sm:inline">|</span>
            <button className="font-hindi hover:text-gov-saffron transition-colors hidden sm:inline">
              हिंदी
            </button>
          </div>
        </div>
      </div>

      <div className="tricolor-stripe" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="gov-header-band">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <GovEmblem className="w-14 h-14 shrink-0" />
          <div>
            <Link href="/" className="block">
              <h1 className="text-xl md:text-2xl font-bold text-gov-navy leading-tight">
                Bhoomi<span className="text-gov-blue">Chain</span>
              </h1>
            </Link>
            <p className="text-xs md:text-sm text-gov-muted mt-0.5">
              One Nation, One Land Ledger — Digital India Hackathon
            </p>
            <p className="font-hindi text-xs text-gov-muted hidden sm:block">
              एक राष्ट्र, एक भूमि खाता
            </p>
          </div>
          <div className="ml-auto hidden lg:flex items-center gap-3">
            <WalletButton />
            <div className="text-right text-xs text-gov-muted">
              <p className="font-semibold text-gov-navy">Digital India Initiative</p>
              <p>Ministry of Rural Development</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="gov-nav-band" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="hidden lg:flex items-center">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn("gov-nav-link", isActive(link.href) && "gov-nav-link-active")}
              >
                {link.label}
              </Link>
            ))}

            <div className="relative">
              <button
                onClick={() => setPortalsOpen(!portalsOpen)}
                className={cn(
                  "gov-nav-link flex items-center gap-1",
                  portalActive && "gov-nav-link-active"
                )}
              >
                Portals <ChevronDown className="w-4 h-4" />
              </button>
              {portalsOpen && (
                <div className="absolute top-full left-0 mt-0 bg-white border border-gov-border rounded-card shadow-lg py-2 min-w-[220px] z-50">
                  {PORTAL_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gov-muted">
                        {group.label}
                      </p>
                      {group.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setPortalsOpen(false)}
                          className={cn(
                            "block px-4 py-2 text-sm text-gov-text hover:bg-gov-blue-light hover:text-gov-blue",
                            isActive(link.href) && "bg-gov-blue-light text-gov-blue font-semibold"
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Link href="/verify" className="hidden lg:inline-flex gov-btn-saffron text-sm my-2">
            Verify Parcel
          </Link>

          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-white/20 px-4 py-3 space-y-1">
            {[...PUBLIC_LINKS, ...CITIZEN_LINKS, ...REGISTRAR_LINKS, ...ADMIN_LINKS].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-btn text-sm",
                  isActive(link.href) ? "bg-white/15 font-semibold" : "hover:bg-white/10"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/verify"
              onClick={() => setOpen(false)}
              className="block mt-2 gov-btn-saffron text-center"
            >
              Verify Parcel
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
