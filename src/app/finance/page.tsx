'use client'
export const dynamic = 'force-dynamic'

import { useState, useMemo, useEffect } from 'react'
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Image from 'next/image'
import Link from 'next/link'
import { AddIcon } from '@/components/icons/AddIcon'
import { ExpenseList } from '@/components/ExpenseList'
import { AddExpenseModal, ExpenseForm } from '@/components/AddExpenseModal'
import { ExportExcelButton } from '@/components/ExportExcelButton'
import { CalendarDaysIcon, HomeIcon, ChartBarIcon } from '@heroicons/react/24/solid'
import { FinanceDashboard } from '@/components/FinanceDashboard'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { SearchBar } from '@/components/SearchBar'
import { DatabaseService } from '@/lib/database'
import { Transaction } from '@/lib/supabase'



dayjs.locale('th')

// Helper function สำหรับ localStorage
const getLocalStorage = (key: string) => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(key)
}

const setLocalStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, value)
}

// สำหรับ dropdown เลือกสัปดาห์
function getWeeksInMonth(month: string) {
  const [year, m] = month.split('-').map(Number)
  const first = dayjs(`${year}-${m}-01`)
  const last = first.endOf('month')
  const weeks: { value: string; label: string; start: dayjs.Dayjs; end: dayjs.Dayjs }[] = []
  let start = first.startOf('week')
  let i = 1
  while (start.isBefore(last)) {
    const end = start.endOf('week')
    weeks.push({
      value: `${start.format('YYYY-MM-DD')}_${end.format('YYYY-MM-DD')}`,
      label: `สัปดาห์ที่ ${i} (${start.format('D/M')} - ${end.format('D/M')})`,
      start: start,
      end: end
    })
    start = start.add(1, 'week')
    i++
  }
  return weeks
}

const PAGES = [
  { key: 'day', label: 'รายวัน', icon: <HomeIcon className="w-5 h-5 mr-1" /> },
  { key: 'period', label: 'สัปดาห์/เดือน', icon: <CalendarDaysIcon className="w-5 h-5 mr-1" /> },
  { key: 'dashboard', label: 'แดชบอร์ด', icon: <ChartBarIcon className="w-5 h-5 mr-1" /> },
]

export default function Home() {
  // App State
  const [open, setOpen] = useState(false)
  const [editData, setEditData] = useState<Transaction | null>(null)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState("day")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // โหลดข้อมูลจาก Supabase - ปิดชั่วคราวเพื่อใช้ข้อมูลตัวอย่าง
  useEffect(() => {
    const loadTransactions = async () => {
      if (typeof window === 'undefined') return // ป้องกัน SSR
      
      try {
        setIsLoading(true)
        const isConnected = await DatabaseService.testConnection()
        if (!isConnected) {
          console.warn('ไม่สามารถเชื่อมต่อฐานข้อมูลได้')
          return
        }
        const data = await DatabaseService.getFinanceTransactions()
        setTransactions(data)
      } catch (error) {
        console.warn('กำลังใช้ข้อมูลสำรองในเครื่อง (Local Storage)', error)
        const savedData = getLocalStorage('finance_transactions')
        if (savedData) setTransactions(JSON.parse(savedData))
      } finally {
        setIsLoading(false)
      }
    }
    loadTransactions()
    const subscription = DatabaseService.subscribeToFinanceTransactions(setTransactions)
    // Ensure cleanup is always synchronous
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    }
  }, [])

  // Animation สำหรับกราฟเมื่อเข้าหน้า dashboard
  // Filter State
  // Default to current month for period view
  const currentMonth = dayjs().format('YYYY-MM')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedWeek, setSelectedWeek] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  // useMemo calculations (all hooks must be at the top, no conditional hooks)
  const today = new Date().toISOString().split('T')[0]
  // Today's expense
  const todayExpense = useMemo(() =>
    transactions.filter(t => t.date === today)
      .reduce((sum, t) => sum + (t.price ?? 0), 0),
    [transactions, today]
  )

  // Animated counter for todayExpense
  const [displayedTodayExpense, setDisplayedTodayExpense] = useState(0)
  useEffect(() => {
    const start = displayedTodayExpense
    const end = todayExpense
    if (start === end) return
    let frame: number
    const duration = 800
    const startTime = performance.now()
    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const value = Math.round(start + (end - start) * progress)
      setDisplayedTodayExpense(value)
      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [todayExpense, displayedTodayExpense])

  // Period filter options
  const periodMonths = useMemo(() => {
    const arr = []
    const start = dayjs('2025-07-01')
    const end = dayjs()
    let d = start.startOf('month')
    while (d.isBefore(end) || d.isSame(end, 'month')) {
      arr.push({
        value: d.format('YYYY-MM'),
        label: d.locale('th').format('MMMM YYYY')
      })
      d = d.add(1, 'month')
    }
    return arr
  }, [])
  const weeks = useMemo(() => getWeeksInMonth(selectedMonth), [selectedMonth])

  // Period filtering and calculations (declare only once)
  const filteredMonth = useMemo(() => {
    return transactions
      .filter(t => t.date?.slice(0, 7) === selectedMonth)
      .filter(t => !selectedCategory || t.category === selectedCategory)
  }, [transactions, selectedMonth, selectedCategory]);

  const filteredWeek = useMemo(() => {
    if (selectedWeek) {
      const [start, end] = selectedWeek.split('_');
      return filteredMonth.filter(t => t.date >= start && t.date <= end);
    }
    return filteredMonth;
  }, [filteredMonth, selectedWeek]);

  const totalCount = (selectedWeek ? filteredWeek : filteredMonth).length;

  // Event Handlers
  const handleEdit = (id: string) => {
    const tx = transactions.find((t) => t.id === id)
    if (tx) {
      setEditData(tx)
      setOpen(true)
    }
  }

  // --- Delete Modal State ---
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ลบข้อมูลทันที
  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true)
      
      // ลบออกจาก state ทันทีเพื่อ UX ที่ดีขึ้น
      setTransactions(prev => prev.filter(t => t.id !== id))
      
      try {
        await DatabaseService.deleteFinanceTransaction(id)
        console.log('Transaction deleted successfully:', id) // Debug log
        
        // Refresh data as fallback if real-time doesn't work
        const updatedTransactions = await DatabaseService.getFinanceTransactions()
        setTransactions(updatedTransactions)
      } catch (dbError: unknown) {
        console.error('Database delete error:', dbError)
        
        // Fallback ใช้ localStorage
        console.log('Using localStorage fallback for delete...')
        const savedTransactions = getLocalStorage('finance_transactions')
        if (savedTransactions) {
          const currentTransactions = JSON.parse(savedTransactions)
          const filteredTransactions = currentTransactions.filter((t: Transaction) => t.id !== id)
          setLocalStorage('finance_transactions', JSON.stringify(filteredTransactions))
          setTransactions(filteredTransactions)
        }
        
        console.log('ลบข้อมูลในเครื่องสำเร็จ (ออฟไลน์โหมด)')
      }
      
      // ข้อมูลจะอัปเดตอัตโนมัติผ่าน real-time subscription
    } catch (error: unknown) {
      console.error('Error deleting data:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('เกิดข้อผิดพลาดในการลบข้อมูล: ' + errorMessage)
      
      // หากเกิดข้อผิดพลาด ให้โหลดข้อมูลใหม่
      try {
        const updatedTransactions = await DatabaseService.getFinanceTransactions()
        setTransactions(updatedTransactions)
      } catch (loadError) {
        console.error('Error loading transactions after delete failure:', loadError)
        // ใช้ localStorage เป็น fallback
        const savedData = getLocalStorage('finance_transactions')
        if (savedData) {
          setTransactions(JSON.parse(savedData))
        }
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    await handleDelete(deleteId)
    setDeleteId(null)
  }

  const handleAdd = async (data: ExpenseForm) => {
    try {
      setIsLoading(true)
      
      const newTransaction = {
        category: data.category,
        detail: data.detail || '',
        date: data.date,
        price: data.amount ?? 0,
        cost: 0,
        profit: 0,
        brand: '',
        model: '',
        repair_detail: '',
        accessory_detail: '',
        service_detail: ''
      }
      
      console.log('Transaction to save:', newTransaction) // Debug log
      
      try {
        await DatabaseService.createFinanceTransaction(newTransaction)
        console.log('Transaction saved successfully') // Debug log
        
        // Refresh data as fallback if real-time doesn't work
        const updatedTransactions = await DatabaseService.getFinanceTransactions()
        setTransactions(updatedTransactions)
      } catch (dbError: unknown) {
        console.error('Database error:', dbError)
        
        // Fallback ใช้ localStorage
        console.log('Using localStorage fallback...')
        const savedTransactions = getLocalStorage('finance_transactions')
        const currentTransactions = savedTransactions ? JSON.parse(savedTransactions) : []
        
        const newTransactionWithId = {
          ...newTransaction,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const updatedTransactions = [newTransactionWithId, ...currentTransactions]
        setLocalStorage('finance_transactions', JSON.stringify(updatedTransactions))
        setTransactions(updatedTransactions)
        
        alert('บันทึกข้อมูลในเครื่องสำเร็จ (ออฟไลน์โหมด)')
      }
      
      // ข้อมูลจะอัปเดตอัตโนมัติผ่าน real-time subscription
    } catch (error: unknown) {
      console.error('Error saving data:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + errorMessage)
    } finally {
      setIsLoading(false)
      setEditData(null)
      setOpen(false)
    }
  }

  const handleEditSubmit = async (data: ExpenseForm) => {
    try {
      setIsLoading(true)
      if (!editData?.id) throw new Error('Invalid edit data')
      
      const updates = {
        category: data.category,
        detail: data.detail || '',
        date: data.date,
        price: data.amount ?? 0,
        cost: 0,
        profit: 0,
        brand: '',
        model: '',
        repair_detail: '',
        accessory_detail: '',
        service_detail: ''
      }
      
      try {
        await DatabaseService.updateFinanceTransaction(editData.id, updates)
        
        // Refresh data as fallback if real-time doesn't work
        const updatedTransactions = await DatabaseService.getFinanceTransactions()
        setTransactions(updatedTransactions)
      } catch (dbError: unknown) {
        console.error('Database error:', dbError)
        
        // ถ้าเป็นปัญหาจากฟิลด์ที่ไม่มีในฐานข้อมูล ให้ลองส่งข้อมูลแบบพื้นฐาน
        const error = dbError as { message?: string; code?: string }
        if (error?.message?.includes('column') || error?.code === '42703') {
          console.log('Trying to update with basic fields only...')
          const basicUpdates = {
            category: data.category,
            detail: data.detail || '',
            date: data.date,
            price: data.amount ?? 0,
            cost: 0,
            profit: 0,
          }
          await DatabaseService.updateFinanceTransaction(editData.id, basicUpdates)
          const updatedTransactions = await DatabaseService.getFinanceTransactions()
          setTransactions(updatedTransactions)
        } else {
          throw dbError
        }
      }
      
      // ข้อมูลจะอัปเดตอัตโนมัติผ่าน real-time subscription
      setEditData(null)
      setOpen(false)
    } catch (error: unknown) {
      console.error('Error updating data:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ' + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const expenseCategories = [
    'ค่าอาหาร/เครื่องดื่ม',
    'ค่าจ้าง/เงินเดือน',
    'ค่าเช่า',
    'ค่าน้ำ/ค่าไฟ',
    'ค่าโทรศัพท์/อินเทอร์เน็ต',
    'ซื้ออุปกรณ์/อะไหล่เข้าร้าน',
    'ค่าเดินทาง',
    'อื่นๆ',
  ]

  return (
    <>
      {/* Delete Confirm Modal */}
      <Transition.Root show={!!deleteId} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDeleteId(null)}>
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="pointer-events-auto bg-white rounded-2xl shadow-xl p-6 max-w-xs w-full flex flex-col items-center border border-[#C7D2FE]">
                <Dialog.Title className="text-lg font-bold text-[#3730A3] mb-2">ยืนยันการลบ</Dialog.Title>
                <div className="text-gray-600 mb-4 text-center">คุณต้องการลบข้อมูลนี้หรือไม่?</div>
                <div className="flex gap-3 w-full justify-center">
                  <button
                    className="px-5 py-2 rounded-full bg-white text-[#3730A3] font-semibold border border-[#C7D2FE] hover:bg-[#C7D2FE] hover:text-white transition order-2"
                    onClick={() => setDeleteId(null)}
                    disabled={isDeleting}
                  >ยกเลิก</button>
                  <button
                    className="px-5 py-2 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition order-1"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                  >ลบ</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

    <main className="min-h-screen bg-gradient-to-br from-[#E0E7FF] to-[#F5F3FF] p-2 sm:p-4 relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10 px-4 py-3 flex items-center justify-between">
        <Link href="/" onClick={() => setPage('day')} className="text-2xl font-bold text-[#3730A3] tracking-tight hover:opacity-80 transition-opacity">
          FB mobile <span className="text-xl font-bold ml-1">(รายรับ-รายจ่าย)</span>
        </Link>
        <div className="ml-auto absolute right-4 top-2 flex items-center gap-2">
          <Link href="/finance">
            <Image src="/cat.png" alt="finance" width={40} height={40} className="object-cover rounded-full border-2 border-[#C7D2FE] bg-white hover:scale-105 transition-transform" />
          </Link>
        </div>
      </header>
      <div className="pt-20 pb-32 max-w-lg mx-auto w-full">
        {/* Net income today */}
        {page === 'day' && (
          <div className="text-[2.25rem] sm:text-[3.5rem] font-extrabold text-red-600 text-center mb-4 drop-shadow-sm" style={{ fontSize: '2.25rem', lineHeight: 1.1 }}>
            <span style={{ fontSize: '1.5em' }}>{displayedTodayExpense.toLocaleString()} บาท</span>
            <div className="text-base font-medium text-[#3730A3] mt-1">รายจ่ายวันนี้</div>
          </div>
        )}
        {(page === 'day' || page === 'period') && (
          <SearchBar value={query} onChange={setQuery} />
        )}
        {page === 'day' && (
          <ExpenseList 
            query={query} 
            onEdit={handleEdit} 
            onDelete={setDeleteId} 
            transactions={transactions.filter(t => t.date === today)} 
          />
        )}
        {page === 'period' && (
          <>
            <div className="w-full flex justify-center mb-2">
              <div
                className="flex flex-nowrap gap-2 max-w-2xl w-full sm:justify-center sm:mx-auto overflow-x-auto"
              >
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 bg-white text-[#3730A3] font-semibold min-w-[140px] text-[13.5px]"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                >
                  {periodMonths.map(m => (
                    <option key={m.value} value={m.value} className="text-[14.5px]">{m.label}</option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-[#3730A3] font-semibold min-w-[120px]"
                  value={selectedWeek}
                  onChange={e => setSelectedWeek(e.target.value)}
                >
                  <option value="">ทุกสัปดาห์</option>
                  {weeks.map(w => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-[#3730A3] font-semibold min-w-[120px]"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="">ทุกหมวดหมู่</option>
                  {expenseCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-[#3730A3]">จำนวนรายการ: <span className="font-bold">{totalCount}</span></div>
              <ExportExcelButton 
                transactions={filteredWeek} 
                period={`${selectedMonth}_สัปดาห์${selectedWeek ? selectedWeek.split('_')[0] : 'ทั้งหมด'}`}
                className="text-xs px-3 py-1.5"
              />
            </div>
            <ExpenseList
              query={query}
              onEdit={handleEdit}
              onDelete={setDeleteId}
              transactions={filteredWeek}
            />
          </>
        )}
        {page === 'dashboard' && (
          <FinanceDashboard expenseData={transactions} />
        )}
      </div>
      {/* Floating Action Button */}
      <button
        className="fixed bottom-24 right-6 w-16 h-16 bg-[#4F46E5] rounded-full shadow-xl flex items-center justify-center text-white hover:bg-[#4338CA] transition-colors z-20"
        aria-label="Add transaction"
        onClick={() => { setEditData(null); setOpen(true) }}
      >
        <AddIcon className="w-9 h-9" />
      </button>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-center gap-4 bg-white border-t border-[#C7D2FE] py-2 z-30">
        {PAGES.map(p => (
          <button
            key={p.key}
            className={`flex items-center px-4 py-2 rounded-full text-base font-semibold transition gap-1 ${page === p.key ? 'bg-[#4F46E5] text-white shadow' : 'bg-[#F5F3FF] text-[#3730A3] hover:bg-[#C7D2FE]'}`}
            onClick={() => setPage(p.key)}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </nav>
      <AddExpenseModal 
        key={open ? 'open' : 'closed'}
        isOpen={open} 
        onClose={() => { setOpen(false); setEditData(null) }} 
        onSubmit={editData ? handleEditSubmit : handleAdd} 
        defaultValues={editData ? {
          category: editData.category as ExpenseForm['category'],
          date: editData.date,
          amount: editData.price || 0,
          detail: editData.detail,
        } : undefined} 
        isLoading={isLoading}
      />
    </main>
  </>
  )
}