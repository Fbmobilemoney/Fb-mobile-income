'use client'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { Transaction } from '@/lib/supabase'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

interface ExportExcelButtonProps {
  transactions: Transaction[]
  period?: string
  className?: string
}

export function ExportExcelButton({ transactions, period, className = '' }: ExportExcelButtonProps) {
  const exportToExcel = () => {
    if (transactions.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก')
      return
    }

    // สร้างข้อมูลสำหรับ CSV
    const headers = [
      'วันที่',
      'เวลา',
      'หมวดหมู่',
      'ยี่ห้อ',
      'รุ่น',
      'รายละเอียด',
      'ต้นทุน',
      'ราคาขาย',
      'กำไร',
      'รายละเอียดการซ่อม',
      'รายละเอียดอุปกรณ์เสริม',
      'รายละเอียดบริการ'
    ]

    const csvData = transactions.map(t => [
      dayjs(t.date).format('DD/MM/YYYY'),
      t.created_at ? dayjs(t.created_at).format('HH:mm') : '',
      t.category,
      t.brand || '',
      t.model || '',
      t.detail || '',
      t.cost || 0,
      t.price,
      t.profit,
      t.repair_detail || '',
      t.accessory_detail || '',
      t.service_detail || ''
    ])

    // สร้าง CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // เพิ่ม BOM สำหรับ UTF-8
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })

    // สร้างชื่อไฟล์
    const now = dayjs()
    const filename = period 
      ? `รายงาน_${period}_${now.format('YYYYMMDD_HHmm')}.csv`
      : `รายงาน_${now.format('YYYYMMDD_HHmm')}.csv`

    // ดาวน์โหลดไฟล์
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={exportToExcel}
      className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium ${className}`}
    >
      <DocumentArrowDownIcon className="w-5 h-5" />
      <span>Export Excel</span>
    </button>
  )
}