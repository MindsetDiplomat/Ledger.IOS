import { Link } from "@tanstack/react-router";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/ledger" className="font-display text-sm tracking-wide text-foreground">
          L E D G E R
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="https://whop.com/joined/mind-management-academy-hq/products/ledger-82/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-gradient-bronze px-4 py-2 text-sm font-medium text-bronze-foreground shadow-elegant transition hover:brightness-110"
        >
          Start audit
        </a>
      </div>
    </header>
  );
}
