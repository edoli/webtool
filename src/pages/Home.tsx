import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toolCategories, tools, type Tool } from '../data/tools';

const FAVORITES_STORAGE_KEY = 'webtool.favoriteToolIds';

function readFavoriteToolIds() {
  try {
    const value = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function ToolButton({
  tool,
  isFavorite,
  onToggleFavorite,
}: {
  tool: Tool;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
}) {
  return (
    <div className="tool-button-card">
      <Link to={tool.path} className="tool-button-card__link">
        <span className="tool-button__content">
          <span className="tool-button__title">
            <span className="tool-button__icon material-symbols-rounded" aria-hidden="true">
              {tool.icon}
            </span>
            <span>{tool.title}</span>
          </span>
          <span className="tool-button__desc">{tool.description}</span>
        </span>
      </Link>
      <button
        type="button"
        className="tool-favorite-button material-symbols-rounded"
        aria-label={isFavorite ? `${tool.title} remove from favorites` : `${tool.title} add to favorites`}
        aria-pressed={isFavorite}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        onClick={() => onToggleFavorite(tool.id)}
      >
        star
      </button>
    </div>
  );
}

export function Home() {
  const [favoriteToolIds, setFavoriteToolIds] = useState(readFavoriteToolIds);
  const favoriteToolIdSet = useMemo(() => new Set(favoriteToolIds), [favoriteToolIds]);
  const favoriteTools = useMemo(
    () => tools.filter(tool => favoriteToolIdSet.has(tool.id)),
    [favoriteToolIdSet],
  );

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteToolIds));
  }, [favoriteToolIds]);

  const toggleFavorite = (toolId: string) => {
    setFavoriteToolIds(current =>
      current.includes(toolId) ? current.filter(id => id !== toolId) : [...current, toolId],
    );
  };

  return (
    <div className="page home-page">
      <section className="home-panel">
        <header className="home-header">
          <h1 className="home-title">Edoli Web Tools</h1>
        </header>

        {favoriteTools.length > 0 && (
          <section id="favorites" className="tool-section home-section favorites-section">
            <div className="section-header">
              <h2 className="section-title">Favorites</h2>
              <span className="section-count">{favoriteTools.length}</span>
            </div>
            <div className="tool-button-grid">
              {favoriteTools.map(tool => (
                <ToolButton
                  key={tool.id}
                  tool={tool}
                  isFavorite={favoriteToolIdSet.has(tool.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </section>
        )}

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
                  <ToolButton
                    key={tool.id}
                    tool={tool}
                    isFavorite={favoriteToolIdSet.has(tool.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}
