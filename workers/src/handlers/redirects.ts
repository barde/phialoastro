interface RedirectRule {
  from: string;
  to: string;
  status?: number;
}

const redirectRules: RedirectRule[] = [
  // Currently no redirects are active due to Firefox/Cloudflare Pages issues
  // TODO: Reimplement redirects after debugging the issue
  // Examples of redirects to implement:
  // { from: '/jewelry', to: '/portfolio', status: 301 },
  // { from: '/about-me', to: '/about', status: 301 },
];

export async function handleRedirects(request: Request): Promise<Response | void> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Remove trailing slashes (except for root)
  if (pathname !== '/' && pathname.endsWith('/')) {
    const newUrl = new URL(url);
    newUrl.pathname = pathname.slice(0, -1);
    return Response.redirect(newUrl.toString(), 301);
  }
  
  // Apply redirect rules
  for (const rule of redirectRules) {
    if (pathname === rule.from || pathname.startsWith(rule.from + '/')) {
      const newPath = pathname.replace(rule.from, rule.to);
      const newUrl = new URL(url);
      newUrl.pathname = newPath;
      
      return Response.redirect(newUrl.toString(), rule.status || 301);
    }
  }
  
  return;
}