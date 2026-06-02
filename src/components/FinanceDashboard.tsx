import { useState, useMemo, useEffect } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { DatabaseService } from '@/lib/database'
import { Transaction } from '@/lib/supabase'

dayjs.locale('th')

// ── Design Tokens ──────────────────────────────────────────
const C = {
  bg2:      '#FFFFFF',
  primary:  '#3730A3', // Indigo
  income:   '#10B981', // Emerald
  expense:  '#EF4444', // Red
  text1:    '#111827',
  text2:    '#6B7280',
  border:   '#E5E7EB',
  borderMd: '#D1D5DB',
}

const PERIODS = ['สัปดาห์', 'เดือน', 'ปี'] as const

// ── Helper ────────────────────────────────────
interface MergedItem {
  id: string
  icon: string
  name: string
  cat: string
  amount: number
  formattedAmount: string
  date: string
  displayDate: string
  income: boolean
}

function mergeTransactions(
  incomeList: Transaction[],
  expenseList: Transaction[]
): MergedItem[] {
  const today = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

  const incomeItems: MergedItem[] = incomeList.map(t => {
    const profit = (t.price ?? 0) - (t.cost ?? 0)
    return {
      id: `inc-${t.id}`,
      icon: getCategoryIcon(t.category, true),
      name: t.category,
      cat: `รายได้ · ${t.brand || t.detail || 'ร้านค้า'}`,
      amount: profit,
      formattedAmount: `+฿${profit.toLocaleString()}`,
      date: t.date,
      displayDate: t.date === today ? 'วันนี้' : t.date === yesterday ? 'วานนี้' : dayjs(t.date).format('DD MMM'),
      income: true,
    }
  })

  const expenseItems: MergedItem[] = expenseList.map(t => ({
    id: `exp-${t.id}`,
    icon: getCategoryIcon(t.category, false),
    name: t.category,
    cat: `รายจ่าย · ${t.detail || t.category}`,
    amount: t.price ?? 0,
    formattedAmount: `-฿${(t.price ?? 0).toLocaleString()}`,
    date: t.date,
    displayDate: t.date === today ? 'วันนี้' : t.date === yesterday ? 'วานนี้' : dayjs(t.date).format('DD MMM'),
    income: false,
  }))

  return [...incomeItems, ...expenseItems]
    .sort((a, b) => b.date.localeCompare(a.date))
}

function getCategoryIcon(category: string, isIncome: boolean): string {
  if (isIncome) {
    const map: Record<string, string> = {
      'ขายโทรศัพท์': '📱', 'ซ่อมโทรศัพท์': '🔧', 'ขายอุปกรณ์เสริม': '🎧',
      'ติดฟิล์ม': '📋', 'บริการเสริม': '⚙️', 'โอนเงิน': '💸',
      'เติม&จ่ายบิล': '💳', 'ขายซิม': '📡',
    }
    return map[category] || '💰'
  }
  const map: Record<string, string> = {
    'ค่าอาหาร/เครื่องดื่ม': '🍽️', 'ค่าจ้าง/เงินเดือน': '👷',
    'ค่าเช่า': '🏠', 'ค่าน้ำ/ค่าไฟ': '💡',
    'ค่าโทรศัพท์/อินเทอร์เน็ต': '📶', 'ซื้ออุปกรณ์/อะไหล่เข้าร้าน': '🛒',
    'ค่าเดินทาง': '🚗',
  }
  return map[category] || '📝'
}

// ── Sub-components ──────────────────────────────────────────────────

function BalanceSection({ balance, changePercent }: { balance: string; changePercent: string }) {
  const isPositive = !changePercent.startsWith('-')
  return (
    <div style={{ padding: '24px 0 0' }}>
      <p style={{ fontSize: 14, color: C.text2, margin: '0 0 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        ยอดคงเหลือทั้งหมด
      </p>
      <p style={{ fontSize: 52, fontWeight: 700, color: C.text1, margin: 0, lineHeight: 1 }}>
        {balance}
      </p>
      <p style={{ fontSize: 16, fontWeight: 500, color: isPositive ? C.income : C.expense, marginTop: 12 }}>
        {isPositive ? '↑' : '↓'} {changePercent}% จากเดือนที่แล้ว
      </p>
    </div>
  )
}

function SummaryStrip({ incomeAmount, expenseAmount, period }: { incomeAmount: string; expenseAmount: string; period: string }) {
  const cellStyle: React.CSSProperties = { padding: '20px 16px', flex: 1 }
  const labelStyle: React.CSSProperties = { fontSize: 13, margin: '0 0 6px', letterSpacing: '0.08em', fontWeight: 600 }
  const valueStyle: React.CSSProperties = { fontSize: 26, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }
  const subStyle: React.CSSProperties = { fontSize: 13, color: C.text2, margin: 0 }

  return (
    <div style={{
      margin: '24px 0 0',
      background: C.bg2,
      border: `1px solid ${C.borderMd}`,
      borderRadius: 20,
      display: 'flex',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    }}>
      <div style={cellStyle}>
        <p style={{ ...labelStyle, color: C.income }}>● รายรับ</p>
        <p style={{ ...valueStyle, color: C.income }}>{incomeAmount}</p>
        <p style={subStyle}>{period}</p>
      </div>
      <div style={{ width: '1px', background: C.borderMd, margin: '16px 0' }} />
      <div style={cellStyle}>
        <p style={{ ...labelStyle, color: C.expense }}>● รายจ่าย</p>
        <p style={{ ...valueStyle, color: C.expense }}>{expenseAmount}</p>
        <p style={subStyle}>{period}</p>
      </div>
    </div>
  )
}

function BarChart({ data, activePeriod, onPeriodChange, selectedIndex, onBarClick }: {
  data: { month: string; fullLabel: string; inc: number; exp: number; current?: boolean; filterFn: (d: string) => boolean }[]
  activePeriod: string
  onPeriodChange: (p: string) => void
  selectedIndex: number
  onBarClick: (i: number) => void
}) {
  const maxVal = Math.max(...data.map(d => Math.max(d.inc, d.exp)), 1)
  const maxH = 80

  return (
    <div style={{ margin: '32px 0 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text1, letterSpacing: '0.05em' }}>
          ภาพรวม
        </span>
        {/* Period tabs */}
        <div style={{
          display: 'flex', gap: 4,
          background: C.bg2,
          border: `1px solid ${C.borderMd}`,
          borderRadius: 10, padding: 4,
        }}>
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: activePeriod === p ? C.primary : 'transparent',
                color: activePeriod === p ? '#fff' : C.text2,
                fontWeight: activePeriod === p ? 600 : 500,
                transition: 'all 0.15s',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, paddingBottom: 6 }}>
        {data.map((d, i) => {
          const isSelected = i === selectedIndex;
          return (
          <div key={i} onClick={() => onBarClick(i)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', background: isSelected ? 'rgba(55, 48, 163, 0.05)' : 'transparent', padding: '8px 2px 4px', borderRadius: 8, transition: 'background 0.2s' }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
              <div style={{
                width: '40%', maxWidth: 20, borderRadius: '4px 4px 0 0',
                height: Math.max((d.inc / maxVal) * maxH, 4),
                background: C.income,
                opacity: isSelected ? 1 : 0.4,
              }} />
              <div style={{
                width: '40%', maxWidth: 20, borderRadius: '4px 4px 0 0',
                height: Math.max((d.exp / maxVal) * maxH, 4),
                background: C.expense,
                opacity: isSelected ? 1 : 0.4,
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: isSelected ? C.primary : C.text2, marginTop: 4 }}>
              {d.month}
            </span>
          </div>
        )})}
      </div>
    </div>
  )
}

function TransactionItem({ icon, name, cat, formattedAmount, displayDate, income }: MergedItem) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: C.bg2,
      border: `1px solid ${C.border}`,
      borderRadius: 16, padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: income ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        {icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: C.text1, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </p>
        <p style={{ fontSize: 13, color: C.text2, margin: '4px 0 0' }}>{cat}</p>
      </div>

      {/* Amount */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: income ? C.income : C.expense, margin: 0 }}>
          {formattedAmount}
        </p>
        <p style={{ fontSize: 12, color: C.text2, margin: '4px 0 0' }}>{displayDate}</p>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────

interface FinanceDashboardProps {
  expenseData: Transaction[] // From the parent Finance page
}

export function FinanceDashboard({ expenseData }: FinanceDashboardProps) {
  const [activePeriod, setActivePeriod] = useState('เดือน')
  const [selectedBarIndex, setSelectedBarIndex] = useState(5)
  const [incomeData, setIncomeData] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ดึงรายรับเพิ่มเติม (กำไร) จากตารางหลัก
  useEffect(() => {
    const loadIncome = async () => {
      setIsLoading(true)
      try {
        const data = await DatabaseService.getTransactions()
        setIncomeData(data)
      } catch (err) {
        console.warn('Load income error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadIncome()
  }, [])

  const now = useMemo(() => dayjs(), [])

  // Reset selected bar when period changes
  useEffect(() => {
    setSelectedBarIndex(activePeriod === 'ปี' ? 4 : 5)
  }, [activePeriod])

  // ── คำนวณยอดคงเหลือทั้งหมด (ตลอดกาล) ──────────────────────────
  const totalIncome = useMemo(() =>
    incomeData.reduce((s, t) => s + ((t.price ?? 0) - (t.cost ?? 0)), 0),
    [incomeData]
  )
  const totalExpense = useMemo(() =>
    expenseData.reduce((s, t) => s + (t.price ?? 0), 0),
    [expenseData]
  )
  const balance = totalIncome - totalExpense

  // ── กราฟแท่ง (ตามสัปดาห์ / เดือน / ปี) ────────────────────────
  const chartData = useMemo(() => {
    const dataPoints: { month: string; fullLabel: string; inc: number; exp: number; current?: boolean; filterFn: (d: string) => boolean }[] = []
    
    if (activePeriod === 'สัปดาห์') {
      // 6 สัปดาห์ย้อนหลัง
      for (let i = 5; i >= 0; i--) {
        const startOfWeek = now.subtract(i, 'week').startOf('week')
        const endOfWeek = startOfWeek.endOf('week')
        const startStr = startOfWeek.format('YYYY-MM-DD')
        const endStr = endOfWeek.format('YYYY-MM-DD')
        
        const filterFn = (d: string) => d >= startStr && d <= endStr
        const inc = incomeData.filter(t => filterFn(t.date)).reduce((s, t) => s + ((t.price ?? 0) - (t.cost ?? 0)), 0)
        const exp = expenseData.filter(t => filterFn(t.date)).reduce((s, t) => s + (t.price ?? 0), 0)
          
        dataPoints.push({
          month: startOfWeek.format('D/M'),
          fullLabel: `สัปดาห์ที่เริ่ม ${startOfWeek.format('D MMM YYYY')}`,
          inc, exp, current: i === 0, filterFn
        })
      }
    } else if (activePeriod === 'ปี') {
      // 5 ปี ย้อนหลัง
      for (let i = 4; i >= 0; i--) {
        const y = now.subtract(i, 'year').year().toString()
        const filterFn = (d: string) => d?.startsWith(y)
        const inc = incomeData.filter(t => filterFn(t.date)).reduce((s, t) => s + ((t.price ?? 0) - (t.cost ?? 0)), 0)
        const exp = expenseData.filter(t => filterFn(t.date)).reduce((s, t) => s + (t.price ?? 0), 0)
          
        dataPoints.push({
          month: (parseInt(y) + 543).toString().slice(-2),
          fullLabel: `ปี พ.ศ. ${parseInt(y) + 543}`,
          inc, exp, current: i === 0, filterFn
        })
      }
    } else {
      // 6 เดือนย้อนหลัง
      for (let i = 5; i >= 0; i--) {
        const m = now.subtract(i, 'month')
        const key = m.format('YYYY-MM')
        const filterFn = (d: string) => d?.startsWith(key)
        const inc = incomeData.filter(t => filterFn(t.date)).reduce((s, t) => s + ((t.price ?? 0) - (t.cost ?? 0)), 0)
        const exp = expenseData.filter(t => filterFn(t.date)).reduce((s, t) => s + (t.price ?? 0), 0)
        dataPoints.push({
          month: m.locale('th').format('MMM'),
          fullLabel: m.locale('th').format('MMMM YYYY'),
          inc, exp, current: i === 0, filterFn
        })
      }
    }
    return dataPoints
  }, [incomeData, expenseData, activePeriod, now])

  // คำนวณยอดของแท่งที่ถูกเลือก
  const selectedBar = chartData[selectedBarIndex] || chartData[chartData.length - 1]
  const prevBar = chartData[selectedBarIndex - 1] // สำหรับหา % การเติบโต
  
  const thisMonthNet = selectedBar ? selectedBar.inc - selectedBar.exp : 0
  const prevMonthNet = prevBar ? prevBar.inc - prevBar.exp : 0
  const changePercent = prevMonthNet !== 0
    ? (((thisMonthNet - prevMonthNet) / Math.abs(prevMonthNet)) * 100).toFixed(1)
    : thisMonthNet > 0 ? '+100' : '0'

  // ── รายการที่เกี่ยวข้องกับช่วงเวลาที่เลือก ──────────────────────────────────────
  const merged = useMemo(() => mergeTransactions(incomeData, expenseData), [incomeData, expenseData])
  const filteredMerged = useMemo(() => {
    if (!selectedBar || !selectedBar.filterFn) return merged;
    return merged.filter(item => selectedBar.filterFn(item.date))
  }, [merged, selectedBar])
  const recentItems = filteredMerged.slice(0, 10)

  return (
    <div className="pb-10">
      {isLoading ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ color: C.text2, fontSize: 16 }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          {/* Balance */}
          <BalanceSection
            balance={`฿${balance.toLocaleString()}`}
            changePercent={changePercent.replace('+', '')}
          />

          {/* Summary */}
          <SummaryStrip
            incomeAmount={`฿${(selectedBar?.inc || 0).toLocaleString()}`}
            expenseAmount={`฿${(selectedBar?.exp || 0).toLocaleString()}`}
            period={selectedBar?.fullLabel || ''}
          />

          {/* Chart */}
          <BarChart 
            data={chartData} 
            activePeriod={activePeriod} 
            onPeriodChange={setActivePeriod} 
            selectedIndex={selectedBarIndex}
            onBarClick={setSelectedBarIndex}
          />

          {/* Transactions */}
          <div style={{ margin: '32px 0 0' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text1, margin: '0 0 16px' }}>
              รายการ ({selectedBar?.fullLabel})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentItems.length === 0 && (
                <p style={{ color: C.text2, textAlign: 'center', padding: '20px 0', fontSize: 15 }}>
                  ไม่มีรายการในช่วงเวลานี้
                </p>
              )}
              {recentItems.map((tx) => (
                <TransactionItem key={tx.id} {...tx} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
