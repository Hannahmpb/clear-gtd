export type List =
  | "inbox"
  | "next"
  | "project"
  | "waiting"
  | "scheduled"
  | "someday"
  | "reference"
  | "done";

export interface Item {
  id: string;
  title: string;
  note: string;
  list: List;
  context: string | null;
  project: string | null;
  who: string | null;
  date: string | null;
  created: string;
  updated: string;
  completedAt: string | null;
  deleted: boolean;
}

export interface Meta {
  contexts: string[];
  lastReview: string | null;
  sync: {
    url: string;
    key: string;
    lastPull: string | null;
  };
  ctxFilter: string | null;
}

export type View =
  | "inbox"
  | "next"
  | "projects"
  | "waiting"
  | "scheduled"
  | "someday"
  | "reference"
  | "done"
  | "review"
  | "more"
  | "settings";
