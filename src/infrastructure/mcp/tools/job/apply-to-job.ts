import { z } from "zod";
import { structuredApplicationResultSchema } from "../../../../domain/models/computrabajo.model";
import { WRITE } from "../annotations";
import { errorResponse } from "../error";
import type { ToolRegistrar } from "../registrar";
import { countrySchema, offerIdSchema } from "../schemas";

const DESCRIPTION =
  "Apply to a job offer on Computrabajo using the authenticated session. This action submits the user's CV/resume to the employer and cannot be undone — confirm with the user before calling it. Requires a Computrabajo session cookie: on the remote server this is the cookie pasted when connecting, and locally it is the CT_COOKIES environment variable. The offer ID is a 32-character hexadecimal string obtained from search-jobs results.";

const inputSchema = z.object({
  offerId: offerIdSchema,
  country: countrySchema,
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answer: z.union([z.string(), z.array(z.string()).min(1)]),
      }),
    )
    .optional(),
});

export const register: ToolRegistrar = (server, repository) => {
  server.registerTool(
    "postular-a-oferta",
    {
      title: "Apply to Job",
      description: DESCRIPTION,
      inputSchema,
      outputSchema: structuredApplicationResultSchema,
      annotations: WRITE,
    },
    async ({ offerId, country, answers }) => {
      try {
        const output = await repository.applyToJob({
          offerId,
          country,
          answers,
        });
        const lower = output.message.toLowerCase();
        const status = output.success
          ? "submitted"
          : /already|ya postul|applied/.test(lower)
            ? "already_applied"
            : /session|cookie|logged|sesión/.test(lower)
              ? "session_expired"
              : /closed|valid|cerrad|no longer/.test(lower)
                ? "expired"
                : answers
                  ? "needs_review"
                  : "error";
        const structured = { ...output, status } as const;

        return {
          content: [{ type: "text", text: JSON.stringify(structured) }],
          structuredContent: structured,
        };
      } catch (error) {
        return errorResponse(error);
      }
    },
  );
};
