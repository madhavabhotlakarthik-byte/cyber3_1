import { default as handler } from "../dist/server/server.js";

export default async (req) => {
  return handler.fetch(req, {}, {});
};
