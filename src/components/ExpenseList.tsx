import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useMemo } from 'react'
import { Transaction } from '@/lib/supabase'

dayjs.locale('th')

function DayGroup({ date, children }: { date: string, children: React.ReactNode }) {
  const formattedDate = dayjs(date).locale('th').format('D/M/YYYY')
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-[#4F46E5] mb-3 tracking-wide">
        {formattedDate}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

function ExpenseCard({ transaction, onEdit, onDelete }: { transaction: Transaction, onEdit?: () => void, onDelete?: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex flex-col gap-2 transition hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded mb-1">
            {transaction.category}
          </span>
          <div className="text-lg font-bold text-black">
            {transaction.detail || transaction.category}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={onEdit} className="p-1 rounded hover:bg-indigo-50"><PencilIcon className="w-5 h-5 text-indigo-500" /></button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-50"><TrashIcon className="w-5 h-5 text-red-500" /></button>
        </div>
      </div>
      
      {/* จำนวนเงินที่จ่ายในแถวเดียวกัน */}
      <div className="flex justify-end items-center mt-2">
        <div className="text-xl font-bold text-red-600">{transaction.price.toLocaleString()}฿</div>
      </div>
      
      <div className="text-right text-xs text-gray-700 font-medium mt-1">
        {dayjs(transaction.date).locale('th').format('D MMM YYYY')}
        {transaction.created_at && (
          <span className="text-gray-500 ml-2">
            : {dayjs(transaction.created_at).locale('th').format('HH:mm')} 
          </span>
        )}
      </div>
    </div>
  )
}

export function ExpenseList({ query = '', onEdit, onDelete, transactions = [] }: {
  query?: string,
  onEdit?: (id: string) => void,
  onDelete?: (id: string) => void,
  transactions?: Transaction[]
}) {
  const data = transactions
  // ฟิลเตอร์ข้อมูลตาม query (ค้นหาจาก category, detail, date)
  const filtered = useMemo(() => {
    if (!query) return data
    const q = query.toLowerCase()
    return data.filter(t =>
      (t.category?.toLowerCase().includes(q) || '') ||
      (t.detail?.toLowerCase().includes(q) || '') ||
      (t.date?.toLowerCase().includes(q) || '')
    )
  }, [query, data])

  // Group by date
  const grouped = useMemo(() => {
    return filtered.reduce((acc: Record<string, Transaction[]>, t) => {
      if (!acc[t.date]) acc[t.date] = []
      acc[t.date].push(t)
      return acc
    }, {})
  }, [filtered])

  return (
    <div className="max-w-lg mx-auto w-full">
      {Object.entries(grouped).map(([date, transactions]) => (
        <DayGroup key={date} date={date}>
          {transactions.map(transaction => (
            <ExpenseCard
              key={transaction.id}
              transaction={transaction}
              onEdit={onEdit ? () => onEdit(transaction.id) : undefined}
              onDelete={onDelete ? () => onDelete(transaction.id) : undefined}
            />
          ))}
        </DayGroup>
      ))}
      {filtered.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          ไม่พบรายการรายจ่าย
        </div>
      )}
    </div>
  )
}
