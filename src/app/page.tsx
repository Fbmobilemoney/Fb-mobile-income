
'use client'

import { useState, useMemo, useEffect } from 'react'
import { AddIcon } from '@/components/icons/AddIcon'
import { TransactionList } from '@/components/TransactionList'
import { AddTransactionModal } from '@/components/AddTransactionModal'
import { ChartBarIcon, CalendarDaysIcon, HomeIcon } from '@heroicons/react/24/solid'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { SearchBar } from '@/components/SearchBar'

dayjs.locale('th')



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
  { key: 'dashboard', label: 'Dashboard', icon: <ChartBarIcon className="w-5 h-5 mr-1" /> },
]

export default function Home() {
  // --- Login State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // --- App State ---
  const [open, setOpen] = useState(false)
  const [editData, setEditData] = useState<any | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState('day')
  const [transactions, setTransactions] = useState<any[]>([])

  // ดึงข้อมูลจาก Google Sheet ทุกครั้งที่โหลดหน้าเว็บ
  // จำนวนแถว header ใน Google Sheet (1 = มี header)
  const SHEET_HEADER_ROWS = 1;
  useEffect(() => {
    fetch('/api/sheet')
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json.data)) {
          // ฟังก์ชัน robust mapping: หา group 7 ช่องติดกันที่ไม่ว่าง
          const findFirstDataGroup = (row: any[]) => {
            for (let i = 0; i <= row.length - 7; i++) {
              // ต้องมีอย่างน้อย model, category, date, price, cost, profit ไม่ว่าง
              if (
                row.slice(i, i + 7).filter(cell => cell !== '' && cell !== undefined && cell !== null).length >= 4 &&
                typeof row[i + 3] === 'string' && row[i + 3].match(/^\d{4}-\d{2}-\d{2}$/)
              ) {
                return row.slice(i, i + 7)
              }
            }
            return [ '', '', '', '', 0, 0, 0 ]
          }
          setTransactions(
            json.data.slice(SHEET_HEADER_ROWS)
              .map((row: any[], i: number) => {
                const group = findFirstDataGroup(row)
                return {
                  id: (i + 1).toString(),
                  model: group[0] || '',
                  category: group[1] || '',
                  detail: group[2] || '',
                  date: group[3] || '',
                  price: Number(group[4]) || 0,
                  cost: Number(group[5]) || 0,
                  profit: Number(group[6]) || 0,
                }
              })
              .filter(t =>
                t.date && /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
                (t.model || t.category || t.price || t.cost || t.profit)
              )
          )
        }
      })
  }, [])
  // --- Google Sheet row mapping: id = index+1 (header = row 1) ---
  const handleEdit = (id: string) => {
    const tx = transactions.find(t => t.id === id)
    if (tx) {
      setEditData(tx)
      setOpen(true)
    }
  }
  const handleDelete = async (id: string) => {
    // id = index+1 (UI), rowIndex = id + header
    const rowIndex = parseInt(id, 10) + SHEET_HEADER_ROWS;
    await fetch(`/api/sheet/${rowIndex}`, { method: 'DELETE' });
    // รีเฟรชข้อมูลใหม่
    fetch('/api/sheet')
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json.data)) {
          const findFirstDataGroup = (row: any[]) => {
            for (let i = 0; i <= row.length - 7; i++) {
              if (
                row.slice(i, i + 7).filter(cell => cell !== '' && cell !== undefined && cell !== null).length >= 4 &&
                typeof row[i + 3] === 'string' && row[i + 3].match(/^\d{4}-\d{2}-\d{2}$/)
              ) {
                return row.slice(i, i + 7)
              }
            }
            return [ '', '', '', '', 0, 0, 0 ]
          }
          setTransactions(
            json.data.slice(SHEET_HEADER_ROWS)
              .map((row: any[], i: number) => {
                const group = findFirstDataGroup(row)
                return {
                  id: (i + 1).toString(),
                  model: group[0] || '',
                  category: group[1] || '',
                  detail: group[2] || '',
                  date: group[3] || '',
                  price: Number(group[4]) || 0,
                  cost: Number(group[5]) || 0,
                  profit: Number(group[6]) || 0,
                }
              })
              .filter(t =>
                t.date && /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
                (t.model || t.category || t.price || t.cost || t.profit)
              )
          )
        }
      })
  }
  const handleAdd = async (data: any) => {
    if (editData) {
      // แก้ไข: PUT ไปยังแถวที่ตรงกับ id
      const rowIndex = parseInt(editData.id, 10) + SHEET_HEADER_ROWS;
      await fetch(`/api/sheet/${rowIndex}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: [
            data.model || '',
            data.category || '',
            data.detail || '',
            data.date || '',
            data.price || 0,
            data.cost || 0,
            (data.price ?? 0) - (data.cost ?? 0)
          ]
        })
      });
    } else {
      // เพิ่ม: POST ตามเดิม
      await fetch('/api/sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: [
            data.model || '',
            data.category || '',
            data.detail || '',
            data.date || '',
            data.price || 0,
            data.cost || 0,
            (data.price ?? 0) - (data.cost ?? 0)
          ]
        })
      });
    }
    setEditData(null);
    setOpen(false);
    // รอ Google Sheets sync ก่อน fetch ใหม่
    await new Promise(res => setTimeout(res, 700));
    fetch('/api/sheet')
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json.data)) {
          const findFirstDataGroup = (row: any[]) => {
            for (let i = 0; i <= row.length - 7; i++) {
              if (
                row.slice(i, i + 7).filter(cell => cell !== '' && cell !== undefined && cell !== null).length >= 4 &&
                typeof row[i + 3] === 'string' && row[i + 3].match(/^\d{4}-\d{2}-\d{2}$/)
              ) {
                return row.slice(i, i + 7)
              }
            }
            return [ '', '', '', '', 0, 0, 0 ]
          }
          setTransactions(
            json.data.slice(SHEET_HEADER_ROWS)
              .map((row: any[], i: number) => {
                const group = findFirstDataGroup(row)
                return {
                  id: (i + 1).toString(),
                  model: group[0] || '',
                  category: group[1] || '',
                  detail: group[2] || '',
                  date: group[3] || '',
                  price: Number(group[4]) || 0,
                  cost: Number(group[5]) || 0,
                  profit: Number(group[6]) || 0,
                }
              })
              .filter(t =>
                t.date && /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
                (t.model || t.category || t.price || t.cost || t.profit)
              )
          )
        }
      });
  }
  // รายรับสุทธิ/วัน (mock)
  const today = new Date().toISOString().split('T')[0]
  const todayIncome = useMemo(() => transactions.filter(t => t.date === today).reduce((sum, t) => sum + (t.profit ?? 0), 0), [transactions])
  // 6 เดือนย้อนหลัง (เริ่มจาก 1/7/2025 หรือเดือนแรกที่มีข้อมูล)
  const graphStart = dayjs('2025-07-01')
  const now = dayjs()
  const monthsCount = Math.max(1, now.diff(graphStart, 'month') + 1)
  const lastMonths = useMemo(() => {
    const arr = []
    for (let i = 0; i < monthsCount; i++) {
      const d = graphStart.add(i, 'month')
      const ym = d.format('YYYY-MM')
      arr.push({
        month: ym,
        label: d.format('MM/YY'),
        total: transactions.filter(t => t.date?.slice(0, 7) === ym).reduce((sum, t) => sum + (t.profit ?? 0), 0)
      })
    }
    return arr
  }, [transactions])
  const totalGraph = lastMonths.reduce((sum, m) => sum + m.total, 0)
  // สำหรับ dropdown เลือกเดือน/ปี
  const periodMonths = useMemo(() => {
    const arr = []
    const start = dayjs('2025-07-01')
    const end = now
    let d = start.startOf('month')
    while (d.isBefore(end) || d.isSame(end, 'month')) {
      arr.push({
        value: d.format('YYYY-MM'),
        label: d.locale('th').format('MMMM YYYY')
      })
      d = d.add(1, 'month')
    }
    return arr.reverse()
  }, [transactions])
  // --- FILTER STATE (single for all pages) ---
  const [selectedMonth, setSelectedMonth] = useState(periodMonths[0]?.value || '')
  const [selectedWeek, setSelectedWeek] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const weeks = useMemo(() => getWeeksInMonth(selectedMonth), [selectedMonth])
  // ฟิลเตอร์ข้อมูลตาม dropdown
  const filteredMonth = transactions.filter(t => t.date?.slice(0, 7) === selectedMonth)
    .filter(t => !selectedCategory || t.category === selectedCategory)
    .filter(t => !selectedModel || t.model === selectedModel)
  const filteredWeek = selectedWeek ? filteredMonth.filter(t => {
    const [start, end] = selectedWeek.split('_')
    return t.date >= start && t.date <= end
  }) : filteredMonth
  const totalCount = filteredWeek.length
  // สำหรับ dropdown เลือกหมวดหมู่และสินค้า
  const allCategories = [
    'ขายโทรศัพท์',
    'ซ่อมโทรศัพท์',
    'โอนเงิน',
    'เติมเงิน',
    'อื่นๆ',
  ]
  const allModels = [
    'iPhone', 'VIVO', 'OPPO', 'Samsung', 'Infinix', 'TECNO', 'realme','ปุ่มกด', 'อื่นๆ',
  ]
  // สร้างรายการรุ่นจาก transaction history (ไม่ซ้ำ, ไม่ว่าง)
  const modelSuggestions = useMemo(() => {
    const models = transactions
      .map(t => t.deviceModel || t.model)
      .filter(Boolean)
      .map(m => m!.trim())
      .filter(m => m.length > 0)
    return Array.from(new Set(models))
  }, [transactions])

  // --- Login Form ---
  if (!isLoggedIn) {
    // PIN pad UI
    const handlePinInput = (num: string) => {
      if (password.length < 6) setPassword(password + num)
      setLoginError('')
    }
    const handleBackspace = () => {
      setPassword(password.slice(0, -1))
      setLoginError('')
    }
    const handleSubmit = (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      if (password === '1161') {
        setIsLoggedIn(true)
        setPassword('')
        setLoginError('')
      } else {
        setLoginError('PIN ไม่ถูกต้อง')
        setPassword('')
      }
    }
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#91C8E4] to-[#FFFBDE]">
        <form
          className="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-4 w-full max-w-xs"
          onSubmit={handleSubmit}
        >
          <h2 className="text-xl font-bold text-[#4682A9] text-center mb-2">กรุณาใส่ PIN</h2>
          <div className="flex justify-center gap-2 mb-2">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 ${password.length > i ? 'bg-[#4682A9] border-[#4682A9]' : 'border-gray-300 bg-white'} transition-all`}></div>
            ))}
          </div>
          {loginError && <div className="text-red-500 text-sm text-center">{loginError}</div>}
          <div className="grid grid-cols-3 gap-3 mt-2 mb-2">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button
                type="button"
                key={n}
                className="bg-[#91C8E4] text-[#4682A9] text-xl font-bold rounded-full h-12 w-12 sm:h-14 sm:w-14 shadow hover:bg-[#4682A9] hover:text-white transition-colors"
                onClick={() => handlePinInput(n.toString())}
                tabIndex={-1}
              >{n}</button>
            ))}
            {/* แถวล่าง: ลบ | 0 | OK */}
            <button
              type="button"
              className="bg-[#FFFBDE] text-[#4682A9] text-xl font-bold rounded-full h-12 w-12 sm:h-14 sm:w-14 shadow border border-[#91C8E4] hover:bg-[#91C8E4] hover:text-white transition-colors"
              onClick={handleBackspace}
              tabIndex={-1}
              aria-label="ลบ"
            >←</button>
            <button
              type="button"
              className="bg-[#91C8E4] text-[#4682A9] text-xl font-bold rounded-full h-12 w-12 sm:h-14 sm:w-14 shadow hover:bg-[#4682A9] hover:text-white transition-colors"
              onClick={() => handlePinInput('0')}
              tabIndex={-1}
            >0</button>
            <button
              type="submit"
              className="bg-[#4682A9] text-white text-xl font-bold rounded-full h-12 w-12 sm:h-14 sm:w-14 shadow hover:bg-[#749BC2] transition-colors"
              disabled={password.length !== 4}
              aria-label="ยืนยัน"
            >OK</button>
          </div>
        </form>
      </main>
    )
  }

  // เนื้อหาแอปหลัก (คงเดิม)
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#91C8E4] to-[#FFFBDE] p-2 sm:p-4 relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10 px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#4682A9] tracking-tight">FB mobile</h1>
        <img src="/cat.png" alt="cat" className="w-10 h-10 object-cover rounded-full border-2 border-[#91C8E4] bg-white ml-auto absolute right-4 top-2" />
      </header>
      <div className="pt-20 pb-32 max-w-lg mx-auto w-full">
        {/* Net income today */}
        {page === 'day' && (
          <div className="text-[2.25rem] sm:text-[3.5rem] font-extrabold text-green-600 text-center mb-4 drop-shadow-sm" style={{ fontSize: '2.25rem', lineHeight: 1.1 }}>
            <span style={{ fontSize: '1.5em' }}>{todayIncome.toLocaleString()} บาท</span>
            <div className="text-base font-medium text-[#4682A9] mt-1">รายรับสุทธิวันนี้</div>
          </div>
        )}
        {page === 'period' && (
          <SearchBar value={query} onChange={setQuery} />
        )}
        {page === 'day' && (
          <TransactionList query={query} onEdit={handleEdit} onDelete={handleDelete} transactions={transactions} />
        )}
        {page === 'period' && (
          <>
            <div className="w-full flex justify-center mb-2">
              <div
                className="flex flex-nowrap gap-2 max-w-2xl w-full sm:justify-center sm:mx-auto overflow-x-auto"
              >
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 bg-white text-[#4682A9] font-semibold min-w-[140px] text-[13.5px]"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                >
                  {periodMonths.map(m => (
                    <option key={m.value} value={m.value} className="text-[14.5px]">{m.label}</option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-[#4682A9] font-semibold min-w-[120px]"
                  value={selectedWeek}
                  onChange={e => setSelectedWeek(e.target.value)}
                >
                  <option value="">ทุกสัปดาห์</option>
                  {weeks.map(w => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-[#4682A9] font-semibold min-w-[120px]"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="">ทุกหมวดหมู่</option>
                  {allCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-[#4682A9] font-semibold min-w-[100px]"
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                >
                  <option value="">ทุกรุ่น</option>
                  {allModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-right text-sm text-[#4682A9] mb-2">จำนวนที่ขาย/ให้บริการ: <span className="font-bold">{totalCount}</span></div>
            <TransactionList
              query={query}
              onEdit={handleEdit}
              onDelete={handleDelete}
              transactions={filteredWeek}
            />
          </>
        )}
        {page === 'dashboard' && (
          <div className="bg-white rounded-xl shadow p-4 mt-6">
            <div className="text-xl font-bold text-[#4682A9] mb-2">รายรับสุทธิย้อนหลัง</div>
            <div className="text-2xl font-extrabold text-green-700 text-center mb-2">{totalGraph.toLocaleString()} บาท</div>
            {/* กราฟแท่ง */}
            <div className="flex items-end gap-2 h-40 w-full mb-2">
              {lastMonths.map(m => (
                <div key={m.month} className="flex flex-col items-center justify-end h-full w-full">
                  <div className="bg-[#4682A9] rounded-t-lg" style={{ height: `${Math.max(10, m.total / (totalGraph || 1) * 120)}px`, width: '24px', transition: 'height 0.3s' }}></div>
                  <span className="text-xs mt-1 text-[#4682A9]">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Floating Action Button */}
      <button
        className="fixed bottom-24 right-6 w-16 h-16 bg-[#4682A9] rounded-full shadow-xl flex items-center justify-center text-white hover:bg-[#749BC2] transition-colors z-20"
        aria-label="Add transaction"
        onClick={() => { setEditData(null); setOpen(true) }}
      >
        <AddIcon className="w-9 h-9" />
      </button>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-center gap-4 bg-white border-t border-[#91C8E4] py-2 z-30">
        {PAGES.map(p => (
          <button
            key={p.key}
            className={`flex items-center px-4 py-2 rounded-full text-base font-semibold transition gap-1 ${page === p.key ? 'bg-[#4682A9] text-white shadow' : 'bg-[#FFFBDE] text-[#4682A9] hover:bg-[#91C8E4]'}`}
            onClick={() => setPage(p.key)}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </nav>
      <AddTransactionModal isOpen={open} onClose={() => { setOpen(false); setEditData(null) }} onSubmit={handleAdd} defaultValues={editData || undefined} modelSuggestions={modelSuggestions} />
    </main>
  )
}