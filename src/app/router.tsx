export type RouteKey = "home" | "questions" | "results";

export const routes: Array<{ key: RouteKey; label: string }> = [
  { key: "home", label: "Home" },
  { key: "questions", label: "Questions" },
  { key: "results", label: "Results" }
];
