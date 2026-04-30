import { useEffect, useState } from "react";
import { Link } from "wasp/client/router";
import { DashboardLayout } from "./DashboardLayout";
import { getSeniors, deleteSenior } from "../operations";

export function SeniorsListPage() {
  const [seniors, setSeniors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSeniors().then(setSeniors).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (seniorId: string) => {
    if (!confirm("Remove this senior?")) return;
    await deleteSenior({ id: seniorId });
    setSeniors((prev) => prev.filter((s) => s.id !== seniorId));
  };

  return (
    <DashboardLayout>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Seniors</h2>
            <p className='text-sm text-gray-500 mt-0.5'>Manage the people you check in on.</p>
          </div>
          <Link
            to='/dashboard/seniors/new'
            className='inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm'
          >
            <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            Add Senior
          </Link>
        </div>

        {loading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse'>
            {[...Array(2)].map((_, i) => (
              <div key={i} className='h-32 bg-gray-100 rounded-2xl' />
            ))}
          </div>
        ) : seniors.length === 0 ? (
          <div className='bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm'>
            <div className='w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <svg className='w-7 h-7 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' />
              </svg>
            </div>
            <p className='text-sm font-medium text-gray-900 mb-1'>No seniors added yet</p>
            <p className='text-sm text-gray-500'>Add your first senior to start receiving AI-powered check-in calls.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {seniors.map((senior) => (
              <div key={senior.id} className='bg-white rounded-2xl border border-gray-100 p-5 shadow-sm'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0'>
                    <span className='text-lg font-bold text-white'>
                      {senior.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-base font-semibold text-gray-900'>{senior.name}</p>
                    <p className='text-sm text-gray-500 mt-0.5'>{senior.phone}</p>
                    <div className='flex items-center gap-2 mt-2'>
                      <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700'>
                        {senior.language?.toUpperCase()}
                      </span>
                      {senior.relationship && (
                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600'>
                          {senior.relationship}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='flex flex-col items-end gap-2'>
                    <div className={`w-2 h-2 rounded-full ${senior.isActive ? "bg-emerald-400" : "bg-gray-300"}`} />
                    <div className='flex gap-1'>
                      <Link
                        to={`/dashboard/seniors/${senior.id}/edit`}
                        className='w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'
                      >
                        <svg className='w-3.5 h-3.5 text-gray-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(senior.id)}
                        className='w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-colors'
                      >
                        <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                {senior.notes && (
                  <p className='mt-3 text-xs text-gray-500 line-clamp-2'>{senior.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
