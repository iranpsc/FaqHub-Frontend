/**
 * HTML Sanitization utilities for preventing XSS attacks
 * Uses the xss library for robust sanitization
 */
import xss, { IFilterXSSOptions, escapeAttrValue } from 'xss';

/**
 * Default XSS filter options for user-generated content
 * Allows safe HTML tags while stripping dangerous ones
 */
const defaultOptions: IFilterXSSOptions = {
  whiteList: {
    // Text formatting
    p: ['class', 'style'],
    br: [],
    span: ['class', 'style'],
    div: ['class', 'style'],
    
    // Headers
    h1: ['class', 'style'],
    h2: ['class', 'style'],
    h3: ['class', 'style'],
    h4: ['class', 'style'],
    h5: ['class', 'style'],
    h6: ['class', 'style'],
    
    // Text styling
    strong: ['class'],
    b: ['class'],
    em: ['class'],
    i: ['class'],
    u: ['class'],
    s: ['class'],
    strike: ['class'],
    del: ['class'],
    ins: ['class'],
    sub: [],
    sup: [],
    
    // Lists
    ul: ['class', 'style'],
    ol: ['class', 'style', 'start', 'type'],
    li: ['class', 'style'],
    
    // Links (href is sanitized by xss library)
    a: ['href', 'title', 'target', 'rel', 'class'],
    
    // Images (src is sanitized by xss library)
    img: ['src', 'alt', 'title', 'width', 'height', 'class', 'style'],
    figure: ['class', 'style'],
    figcaption: ['class', 'style'],
    
    // Tables
    table: ['class', 'style', 'border', 'cellpadding', 'cellspacing'],
    thead: ['class'],
    tbody: ['class'],
    tfoot: ['class'],
    tr: ['class', 'style'],
    th: ['class', 'style', 'colspan', 'rowspan', 'scope'],
    td: ['class', 'style', 'colspan', 'rowspan'],
    
    // Quotes and code
    blockquote: ['class', 'style'],
    pre: ['class', 'style'],
    code: ['class', 'style'],
    
    // Other safe elements
    hr: ['class'],
    address: ['class'],
    cite: ['class'],
    abbr: ['title', 'class'],
    mark: ['class'],
    
    // CKEditor specific
    oembed: ['url'],
  },
  
  // Strip dangerous protocols
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'noscript', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea'],
  
  // Custom attribute filter
  onTagAttr: (tag, name, value) => {
    // Allow data-* attributes
    if (name.startsWith('data-')) {
      return `${name}="${escapeAttrValue(value)}"`;
    }
    
    // Block javascript:, vbscript:, and data: URLs in href/src (except for images)
    if ((name === 'href' || name === 'src') && tag !== 'img') {
      const lowerValue = value.toLowerCase().trim();
      if (
        lowerValue.startsWith('javascript:') ||
        lowerValue.startsWith('vbscript:') ||
        lowerValue.startsWith('data:')
      ) {
        return '';
      }
    }
    
    // For img src, allow data:image/* for base64 images but block other dangerous schemes
    if (tag === 'img' && name === 'src') {
      const lowerValue = value.toLowerCase().trim();
      if (lowerValue.startsWith('javascript:') || lowerValue.startsWith('vbscript:')) {
        return '';
      }
      // Allow data:image/* URLs only
      if (lowerValue.startsWith('data:') && !lowerValue.startsWith('data:image/')) {
        return '';
      }
    }
    
    // Block event handlers
    if (name.startsWith('on')) {
      return '';
    }
    
    // Return undefined to use default behavior
    return undefined;
  },
  
  // CSS filter - allow safe CSS properties
  css: {
    whiteList: {
      'color': true,
      'background-color': true,
      'font-size': true,
      'font-weight': true,
      'font-style': true,
      'font-family': true,
      'text-align': true,
      'text-decoration': true,
      'line-height': true,
      'margin': true,
      'margin-top': true,
      'margin-right': true,
      'margin-bottom': true,
      'margin-left': true,
      'padding': true,
      'padding-top': true,
      'padding-right': true,
      'padding-bottom': true,
      'padding-left': true,
      'border': true,
      'border-color': true,
      'border-width': true,
      'border-style': true,
      'width': true,
      'height': true,
      'max-width': true,
      'max-height': true,
      'min-width': true,
      'min-height': true,
      'display': true,
      'float': true,
      'clear': true,
      'vertical-align': true,
      'list-style-type': true,
      'list-style': true,
    }
  }
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this for any user-generated HTML content before rendering with dangerouslySetInnerHTML
 * 
 * @param html - The HTML string to sanitize
 * @param options - Optional custom XSS filter options
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string, options?: IFilterXSSOptions): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return xss(html, options || defaultOptions);
}

/**
 * Sanitize HTML for display in rich text content areas (questions, answers, comments)
 * This is the primary function to use for user-generated content
 */
export function sanitizeContent(content: string): string {
  return sanitizeHtml(content);
}

/**
 * Escape HTML entities for plain text display
 * Use this when you want to display text as-is without any HTML rendering
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Strip all HTML tags using the xss library (avoids incomplete regex sanitization).
 * Script/style bodies are removed entirely.
 */
export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return xss(html, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: [
      'script',
      'style',
      'noscript',
      'iframe',
      'object',
      'embed',
      'form',
    ],
  });
}

/**
 * Decode common HTML entities without double-unescaping.
 * `&amp;` is decoded last so sequences like `&amp;lt;` stay as `&lt;`.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      return (
        new DOMParser().parseFromString(text, 'text/html').documentElement
          .textContent || ''
      );
    } catch {
      // Fall through to manual decoding
    }
  }

  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#x60;/gi, '`')
    .replace(/&#x3D;/gi, '=')
    .replace(/&amp;/gi, '&');
}

/**
 * Convert HTML to plain text for previews, metadata, and validation.
 */
export function htmlToPlainText(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return decodeHtmlEntities(stripHtmlTags(html)).trim();
}

/**
 * Sanitize a URL to prevent javascript: and other dangerous protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:'];
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return '';
    }
  }
  
  return url;
}

export default sanitizeHtml;

