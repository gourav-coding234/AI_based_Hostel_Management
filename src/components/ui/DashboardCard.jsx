// Thin re-export: the project's existing `Card` component (from
// components/dashboard/student/ui.jsx) already implements exactly what a
// "DashboardCard" is asked to be — reusing it keeps one visual language
// instead of a second, near-identical card component.
export { Card as default, Card } from "../dashboard/student/ui";
