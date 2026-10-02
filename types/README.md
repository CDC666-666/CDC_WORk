# Domain types and Workspace compatibility

`WorkspaceDomainState` is the persisted localStorage schema v4. It contains
projects, tasks, engineering logs, experiments, knowledge, skills, skill
evidence, timeline, reviews, academic records, and attachment references.
Project modules and milestones remain top-level. `legacy` holds the remaining
v3 collections until those modules are migrated. `WorkspaceData` is the v3
projection used by existing React reducers and pages; it is not the v4 source
of truth. `WorkspaceDomainGraph` remains an alias for the v4 state.

The `@/types` barrel exports canonical domain names. Historical Dashboard demo
shapes use `DashboardProject`, `DashboardProjectModule`, `DashboardSkill`,
`DashboardWorkLog`, and `DashboardTechnicalIssue` so they cannot shadow the
persisted domain types. New domain code should import its owning `types/` file.

`Task.sourceType` in v3 means how the task was created (`manual`, `content`,
`reading`, or `project`). `DomainTask.sourceType` means its domain relationship
(`PROJECT`, `COURSE`, `LEARNING`, or `PERSONAL`); `relatedId` is interpreted with
that type. V4 stores `deadline` instead of `dueAt` and keeps provenance in
`creationSourceType` and `creationSourceId`. No course ID is inferred from a
task title. `TaskVNext` remains an alias for `DomainTask`.

`EngineeringLog` keeps the existing `WorkLog` fields while adding structured
problem-analysis fields. `Experiment` keeps existing `TestRecord` fields.
Unknown structured values migrate to empty strings rather than invented facts.
`ProjectVNext` adds visibility and public summary; migration defaults to
`PRIVATE`. `KnowledgeVNext` and `SkillEvidenceVNext` add course/knowledge links.

Academic courses reference `Semester.id` through `semesterId`; chapters, class
sessions, assignments, and exams reference `Course.id`. A future UI may group
`GENERAL` courses without merging their records. `Review` is a reflection
record and does not replace experiments or technical issues. `Attachment`
stores a URL and target reference only; upload, binary storage, and URL access
policy are not implemented here.

`WorkspaceRecoveryBackup` marks a read-only rescue export and lists broken
references. It contains the full persisted v4 state and is deliberately not
accepted by normal import until those references have been repaired.
