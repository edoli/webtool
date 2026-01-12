const inFlight = new Map<string, Promise<void>>();

export function loadScriptOnce(url: string) {
  if (inFlight.has(url)) {
    return inFlight.get(url) as Promise<void>;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.body.appendChild(script);
  });

  inFlight.set(url, promise);
  return promise;
}
