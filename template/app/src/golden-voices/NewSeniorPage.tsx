import { useState } from "react";
import { useNavigate } from "wasp/client/router";
import { DashboardLayout } from "./DashboardLayout";
import { createSenior } from "../operations";

export function NewSeniorPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    language: "en",
    relationship: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createSenior({
        ...form,
        phone: form.phone.replace(/\D/g, ""),
      });
      navigate("/dashboard/seniors");
    } catch (err) {
      alert("Failed to add senior. Please check the phone number.");
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow";

  return (
    <DashboardLayout>
      <div className='max-w-lg space-y-6'>
        <div className='flex items-center gap-3'>
          <button onClick={() => navigate("/dashboard/seniors")} className='w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors'>
            <svg className='w-4 h-4 text-gray-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
          </button>
          <h2 className='text-xl font-bold text-gray-900'>Add a Senior</h2>
        </div>

        <form onSubmit={handleSubmit} className='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>Full Name</label>
            <input
              className={inputClass}
              placeholder='e.g. Ammi Jaan'
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>Phone Number</label>
            <input
              className={inputClass}
              placeholder='+1 (416) 555-0100'
              type='tel'
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <p className='text-xs text-gray-400 mt-1.5'>Include country code (e.g. +1 for North America)</p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>Language</label>
            <div className='grid grid-cols-3 gap-3'>
              {[
                { value: "en", label: "English", flag: "🇺🇸" },
                { value: "ur", label: "اردو", flag: "🇵🇰" },
                { value: "hi", label: "हिंदी", flag: "🇮🇳" },
              ].map((lang) => (
                <button
                  key={lang.value}
                  type='button'
                  onClick={() => setForm({ ...form, language: lang.value })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.language === lang.value
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                  }`}
                >
                  <span className='text-xl'>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>Relationship (optional)</label>
            <input
              className={inputClass}
              placeholder='e.g. Grandmother, Uncle'
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>Notes (optional)</label>
            <textarea
              className={inputClass + " resize-none h-24"}
              placeholder='Any health concerns, preferred topics, or things the AI should know...'
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className='flex gap-3 pt-2'>
            <button
              type='button'
              onClick={() => navigate("/dashboard/seniors")}
              className='flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold rounded-xl transition-colors'
            >
              {loading ? "Saving..." : "Add Senior"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
