import { WorkerContext } from '../../types/worker';
import { logger } from '../../utils/logger';

/**
 * Redirect rule interface
 */
interface RedirectRule {
  from: string | RegExp;
  to: string | ((match: RegExpMatchArray) => string);
  status?: number;
  permanent?: boolean;
}

/**
 * List of paths that should keep their trailing slashes
 * These are typically directory-based routes that Astro generates with index.html
 */
const preserveTrailingSlashPaths = [
  '/contact/',
  '/en/contact/',
  '/about/',
  '/en/about/',
  '/portfolio/',
  '/en/portfolio/',
  '/services/',
  '/en/services/',
  '/classes/',
  '/en/classes/',
  '/imprint/',
  '/en/imprint/',
  '/privacy/',
  '/en/privacy/',
  '/terms/',
  '/en/terms/',
];

/**
 * Redirect rules configuration
 */
const redirectRules: RedirectRule[] = [
  // Remove trailing slashes (except for root and specific paths)
  // The logic for preserving specific paths is handled in handleRedirect function
  {
    from: /^(.+)\/$/,
    to: (match) => match[1],
    status: 301,
    permanent: true,
  },
  // Add your custom redirects here
  // Example:
  // { from: '/old-path', to: '/new-path', status: 301 },
  // { from: /^\/blog\/(.+)$/, to: (match) => `/articles/${match[1]}`, status: 301 },
];

/**
 * Handle redirects
 */
export async function handleRedirect(context: WorkerContext): Promise<Response | void> {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Skip redirect for root path
  if (pathname === '/') {
    return;
  }
  
  // Skip trailing slash removal for paths that should preserve them
  if (pathname.endsWith('/') && preserveTrailingSlashPaths.includes(pathname)) {
    return;
  }
  
  // Apply redirect rules
  for (const rule of redirectRules) {
    let match: RegExpMatchArray | null = null;
    
    if (typeof rule.from === 'string') {
      // Exact match
      if (pathname === rule.from) {
        const newUrl = new URL(url);
        newUrl.pathname = typeof rule.to === 'string' ? rule.to : rule.to([pathname]);
        
        logger.info('Redirecting request', {
          from: pathname,
          to: newUrl.pathname,
          status: rule.status || 301,
        });
        
        return Response.redirect(newUrl.toString(), rule.status || 301);
      }
    } else {
      // Regex match
      match = pathname.match(rule.from);
      if (match) {
        const newPath = typeof rule.to === 'string' ? rule.to : rule.to(match);
        
        // Skip redirect if the path doesn't actually change
        if (newPath === pathname) {
          continue;
        }
        
        const newUrl = new URL(url);
        newUrl.pathname = newPath;
        
        logger.info('Redirecting request', {
          from: pathname,
          to: newUrl.pathname,
          status: rule.status || 301,
        });
        
        return Response.redirect(newUrl.toString(), rule.status || 301);
      }
    }
  }
  
  // No redirect needed
  return;
}