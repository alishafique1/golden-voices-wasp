import { useEffect, useState } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { getCredits } from "../operations";

const PLANS = [
  {
    id: "pay_as_you_go",
    name: "Pay As You Go",
    price: "$0.10",
    period: "per call",
    description: "Perfect for occasional check-ins.",
    features: ["$0.10 per call", "AI summaries included", "Email notifications"],
    color: "from-gray-500 to-gray-600",
  },
  {
    id: "monthly_basic",
    name: "Basic",
    price: "$29",
    period: "/month",
    description: "For families checking in on 1-2 seniors.",
    features: ["Up to 100 calls/month", "AI summaries included", "Multi-language (EN/UR/HI)", "Priority support"],
    color: "from-blue-500 to-blue-600",
    popular: true,
  },
  {
    id: "monthly_premium",
    name: "Premium",
    price: "$79",
    period: "/month",
    description: "For families with 3+ seniors.",
    features: ["Unlimited calls", "AI summaries + insights", "Multi-language (EN/UR/HI)", "Care team access (up to 4)", "Priority support"],
    color: "from-amber-500 to-orange-600",
  },
];

export function BillingPage() {
  const [creditsData, setCreditsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCredits().then(setCreditsData).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Plans & Billing</h2>
          <p className="text-sm text-gray-500 mt-0.5">Choose the plan that fits your family's needs.</p>
        </div>

        {/* Current usage */}
        {!loading && creditsData && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {creditsData.subscription?.planId
                  ? `On ${PLANS.find(p => p.id === creditsData.subscription.planId)?.name ?? creditsData.subscription.planId} plan`
                  : "Pay As You Go"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {creditsData.subscription?.monthlyCallLimit === -1
                  ? "Unlimited calls this month"
                  : creditsData.subscription
                  ? `${creditsData.subscription.callsUsed ?? 0} / ${creditsData.subscription.monthlyCallLimit} calls used this month`
                  : `${creditsData.credits} credits remaining`}
              </p>
            </div>
            {creditsData.subscription?.monthlyCallLimit > 0 && (
              <div className="ml-auto w-32">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, ((creditsData.subscription.callsUsed ?? 0) / creditsData.subscription.monthlyCallLimit) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-6 shadow-sm ${plan.popular ? "border-amber-400" : "border-gray-100"}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">Most Popular</span>
                </div>
              )}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-500">{plan.period}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 mb-4">{plan.description}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  plan.popular
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "border-2 border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {plan.id === "pay_as_you_go" ? "Current (No commitment)" : "Choose Plan"}
              </button>
            </div>
          ))}
        </div>

        {/* Transaction history */}
        {creditsData && creditsData.transactions && creditsData.transactions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
            </div>
            <ul className="divide-y divide-gray-50">
              {creditsData.transactions.slice(0, 10).map((tx: any) => (
                <li key={tx.id} className="flex items-center gap-4 px-6 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.amount > 0 ? "bg-emerald-50" : "bg-gray-50"}`}>
                    <span className={`text-xs font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-gray-500"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
