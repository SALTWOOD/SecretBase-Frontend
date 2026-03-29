import type { ArticleResponse } from "~~/packages/api/src/types.gen";

/**
 * 获取文章封面 URL
 * @param article - 文章对象
 * @returns string | null - 返回封面 URL，null 表示没有封面
 */
export function getArticleCover(article: ArticleResponse | null | undefined): string | null {
  if (article?.cover) return `/api/v1/articles/${article.id}/cover`;
  else return null;
}
