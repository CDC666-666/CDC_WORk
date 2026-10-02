# Academic UI

`AcademicCenter` manages semesters and courses. Major courses have individual
cards; general courses are grouped visually while each remains a separate
`Course` record. `AcademicCourseDetail` manages chapters, class sessions,
assignments, and exams for one course.

Both components call `useAcademic`; they never read or write localStorage.
They show loading and empty states, and only show a success notice after the
service write succeeds. Failed writes retain the editor and show an error.
Deleting a semester or course with dependent records is rejected by the
service, so personal notes and assignments are preserved.
