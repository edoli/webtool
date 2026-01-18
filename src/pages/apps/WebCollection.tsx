import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Button } from '../../components/Button';
import { FullToolLayout } from '../../components/FullToolLayout';

type LinkItem = {
  id: number;
  title: string;
  url: string;
};

export function WebCollection() {
  const [links, setLinks] = useState<LinkItem[]>(() => loadLinksFromHash());
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState('');
  const [openedIds, setOpenedIds] = useState<number[]>([]);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  useEffect(() => {
    saveLinksToHash(links);
  }, [links]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const nextLinks = loadLinksFromHash();
      if (JSON.stringify(nextLinks) !== JSON.stringify(links)) {
        setLinks(nextLinks);
      }
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [links]);

  const activeLink = useMemo(() => links.find(link => link.id === activeId) ?? null, [activeId, links]);

  const addLink = useCallback(async () => {
    if (!urlInput.trim()) {
      return;
    }

    let url = urlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    let title = titleInput.trim();
    if (!title) {
      setStatus('Fetching title...');
      try {
        title = await fetchPageTitle(url);
      } catch (error) {
        console.warn(error);
        title = new URL(url).hostname;
      }
    }

    const newLink: LinkItem = {
      id: Date.now(),
      title,
      url,
    };

    setLinks(prev => [...prev, newLink]);
    setTitleInput('');
    setUrlInput('');
    setStatus('Added');
    setTimeout(() => setStatus(''), 1500);
  }, [titleInput, urlInput]);

  const deleteLink = useCallback(
    (id: number) => {
      if (!window.confirm('이 링크를 삭제하시겠습니까?')) {
        return;
      }
      setLinks(prev => prev.filter(link => link.id !== id));
      setOpenedIds(prev => prev.filter(opened => opened !== id));
      if (activeId === id) {
        setActiveId(null);
      }
    },
    [activeId]
  );

  const handleSelect = useCallback((link: LinkItem) => {
    setActiveId(link.id);
    setOpenedIds(prev => (prev.includes(link.id) ? prev : [...prev, link.id]));
  }, []);

  const handleDragStart = useCallback((event: DragEvent<HTMLDivElement>, index: number) => {
    dragIndexRef.current = index;
    setDragSourceIndex(index);
    setDropIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOverList = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (dragSourceIndex === null) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setDropIndex(links.length);
    },
    [dragSourceIndex, links.length]
  );

  const handleDragOverItem = useCallback((event: DragEvent<HTMLDivElement>, index: number) => {
    if (dragSourceIndex === null) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const rect = event.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const nextIndex = event.clientY < midpoint ? index : index + 1;
    setDropIndex(nextIndex);
  }, [dragSourceIndex]);

  const commitDrop = useCallback((targetIndex: number) => {
    const sourceIndex = dragIndexRef.current;
    if (sourceIndex === null || sourceIndex === targetIndex) {
      return;
    }
    setLinks(prev => {
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      if (!moved) {
        return prev;
      }
      const adjustedIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(adjustedIndex, 0, moved);
      return next;
    });
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>, targetIndex: number) => {
    event.preventDefault();
    const resolvedIndex = dropIndex ?? targetIndex;
    commitDrop(resolvedIndex);
    dragIndexRef.current = null;
    setDragSourceIndex(null);
    setDropIndex(null);
  }, [commitDrop, dropIndex]);

  const handleDropAtEnd = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (dragSourceIndex === null) {
      return;
    }
    const resolvedIndex = dropIndex ?? links.length;
    commitDrop(resolvedIndex);
    dragIndexRef.current = null;
    setDragSourceIndex(null);
    setDropIndex(null);
  }, [commitDrop, dragSourceIndex, dropIndex, links.length]);

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDragSourceIndex(null);
    setDropIndex(null);
  }, []);

  return (
    <FullToolLayout title="Web Collection" description="Save and open favorite web pages." badge="Apps" hideHeader>
      <div className={`web-collection${sidebarOpen ? '' : ' web-collection--collapsed'}`}>
        <div className="web-sidebar" style={{ display: sidebarOpen ? 'grid' : 'none' }}>
          <div>
            <h3>웹페이지 컬렉션</h3>
            <p className="muted">링크를 추가하고 바로 열어보세요.</p>
          </div>
          <div className="stack">
            <input
              type="text"
              placeholder="제목 (비워두면 자동)"
              value={titleInput}
              onChange={event => setTitleInput(event.target.value)}
            />
            <input
              type="url"
              placeholder="https://..."
              value={urlInput}
              onChange={event => setUrlInput(event.target.value)}
            />
            <Button onClick={addLink}>링크 추가</Button>
            <div className="web-status" aria-live="polite">
              {status ? <div className="message-box">{status}</div> : null}
            </div>
          </div>
          <div className="web-links" onDragOver={handleDragOverList} onDrop={handleDropAtEnd}>
            {links.length === 0 ? (
              <div className="muted">아직 추가된 링크가 없습니다.</div>
            ) : (
              links.map((link, index) => {
                const isDropBefore = dragSourceIndex !== null && dropIndex === index;
                const isDropAfter = dragSourceIndex !== null && dropIndex === index + 1;
                const isDragSource = dragSourceIndex === index;
                return (
                  <div
                    key={link.id}
                    className={`web-link ${activeId === link.id ? 'active' : ''} ${isDragSource ? 'drag-source' : ''} ${isDropBefore ? 'drop-before' : ''} ${isDropAfter ? 'drop-after' : ''}`}
                    draggable
                    onDragStart={event => handleDragStart(event, index)}
                    onDragOver={event => handleDragOverItem(event, index)}
                    onDrop={event => handleDrop(event, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div style={{ flex: 1 }} onClick={() => handleSelect(link)}>
                      <div className="web-link-title">{link.title}</div>
                      <div className="web-link-url">{link.url}</div>
                    </div>
                    <Button variant="ghost" onClick={() => deleteLink(link.id)}>
                      Remove
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="web-viewer">
          <div className="web-header">
            <Button variant="outline" onClick={() => setSidebarOpen(prev => !prev)}>
              {sidebarOpen ? 'Hide Menu' : 'Show Menu'}
            </Button>
            <div className="muted" style={{ flex: 1 }}>
              {activeLink ? activeLink.url : '링크를 선택하세요'}
            </div>
          </div>
          {activeLink ? (
            openedIds.map(id => {
              const link = links.find(item => item.id === id);
              if (!link) {
                return null;
              }
              return (
                <iframe
                  key={link.id}
                  src={link.url}
                  title={link.title}
                  className="web-frame"
                  style={{ display: activeId === link.id ? 'block' : 'none' }}
                />
              );
            })
          ) : (
            <div className="message-box" style={{ margin: 'auto' }}>
              즐겨찾는 링크를 추가해서 바로 열어보세요.
            </div>
          )}
        </div>
      </div>
    </FullToolLayout>
  );
}

function loadLinksFromHash(): LinkItem[] {
  try {
    const hash = window.location.hash.substring(1);
    if (!hash) {
      return [];
    }
    const decoded = decodeURIComponent(hash);
    const json = decodeURIComponent(escape(atob(decoded)));
    return JSON.parse(json) as LinkItem[];
  } catch {
    return [];
  }
}

function saveLinksToHash(links: LinkItem[]) {
  try {
    const json = JSON.stringify(links);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    window.location.hash = encodeURIComponent(encoded);
  } catch (error) {
    console.error('Failed to save links to URL', error);
  }
}

async function fetchPageTitle(url: string) {
  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch title');
  }
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const title = doc.querySelector('title');
  if (title?.textContent?.trim()) {
    return title.textContent.trim();
  }
  return new URL(url).hostname;
}
