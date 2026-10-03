import type { MigrationDependency, MigrationDisposition, MigrationEntity } from "@/types/migration";

const keyOf = (entity: Pick<MigrationEntity, "collection" | "id">): string => `${entity.collection}:${entity.id}`;

/** Walk selected/personal records through every parent, including multi-level demo links. */
export function collectMigrationDependencies(
  entities: readonly MigrationEntity[],
  disposition: ReadonlyMap<string, MigrationDisposition>,
  mappedKeys: ReadonlySet<string>,
  includeKeys: ReadonlySet<string>,
): MigrationDependency[] {
  const byKey = new Map(entities.map((entity) => [keyOf(entity), entity]));
  const queue = entities.filter((entity) => entity.origin === "PERSONAL" || includeKeys.has(keyOf(entity)));
  const visited = new Set(queue.map(keyOf));
  const edges = new Map<string, MigrationDependency>();
  while (queue.length) {
    const entity = queue.shift();
    if (!entity) break;
    const dependentKey = keyOf(entity);
    for (const relation of entity.relations) {
      const requiredKey = `${relation.collection}:${relation.id}`;
      const parent = byKey.get(requiredKey);
      const requiredStatus = disposition.get(requiredKey) ?? "missing";
      const satisfied = requiredStatus === "write" ||
        (requiredStatus === "skip" && mappedKeys.has(requiredKey));
      edges.set(`${dependentKey}/${relation.field}/${requiredKey}`, {
        dependentKey, requiredKey, field: relation.field, requiredOrigin: parent?.origin ?? null,
        requiredStatus, satisfied,
      });
      if (parent && !visited.has(requiredKey)) {
        visited.add(requiredKey);
        queue.push(parent);
      }
    }
  }
  return [...edges.values()].sort((a, b) =>
    a.dependentKey.localeCompare(b.dependentKey) || a.requiredKey.localeCompare(b.requiredKey) ||
    a.field.localeCompare(b.field));
}
