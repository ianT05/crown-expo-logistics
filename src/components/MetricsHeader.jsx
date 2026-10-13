import React from 'react'

export default function MetricsHeader({ orders, payments }) {
  const totalContainers = orders.reduce((sum, item) => sum + (item.container_count || 0), 0)
  const totalDemanded = orders.reduce((sum, item) => sum + (parseFloat(item.total_fee) || 0), 0)
  const totalCollected = payments.reduce((sum, item) => sum + (parseFloat(item.amount_paid) || 0), 0)
  const outstandingBalance = totalDemanded - totalCollected

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase">Containers Ordered</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalContainers} Containers</h3>
      </div>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase">Total Demanded Fees</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">${totalDemanded.toLocaleString()}</h3>
      </div>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <p className="text-xs font-semibold text-emerald-600 uppercase">Client Payments Collected</p>
        <h3 className="text-2xl font-bold text-emerald-600 mt-1">${totalCollected.toLocaleString()}</h3>
      </div>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <p className="text-xs font-semibold text-amber-600 uppercase">Outstanding Balance</p>
        <h3 className="text-2xl font-bold text-amber-600 mt-1">${outstandingBalance.toLocaleString()}</h3>
      </div>
    </div>
  )
}