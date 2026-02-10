/**
 * URL 验证工具函数
 * 用于防止 XSS 攻击和开放重定向攻击
 */

/**
 * 验证头像 URL 是否安全，防止 XSS 攻击
 * @param url - 要验证的 URL
 * @returns 如果 URL 安全返回 true，否则返回 false
 */
export function isValidAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  try {
    const parsedUrl = new URL(url);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * 验证重定向 URL 是否安全，防止开放重定向攻击
 * @param url - 要验证的重定向 URL
 * @returns 如果 URL 安全返回 true，否则返回 false
 */
export function isValidRedirectUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  try {
    const parsedUrl = new URL(url, window.location.origin);
    // 只允许同源重定向
    return parsedUrl.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * 验证 URL 是否为绝对 URL
 * @param url - 要验证的 URL
 * @returns 如果是绝对 URL 返回 true，否则返回 false
 */
export function isAbsoluteUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 清理用户输入的 URL，移除危险字符
 * @param url - 要清理的 URL
 * @returns 清理后的 URL
 */
export function sanitizeUrl(url: string): string {
  return url.replace(/^(javascript|data|vbscript|about|file):/i, "");
}
