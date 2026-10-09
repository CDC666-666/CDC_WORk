# Academic state hook

`useAcademic` exposes the shared `AcademicProvider` state to course pages,
the dashboard, the calendar, and settings. The provider loads through
`AcademicService`, then reloads its snapshot after each successful service
write. Every mounted consumer receives the new state in the same browser
session. It also reloads after Workspace import or demo reset.

An unsuccessful write leaves persisted data unchanged and propagates an error
to the calling UI. The hook does not store a second copy of assignments as
tasks or calendar events.

`useReflections` exposes `Review` records and current projects through a
shared `ReflectionsProvider`. It reloads after successful writes and after a
Workspace import or demo reset. Failed writes leave the form open with its
draft intact. Home and project detail use this same state.
