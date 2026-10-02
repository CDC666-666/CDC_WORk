import type { TestRecord } from "@/types/testing";

/** Structured experiment data preserves all existing test record fields. */
export interface Experiment extends TestRecord {
  hypothesis: string;
  observations: string;
}
