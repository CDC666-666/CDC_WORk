import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { Prisma, PrismaClient } from "@prisma/client";
import { readWorkspaceExperiences, SnapshotReadError } from "@/services/experience-snapshot-reader";
import { parseAutoAimCase } from "@/services/shared-memory-experience";
import { insertEntity } from "@/repositories/server/entity-repository";
import { syntheticCase } from "@/tests/fixtures/experience-case";

test("read-only snapshot selects only the verified owner's active experiences across projects",
  { skip: !process.env.DATABASE_URL }, async () => {
    const db = new PrismaClient();
    const marker = randomUUID();
    const ownId = "synthetic-" + marker;
    const otherId = "synthetic-other-" + marker;
    const own = await db.user.create({ data: { githubId: ownId } });
    const other = await db.user.create({ data: { githubId: otherId } });
    const ownWorkspace = await db.workspace.create({ data: { userId: own.id } });
    const otherWorkspace = await db.workspace.create({ data: { userId: other.id } });
    await db.account.create({ data: { userId: own.id, provider: "github", providerAccountId: ownId,
      type: "oauth", access_token: "synthetic-token-must-not-appear" } });
    await db.account.create({ data: { userId: other.id, provider: "github", providerAccountId: otherId,
      type: "oauth" } });
    try {
      const shared = parseAutoAimCase(syntheticCase, ownWorkspace.id);
      const manual = structuredClone(shared);
      manual.id = "experience-" + randomUUID();
      manual.title = "合成底盘案例";
      manual.sourceType = "manual";
      manual.sourceId = undefined;
      if (!manual.experience) throw new Error("missing experience");
      manual.experience.sourceProject = "chassis";
      manual.experience.sourceKey = undefined;
      manual.experience.sourceRevision = undefined;
      const note = { ...manual, id: "note-" + randomUUID(), itemType: "笔记" };
      const archived = { ...shared, id: "archived-" + randomUUID(), status: "已归档" };
      const foreign = { ...manual, id: "foreign-" + randomUUID() };
      const create = (workspaceId: string, item: typeof shared) => db.knowledge.create({
        data: { id: item.id, workspaceId, payload: item as unknown as Prisma.InputJsonValue,
          sourceType: item.sourceType, sourceId: item.sourceId ?? null } });
      await create(ownWorkspace.id, shared);
      await create(ownWorkspace.id, manual);
      await create(ownWorkspace.id, note as typeof shared);
      await create(ownWorkspace.id, archived as typeof shared);
      await create(otherWorkspace.id, foreign);
      const database = (await db.$queryRawUnsafe<Array<{ name: string }>>("SELECT current_database() AS name"))[0].name;
      const read = () => db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
        return readWorkspaceExperiences(tx, database, ownId);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
      let selected = await read();
      assert.deepEqual(selected.map((row) => row.id).sort(), [shared.id, manual.id].sort());
      assert.deepEqual(selected.map((row) => row.item.experience.sourceProject).sort(), ["auto_aim", "chassis"]);
      assert.equal(JSON.stringify(selected).includes("synthetic-token-must-not-appear"), false);
      await db.knowledge.update({ where: { id: shared.id }, data: { payload: {
        ...shared, experience: { ...shared.experience, sourceKey: "shared-memory/cases/other.md" },
      } as unknown as Prisma.InputJsonValue } });
      await assert.rejects(read(), (error: unknown) =>
        error instanceof SnapshotReadError && error.code === "SOURCE_IDENTITY_MISMATCH");
      await db.knowledge.update({ where: { id: shared.id }, data: {
        payload: shared as unknown as Prisma.InputJsonValue } });
      await assert.rejects(db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
        return readWorkspaceExperiences(tx, "wrong_database", ownId);
      }), (error: unknown) => error instanceof SnapshotReadError && error.code === "DATABASE_TARGET_REJECTED");
      await db.account.update({ where: { provider_providerAccountId: {
        provider: "github", providerAccountId: ownId } }, data: { providerAccountId: "mismatch-" + marker } });
      await assert.rejects(read(), (error: unknown) =>
        error instanceof SnapshotReadError && error.code === "WORKSPACE_OWNER_MISMATCH");
      await db.account.update({ where: { provider_providerAccountId: {
        provider: "github", providerAccountId: "mismatch-" + marker } }, data: { providerAccountId: ownId } });
      await db.knowledge.update({ where: { id: manual.id }, data: { version: 2,
        payload: { ...manual, title: "编辑后" } as unknown as Prisma.InputJsonValue } });
      selected = await read();
      assert.equal(selected.find((row) => row.id === manual.id)?.version, 2);
      assert.equal(selected.find((row) => row.id === manual.id)?.item.title, "编辑后");
      await db.knowledge.update({ where: { id: manual.id }, data: {
        payload: { ...manual, status: "已归档" } as unknown as Prisma.InputJsonValue } });
      assert.deepEqual((await read()).map((row) => row.id), [shared.id]);
      await db.knowledge.delete({ where: { id: shared.id } });
      assert.equal((await read()).length, 0);
    } finally {
      await db.knowledge.deleteMany({ where: { workspaceId: { in: [ownWorkspace.id, otherWorkspace.id] } } });
      await db.account.deleteMany({ where: { userId: { in: [own.id, other.id] } } });
      await db.workspace.deleteMany({ where: { id: { in: [ownWorkspace.id, otherWorkspace.id] } } });
      await db.user.deleteMany({ where: { id: { in: [own.id, other.id] } } });
      await db.$disconnect();
    }
  });

test("UTC entity timestamp survives an explicit Asia/Shanghai PostgreSQL session",
  { skip: !process.env.DATABASE_URL }, async () => {
    const db = new PrismaClient();
    const user = await db.user.create({ data: { githubId: "tz-" + randomUUID() } });
    const workspace = await db.workspace.create({ data: { userId: user.id } });
    const now = new Date("2026-10-08T12:34:56.000Z");
    try {
      await db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET LOCAL TIME ZONE 'Asia/Shanghai'");
        const zone = await tx.$queryRawUnsafe<Array<{ TimeZone: string }>>("SHOW TIME ZONE");
        assert.equal(zone[0].TimeZone, "Asia/Shanghai");
        const item = parseAutoAimCase(syntheticCase, workspace.id);
        item.id = "tz-" + randomUUID();
        const inserted = await insertEntity(tx, workspace.id, "knowledge",
          item as unknown as Record<string, unknown>, [], now);
        assert.equal(inserted.updatedAt.toISOString(), now.toISOString());
      });
    } finally {
      await db.knowledge.deleteMany({ where: { workspaceId: workspace.id } });
      await db.workspace.delete({ where: { id: workspace.id } });
      await db.user.delete({ where: { id: user.id } });
      await db.$disconnect();
    }
  });
