"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "./LanguageContext";

const CACHE_KEY = "delta-translations-th-en-v2";
const SKIP_TEXT_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PRE", "CODE"]);
const SKIP_CLASSES = ["katex", "katex-display", "notranslate"];
const BATCH_SIZE = 5;

function isThai(text: string) {
  return /[\u0E00-\u0E7F]/.test(text);
}

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function readCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, string>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Translation remains usable for the current session.
  }
}

async function translateText(text: string) {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "th",
    tl: "en",
    dt: "t",
    q: text,
  });

  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
    { cache: "force-cache" },
  );

  if (!response.ok) throw new Error("Translation failed");

  const data: unknown = await response.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Invalid translation response");
  }

  return data[0]
    .filter((part): part is unknown[] => Array.isArray(part))
    .map((part) => (typeof part[0] === "string" ? part[0] : ""))
    .join("");
}

function shouldSkip(node: Text) {
  let parent = node.parentElement;
  while (parent) {
    if (SKIP_TEXT_TAGS.has(parent.tagName)) return true;
    if (SKIP_CLASSES.some((name) => parent.classList.contains(name))) return true;
    if (parent.closest("[data-no-translate='true']")) return true;
    parent = parent.parentElement;
  }
  return false;
}

function collectTextNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();

  while (current) {
    const node = current as Text;
    const value = normalize(node.nodeValue ?? "");

    if (value && isThai(value) && !shouldSkip(node)) {
      nodes.push(node);
    }

    current = walker.nextNode();
  }

  return nodes;
}

function collectAttributes(root: HTMLElement) {
  const elements = Array.from(root.querySelectorAll<HTMLElement>("[placeholder], [title], [aria-label]"));
  const result: Array<{ element: HTMLElement; attribute: "placeholder" | "title" | "aria-label"; source: string }> = [];

  for (const element of elements) {
    if (element.closest("[data-no-translate='true']")) continue;
    if (SKIP_TEXT_TAGS.has(element.tagName)) continue;

    for (const attribute of ["placeholder", "title", "aria-label"] as const) {
      const value = element.getAttribute(attribute);
      if (value && isThai(normalize(value))) {
        result.push({ element, attribute, source: normalize(value) });
      }
    }
  }

  return result;
}

async function translateRoot(root: HTMLElement) {
  const cache = readCache();
  const textNodes = collectTextNodes(root);
  const attributes = collectAttributes(root);
  const entries = new Map<string, { textNodes: Text[]; attributes: Array<{ element: HTMLElement; attribute: "placeholder" | "title" | "aria-label" }> }>();

  for (const node of textNodes) {
    const source = normalize(node.nodeValue ?? "");
    if (!source) continue;
    const entry = entries.get(source) ?? { textNodes: [], attributes: [] };
    entry.textNodes.push(node);
    entries.set(source, entry);
  }

  for (const item of attributes) {
    const entry = entries.get(item.source) ?? { textNodes: [], attributes: [] };
    entry.attributes.push({ element: item.element, attribute: item.attribute });
    entries.set(item.source, entry);
  }

  const all = [...entries.entries()];

  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    const batch = all.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async ([source, targets]) => {
        let translated = cache[source];

        if (!translated) {
          try {
            translated = await translateText(source);
            if (translated) {
              cache[source] = translated;
              writeCache(cache);
            }
          } catch {
            return;
          }
        }

        if (!translated) return;

        for (const node of targets.textNodes) {
          if (!node.isConnected) continue;
          const original = node.nodeValue ?? "";
          const leading = original.match(/^\s*/)?.[0] ?? "";
          const trailing = original.match(/\s*$/)?.[0] ?? "";
          node.nodeValue = `${leading}${translated}${trailing}`;
        }

        for (const target of targets.attributes) {
          if (target.element.isConnected) {
            target.element.setAttribute(target.attribute, translated);
          }
        }
      }),
    );
  }
}

function restore(
  root: HTMLElement,
  originals: Map<Text, string>,
  attributeOriginals: Map<HTMLElement, Map<"placeholder" | "title" | "aria-label", string>>,
) {
  for (const [node, value] of originals) {
    if (node.isConnected && root.contains(node)) node.nodeValue = value;
  }

  for (const [element, attributes] of attributeOriginals) {
    if (!element.isConnected || !root.contains(element)) continue;
    for (const [attribute, value] of attributes) {
      element.setAttribute(attribute, value);
    }
  }
}

export function LanguageLayer({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const originalsRef = useRef(new Map<Text, string>());
  const attributeOriginalsRef = useRef(
    new Map<HTMLElement, Map<"placeholder" | "title" | "aria-label", string>>(),
  );
  const runRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const run = ++runRef.current;

    if (language === "th") {
      restore(root, originalsRef.current, attributeOriginalsRef.current);
      const originalTitle = document.documentElement.dataset.deltaOriginalTitle;
      if (originalTitle) document.title = originalTitle;
      return;
    }

    const textNodes = collectTextNodes(root);
    for (const node of textNodes) {
      if (!originalsRef.current.has(node)) {
        originalsRef.current.set(node, node.nodeValue ?? "");
      }
    }

    const elements = collectAttributes(root);
    for (const item of elements) {
      const attributes = attributeOriginalsRef.current.get(item.element) ?? new Map();
      if (!attributes.has(item.attribute)) {
        attributes.set(item.attribute, item.element.getAttribute(item.attribute) ?? "");
      }
      attributeOriginalsRef.current.set(item.element, attributes);
    }

    let cancelled = false;

    const originalTitle = document.documentElement.dataset.deltaOriginalTitle ?? document.title;
    document.documentElement.dataset.deltaOriginalTitle = originalTitle;

    void translateText(originalTitle).then((translatedTitle) => {
      if (!cancelled && run === runRef.current && translatedTitle) {
        document.title = translatedTitle;
      }
    }).catch(() => {
      // Keep the original document title if translation is unavailable.
    });

    void translateRoot(root).then(() => {
      if (cancelled || run !== runRef.current) return;
    });

    const observer = new MutationObserver(() => {
      if (cancelled || run !== runRef.current) return;

      const addedTextNodes = collectTextNodes(root);
      for (const node of addedTextNodes) {
        if (!originalsRef.current.has(node)) {
          originalsRef.current.set(node, node.nodeValue ?? "");
        }
      }

      const addedAttributes = collectAttributes(root);
      for (const item of addedAttributes) {
        const attributes = attributeOriginalsRef.current.get(item.element) ?? new Map();
        if (!attributes.has(item.attribute)) {
          attributes.set(item.attribute, item.element.getAttribute(item.attribute) ?? "");
        }
        attributeOriginalsRef.current.set(item.element, attributes);
      }

      void translateRoot(root);
    });

    observer.observe(root, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [language]);

  return (
    <div ref={rootRef} className="contents" data-delta-language-root="true">
      {children}
    </div>
  );
}
