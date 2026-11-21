export function logApiRequest(method: string, route: string, status: number) {
  console.log(`[api] ${method} ${route} -> ${status}`);
}
