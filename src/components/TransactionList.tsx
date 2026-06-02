import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { PencilIcon, TrashIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { useMemo } from 'react'
import { saveReceiptAsImage } from '@/utils/receiptPrinter'

dayjs.locale('th')

type Transaction = {
  id: string
  date: string
  category: string
  brand: string
  model: string
  detail?: string
  cost?: number
  price: number
  profit: number
  repair_detail?: string
  accessory_detail?: string
  service_detail?: string
  created_at?: string
  updated_at?: string
}

// ตัวอย่าง mock data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2025-07-01',
    category: 'ขายโทรศัพท์',
    brand: 'VIVO',
    model: 'Y27',
    price: 35000,
    cost: 32000,
    profit: 3000,
    created_at: '2025-07-01T08:30:00.000Z'
  },
  {
    id: '2',
    date: '2025-07-01',
    category: 'ซ่อมโทรศัพท์',
    brand: 'iPhone',
    model: '13',
    detail: 'เปลี่ยนจอ',
    repair_detail: 'จอแตก ขีดข่วน',
    price: 1200,
    cost: 500,
    profit: 700,
    created_at: '2025-07-01T14:15:00.000Z'
  },
  {
    id: '3',
    date: '2025-07-02',
    category: 'เติม&จ่ายบิล',
    brand: '',
    model: '',
    price: 500,
    profit: 500,
    created_at: '2025-07-02T10:45:00.000Z'
  },
  {
    id: '4',
    date: '2025-07-02',
    category: 'อื่นๆ',
    brand: '',
    model: '',
    detail: 'ขายอุปกรณ์เสริม',
    price: 300,
    cost: 200,
    profit: 100,
    created_at: '2025-07-02T16:20:00.000Z'
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
        <div className="flex-1">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded mb-1">
            {transaction.category}
          </span>
          <div className="text-lg font-bold text-black">
            {transaction.brand && transaction.model ? (
              <span className="font-bold text-black">{transaction.brand} {transaction.model}</span>
            ) : (
              <span className="font-bold text-black">{transaction.category}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={onEdit} className="p-1 rounded hover:bg-blue-50"><PencilIcon className="w-5 h-5 text-blue-500" /></button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-50"><TrashIcon className="w-5 h-5 text-red-500" /></button>
        </div>
      </div>

      <div className="space-y-1">
        {transaction.detail && transaction.detail !== transaction.repair_detail && (
          <div className="text-gray-800 text-sm font-medium">{transaction.detail}</div>
        )}
      </div>

      {/* รายละเอียดการซ่อม */}
      {transaction.repair_detail && (
        <div className="text-gray-800 text-sm">
          <span className="font-semibold text-black">รายละเอียดการซ่อม:</span> {transaction.repair_detail}
        </div>
      )}

      {/* ต้นทุนและราคาขายในแถวเดียวกัน */}
      <div className="flex justify-between items-center">
        <div className="text-sm font-bold text-red-600">
          {transaction.cost !== undefined && transaction.cost > 0 ? `ต้นทุน: ${transaction.cost.toLocaleString()}฿` : ''}
        </div>
        <div className="text-lg font-bold text-green-600">{transaction.price.toLocaleString()}฿</div>
      </div>

      <div className="text-right text-xs text-gray-700 font-medium flex justify-between items-end mt-2">
        <button
          onClick={async () => {
            // Build title parts
            const parts = [
              transaction.category !== 'ซ่อมโทรศัพท์' && transaction.category !== 'ขายโทรศัพท์' ? transaction.category : null, // Show category only if generic
              transaction.brand,
              transaction.model
            ].filter(Boolean);

            // Add details but avoid duplicates
            const details = [
              transaction.detail,
              transaction.repair_detail,
              transaction.accessory_detail,
              transaction.service_detail
            ].filter(Boolean);

            // Unique details
            const uniqueDetails = [...new Set(details)];

            const title = [...parts, ...uniqueDetails].join(' ');

            try {
              await saveReceiptAsImage([{
                displayTitle: title,
                price: transaction.price,
                category: transaction.category
              }], dayjs(transaction.date).locale('th').format('D MMM YYYY HH:mm'))
            } catch (error) {
              console.error('Error saving receipt:', error)
              alert('ไม่สามารถบันทึกรูปภาพได้')
            }
          }}
          className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-green-100 hover:text-green-600 flex items-center gap-1 transition-colors"
          title="บันทึกใบเสร็จเป็นรูปภาพ"
        >
          <PrinterIcon className="w-4 h-4" />
          <span className="text-[10px]">บันทึกรูป</span>
        </button>
        <div>
          {dayjs(transaction.date).locale('th').format('D MMM YYYY')}
          {transaction.created_at && (
            <span className="text-black-500 ml-2">
              : {dayjs(transaction.created_at).locale('th').format('HH:mm')}
            </span>
          )}
        </div>
      </div>
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
  // ฟิลเตอร์ข้อมูลตาม query (ค้นหาจาก brand, model, category, detail, date)
  const filtered = useMemo(() => {
    if (!query) return data
    const q = query.toLowerCase()
    return data.filter(t =>
      (t.brand?.toLowerCase().includes(q) || '') ||
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
