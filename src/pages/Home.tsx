import { Link } from 'react-router-dom';
import { toolCategories, tools } from '../data/tools';

export function Home() {
  return (
    <div className="page home-page">
      <section className="home-panel">
        <header className="home-header">
          <h1 className="home-title">Edoli Web Tools</h1>
        </header>

        {Object.entries(toolCategories).map(([key, category]) => {
          const categoryKey = key as keyof typeof toolCategories;
          const categoryTools = tools.filter(tool => tool.category === categoryKey);
          return (
            <section key={categoryKey} id={categoryKey} className="tool-section home-section">
              <div className="section-header">
                <h2 className="section-title">{category.label}</h2>
                <span className="section-count">{categoryTools.length}</span>
              </div>
              <div className="tool-button-grid">
                {categoryTools.map(tool => (
                  <Link key={tool.id} to={tool.path} className="tool-button">
                    <span className="tool-button__title">{tool.title}</span>
                    <span className="tool-button__desc">{tool.description}</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}
