import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card';

type ToolLayoutProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  badge?: string;
  extend?: boolean;
};

export function ToolLayout({ title, description, children, badge, extend }: ToolLayoutProps) {
  const sectionClass = extend ? 'tool-page tool-page--extend' : 'tool-page tool-page--compact';
  return (
    <section className={sectionClass}>
      <div className="tool-header">
        <Link to="/" className="tool-back">
          ← Back to tools
        </Link>
        {
          title ? (
            <div className="tool-title-row">
              <h1 className="tool-title">{title}</h1>
              {badge ? <span className="tool-badge">{badge}</span> : null}
            </div>
          ) : null
        }
        {description ? <p className="tool-subtitle">{description}</p> : null}
      </div>
      <Card className="tool-card">{children}</Card>
    </section>
  );
}
