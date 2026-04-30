import { useEffect, useState } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { getScheduledCalls, cancelScheduledCall } from "../operations";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  every_other_day: "Every other day",
  weekly: "Weekly",
  bi_weekly: "Every 2 weeks",
};

export function SchedulePage() {
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScheduledCalls().then(setScheduleItems).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this schedule?")) return;
    await cancelScheduledCall({ id });
    setScheduleItems((prev) => prev.filter((s) => s.id !== id));
  };

  const nextDate = (next: string) =>
    new Date(next).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Call Schedule</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage automated check-in calls for each senior.</p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
          </div>
        ) : scheduleItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-900 mb-1">No schedules yet</p>
            <p className="text-sm text-gray-500">Go to a senior's profile to set up recurring calls.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduleItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.senior?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{FREQUENCY_LABELS[item.frequency] ?? item.frequency}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{item.time}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-emerald-600">Next</p>
                  <p className="text-xs text-gray-500">{nextDate(item.nextCallAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-500"}`}>
                    {item.enabled ? "Active" : "Paused"}
                  </span>
                  <button onClick={() => handleCancel(item.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
