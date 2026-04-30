import { useEffect, useState } from "react";
import { Link } from "wasp/client/router";
import { DashboardLayout } from "./DashboardLayout";
import { getCalls } from "../operations";

type CallStatus = "completed" | "failed" | "in-progress" | "pending" | "missed";
type FilterTab = "all" | CallStatus;

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Missed", value: "missed" },
  { label: "Failed", value: "failed" },
];

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  "in-progress": "bg-blue-50 text-blue-700",
  missed: "bg-amber-50 text-amber-700",
  pending: "bg-gray-50 text-gray-600",
};

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CallsListPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCalls({})
      .then(setCalls)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? calls
    : calls.filter((c) => c.status === filter);

  return (
    <DashboardLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Call History</h2>
          <p className='mt-1 text-gray-500'>Review all your past calls with seniors.</p>
        </div>

        {/* Filter tabs */}
        <div className='flex gap-1 bg-gray-100 p-1 rounded-xl w-fit'>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Calls list */}
        {loading ? (
          <div className='space-y-3'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='bg-white rounded-2xl border border-gray-100 p-6 animate-pulse'>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-gray-100 rounded-full' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-100 rounded w-32' />
                    <div className='h-3 bg-gray-50 rounded w-24' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className='bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm'>
            <div className='w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <svg className='w-7 h-7 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
              </svg>
            </div>
            <p className='text-sm font-medium text-gray-900 mb-1'>No {filter === "all" ? "" : filter} calls</p>
            <p className='text-sm text-gray-500'>Calls will appear here once they are made.</p>
          </div>
        ) : (
          <ul className='space-y-3'>
            {filtered.map((call) => (
              <li key={call.id}>
                <Link
                  to={`/dashboard/calls/${call.id}`}
                  className='block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-gray-200 hover:shadow-md transition-all'
                >
                  <div className='flex items-center gap-4'>
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      call.status === "completed" ? "bg-emerald-50" :
                      call.status === "failed" ? "bg-red-50" :
                      call.status === "missed" ? "bg-amber-50" :
                      "bg-blue-50"
                    }`}>
                      <svg className={`w-6 h-6 ${
                        call.status === "completed" ? "text-emerald-600" :
                        call.status === "failed" ? "text-red-600" :
                        call.status === "missed" ? "text-amber-600" :
                        "text-blue-600"
                      }`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.75} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                      </svg>
                    </div>

                    {/* Info */}
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-semibold text-gray-900'>{call.senior?.name ?? "Unknown Senior"}</p>
                      <p className='text-xs text-gray-500 mt-0.5'>{formatDate(call.createdAt)}</p>
                    </div>

                    {/* Duration */}
                    <div className='text-right pr-2'>
                      <p className='text-sm font-medium text-gray-900'>{formatDuration(call.durationSeconds)}</p>
                      <p className='text-xs text-gray-400'>duration</p>
                    </div>

                    {/* Status badge */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[call.status] ?? "bg-gray-50 text-gray-600"}`}>
                      {call.status}
                    </span>

                    <svg className='w-4 h-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
