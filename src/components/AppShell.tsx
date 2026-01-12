import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AppShellProps = {
  children: ReactNode;
};

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Converter', to: '/#convert' },
  { label: 'Apps', to: '/#apps' },
  { label: 'Labs', to: '/#labs' },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            ET
          </span>
          <span className="brand-text">Edoli Web Tools</span>
        </Link>
        <nav className="app-nav">
          {navLinks.map(link => (
            <a key={link.label} href={link.to} className="app-nav__link">
              {link.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
