import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useMemo } from 'react'

dayjs.locale('th')

type Transaction = {
  id: string
  date: string
  category: string
  model?: string
  deviceModel?: string
  detail?: string
  cost?: number
  price: number
  profit: number
}

// ตัวอย่าง mock data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2025-07-01',
    category: 'ขายโทรศัพท์',
    model: 'VIVO',
    price: 35000,
    cost: 32000,
    profit: 3000
  },
  {
    id: '2',
    date: '2025-07-01',
    category: 'ซ่อมโทรศัพท์',
    model: 'iPhone',
    detail: 'เปลี่ยนจอ',
    price: 1200,
    cost: 500,
    profit: 700
  },
  {
    id: '3',
    date: '2025-07-02',
    category: 'เติมเงิน',
    price: 500,
    profit: 500
  }
]

function DayGroup({ date, children }: { date: string, children: React.ReactNode }) {
  const formattedDate = dayjs(date).locale('th').format('D/M/YYYY')
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-blue-600 mb-3 tracking-wide">
        {formattedDate}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

function TransactionCard({ transaction, onEdit, onDelete }: { transaction: Transaction, onEdit?: () => void, onDelete?: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex flex-col gap-2 transition hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded mb-1">
            {transaction.category}
          </span>
          <div className="text-lg font-medium text-gray-900 flex flex-wrap items-center gap-x-2 gap-y-1">
            {transaction.model && (
              <span className="font-semibold text-gray-900">{transaction.model}</span>
            )}
            {transaction.deviceModel && (
              <span className="text-gray-500 text-base font-normal">{transaction.deviceModel}</span>
            )}
            {!(transaction.model || transaction.deviceModel) && (
              <span className="text-gray-400 text-base font-normal">-</span>
            )}
          </div>
          {transaction.detail && (
            <div className="text-gray-500 text-sm mt-1">{transaction.detail}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={onEdit} className="p-1 rounded hover:bg-blue-50"><PencilIcon className="w-5 h-5 text-blue-500" /></button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-50"><TrashIcon className="w-5 h-5 text-red-500" /></button>
        </div>
      </div>
      <div className="flex justify-between items-end mt-2">
        <div className="text-sm text-gray-500">{transaction.cost !== undefined ? `ต้นทุน: ${transaction.cost.toLocaleString()}฿` : ''}</div>
        <div className="text-lg font-bold text-green-600">{transaction.price.toLocaleString()}฿</div>
      </div>
      <div className="text-right text-xs text-gray-400 mt-1">{dayjs(transaction.date).locale('th').format('D MMM YYYY')}</div>
    </div>
  )
}

export function TransactionList({ query = '', onEdit, onDelete, transactions }: {
  query?: string,
  onEdit?: (id: string) => void,
  onDelete?: (id: string) => void,
  transactions?: Transaction[]
}) {
  const data = transactions ?? mockTransactions
  // ฟิลเตอร์ข้อมูลตาม query (ค้นหาจาก model, category, detail, date)
  const filtered = useMemo(() => {
    if (!query) return data
    const q = query.toLowerCase()
    return data.filter(t =>
      (t.model?.toLowerCase().includes(q) || '') ||
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
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onEdit={onEdit ? () => onEdit(transaction.id) : undefined}
              onDelete={onDelete ? () => onDelete(transaction.id) : undefined}
            />
          ))}
        </DayGroup>
      ))}
    </div>
  )
}
