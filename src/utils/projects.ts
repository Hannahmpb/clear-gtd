import type { Item } from "../types";

export function projectActions(items: Item[], pid: string): Item[] {
  return items.filter(
    (i) =>
      !i.deleted &&
      i.project === pid &&
      (i.list === "next" || i.list === "waiting" || i.list === "scheduled"),
  );
}

export function subProjects(items: Item[], pid: string): Item[] {
  return items.filter(
    (i) => !i.deleted && i.list === "project" && i.project === pid,
  );
}

export function projectActionsDeep(items: Item[], pid: string): Item[] {
  let acts = projectActions(items, pid);
  subProjects(items, pid).forEach((sp) => {
    acts = acts.concat(projectActionsDeep(items, sp.id));
  });
  return acts;
}

export function projectIsStalled(items: Item[], pid: string): boolean {
  return projectActionsDeep(items, pid).length === 0;
}

export function topProjects(items: Item[]): Item[] {
  const projects = items.filter((i) => !i.deleted && i.list === "project");
  return projects.filter((p) => {
    if (!p.project) return true;
    const parent = items.find((i) => i.id === p.project);
    return !parent || parent.deleted || parent.list !== "project";
  });
}

export function projHue(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function projChipStyle(id: string): React.CSSProperties {
  const h = projHue(id);
  return {
    background: `hsla(${h},50%,50%,.16)`,
    color: `hsl(${h},45%,45%)`,
  };
}

export function projDotStyle(id: string): React.CSSProperties {
  return { background: `hsl(${projHue(id)},48%,52%)` };
}
