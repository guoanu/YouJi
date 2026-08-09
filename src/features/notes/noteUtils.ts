import { t, type TFunction } from "i18next";
import type { Note, NoteMetadata } from "./types";

export function getDisplayTitle(
  note: Pick<NoteMetadata, "title" | "preview">,
  translate: TFunction = t,
): string {
  const title = note.title.trim();
  if (title) return title;

  const preview = note.preview.trim();
  if (preview) return preview.slice(0, 20);

  return translate("common.untitledNote", { defaultValue: "无标题笔记" });
}

export function buildPreview(content: string): string {
  return content.split(/\s+/).filter(Boolean).join(" ").slice(0, 80);
}

export function countNoteChars(content: string): number {
  let count = 0;
  for (const ch of content) {
    if (!/\s/.test(ch)) count++;
  }
  return count;
}

export function metadataFromNote(note: Note): NoteMetadata {
  return {
    id: note.id,
    title: note.title,
    fileName: note.fileName,
    category: note.category,
    kind: note.kind,
    scheduleDate: note.scheduleDate,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    wordCount: note.wordCount,
    preview: buildPreview(note.content),
  };
}

export function scheduleTemplate(): string {
  return [
    "## 今日任务",
    "",
    "- [ ] 任务一",
    "- [ ] 任务二",
    "- [ ] 任务三",
    "",
    "---",
    "",
    "## 晚间总结",
    "",
    "> 今日完成情况：",
    "> ",
    "> 未完成事项：",
    "> ",
    "> 明日计划：",
    "",
  ].join("\n");
}

export interface CheckboxStats {
  total: number;
  done: number;
}

export function parseCheckboxStats(content: string): CheckboxStats {
  const matches = content.match(/^-\s*\[([ xX])\]\s/gm);
  const total = matches ? matches.length : 0;
  const done = matches ? matches.filter((m) => /\[[xX]\]/.test(m)).length : 0;
  return { total, done };
}

export function todayYmd(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface FilteredResult {
  notes: NoteMetadata[];
  freeNotes: NoteMetadata[];
  schedules: NoteMetadata[];
}

export function filterAll(
  notes: NoteMetadata[],
  freeNotes: NoteMetadata[],
  schedules: NoteMetadata[],
  query: string,
): FilteredResult {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return { notes, freeNotes, schedules };

  const match = (item: NoteMetadata): boolean => {
    const haystack = [
      item.title,
      item.preview,
      item.fileName,
      getDisplayTitle(item),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  };

  return {
    notes: notes.filter(match),
    freeNotes: freeNotes.filter(match),
    schedules: schedules.filter(match),
  };
}

export interface CategoryGroup {
  category: string;
  notes: NoteMetadata[];
  latestUpdatedAt: string;
}

export function groupNotesByCategory(
  notes: NoteMetadata[],
  allCategories: string[] = [],
): CategoryGroup[] {
  const groups = new Map<string, NoteMetadata[]>();

  for (const cat of allCategories) {
    groups.set(cat, []);
  }

  for (const note of notes) {
    const key = note.category || "";
    const list = groups.get(key);
    if (list) {
      list.push(note);
    } else {
      groups.set(key, [note]);
    }
  }

  const result: CategoryGroup[] = [];
  for (const [category, categoryNotes] of groups) {
    categoryNotes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    result.push({
      category,
      notes: categoryNotes,
      latestUpdatedAt: categoryNotes[0]?.updatedAt ?? "",
    });
  }

  result.sort((a, b) => {
    if (!a.category) return 1;
    if (!b.category) return -1;
    const aEmpty = a.notes.length === 0;
    const bEmpty = b.notes.length === 0;
    if (aEmpty && !bEmpty) return -1;
    if (!aEmpty && bEmpty) return 1;
    return a.category.localeCompare(b.category);
  });
  return result;
}

export function filterNotes(notes: NoteMetadata[], query: string): NoteMetadata[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return notes;

  return notes.filter((note) => {
    const haystack = [note.title, note.preview, note.fileName, getDisplayTitle(note)]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
