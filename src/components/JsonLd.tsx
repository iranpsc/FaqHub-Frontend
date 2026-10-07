import { JsonLdNode, serializeJsonLd } from '@/lib/schema';

export function JsonLd({ data }: { data?: JsonLdNode | JsonLdNode[] | null }) {
  const nodes = (Array.isArray(data) ? data : data ? [data] : []).filter(
    (node) => node && typeof node === 'object' && Object.keys(node).length > 0
  );

  if (nodes.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(nodes.length === 1 ? nodes[0] : nodes),
      }}
    />
  );
}
