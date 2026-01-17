import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card';

export type ToolLayoutProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  badge?: string;
  extend?: boolean;
  layout?: 'compact' | 'extend' | 'full';
};

export function ToolLayout({ title, description, children, badge, extend, layout }: ToolLayoutProps) {
  const resolvedLayout = layout ?? (extend ? 'extend' : 'compact');
  const sectionClass = `tool-page tool-page--${resolvedLayout}`;
  const headerClass = resolvedLayout === 'full' ? 'tool-header tool-header--full' : 'tool-header';
  const cardClass = resolvedLayout === 'full' ? 'tool-card tool-card--full' : 'tool-card';
  const showCard = resolvedLayout !== 'full';
  return (
    <section className={sectionClass}>
      <div className={headerClass}>
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
      {showCard ? <Card className={cardClass}>{children}</Card> : <div className={cardClass}>{children}</div>}
    </section>
  );
}
