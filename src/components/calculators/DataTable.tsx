"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Column {
  key: string;
  label: string;
  format?: (value: number) => string;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: Record<string, number>[];
  maxHeight?: string;
  defaultCollapsed?: boolean;
}

const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function DataTable({
  title,
  columns,
  data,
  maxHeight = "400px",
  defaultCollapsed = true,
}: DataTableProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (data.length === 0) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/50 transition-colors"
      >
        <h3 className="text-slate-900 font-bold text-sm">{title}</h3>
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <span>{data.length} rows</span>
          {collapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="overflow-auto" style={{ maxHeight }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr className="bg-white border-t border-slate-200">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="text-slate-500 text-xs font-semibold uppercase tracking-wider text-left px-4 py-3"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-slate-200/50 hover:bg-white/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="text-slate-900 text-xs px-4 py-2.5">
                      {col.format
                        ? col.format(row[col.key])
                        : fmt(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
