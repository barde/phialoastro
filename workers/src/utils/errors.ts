import { WorkerError, ErrorType } from '../types/worker';
import { logger } from './logger';

/**
 * Error response factory
 */
export function createErrorResponse(error: WorkerError): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });

  const body = {
    error: {
      type: error.type,
      message: error.message,
      // Details are not included in production for security
    },
  };

  return new Response(JSON.stringify(body), {
    status: error.statusCode,
    headers,
  });
}

/**
 * HTML error response for browser requests
 */
export function createHTMLErrorResponse(error: WorkerError): Response {
  const title = `${error.statusCode} - ${getErrorTitle(error.type)}`;
  const message = error.message || getDefaultErrorMessage(error.type);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .error-container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 600px;
    }
    h1 {
      color: #333;
      margin: 0 0 1rem;
      font-size: 3rem;
      font-weight: 300;
    }
    h2 {
      color: #666;
      margin: 0 0 1rem;
      font-size: 1.5rem;
      font-weight: normal;
    }
    p {
      color: #666;
      margin: 0 0 2rem;
      line-height: 1.5;
    }
    a {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background 0.2s;
    }
    a:hover {
      background: #0052a3;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>${error.statusCode}</h1>
    <h2>${getErrorTitle(error.type)}</h2>
    <p>${message}</p>
    <a href="/">Go to homepage</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: error.statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Global error handler
 */
export async function handleError(
  error: unknown,
  request: Request
): Promise<Response> {
  // Convert to WorkerError if needed
  let workerError: WorkerError;

  if (error instanceof WorkerError) {
    workerError = error;
  } else if (error instanceof Error) {
    workerError = new WorkerError(
      ErrorType.INTERNAL_ERROR,
      500,
      'Internal Server Error',
      { originalError: error.message }
    );
  } else {
    workerError = new WorkerError(
      ErrorType.INTERNAL_ERROR,
      500,
      'An unexpected error occurred'
    );
  }

  // Log the error
  logger.error('Request failed', {
    url: request.url,
    method: request.method,
    errorType: workerError.type,
    message: workerError.message,
    statusCode: workerError.statusCode,
    details: workerError.details,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Return appropriate response based on Accept header
  const acceptHeader = request.headers.get('Accept') || '';
  if (acceptHeader.includes('application/json')) {
    return createErrorResponse(workerError);
  }

  return createHTMLErrorResponse(workerError);
}

/**
 * Get human-readable error title
 */
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.NOT_FOUND:
      return 'Page Not Found';
    case ErrorType.BAD_REQUEST:
      return 'Bad Request';
    case ErrorType.UNAUTHORIZED:
      return 'Unauthorized';
    case ErrorType.FORBIDDEN:
      return 'Forbidden';
    case ErrorType.INTERNAL_ERROR:
    default:
      return 'Internal Server Error';
  }
}

/**
 * Get default error message
 */
function getDefaultErrorMessage(type: ErrorType): string {
  switch (type) {
    case ErrorType.NOT_FOUND:
      return 'The page you are looking for does not exist.';
    case ErrorType.BAD_REQUEST:
      return 'Your request could not be processed.';
    case ErrorType.UNAUTHORIZED:
      return 'You need to be authenticated to access this resource.';
    case ErrorType.FORBIDDEN:
      return 'You do not have permission to access this resource.';
    case ErrorType.INTERNAL_ERROR:
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * Validate request
 */
export function validateRequest(request: Request): void {
  const url = new URL(request.url);

  // Check for suspicious patterns
  if (url.pathname.includes('..') || url.pathname.includes('//')) {
    throw new WorkerError(
      ErrorType.BAD_REQUEST,
      400,
      'Invalid request path'
    );
  }

  // Check method
  const allowedMethods = ['GET', 'HEAD', 'OPTIONS', 'POST'];
  if (!allowedMethods.includes(request.method)) {
    throw new WorkerError(
      ErrorType.BAD_REQUEST,
      405,
      'Method not allowed',
      { method: request.method }
    );
  }
}