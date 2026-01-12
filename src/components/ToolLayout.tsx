import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card';

type ToolLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  badge?: string;
};

export function ToolLayout({ title, description, children, badge }: ToolLayoutProps) {
  return (
    <section className="tool-page">
      <div className="tool-header">
        <Link to="/" className="tool-back">
          ← Back to tools
        </Link>
        <div className="tool-title-row">
          <h1 className="tool-title">{title}</h1>
          {badge ? <span className="tool-badge">{badge}</span> : null}
        </div>
        {description ? <p className="tool-subtitle">{description}</p> : null}
      </div>
      <Card className="tool-card">{children}</Card>
    </section>
  );
}
