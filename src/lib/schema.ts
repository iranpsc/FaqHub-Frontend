import { resolveAvatarSrc, userAvatarSrc } from '@/lib/avatar';
import { htmlToPlainText } from '@/lib/sanitize';
import type { Answer, Comment, Question, User } from '@/services/types';

export const SITE_URL = 'https://faqhub.ir';
export const SITE_NAME = 'انجمن حم';
export const LOGO_URL = `${SITE_URL}/assets/icons/main-logo.PNG`;

export type JsonLdNode = Record<string, unknown>;

type PersonSource = {
  name?: string | null;
  username?: string | null;
  id?: string | number | null;
  image?: string | null;
  image_url?: string | null;
  avatar?: string | null;
};

/**
 * JSON-LD must survive being embedded in HTML. A literal `</script>` or `<`
 * inside user content closes the tag early, so Google reports the block as
 * unparsable and drops every entity in it.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function absoluteUrl(path?: string | null): string | undefined {
  if (typeof path !== 'string') return undefined;

  const trimmed = path.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${SITE_URL}${normalized}`;
}

export function toIsoDate(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}

export function nonNegativeInt(value: unknown): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

export function schemaText(value: unknown, max = 5000): string {
  if (typeof value !== 'string') return '';
  return htmlToPlainText(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

const MAX_SCHEMA_COMMENTS = 10;

function countVoteSide(value: unknown): number {
  if (typeof value === 'number') return nonNegativeInt(value);
  if (Array.isArray(value)) return value.length;
  return 0;
}

/**
 * Questions return up/down votes as loaded collections. Answers and comments
 * return numeric counts. `votes_count` is the combined total, so it must not
 * be stored as upvoteCount.
 */
function voteTally(votes: unknown): { up: number; down: number } {
  if (!votes || typeof votes !== 'object') return { up: 0, down: 0 };

  const bag = votes as { upvotes?: unknown; downvotes?: unknown };
  return {
    up: countVoteSide(bag.upvotes),
    down: countVoteSide(bag.downvotes),
  };
}

function interactionCounter(
  type: 'LikeAction' | 'DislikeAction' | 'CommentAction',
  count: number
): JsonLdNode {
  return {
    '@type': 'InteractionCounter',
    interactionType: `https://schema.org/${type}`,
    userInteractionCount: count,
  };
}

function applyVoteStats(node: JsonLdNode, votes: unknown, commentCount?: number) {
  const { up, down } = voteTally(votes);
  node.upvoteCount = up;
  node.downvoteCount = down;

  const stats: JsonLdNode[] = [];
  if (up > 0) stats.push(interactionCounter('LikeAction', up));
  if (down > 0) stats.push(interactionCounter('DislikeAction', down));
  if (commentCount && commentCount > 0) stats.push(interactionCounter('CommentAction', commentCount));

  if (stats.length === 1) node.interactionStatistic = stats[0];
  else if (stats.length > 1) node.interactionStatistic = stats;
}

export function organizationSchema(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
    },
  };
}

export function websiteSchema(description?: string): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: description || 'بزرگترین انجمن پرسش و پاسخ ایران',
    inLanguage: 'fa-IR',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function personNode(user?: PersonSource | null): JsonLdNode {
  const name = user?.name?.trim() || 'کاربر ناشناس';
  const username = typeof user?.username === 'string' ? user.username.trim() : '';
  const avatarSource =
    userAvatarSrc(user) || (typeof user?.avatar === 'string' ? user.avatar : undefined);
  const image = resolveAvatarSrc(avatarSource);
  const imageUrl = image && /^https?:\/\//i.test(image) ? image : undefined;

  return {
    '@type': 'Person',
    name,
    ...(username
      ? {
          alternateName: username,
          url: `${SITE_URL}/authors/${username}`,
        }
      : {}),
    ...(user?.id != null && String(user.id).trim() ? { identifier: String(user.id) } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
  };
}

export function buildListItems(
  items: Array<{ name?: string | null; url?: string | null }>
): JsonLdNode[] {
  const list: JsonLdNode[] = [];

  for (const item of items) {
    const url = absoluteUrl(item.url);
    const name = schemaText(item.name, 300);
    if (!url || !name) continue;

    list.push({
      '@type': 'ListItem',
      position: list.length + 1,
      url,
      name,
    });
  }

  return list;
}

export function buildCollectionPage(input: {
  url: string;
  name: string;
  description?: string;
  items?: Array<{ name?: string | null; url?: string | null }>;
}): JsonLdNode {
  const list = buildListItems(input.items ?? []);
  const description = schemaText(input.description, 300);

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': input.url,
    url: input.url,
    name: schemaText(input.name, 300) || input.name,
    ...(description ? { description } : {}),
    inLanguage: 'fa-IR',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    ...(list.length
      ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: list.length,
            itemListElement: list,
          },
        }
      : {}),
  };
}

function commentDate(comment: Comment): string | undefined {
  return toIsoDate(comment.published_at) || toIsoDate(comment.created_at);
}

function commentNodes(comments: Comment[] | undefined, pageUrl: string, parentId: string): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];

  for (const comment of comments ?? []) {
    if (nodes.length >= MAX_SCHEMA_COMMENTS) break;
    if (comment.published === false) continue;

    const text = schemaText(comment.content, 2000);
    if (!text || !comment.id) continue;

    const created = commentDate(comment);
    const url = `${pageUrl}#comment-${comment.id}`;
    const node: JsonLdNode = {
      '@type': 'Comment',
      '@id': url,
      text,
      url,
      author: personNode(comment.user),
      parentItem: { '@id': parentId },
    };

    if (created) {
      node.dateCreated = created;
      node.datePublished = created;
    }

    applyVoteStats(node, comment.votes);
    nodes.push(node);
  }

  return nodes;
}

function answerNode(
  answer: Answer,
  pageUrl: string,
  comments?: Comment[],
  commentTotal?: number
): JsonLdNode | null {
  const text = schemaText(answer.content);
  if (!text || !answer.id) return null;

  const created = toIsoDate(answer.created_at);
  const url = `${pageUrl}#answer-${answer.id}`;
  const embeddedComments = commentNodes(comments ?? answer.comments, pageUrl, url);
  const commentCount = Math.max(
    nonNegativeInt(commentTotal ?? answer.comments_count),
    embeddedComments.length
  );

  const node: JsonLdNode = {
    '@type': 'Answer',
    '@id': url,
    text,
    url,
    ...(created ? { dateCreated: created, datePublished: created } : {}),
    author: personNode(answer.user),
    commentCount,
  };

  applyVoteStats(node, answer.votes, commentCount);
  if (embeddedComments.length === 1) node.comment = embeddedComments[0];
  else if (embeddedComments.length > 1) node.comment = embeddedComments;

  return node;
}

/**
 * QAPage is the type Google expects on a single-question forum thread.
 * `acceptedAnswer` must be one Answer object. An empty array, which the old
 * markup always sent when nothing was marked correct, makes the entity invalid.
 */
export type QaPageComments = {
  questionComments?: Comment[];
  questionCommentTotal?: number;
  answerComments?: Record<string, { comments: Comment[]; total?: number }>;
};

export function buildQaPageSchema(
  question: Question,
  answers: Answer[],
  slug: string,
  extras: QaPageComments = {}
): JsonLdNode | null {
  const name = schemaText(question.title, 300);
  if (!name || !slug) return null;

  const pageUrl = `${SITE_URL}/questions/${slug}`;
  const questionId = `${pageUrl}#question`;
  const text = schemaText(question.content);
  const created = toIsoDate(question.created_at);
  const nodes = answers
    .filter((answer) => answer.published !== false)
    .map((answer) => ({
      correct: Boolean(answer.is_correct),
      node: answerNode(
        answer,
        pageUrl,
        extras.answerComments?.[answer.id]?.comments,
        extras.answerComments?.[answer.id]?.total
      ),
    }))
    .filter((entry): entry is { correct: boolean; node: JsonLdNode } => entry.node !== null);

  const acceptedPool = nodes.filter((entry) => entry.correct);
  const accepted = [...acceptedPool].sort(
    (a, b) => nonNegativeInt(b.node.upvoteCount) - nonNegativeInt(a.node.upvoteCount)
  )[0]?.node;
  const acceptedUrl = typeof accepted?.url === 'string' ? accepted.url : undefined;
  const suggested = nodes
    .map((entry) => entry.node)
    .filter((node) => node.url !== acceptedUrl)
    .slice(0, 5);

  const publishedAnswerCount = Math.max(
    0,
    nonNegativeInt(question.answers_count) - nonNegativeInt(question.unpublished_answers_count)
  );
  const questionCommentList = commentNodes(extras.questionComments, pageUrl, questionId);
  const publishedCommentCount = Math.max(
    0,
    nonNegativeInt(question.comments_count) - nonNegativeInt(question.unpublished_comments_count)
  );
  const commentCount = Math.max(
    nonNegativeInt(extras.questionCommentTotal ?? publishedCommentCount),
    questionCommentList.length
  );

  const mainEntity: JsonLdNode = {
    '@type': 'Question',
    '@id': questionId,
    name,
    url: pageUrl,
    answerCount: Math.max(
      question.answers_count != null ? publishedAnswerCount : nodes.length,
      nodes.length
    ),
    commentCount,
    author: personNode(question.user),
  };

  applyVoteStats(mainEntity, question.votes, commentCount);
  if (text) mainEntity.text = text;
  if (created) {
    mainEntity.dateCreated = created;
    mainEntity.datePublished = created;
  }
  if (questionCommentList.length === 1) mainEntity.comment = questionCommentList[0];
  else if (questionCommentList.length > 1) mainEntity.comment = questionCommentList;
  if (accepted) mainEntity.acceptedAnswer = accepted;
  if (suggested.length === 1) mainEntity.suggestedAnswer = suggested[0];
  else if (suggested.length > 1) mainEntity.suggestedAnswer = suggested;

  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    '@id': `${pageUrl}#qapage`,
    url: pageUrl,
    inLanguage: 'fa-IR',
    mainEntity,
  };
}

export function buildProfilePageSchema(author: User): JsonLdNode | null {
  const name = author.name?.trim();
  if (!name) return null;

  const username = typeof author.username === 'string' ? author.username.trim() : '';
  const pathId = username || (author.id != null ? String(author.id) : '');
  if (!pathId) return null;

  const url = `${SITE_URL}/authors/${pathId}`;
  const description = schemaText(author.bio, 500);
  const avatar = typeof author.avatar === 'string' ? author.avatar : undefined;
  const created = toIsoDate(author.created_at);
  const person = personNode({
    name,
    username: author.username,
    id: author.id,
    image: author.image,
    image_url: author.image_url,
    avatar,
  });

  if (description) person.description = description;
  if (!person.url) person.url = url;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#profile`,
    url,
    name,
    inLanguage: 'fa-IR',
    mainEntity: person,
    ...(created ? { dateCreated: created } : {}),
  };
}
