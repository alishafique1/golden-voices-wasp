import { useEffect, useState } from "react";
import { useParams } from "wasp/client/router";
import { DashboardLayout } from "./DashboardLayout";
import { getCall } from "../operations";

export function CallDetailPage() {
  const { callId } = useParams<{ callId: string }>();
  const [call, setCall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCall({ id: callId }).then(setCall).finally(() => setLoading(false));
  }, [callId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className='max-w-2xl animate-pulse space-y-4'>
          <div className='h-6 bg-gray-200 rounded w-32' />
          <div className='h-48 bg-gray-100 rounded-2xl' />
        </div>
      </DashboardLayout>
    );
  }

  if (!call) {
    return (
      <DashboardLayout>
        <div className='text-center py-20'>
          <p className='text-gray-500'>Call not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const statusColors: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
    "in-progress": "bg-blue-50 text-blue-700",
    pending: "bg-gray-50 text-gray-600",
  };

  return (
    <DashboardLayout>
      <div className='max-w-2xl space-y-6'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <button onClick={() => history.back()} className='w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors'>
            <svg className='w-4 h-4 text-gray-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
          </button>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>{call.senior?.name}</h2>
            <p className='text-sm text-gray-500'>
              {new Date(call.createdAt).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
          <span className={`ml-auto inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[call.status] ?? "bg-gray-50 text-gray-600"}`}>
            {call.status}
          </span>
        </div>

        {/* Summary */}
        {call.callSummary && (
          <div className='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
            <h3 className='text-sm font-semibold text-gray-900 mb-3'>AI Summary</h3>
            <p className='text-sm text-gray-700 leading-relaxed'>{call.callSummary.summary}</p>
            {call.callSummary.keyTopics && call.callSummary.keyTopics.length > 0 && (
              <div className='mt-4 flex flex-wrap gap-2'>
                {call.callSummary.keyTopics.map((topic: string, i: number) => (
                  <span key={i} className='px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full'>
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Insights */}
        {call.callInsights && call.callInsights.length > 0 && (
          <div className='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
            <h3 className='text-sm font-semibold text-gray-900 mb-3'>Insights</h3>
            <ul className='space-y-2'>
              {call.callInsights.map((insight: any, i: number) => (
                <li key={i} className='flex items-start gap-3'>
                  <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    insight.type === "health_concern" ? "bg-red-100 text-red-600" :
                    insight.type === "mood_positive" ? "bg-emerald-100 text-emerald-600" :
                    insight.type === "mood_negative" ? "bg-orange-100 text-orange-600" :
                    "bg-blue-100 text-blue-600"
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className='text-sm font-medium text-gray-900 capitalize'>{insight.type.replace(/_/g, " ")}</p>
                    <p className='text-xs text-gray-500 mt-0.5'>{insight.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Call metadata */}
        <div className='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-900 mb-4'>Call Details</h3>
          <dl className='grid grid-cols-2 gap-4'>
            {[
              ["Duration", call.durationSeconds ? `${Math.round(call.durationSeconds / 60)} min` : "—"],
              ["Started", new Date(call.createdAt).toLocaleTimeString()],
              ["Ended", call.endedAt ? new Date(call.endedAt).toLocaleTimeString() : "—"],
              ["Language", call.senior?.language?.toUpperCase() ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className='text-xs text-gray-500'>{label}</dt>
                <dd className='text-sm font-medium text-gray-900 mt-0.5'>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </DashboardLayout>
  );
}
