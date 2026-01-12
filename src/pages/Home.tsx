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
          <p className="hero-subtitle">
            빠른 웹 툴을 한 곳에 모아 작업을 덜 끊기게 정리했어요. 변환, 분석, 실험까지
            전부 로컬에서 처리합니다.
          </p>
        </div>
        <div className="hero-panel">
          <div className="hero-panel__title">Unified Theme</div>
          <p className="hero-panel__body">
            모든 툴을 동일한 타이포, 컬러, 간격 시스템으로 묶어서 UI를 일관되게 유지합니다.
          </p>
          <div className="hero-panel__chips">
            <span className="chip">React + TS</span>
            <span className="chip">Modular UI</span>
            <span className="chip">Local-first</span>
          </div>
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
                      {tool.status === 'planned' ? (
                        <Badge tone="muted">Planned</Badge>
                      ) : (
                        <Badge tone="accent">Ready</Badge>
                      )}
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
