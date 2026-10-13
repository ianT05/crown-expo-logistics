import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import MetricsHeader from './components/MetricsHeader'
import { 
  Crown, LogOut, Package, CreditCard, Anchor, PlusCircle, 
  DollarSign, FileText, Truck, UploadCloud, Download, Percent, 
  CheckCircle2, AlertCircle, Edit3, X, Eye
} from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [shippingLogs, setShippingLogs] = useState([])
  const [commissions, setCommissions] = useState([])
  
  // UI State
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [toast, setToast] = useState(null)

  // Form states: Container Orders & Vendors
  const [orderNumber, setOrderNumber] = useState('')
  const [vendingCompany, setVendingCompany] = useState('')
  const [containerCount, setContainerCount] = useState(1)
  const [totalFee, setTotalFee] = useState('')
  const [hasContract, setHasContract] = useState('No')
  const [customerExperience, setCustomerExperience] = useState('')
  const [invoiceFile, setInvoiceFile] = useState(null)

  // Form states: Payments
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [clientName, setClientName] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)

  // Form states: Shipping & Logistics
  const [shipOrderId, setShipOrderId] = useState('')
  const [logisticsCompany, setLogisticsCompany] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [logisticsFee, setLogisticsFee] = useState('')
  const [depDate, setDepDate] = useState('')
  const [arrDate, setArrDate] = useState('')
  const [logisticsInvoiceFile, setLogisticsInvoiceFile] = useState(null)
  const [logisticsReceiptFile, setLogisticsReceiptFile] = useState(null)
  const [billOfLadingFile, setBillOfLadingFile] = useState(null)

  // Form states: Commission
  const [commissionOrderId, setCommissionOrderId] = useState('')
  const [commissionAmount, setCommissionAmount] = useState('')
  const [commissionDate, setCommissionDate] = useState('')
  const [commissionReceiptFile, setCommissionReceiptFile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchAllData()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchAllData()
    })

    return () => subscription.unsubscribe()
  }, [])

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Pass currentUser directly so it doesn't rely on pending React state updates
  async function fetchAllData(currentUser = session?.user) {
    try {
      const userId = currentUser?.id
      if (!userId) return

      const { data: o } = await supabase
        .from('container_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      const { data: p } = await supabase
        .from('client_payments')
        .select('*, container_orders(order_number)')
        .eq('user_id', userId)
        .order('payment_date', { ascending: false })

      const { data: s } = await supabase
        .from('shipping_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      const { data: c } = await supabase
        .from('commissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      setOrders(o || [])
      setPayments(p || [])
      setShippingLogs(s || [])
      setCommissions(c || [])
    } catch (err) {
      console.error('Data fetch error:', err)
      showToast('Error syncing latest records', 'error')
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchAllData(session.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) fetchAllData(session.user)
    })

    return () => subscription.unsubscribe()
  }, [])
  
  // Instant Inline Update for Orders
  async function handleUpdateOrderField(orderId, field, newValue) {
    const { error } = await supabase
      .from('container_orders')
      .update({ [field]: newValue })
      .eq('id', orderId)

    if (error) {
      showToast('Update failed: ' + error.message, 'error')
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, [field]: newValue } : o))
      showToast('Record updated')
    }
  }

  // Storage Upload Helper
  async function uploadFileToBucket(bucket, file, pathPrefix = '') {
    if (!file) return null
    const fileExt = file.name.split('.').pop()
    const fileName = `${pathPrefix}${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { cacheControl: '3600', upsert: true })

    if (uploadError) throw new Error(`Upload failed (${bucket}): ${uploadError.message}`)

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return urlData.publicUrl
  }

  // Handler: Add Order
  async function handleAddOrder(e) {
    e.preventDefault()
    setUploading(true)
    setUploadProgress('Saving order & uploading invoice...')

    try {
      let invoiceUrl = await uploadFileToBucket('invoices', invoiceFile)

      const { error } = await supabase.from('container_orders').insert([{
        order_number: orderNumber,
        vending_company: vendingCompany,
        container_count: parseInt(containerCount),
        total_fee: parseFloat(totalFee),
        has_contract: hasContract,
        customer_experience: customerExperience,
        invoice_url: invoiceUrl,
        user_id: session?.user?.id
      }])

      if (error) throw error

      showToast('Container order saved successfully!')
      setOrderNumber('')
      setVendingCompany('')
      setContainerCount(1)
      setTotalFee('')
      setHasContract('No')
      setCustomerExperience('')
      setInvoiceFile(null)
      fetchAllData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  // Handler: Add Client Payment
  async function handleAddPayment(e) {
    e.preventDefault()
    setUploading(true)
    setUploadProgress('Recording payment & attachment...')

    try {
      let receiptUrl = await uploadFileToBucket('receipts', receiptFile)

      const { error } = await supabase.from('client_payments').insert([{
        order_id: selectedOrderId,
        client_name: clientName,
        amount_paid: parseFloat(amountPaid),
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        notes: paymentNotes,
        receipt_url: receiptUrl,
        user_id: session?.user?.id
      }])

      if (error) throw error

      showToast('Client payment recorded!')
      setClientName('')
      setAmountPaid('')
      setPaymentNotes('')
      setReceiptFile(null)
      fetchAllData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  // Handler: Add Shipping & Logistics
  async function handleAddShipping(e) {
    e.preventDefault()
    setUploading(true)
    setUploadProgress('Uploading logistics document suite...')

    try {
      let invoiceUrl = await uploadFileToBucket('shipping_docs', logisticsInvoiceFile, 'Invoices/')
      let receiptUrl = await uploadFileToBucket('shipping_docs', logisticsReceiptFile, 'Receipts/')
      let bolUrl = await uploadFileToBucket('shipping_docs', billOfLadingFile, 'Bills_of_Lading/')

      const payload = {
        order_id: shipOrderId || null,
        logistics_company: logisticsCompany,
        carrier_name: logisticsCompany,
        reference_number: referenceNumber,
        logistics_fee: logisticsFee ? parseFloat(logisticsFee) : 0,
        departure_date: depDate || null,
        arrival_date: arrDate || null,
        logistics_invoice_url: invoiceUrl,
        logistics_receipt_url: receiptUrl,
        bill_of_lading_url: bolUrl,
        user_id: session?.user?.id
      }

      const { error } = await supabase.from('shipping_logs').insert([payload])
      if (error) throw error

      showToast('Logistics record saved successfully!')
      setShipOrderId('')
      setLogisticsCompany('')
      setReferenceNumber('')
      setLogisticsFee('')
      setDepDate('')
      setArrDate('')
      setLogisticsInvoiceFile(null)
      setLogisticsReceiptFile(null)
      setBillOfLadingFile(null)

      fetchAllData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  // Handler: Add Commission
  async function handleAddCommission(e) {
    e.preventDefault()
    setUploading(true)
    setUploadProgress('Uploading commission receipt...')

    try {
      let receiptUrl = await uploadFileToBucket('receipts', commissionReceiptFile, 'commissions/')

      const payload = {
        order_id: commissionOrderId || null,
        amount: parseFloat(commissionAmount),
        date_received: commissionDate || new Date().toISOString().split('T')[0],
        receipt_url: receiptUrl,
        user_id: session?.user?.id
      }

      const { error } = await supabase.from('commissions').insert([payload])
      if (error) throw error

      showToast('Commission payment saved!')
      setCommissionOrderId('')
      setCommissionAmount('')
      setCommissionDate('')
      setCommissionReceiptFile(null)

      fetchAllData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  if (!session) return <Auth />

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-4 backdrop-blur-md bg-slate-900/90"
             style={{ borderColor: toast.type === 'error' ? '#f87171' : '#34d399' }}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className={toast.type === 'error' ? 'text-red-200' : 'text-emerald-200'}>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <img 
                src="/logo.png" 
                alt="Crown Expo" 
                className="w-6 h-6 object-contain" 
                onError={(e) => { e.target.style.display = 'none'; document.getElementById('header-fallback-crown').style.display = 'block'; }} 
              />
              <Crown id="header-fallback-crown" className="w-5 h-5 text-slate-950 hidden" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Crown Expo Company
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Logistics & Operations Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              {session.user.email}
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl border border-slate-700 font-semibold transition cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Metric Cards Header */}
        <MetricsHeader orders={orders} payments={payments} />

        {/* Tab Selection Switcher */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'orders', label: 'Container Orders & Vendors', icon: Package },
            { id: 'payments', label: 'Client Payments Ledger', icon: CreditCard },
            { id: 'shipping', label: 'Shipping & Logistics', icon: Anchor },
            { id: 'commission', label: 'Commission', icon: Percent }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-500' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ==================== TAB 1: CONTAINER ORDERS ==================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Form Section */}
            <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-500" /> Log Container Order & Vendor
              </h2>

              <form onSubmit={handleAddOrder} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order #</label>
                  <input type="text" placeholder="e.g. ORD-2026-01" value={orderNumber} onChange={(e)=>setOrderNumber(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vending Company</label>
                  <input type="text" placeholder="Vendor / Supplier Name" value={vendingCompany} onChange={(e)=>setVendingCompany(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Container Count</label>
                  <input type="number" min="1" value={containerCount} onChange={(e)=>setContainerCount(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Demanded Fee ($)</label>
                  <input type="number" placeholder="Total Cost" value={totalFee} onChange={(e)=>setTotalFee(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contract Status</label>
                  <select value={hasContract} onChange={(e)=>setHasContract(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition">
                    <option value="Yes">Yes (Contract Active)</option>
                    <option value="No">No Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vendor Invoice Attachment</label>
                  <input 
                    type="file" 
                    accept="application/pdf,image/*"
                    onChange={(e)=>setInvoiceFile(e.target.files[0])}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 cursor-pointer" 
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Customer Experience / Expectations Notes</label>
                  <input type="text" placeholder="Initial client expectations or feedback..." value={customerExperience} onChange={(e)=>setCustomerExperience(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                </div>

                <button type="submit" disabled={uploading} className="md:col-span-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                  {uploading ? <><UploadCloud className="w-4 h-4 animate-bounce" /> {uploadProgress || 'Processing...'}</> : 'Save Container Order'}
                </button>
              </form>
            </section>

            {/* Table Section */}
            <section className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto backdrop-blur-sm">
              <table className="w-full text-left text-sm min-w-[900px]">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Vendor</th>
                    <th className="py-3.5 px-4">Containers</th>
                    <th className="py-3.5 px-4">Demanded Fee</th>
                    <th className="py-3.5 px-4">Contract Status</th>
                    <th className="py-3.5 px-4">Customer Experience Review</th>
                    <th className="py-3.5 px-4">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{o.order_number}</td>
                      <td className="py-3.5 px-4 text-slate-300">{o.vending_company}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-semibold">{o.container_count}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">${parseFloat(o.total_fee).toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <select 
                          value={o.has_contract || 'No'} 
                          onChange={(e) => handleUpdateOrderField(o.id, 'has_contract', e.target.value)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer focus:outline-none transition ${
                            o.has_contract === 'Yes' 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          <option value="Yes">Yes (Contract Active)</option>
                          <option value="No">No Contract</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="relative flex items-center group">
                          <input
                            type="text"
                            defaultValue={o.customer_experience || ''}
                            placeholder="Click to type review..."
                            onBlur={(e) => {
                              if (e.target.value !== (o.customer_experience || '')) {
                                handleUpdateOrderField(o.id, 'customer_experience', e.target.value)
                              }
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                            className="w-full bg-transparent group-hover:bg-slate-950/60 border border-transparent group-hover:border-slate-700 focus:border-blue-500 focus:bg-slate-950 px-2.5 py-1 rounded-lg text-xs text-slate-200 transition focus:outline-none"
                          />
                          <Edit3 className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 absolute right-2 pointer-events-none transition" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {o.invoice_url ? (
                          <a 
                            href={o.invoice_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition"
                          >
                            <FileText className="w-3.5 h-3.5" /> Invoice <Download className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-600 font-medium">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500 text-sm">No container orders logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* ==================== TAB 2: CLIENT PAYMENTS ==================== */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Record Client Installment Payment
              </h2>
              <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order Reference</label>
                  <select value={selectedOrderId} onChange={(e)=>setSelectedOrderId(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition">
                    <option value="">Select Order Reference...</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} - {o.vending_company}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Client Name</label>
                  <input type="text" placeholder="Client Name" value={clientName} onChange={(e)=>setClientName(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Amount Paid ($)</label>
                  <input type="number" placeholder="Amount ($)" value={amountPaid} onChange={(e)=>setAmountPaid(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Date</label>
                  <input type="date" value={paymentDate} onChange={(e)=>setPaymentDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Receipt Attachment</label>
                  <input 
                    type="file" 
                    accept="application/pdf,image/*"
                    onChange={(e)=>setReceiptFile(e.target.files[0])}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600/10 file:text-emerald-400 hover:file:bg-emerald-600/20 cursor-pointer" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes / Transaction Reference</label>
                  <input type="text" placeholder="Transaction ref / notes..." value={paymentNotes} onChange={(e)=>setPaymentNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition" />
                </div>
                <button type="submit" disabled={uploading} className="md:col-span-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                  {uploading ? <><UploadCloud className="w-4 h-4 animate-bounce" /> {uploadProgress || 'Processing...'}</> : 'Record Installment Payment'}
                </button>
              </form>
            </section>

            <section className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto backdrop-blur-sm">
              <table className="w-full text-left text-sm min-w-[750px]">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Amount Paid</th>
                    <th className="py-3.5 px-4">Notes</th>
                    <th className="py-3.5 px-4">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 text-xs">{p.payment_date}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{p.container_orders?.order_number || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-200">{p.client_name}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">+${parseFloat(p.amount_paid).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">{p.notes || '-'}</td>
                      <td className="py-3.5 px-4">
                        {p.receipt_url ? (
                          <a 
                            href={p.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
                          >
                            <FileText className="w-3.5 h-3.5" /> Receipt <Download className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-600 font-medium">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">No payment records logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* ==================== TAB 3: SHIPPING & LOGISTICS ==================== */}
        {activeTab === 'shipping' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-500" /> Log Shipping & Logistics Record
                </h2>
                <span className="text-xs text-slate-500">Supports PDF/Image uploads</span>
              </div>

              <form onSubmit={handleAddShipping} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order Reference</label>
                    <select value={shipOrderId} onChange={(e)=>setShipOrderId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition">
                      <option value="">Select Order...</option>
                      {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} ({o.vending_company})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Logistics Company</label>
                    <input type="text" placeholder="e.g. Maersk, DHL, BlueDart" value={logisticsCompany} onChange={(e)=>setLogisticsCompany(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tracking / Ref #</label>
                    <input type="text" placeholder="e.g. TRK-9908123X" value={referenceNumber} onChange={(e)=>setReferenceNumber(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Demanded Amount ($)</label>
                    <input type="number" placeholder="Logistics Fee ($)" value={logisticsFee} onChange={(e)=>setLogisticsFee(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Departure Date</label>
                    <input type="date" value={depDate} onChange={(e)=>setDepDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Arrival Date</label>
                    <input type="date" value={arrDate} onChange={(e)=>setArrDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Logistics Documents Attachment Suite
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Logistics Invoice</label>
                      <input type="file" accept="application/pdf,image/*" onChange={(e)=>setLogisticsInvoiceFile(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Payment Receipt</label>
                      <input type="file" accept="application/pdf,image/*" onChange={(e)=>setLogisticsReceiptFile(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Bill of Lading (BoL)</label>
                      <input type="file" accept="application/pdf,image/*" onChange={(e)=>setBillOfLadingFile(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                  {uploading ? <><UploadCloud className="w-4 h-4 animate-bounce" /> {uploadProgress || 'Processing...'}</> : 'Save Shipping & Logistics Record'}
                </button>
              </form>
            </section>

            <section className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto backdrop-blur-sm">
              <table className="w-full text-left text-sm min-w-[950px]">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Logistics Company</th>
                    <th className="py-3.5 px-4">Tracking / Ref #</th>
                    <th className="py-3.5 px-4">Departure</th>
                    <th className="py-3.5 px-4">Arrival</th>
                    <th className="py-3.5 px-4">Demanded Fee</th>
                    <th className="py-3.5 px-4 text-center">Attached Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {shippingLogs.map((s, idx) => {
                    const matchedOrder = orders.find(o => o.id === s.order_id)
                    const orderNum = matchedOrder ? matchedOrder.order_number : 'General Shipping'
                    return (
                      <tr key={s.id || idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{orderNum}</td>
                        <td className="py-3.5 px-4 text-slate-200">{s.logistics_company || s.carrier_name || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{s.reference_number || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">{s.departure_date || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">{s.arrival_date || '-'}</td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {s.logistics_fee ? `$${parseFloat(s.logistics_fee).toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {s.logistics_invoice_url && (
                              <a href={s.logistics_invoice_url} target="_blank" rel="noopener noreferrer" download className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Invoice <Download className="w-3 h-3" />
                              </a>
                            )}
                            {s.logistics_receipt_url && (
                              <a href={s.logistics_receipt_url} target="_blank" rel="noopener noreferrer" download className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Receipt <Download className="w-3 h-3" />
                              </a>
                            )}
                            {s.bill_of_lading_url && (
                              <a href={s.bill_of_lading_url} target="_blank" rel="noopener noreferrer" download className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1">
                                <FileText className="w-3 h-3" /> BoL <Download className="w-3 h-3" />
                              </a>
                            )}
                            {!s.logistics_invoice_url && !s.logistics_receipt_url && !s.bill_of_lading_url && (
                              <span className="text-xs text-slate-600 font-medium">None</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {shippingLogs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500 text-sm">No shipping & logistics records logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* ==================== TAB 4: COMMISSION ==================== */}
        {activeTab === 'commission' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-500" /> Log Commission Payment
              </h2>
              <form onSubmit={handleAddCommission} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order No.</label>
                  <select value={commissionOrderId} onChange={(e)=>setCommissionOrderId(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition">
                    <option value="">Select Order No. ...</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} ({o.vending_company})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Amount ($)</label>
                  <input type="number" step="any" placeholder="Commission Amount" value={commissionAmount} onChange={(e)=>setCommissionAmount(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Received</label>
                  <input type="date" value={commissionDate} onChange={(e)=>setCommissionDate(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Commission Receipt Attachment</label>
                  <input type="file" accept="application/pdf,image/*" onChange={(e)=>setCommissionReceiptFile(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 cursor-pointer" />
                </div>
                <button type="submit" disabled={uploading} className="md:col-span-2 lg:col-span-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-2">
                  {uploading ? <><UploadCloud className="w-4 h-4 animate-bounce" /> {uploadProgress || 'Processing...'}</> : 'Save Commission Record'}
                </button>
              </form>
            </section>

            <section className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto backdrop-blur-sm">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Order No.</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Date Received</th>
                    <th className="py-3.5 px-4">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {commissions.map((c, idx) => {
                    const matchedOrder = orders.find(o => o.id === c.order_id)
                    const orderNum = matchedOrder ? matchedOrder.order_number : 'General Order'
                    return (
                      <tr key={c.id || idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{orderNum}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">${parseFloat(c.amount).toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-slate-300">{c.date_received || '-'}</td>
                        <td className="py-3.5 px-4">
                          {c.receipt_url ? (
                            <a href={c.receipt_url} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition">
                              <FileText className="w-3.5 h-3.5" /> Receipt <Download className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-600 font-medium">None</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500 text-sm">No commission records logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>
        )}

      </main>
    </div>
  )
}