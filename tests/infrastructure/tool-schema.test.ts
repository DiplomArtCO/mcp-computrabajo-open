import { expect, test } from "bun:test";
import { loadConfig } from "../../src/config/node-config";
import { redactApplicationForm } from "../../src/infrastructure/mcp/tools/job/get-application-questions";
import { searchJobsInputSchema } from "../../src/infrastructure/mcp/tools/job/search-jobs";

test("search jobs rejects empty keywords and pages below one", () => {
  expect(
    searchJobsInputSchema.safeParse({
      keyword: "",
      page: 1,
    }).success,
  ).toBe(false);
  expect(
    searchJobsInputSchema.safeParse({
      keyword: "sst",
      page: 0,
    }).success,
  ).toBe(false);
});

test("search jobs trims valid keyword and location", () => {
  const parsed = searchJobsInputSchema.parse({
    keyword: " sst ",
    location: " cali ",
    page: 1,
  });

  expect(parsed.keyword).toBe("sst");
  expect(parsed.location).toBe("cali");
});

test("application question output redacts dynamic field values", () => {
  const safe = redactApplicationForm({
    offerId: "A".repeat(32),
    fields: [{ name: "__RequestVerificationToken", value: "secret" }],
    questions: [],
    status: "no_questions",
  });

  expect(safe.fields).toEqual([
    { name: "__RequestVerificationToken", value: "[redacted]" },
  ]);
});

test("isolated test mode does not read any configured session", async () => {
  const previous = process.env.CT_DISABLE_LOCAL_SESSION;
  process.env.CT_DISABLE_LOCAL_SESSION = "1";
  try {
    expect((await loadConfig()).cookies).toBeUndefined();
  } finally {
    if (previous === undefined) delete process.env.CT_DISABLE_LOCAL_SESSION;
    else process.env.CT_DISABLE_LOCAL_SESSION = previous;
  }
});
