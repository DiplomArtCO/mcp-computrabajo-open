import { z } from "zod";
import { COUNTRY_CODES } from "../../../config/api";

export const countrySchema = z
  .enum(COUNTRY_CODES)
  .optional()
  .describe(
    "Two-letter country code: pe (Peru), co (Colombia), mx (Mexico), ar (Argentina), cl (Chile), ec (Ecuador). Defaults to the server's configured country ('co' unless overridden).",
  );

export const offerIdSchema = z
  .string()
  .regex(
    /^[0-9A-Fa-f]{32}$/,
    "offerId must be a 32-character hexadecimal string",
  )
  .describe(
    "The 32-character hexadecimal offer ID (e.g. '7688C0282117AF8561373E686DCF3405'). Obtained from search-jobs results.",
  );

export const pageSchema = z
  .number()
  .int("page must be an integer")
  .min(1, "page must be at least 1")
  .optional()
  .describe("Page number for pagination; starts at 1.");
