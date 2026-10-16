"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveBulkSettingsAction } from "@/lib/actions/settings";
import type { Json } from "@/types/database";

export type SettingsRowProp = {
  key: string;
  value: Json;
  description: string | null;
  isPublic: boolean;
};

type FieldKind = "boolean" | "number" | "text" | "textarea" | "list";

type Field = {
  fullKey: string;
  label: string;
  kind: FieldKind;
};

type Draft = string | boolean;

function isPlainObject(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanize(key: string): string {
  return key
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function humanizeRoot(key: string): string {
  if (/^[a-z0-9]+$/i.test(key) && key.length <= 4) return key.toUpperCase();
  return humanize(key);
}

function fieldKind(key: string, value: Json): FieldKind {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "list";
  if (typeof value === "string" && (value.length > 48 || /description|address|tagline/i.test(key))) return "textarea";
  return "text";
}

function toDraft(value: Json | undefined): Draft {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item) ?? "")).join(", ");
  }
  return "";
}

function collectFields(rowKey: string, value: Json, prefix: string, out: Field[]): void {
  if (isPlainObject(value)) {
    for (const [key, nested] of Object.entries(value)) {
      collectFields(rowKey, nested ?? null, prefix ? `${prefix}.${key}` : key, out);
    }
    return;
  }
  const path = prefix || rowKey;
  out.push({
    fullKey: prefix ? `${rowKey}.${prefix}` : rowKey,
    label: humanize(path),
    kind: fieldKind(path, value),
  });
}

function leafValue(value: Json, fullKey: string): Json | undefined {
  const [, ...path] = fullKey.split(".");
  let current: Json | undefined = value;
  for (const part of path) {
    if (!isPlainObject(current)) return undefined;
    current = current[part];
  }
  return current;
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10";

export function SettingsForm({ rows }: { rows: SettingsRowProp[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const initial: Record<string, Draft> = {};
    for (const row of rows) {
      const fields: Field[] = [];
      collectFields(row.key, row.value, "", fields);
      for (const field of fields) {
        initial[field.fullKey] = toDraft(leafValue(row.value, field.fullKey));
      }
    }
    return initial;
  });

  const updateDraft = (fullKey: string, value: Draft) => {
    setDrafts((prev) => ({ ...prev, [fullKey]: value }));
  };

  const saveGroup = (row: SettingsRowProp, fields: Field[]) => {
    const entries = fields
      .filter((field) => {
        const current = drafts[field.fullKey];
        return String(current) !== String(toDraft(leafValue(row.value, field.fullKey)));
      })
      .map((field) => ({ key: field.fullKey, value: drafts[field.fullKey] }));

    if (!entries.length) {
      toast.info("No changes to save");
      return;
    }

    startTransition(async () => {
      try {
        await saveBulkSettingsAction(entries);
        toast.success(`${humanizeRoot(row.key)} settings saved`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save settings");
      }
    });
  };

  const renderInput = (field: Field) => {
    const id = `setting-${field.fullKey}`;
    const draft = drafts[field.fullKey];

    if (field.kind === "boolean") {
      const checked = draft === true;
      return (
        <label htmlFor={id} className="flex items-center gap-3 text-sm text-slate-300">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(event) => updateDraft(field.fullKey, event.target.checked)}
            className="h-5 w-5 accent-blue-500"
          />
          <span>{checked ? "Enabled" : "Disabled"}</span>
        </label>
      );
    }

    const text = typeof draft === "boolean" ? String(draft) : draft;

    if (field.kind === "number") {
      return (
        <input
          id={id}
          type="number"
          step="any"
          value={text}
          onChange={(event) => updateDraft(field.fullKey, event.target.value)}
          className={inputClassName}
        />
      );
    }

    if (field.kind === "textarea") {
      return (
        <textarea
          id={id}
          rows={3}
          value={text}
          onChange={(event) => updateDraft(field.fullKey, event.target.value)}
          className={inputClassName}
        />
      );
    }

    return (
      <input
        id={id}
        type="text"
        value={text}
        placeholder={field.kind === "list" ? "Comma separated values" : undefined}
        onChange={(event) => updateDraft(field.fullKey, event.target.value)}
        className={inputClassName}
      />
    );
  };

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-400 shadow-2xl backdrop-blur-xl">
        No settings found in the database yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rows.map((row) => {
        const fields: Field[] = [];
        collectFields(row.key, row.value, "", fields);

        return (
          <section
            key={row.key}
            className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{humanizeRoot(row.key)}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      row.isPublic ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {row.isPublic ? "Public" : "Private"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {row.description ?? `Settings stored under "${row.key}".`}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => saveGroup(row, fields)}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {fields.map((field) => (
                <div
                  key={field.fullKey}
                  className="grid gap-3 p-5 sm:grid-cols-[220px_1fr] sm:items-center"
                >
                  <div>
                    <label
                      htmlFor={`setting-${field.fullKey}`}
                      className="text-sm font-medium text-slate-200"
                    >
                      {field.label}
                    </label>
                    <p className="text-xs text-slate-500">{field.fullKey}</p>
                  </div>
                  {renderInput(field)}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
