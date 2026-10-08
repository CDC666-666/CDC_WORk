import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.TEST_BASE_URL;

test("anonymous visitors cannot read or change engineering experiences", { skip: !baseUrl }, async () => {
  assert.ok(baseUrl);
  const page = await fetch(`${baseUrl}/experiences`, { redirect: "manual" });
  assert.equal(page.status, 307);
  assert.equal(page.headers.get("location"), "/login");
  const workspace = await fetch(`${baseUrl}/api/private/workspace`);
  assert.equal(workspace.status, 401);
  const detail = await fetch(`${baseUrl}/api/private/entities/knowledge/private-id`);
  assert.equal(detail.status, 401);
  const create = await fetch(`${baseUrl}/api/private/entities/knowledge`, {
    method: "POST", headers: { "content-type": "application/json", origin: baseUrl },
    body: JSON.stringify({ item: { id: "private-id", itemType: "工程经验" } }),
  });
  assert.equal(create.status, 401);
  const edit = await fetch(`${baseUrl}/api/private/entities/knowledge/private-id`, {
    method: "PATCH", headers: { "content-type": "application/json", origin: baseUrl },
    body: JSON.stringify({ version: 1, item: { title: "unauthorized" } }),
  });
  assert.equal(edit.status, 401);
});
