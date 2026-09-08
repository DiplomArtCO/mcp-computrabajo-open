import { z } from "zod";
import { applicationFormSchema } from "../../../../domain/models/computrabajo.model";
import { READ_ONLY } from "../annotations";
import { errorResponse } from "../error";
import type { ToolRegistrar } from "../registrar";
import { countrySchema, offerIdSchema } from "../schemas";

const inputSchema = z.object({
  offerId: offerIdSchema,
  country: countrySchema,
});

export const register: ToolRegistrar = (server, repository) => {
  server.registerTool(
    "get-application-questions",
    {
      title: "Get Application Questions",
      description:
        "Read the current application form for a Computrabajo offer without submitting an application. Returns questions, valid options, and dynamic hidden fields.",
      inputSchema,
      outputSchema: applicationFormSchema,
      annotations: READ_ONLY,
    },
    async ({ offerId, country }) => {
      try {
        const output = await repository.getApplicationForm({
          offerId,
          country,
        });
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
