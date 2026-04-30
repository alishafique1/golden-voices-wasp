import { useState, useEffect } from "react";
import { useNavigate, useParams } from "wasp/client/router";
import { DashboardLayout } from "./DashboardLayout";
import { getSenior, updateSenior } from "../operations";

export function EditSeniorPage() {
  const navigate = useNavigate();
  const { seniorId } = useParams<{ seniorId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    language: "en",
    relationship: "",
    notes: "",
  });

  useEffect(() => {
    if (!seniorId) return;
    getSenior({ id: seniorId }).then((s) => {
      if (s) {
        setForm({
          name: s.name ?? "",
          phone: s.phone ?? "",
          language: s.language ?? "en",
          relationship: s.relationship ?? "",
          notes: s.notes ?? "",
        });
      }
      setLoading(false);
    });
  }, [seniorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSenior({
        id: seniorId!,
        name: form.name,
        phone: form.phone.replace(/\D/g, ""),
        language: form.language,
        relationship: form.relationship,
        notes: form.notes,
      });
      navigate("/dashboard/seniors");
    } catch {
      alert("Failed to update. Please try again.");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow";

  return (
    <DashboardLayout>
      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/seniors")}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900">Edit Senior</h2>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl" />
            ))}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input
                className={inputClass}
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "en", label: "English" },
                  { value: "ur", label: "اردو" },
                  { value: "hi", label: "हिंदी" },
                ].map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setForm({ ...form, language: lang.value })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.language === lang.value
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
              <input
                className={inputClass}
                placeholder="e.g. Grandmother, Uncle"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
              <textarea
                className={inputClass + " resize-none h-24"}
                placeholder="Health concerns, preferred topics..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard/seniors")}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
