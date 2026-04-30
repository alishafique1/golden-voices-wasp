import { useEffect, useState } from "react";
import { Link } from "wasp/client/router";
import { DashboardLayout } from "./DashboardLayout";
import { getDashboardStats } from "../operations";
import type { GetDashboardStats } from "../operations";

export function DashboardPage() {
  const [stats, setStats] = useState<GetDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-48' />
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-28 bg-gray-100 rounded-2xl' />
            ))}
          </div>
          <div className='h-64 bg-gray-100 rounded-2xl' />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      label: "Total Calls",
      value: stats?.totalCalls ?? 0,
      icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      label: "This Month",
      value: stats?.callsThisMonth ?? 0,
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      color: "from-violet-500 to-violet-600",
      bg: "bg-violet-50",
      text: "text-violet-700",
    },
    {
      label: "Seniors",
      value: stats?.totalSeniors ?? 0,
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
    {
      label: "Credits Left",
      value: stats?.credits ?? 0,
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
  ];

  return (
    <DashboardLayout>
      <div className='space-y-8'>
        {/* Header */}
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Good morning</h2>
          <p className='mt-1 text-gray-500'>Here's what's happening with your calls today.</p>
        </div>

        {/* Stat cards */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          {statCards.map((card) => (
            <div key={card.label} className='bg-white rounded-2xl border border-gray-100 p-5 shadow-sm'>
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <svg className={`w-5 h-5 ${card.text}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.75} d={card.icon} />
                </svg>
              </div>
              <p className='text-2xl font-bold text-gray-900'>{card.value}</p>
              <p className='text-sm text-gray-500 mt-0.5'>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Recent calls */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm'>
          <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
            <h3 className='text-base font-semibold text-gray-900'>Recent Calls</h3>
            <Link to='/dashboard/calls' className='text-sm font-medium text-amber-600 hover:text-amber-700'>
              View all
            </Link>
          </div>
          {stats?.recentCalls && stats.recentCalls.length > 0 ? (
            <ul className='divide-y divide-gray-50'>
              {stats.recentCalls.map((call) => (
                <li key={call.id}>
                  <Link
                    to={`/dashboard/calls/${call.id}`}
                    className='flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors'
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      call.status === "completed" ? "bg-emerald-50" : call.status === "failed" ? "bg-red-50" : "bg-blue-50"
                    }`}>
                      <svg className={`w-5 h-5 ${
                        call.status === "completed" ? "text-emerald-600" : call.status === "failed" ? "text-red-600" : "text-blue-600"
                      }`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.75} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                      </svg>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>{call.senior?.name}</p>
                      <p className='text-xs text-gray-500 mt-0.5'>
                        {new Date(call.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        call.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                        call.status === "failed" ? "bg-red-50 text-red-700" :
                        call.status === "in-progress" ? "bg-blue-50 text-blue-700" :
                        "bg-gray-50 text-gray-600"
                      }`}>
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
          ) : (
            <div className='px-6 py-16 text-center'>
              <div className='w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                <svg className='w-7 h-7 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                </svg>
              </div>
              <p className='text-sm font-medium text-gray-900 mb-1'>No calls yet</p>
              <p className='text-sm text-gray-500'>Add a senior to get started with your first call.</p>
              <Link
                to='/dashboard/seniors/new'
                className='mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors'
              >
                <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                </svg>
                Add your first senior
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
