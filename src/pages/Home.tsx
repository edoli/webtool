import { Link } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { toolCategories, tools } from '../data/tools';

export function Home() {
  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="hero-kicker">Toolbox</p>
          <h1 className="hero-title">
            Keep every utility in one
            <span className="hero-accent"> focused workspace.</span>
          </h1>
        </div>
      </section>

      {Object.entries(toolCategories).map(([key, category]) => {
        const categoryKey = key as keyof typeof toolCategories;
        const categoryTools = tools.filter(tool => tool.category === categoryKey);
        return (
          <section key={categoryKey} id={categoryKey} className="tool-section">
            <div className="section-header">
              <div>
                <h2>{category.label}</h2>
                <p className="muted">{category.blurb}</p>
              </div>
              <Badge tone="accent">{categoryTools.length} tools</Badge>
            </div>
            <div className="card-grid">
              {categoryTools.map(tool => (
                <Link key={tool.id} to={tool.path} className="card-link">
                  <Card className="tool-card__tile">
                    <div className="tool-card__head">
                      <h3>{tool.title}</h3>
                    </div>
                    <p className="muted">{tool.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
