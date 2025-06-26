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
 * Redirect rules configuration
 */
const redirectRules: RedirectRule[] = [
  // Remove trailing slashes (except for root)
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