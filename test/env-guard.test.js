// Token hold (MEMO-1h row 5): the test suite must run without an Apify token.
// Fails when APIFY_TOKEN is set to a non-empty value. The value itself is never printed.
// Run tests with: env -u APIFY_TOKEN npm test
import { test } from "node:test";
import assert from "node:assert/strict";

test("APIFY_TOKEN is not set in the test environment", () => {
  const isSet = (process.env.APIFY_TOKEN ?? "").trim() !== "";
  assert.equal(isSet, false, "APIFY_TOKEN is set; unset it (env -u APIFY_TOKEN npm test). Value not printed.");
});
