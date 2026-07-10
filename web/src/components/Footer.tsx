import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gov-navy text-white mt-auto">
      <div className="tricolor-stripe" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <p className="text-gov-saffron text-xs font-semibold uppercase tracking-wide mb-3">
              Citizen Portal
            </p>
            {[
              { label: "Verify Parcel", href: "/verify" },
              { label: "My Parcels", href: "/portal/parcels" },
              { label: "Initiate Transfer", href: "/portal/transfer" },
              { label: "Buyer Approvals", href: "/portal/approvals" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block text-white/70 hover:text-white py-1 text-sm transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="text-gov-saffron text-xs font-semibold uppercase tracking-wide mb-3">
              Registrar & Admin
            </p>
            {[
              { label: "Fraud War-Room", href: "/dashboard" },
              { label: "Register Parcel", href: "/dashboard/register" },
              { label: "Transfer Queue", href: "/dashboard/transfers" },
              { label: "Admin Panel", href: "/admin" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block text-white/70 hover:text-white py-1 text-sm transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="text-gov-saffron text-xs font-semibold uppercase tracking-wide mb-3">
              Related Links
            </p>
            {[
              { label: "Digital India", href: "https://www.digitalindia.gov.in" },
              { label: "DILRMP", href: "https://dilrmp.gov.in" },
              { label: "India.gov.in", href: "https://www.india.gov.in" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-white/70 hover:text-white py-1 text-sm transition-colors"
              >
                {l.label}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>

          <div>
            <p className="text-gov-saffron text-xs font-semibold uppercase tracking-wide mb-3">
              Contact & Support
            </p>
            <p className="text-white/70 text-sm">support@bhuraksha.gov.in</p>
            <p className="text-white/70 text-sm mt-2">Helpline: 1800-XXX-XXXX</p>
            <p className="text-white/50 text-xs mt-4 leading-relaxed">
              BhuRaksha provides a tamper-evident blockchain land registry layer.
              On-chain records are the source of truth for ownership.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between gap-4 text-xs text-white/50">
          <p>© 2026 BhuRaksha. Digital India Hackathon demo. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Use</span>
            <span>Accessibility</span>
          </div>
        </div>

        <p className="mt-4 text-[10px] text-white/40 leading-relaxed">
          Disclaimer: Demonstration platform for the Digital India Hackathon.
          Data shown may be simulated. Official land records are maintained by State Revenue Departments.
        </p>
      </div>
    </footer>
  );
}
