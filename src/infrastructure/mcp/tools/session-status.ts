import { READ_ONLY } from "./annotations";
import { errorResponse } from "./error";
import type { ToolRegistrar } from "./registrar";

export const register: ToolRegistrar = (server, repository) => {
  server.registerTool(
    "estado-de-sesion",
    {
      title: "Session Status",
      description:
        "Report whether an authenticated Computrabajo session is available. Never returns cookies, tokens, or credentials.",
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const status = await repository.getSessionStatus();
        const authenticated = status === "authenticated";
        const output = {
          status,
          authenticated,
          message: authenticated
            ? "Authenticated session available for profile, CV, questions, and applications."
            : "No authenticated session. Public job search and details remain available.",
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output) }],
          structuredContent: output,
        };
      } catch (error) {
        return errorResponse(error);
      }
    },
  );
};
