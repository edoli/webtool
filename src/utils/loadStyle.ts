const loaded = new Map<string, Promise<void>>();

export function loadStyleOnce(url: string) {
  if (loaded.has(url)) {
    return loaded.get(url) as Promise<void>;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(link);
  });

  loaded.set(url, promise);
  return promise;
}
