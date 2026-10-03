# Academic routes

`/academic` renders the semester and course management UI.
`/academic/[courseId]` renders one course's chapter notes, class sessions,
assignments, and exams. Both routes use `useAcademic` through the shared
layout provider. Missing course IDs show an explicit empty state with a link
back to the course list.
