export interface LinkEntry {
  url: string;
  type: 'image' | 'weblink' | 'form';
}

export function extractLinks(allBlocks: any[]): LinkEntry[] {
  const seen = new Set<string>();
  const links: LinkEntry[] = [];

  function add(url: string, type: LinkEntry['type']) {
    const u = url?.trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    links.push({ url: u, type });
  }

  for (const block of allBlocks) {
    if (block.InfoType === 'Images') {
      for (const img of block.Images ?? []) {
        if (img.InfoImageValue) add(img.InfoImageValue, 'image');
      }
    }
    if (block.InfoType === 'Cta') {
      const attrs = block.CtaAttributes ?? {};
      if (attrs.CtaButtonImgUrl) add(attrs.CtaButtonImgUrl, 'image');
      if (attrs.CtaType === 'Weblink' && attrs.CtaAction) add(attrs.CtaAction, 'weblink');
      if (attrs.CtaType === 'Form' && attrs.CtaAction) add(attrs.CtaAction, 'form');
    }
  }

  return links;
}

function checkImage(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(false), 10000);
    const img = new Image();
    img.onload = () => { clearTimeout(timer); resolve(true); };
    img.onerror = () => { clearTimeout(timer); resolve(false); };
    img.src = url;
  });
}

async function checkUrl(url: string): Promise<boolean> {
  const c1 = new AbortController();
  const t1 = setTimeout(() => c1.abort(), 8000);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: c1.signal });
    clearTimeout(t1);
    return res.ok;
  } catch (e) {
    clearTimeout(t1);
    if ((e as DOMException)?.name === 'AbortError') return false;
    // CORS error — try no-cors GET to distinguish from unreachable
    const c2 = new AbortController();
    const t2 = setTimeout(() => c2.abort(), 8000);
    try {
      await fetch(url, { mode: 'no-cors', signal: c2.signal });
      clearTimeout(t2);
      return true; // opaque but reachable
    } catch {
      clearTimeout(t2);
      return false;
    }
  }
}

export function checkLink({ url, type }: LinkEntry): Promise<boolean> {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return Promise.resolve(false);
  return type === 'image' ? checkImage(url) : checkUrl(url);
}
