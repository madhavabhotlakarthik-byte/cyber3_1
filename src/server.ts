import { renderErrorPage } from "./lib/error-page";

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await import("@tanstack/react-start/server-entry");
      const entry = await handler.default ?? handler;
      const response = await entry.fetch(request, env, ctx);
      return response;
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
