"use client"
import { useMemo, useState, useEffect } from 'react'
import { ChartBarIcon, ArrowTrendingUpIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

interface Transaction {
  id: string
  date: string
  category: string
  price: number
  cost?: number
  profit: number
  created_at?: string
  updated_at?: string
}

interface DashboardProps {
  transactions: Transaction[]
}

export function Dashboard({ transactions }: DashboardProps) {
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week'))
  const [currentMonthCard, setCurrentMonthCard] = useState(dayjs())
  const [barAnimated, setBarAnimated] = useState(false)
  const [weekBarAnimated, setWeekBarAnimated] = useState(false)

  // คำนวณข้อมูลรายเดือนย้อนหลัง 6 เดือน
  const monthlyData = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const month = currentDate.subtract(i, 'month')
      const monthStr = month.format('YYYY-MM')
      
      const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr))
      const revenue = monthTransactions.reduce((sum, t) => sum + t.price, 0)
      const profit = monthTransactions.reduce((sum, t) => sum + t.profit, 0)
      
      months.push({
        month: monthStr,
        monthName: month.format('MMM'),
        fullMonthName: month.format('MMMM YYYY'),
        revenue,
        profit
      })
    }
    
    // Debug log
    console.log('Monthly Data:', months)
    console.log('Current date for monthly chart:', currentDate.format('YYYY-MM-DD'))
    
    return months
  }, [transactions, currentDate])

  // คำนวณข้อมูลรายสัปดาห์
  const weekData = useMemo(() => {
    // เริ่มต้นสัปดาห์ที่วันจันทร์
    const startOfWeek = currentWeek.startOf('week').add(1, 'day')
    const data: Array<{
      date: string
      dayName: string
      amount: number
      profit: number
      color: string
    }> = []
    const dayNames = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']
    const dayColors = [
      '#eab308', // จันทร์ - เหลือง
      '#ec4899', // อังคาร - ชมพู
      '#22c55e', // พุธ - เขียว
      '#f97316', // พฤหัสบดี - ส้ม
      '#3b82f6', // ศุกร์ - ฟ้า
      '#8b5cf6', // เสาร์ - ม่วง
      '#ef4444', // อาทิตย์ - แดง
    ]

    for (let i = 0; i < 7; i++) {
      const date = startOfWeek.add(i, 'day')
      const dateStr = date.format('YYYY-MM-DD')
      // หาข้อมูลรายการในวันนั้น
      const dayTransactions = transactions.filter(t => t.date === dateStr)
      const amount = dayTransactions.reduce((sum, t) => sum + t.price, 0)
      const profit = dayTransactions.reduce((sum, t) => sum + t.profit, 0)
      data.push({
        date: dateStr,
        dayName: dayNames[i],
        amount,
        profit,
        color: dayColors[i]
      })
    }

    // Debug log
    console.log('Week Data:', data)
    console.log('Total transactions:', transactions.length)
    console.log('Current week range:', startOfWeek.format('YYYY-MM-DD'), 'to', startOfWeek.add(6, 'day').format('YYYY-MM-DD'))

    return data
  }, [currentWeek, transactions])

  // คำนวณข้อมูลการ์ดรายเดือนแยกตามหมวดหมู่
  const monthlyCardData = useMemo(() => {
    const targetMonth = currentMonthCard.format('YYYY-MM')
    const monthTransactions = transactions.filter(t => t.date.startsWith(targetMonth))
    // แยกตามหมวดหมู่
    const phonesSales = monthTransactions.filter(t => t.category === 'ขายโทรศัพท์')
    const phonesRepair = monthTransactions.filter(t => t.category === 'ซ่อมโทรศัพท์')
    const accessories = monthTransactions.filter(t => t.category === 'ขายอุปกรณ์เสริม')
    const others = monthTransactions.filter(t =>
      !['ขายโทรศัพท์', 'ซ่อมโทรศัพท์', 'ขายอุปกรณ์เสริม'].includes(t.category)
    )
    return {
      phonesSales: {
        revenue: phonesSales.reduce((sum, t) => sum + t.price, 0),
        count: phonesSales.length,
        profit: phonesSales.reduce((sum, t) => sum + t.profit, 0)
      },
      phonesRepair: {
        revenue: phonesRepair.reduce((sum, t) => sum + t.price, 0),
        count: phonesRepair.length,
        profit: phonesRepair.reduce((sum, t) => sum + t.profit, 0)
      },
      accessories: {
        revenue: accessories.reduce((sum, t) => sum + t.price, 0),
        count: accessories.length,
        profit: accessories.reduce((sum, t) => sum + t.profit, 0)
      },
      others: {
        revenue: others.reduce((sum, t) => sum + t.price, 0),
        count: others.length,
        profit: others.reduce((sum, t) => sum + t.profit, 0)
      }
    }
  }, [transactions, currentMonthCard])

  // Functions สำหรับเลื่อนเดือนการ์ด
  const goToPrevMonthCard = () => {
    setCurrentMonthCard(prev => prev.subtract(1, 'month'))
  }

  const goToNextMonthCard = () => {
    setCurrentMonthCard(prev => prev.add(1, 'month'))
  }

  const goToCurrentMonthCard = () => {
    setCurrentMonthCard(dayjs())
  }

  // ฟังก์ชันเลือก gradient สำหรับแต่ละเดือน
  const monthGradients = [
    '#f43f5e, #ec4899', // 0
    '#8b5cf6, #a855f7', // 1
    '#06b6d4, #0891b2', // 2
    '#f59e0b, #d97706', // 3
    '#10b981, #059669', // 4
    '#6366f1, #4f46e5', // 5
  ]

  const formatWeekRange = () => {
    const start = currentWeek.startOf('week')
    const end = currentWeek.endOf('week')
    return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`
  }

  const goToPrevWeek = () => {
    setCurrentWeek(prev => prev.subtract(1, 'week'))
  }
  const goToNextWeek = () => {
    setCurrentWeek(prev => prev.add(1, 'week'))
  }
  const goToCurrentWeek = () => {
    setCurrentWeek(dayjs().startOf('week'))
  }

  // Animation เมื่อ component mount
  useEffect(() => {
    // Component initialization if needed
  }, [])

  useEffect(() => {
    setBarAnimated(false)
    const timer = setTimeout(() => setBarAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [currentDate])

  useEffect(() => {
    setWeekBarAnimated(false)
    const timer = setTimeout(() => setWeekBarAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [currentWeek, transactions])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">FB Mobile Dashboard</h1>
        <p className="text-gray-600">ภาพรวมยอดขายและกำไร</p>
      </div>

      {/* การ์ดรายเดือนแยกตามหมวดหมู่ */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        {/* Header ส่วนการ์ด */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">กำไรรายเดือน</h2>
            <p className="text-sm text-gray-600">{currentMonthCard.format('MMMM YYYY')} • แยกตามหมวดหมู่</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonthCard}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={goToCurrentMonthCard}
              className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              เดือนนี้
            </button>
            <button
              onClick={goToNextMonthCard}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* การ์ดแยกตามหมวดหมู่ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* การ์ด 1: ขายโทรศัพท์ */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white relative overflow-hidden hover:scale-105">
            <div className="relative z-10">
              <div className="mb-1.5">
                <h3 className="text-xs font-medium truncate">ขายมือถือ</h3>
              </div>
              <div className="mb-1">
                <p className="text-xl font-bold truncate">
                  {monthlyCardData.phonesSales.profit > 0 
                    ? `${(monthlyCardData.phonesSales.profit / 1000).toFixed(1)}k` 
                    : '0'}฿
                </p>
              </div>
              <div className="text-xs space-y-0.5">
                <p className="text-blue-100 truncate">
                  ยอดขาย: {monthlyCardData.phonesSales.revenue >= 1000 
                    ? `${(monthlyCardData.phonesSales.revenue / 1000).toFixed(1)}K` 
                    : monthlyCardData.phonesSales.revenue}฿
                </p>
                <p className="truncate">รายการ: {monthlyCardData.phonesSales.count} ครั้ง</p>
              </div>
            </div>
          </div>

          {/* การ์ด 2: ซ่อมโทรศัพท์ */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="mb-1.5">
                <h3 className="text-xs font-medium truncate">ซ่อมมือถือ</h3>
              </div>
              <div className="mb-1">
                <p className="text-xl font-bold truncate">
                  {monthlyCardData.phonesRepair.profit > 0 
                    ? `${(monthlyCardData.phonesRepair.profit / 1000).toFixed(1)}k` 
                    : '0'}฿
                </p>
              </div>
              <div className="text-xs space-y-0.5">
                <p className="text-green-100 truncate">
                  ยอดขาย: {monthlyCardData.phonesRepair.revenue >= 1000 
                    ? `${(monthlyCardData.phonesRepair.revenue / 1000).toFixed(1)}K` 
                    : monthlyCardData.phonesRepair.revenue}฿
                </p>
                <p className="truncate">รายการ: {monthlyCardData.phonesRepair.count} ครั้ง</p>
              </div>
            </div>
          </div>

          {/* การ์ด 3: ขายอุปกรณ์เสริม */}
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="mb-1.5">
                <h3 className="text-xs font-medium truncate">ขายอุปกรณ์เสริม</h3>
              </div>
              <div className="mb-1">
                <p className="text-xl font-bold truncate">
                  {monthlyCardData.accessories.profit > 0 
                    ? `${(monthlyCardData.accessories.profit / 1000).toFixed(1)}k` 
                    : '0'}฿
                </p>
              </div>
              <div className="text-xs space-y-0.5">
                <p className="text-yellow-100 truncate">
                  ยอดขาย: {monthlyCardData.accessories.revenue >= 1000 
                    ? `${(monthlyCardData.accessories.revenue / 1000).toFixed(1)}K` 
                    : monthlyCardData.accessories.revenue}฿
                </p>
                <p className="truncate">รายการ: {monthlyCardData.accessories.count} ครั้ง</p>
              </div>
            </div>
          </div>

          {/* การ์ด 4: อื่นๆ */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="mb-1.5">
                <h3 className="text-xs font-medium truncate">อื่นๆ</h3>
              </div>
              <div className="mb-1">
                <p className="text-xl font-bold truncate">
                  {monthlyCardData.others.profit > 0 
                    ? `${(monthlyCardData.others.profit / 1000).toFixed(1)}k` 
                    : '0'}฿
                </p>
              </div>
              <div className="text-xs space-y-0.5">
                <p className="text-red-100 truncate">
                  ยอดขาย: {monthlyCardData.others.revenue >= 1000 
                    ? `${(monthlyCardData.others.revenue / 1000).toFixed(1)}K` 
                    : monthlyCardData.others.revenue}฿
                </p>
                <p className="truncate">รายการ: {monthlyCardData.others.count} ครั้ง</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* กราฟรายสัปดาห์ */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">กำไรรายสัปดาห์</h2>
            <p className="text-sm text-gray-600">{formatWeekRange()} • ความสูงแสดงตามกำไรจริง (สูงสุด 5,000฿)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              สัปดาห์นี้
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Scale Reference Lines */}
        <div className="mb-2 text-xs text-gray-500 text-right">
          <div className="flex justify-end items-center gap-4">
            <span>เป้าหมาย: 5,000฿</span>
            <span>•</span>
            <span>กำไรรายวัน (บาท)</span>
          </div>
        </div>

        {/* Bar Chart แสดงกำไรรายวัน */}
        <div className="relative">
          {/* Y-axis scale lines - ลดระยะห่างเหลือ 50% และจัดตำแหน่ง label ให้สม่ำเสมอ */}
          <div className="absolute left-0 top-0 h-96 w-full pointer-events-none">
            {/* 5000฿ line (top) */}
            <div className="absolute top-0 left-0 right-4 sm:right-8 h-px bg-red-200 opacity-50">
              <span className="absolute -left-10 sm:-left-12 -top-2 text-xs text-red-500 font-medium">5k฿</span>
            </div>
            {/* 4750฿ line (5%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-20" style={{ top: '5%' }}>
              <span className="absolute -left-14 sm:-left-16 -top-2 text-xs text-gray-300">4.75k฿</span>
            </div>
            {/* 4500฿ line (10%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-30" style={{ top: '10%' }}>
              <span className="absolute -left-14 sm:-left-16 -top-2 text-xs text-gray-400">4.5k฿</span>
            </div>
            {/* 4250฿ line (15%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-20" style={{ top: '15%' }}>
              <span className="absolute -left-16 sm:-left-18 -top-2 text-xs text-gray-300">4.25k฿</span>
            </div>
            {/* 4000฿ line (20%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-50" style={{ top: '20%' }}>
              <span className="absolute -left-10 sm:-left-12 -top-2 text-xs text-gray-400">4k฿</span>
            </div>
            {/* 3750฿ line (25%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-20" style={{ top: '25%' }}>
              <span className="absolute -left-16 sm:-left-18 -top-2 text-xs text-gray-300">3.75k฿</span>
            </div>
            {/* 3500฿ line (30%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-30" style={{ top: '30%' }}>
              <span className="absolute -left-14 sm:-left-16 -top-2 text-xs text-gray-400">3.5k฿</span>
            </div>
            {/* 3250฿ line (35%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-20" style={{ top: '35%' }}>
              <span className="absolute -left-16 sm:-left-18 -top-2 text-xs text-gray-300">3.25k฿</span>
            </div>
            {/* 3000฿ line (40%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-50" style={{ top: '40%' }}>
              <span className="absolute -left-10 sm:-left-12 -top-2 text-xs text-gray-400">3k฿</span>
            </div>
            {/* 2750฿ line (45%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-20" style={{ top: '45%' }}>
              <span className="absolute -left-16 sm:-left-18 -top-2 text-xs text-gray-300">2.75k฿</span>
            </div>
            {/* 2500฿ line (50% - middle) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-blue-300 opacity-60" style={{ top: '50%' }}>
              <span className="absolute -left-14 sm:-left-16 -top-2 text-xs text-blue-500 font-medium">2.5k฿</span>
            </div>
            {/* 2250฿ line (55%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-20" style={{ top: '55%' }}>
              <span className="absolute -left-16 sm:-left-18 -top-2 text-xs text-gray-300">2.25k฿</span>
            </div>
            {/* 2000฿ line (60% - เส้นเน้นพิเศษ) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-blue-300 opacity-80" style={{ top: '60%' }}>
              <span className="absolute -left-10 sm:-left-12 -top-2 text-xs text-blue-500 font-medium">2k฿</span>
            </div>
            {/* 1750฿ line (65%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-20" style={{ top: '65%' }}>
              <span className="absolute -left-16 sm:-left-18 -top-2 text-xs text-gray-300">1.75k฿</span>
            </div>
            {/* 1500฿ line (70%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-30" style={{ top: '70%' }}>
              <span className="absolute -left-14 sm:-left-16 -top-2 text-xs text-gray-400">1.5k฿</span>
            </div>
            {/* 1250฿ line (75%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-20" style={{ top: '75%' }}>
              <span className="absolute -left-16 sm:-left-18 -top-2 text-xs text-gray-300">1.25k฿</span>
            </div>
            {/* 1000฿ line (80%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-50" style={{ top: '80%' }}>
              <span className="absolute -left-10 sm:-left-12 -top-2 text-xs text-gray-400">1k฿</span>
            </div>
            {/* 750฿ line (85%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-20" style={{ top: '85%' }}>
              <span className="absolute -left-12 sm:-left-14 -top-2 text-xs text-gray-300">750฿</span>
            </div>
            {/* 500฿ line (90%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-30" style={{ top: '90%' }}>
              <span className="absolute -left-12 sm:-left-14 -top-2 text-xs text-gray-400">500฿</span>
            </div>
            {/* 250฿ line (95%) */}
            <div className="absolute left-0 right-4 sm:right-8 h-px bg-gray-200 opacity-20" style={{ top: '95%' }}>
              <span className="absolute -left-12 sm:-left-14 -top-2 text-xs text-gray-300">250฿</span>
            </div>
            {/* 0฿ line (bottom) */}
            <div className="absolute bottom-0 left-0 right-4 sm:right-8 h-px bg-gray-300 opacity-60">
              <span className="absolute -left-6 sm:-left-8 -top-2 text-xs text-gray-500">0฿</span>
            </div>
          </div>

          <div className="flex items-end justify-between space-x-1 sm:space-x-2 h-96 mb-4 ml-16 sm:ml-20">
            {weekData.map((day, index) => {
              const maxWeekProfit = 5000
              const targetHeight = day.profit > 0 ? Math.max((day.profit / maxWeekProfit) * 384, 12) : 0
              const heightPixels = weekBarAnimated ? targetHeight : 0
              const transitionDelay = weekBarAnimated ? `${index * 140}ms` : '0ms'
              // ใช้ cubic-bezier แบบ easeOutBack
              const transition = 'height 1.2s cubic-bezier(0.34,1.56,0.64,1)';
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                    <div className="font-bold">{day.dayName}</div>
                    <div>วันที่: {dayjs(day.date).format('D/M/YYYY')}</div>
                    <div>ยอดขาย: {day.amount >= 1000 ? `${(day.amount / 1000).toFixed(1)}K฿` : `${day.amount.toLocaleString()}฿`}</div>
                    <div>กำไร: {day.profit >= 1000 ? `${(day.profit / 1000).toFixed(1)}K฿` : `${day.profit.toLocaleString()}฿`}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                  
                  {/* Bar */}
                  <div
                    className="w-full rounded-t-lg transition-all hover:shadow-lg relative overflow-hidden cursor-pointer border border-gray-200"
                    style={{
                      height: `${heightPixels}px`,
                      transition,
                      transitionDelay,
                      background: day.profit > 0 ? day.color : '#f3f4f6',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      transform: 'translateZ(0)',
                      minHeight: '0px'
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
                    
                    {/* Profit labels inside bar - แสดงกำไรเป็นตัวเลขหลัก ชิดขอบบน */}
                    {day.profit > 0 && heightPixels > 50 && (
                      <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold opacity-95 text-center">
                        <div className="text-xs sm:text-sm leading-tight">{day.profit >= 1000 ? `${(day.profit / 1000).toFixed(1)}K฿` : `${day.profit}฿`}</div>
                        <div className="text-xs opacity-80 mt-0.5 leading-tight hidden sm:block">
                          ยอดขาย: {day.amount >= 1000 ? `${(day.amount / 1000).toFixed(1)}K฿` : `${day.amount}฿`}
                        </div>
                      </div>
                    )}

                    {/* Show values below bar if bar is too small */}
                    {day.profit > 0 && heightPixels <= 50 && (
                      <div className="absolute -bottom-8 sm:-bottom-10 left-1/2 transform -translate-x-1/2 text-gray-700 text-xs font-medium text-center">
                        <div className="bg-white rounded-lg px-1 sm:px-2 py-1 shadow-md border border-gray-200">
                          <div className="font-semibold text-green-600 text-xs">{day.profit >= 1000 ? `${(day.profit / 1000).toFixed(1)}K฿` : `${day.profit}฿`}</div>
                          <div className="text-xs text-blue-600 hidden sm:block">
                            ยอดขาย: {day.amount >= 1000 ? `${(day.amount / 1000).toFixed(1)}K฿` : `${day.amount}฿`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Day label */}
                  <div className="mt-6 sm:mt-8 text-xs sm:text-sm font-medium text-gray-700 text-center">
                    <div>{day.dayName}</div>
                    <div className="text-xs text-gray-500">{dayjs(day.date).format('D/M')}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend สำหรับสีประจำวัน */}
        <div className="mt-4 mb-6">
          <div className="text-xs text-gray-500 mb-2 text-center">สีประจำวัน:</div>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {[
              { name: 'จันทร์', color: '#eab308' }, // เหลือง
              { name: 'อังคาร', color: '#ec4899' }, // ชมพู
              { name: 'พุธ', color: '#22c55e' }, // เขียว
              { name: 'พฤหัสบดี', color: '#f97316' }, // ส้ม
              { name: 'ศุกร์', color: '#3b82f6' }, // ฟ้า
              { name: 'เสาร์', color: '#8b5cf6' }, // ม่วง
              { name: 'อาทิตย์', color: '#ef4444' }  // แดง
            ].map((day) => (
              <div key={day.name} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: day.color }}
                ></div>
                <span className="text-gray-600">{day.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* สรุปยอดรวมสัปดาห์ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-blue-600 font-medium">ยอดขายรวมสัปดาห์</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">
                  {weekData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}฿
                </p>
              </div>
              <div className="bg-blue-500 bg-opacity-10 rounded-lg p-2">
                <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">กำไรรวมสัปดาห์</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">
                  {weekData.reduce((sum, d) => sum + d.profit, 0).toLocaleString()}฿
                </p>
              </div>
              <div className="bg-green-500 bg-opacity-10 rounded-lg p-2">
                <ArrowTrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* กราฟรายเดือน */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">กำไรรายเดือน</h2>
            <p className="text-sm text-gray-600">ย้อนหลัง 6 เดือน</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentDate(prev => prev.subtract(6, 'month'))
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => {
                setCurrentDate(dayjs())
              }}
              className="px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
            >
              ปัจจุบัน
            </button>
            <button
              onClick={() => {
                setCurrentDate(prev => prev.add(6, 'month'))
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Scale Reference Lines */}
        <div className="mb-2 text-xs text-gray-500 text-right">
          <div className="flex justify-end items-center gap-4">
            <span>เป้าหมาย: 50,000฿</span>
            <span>•</span>
            <span>กำไรรายเดือน (บาท)</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="relative">
          {/* Y-axis scale lines */}
          <div className="absolute left-0 top-0 h-96 w-full pointer-events-none">
            {/* 50000฿ line (top) */}
            <div className="absolute top-0 left-0 right-8 h-px bg-red-200 opacity-50">
              <span className="absolute -left-12 -top-2 text-xs text-red-500 font-medium">50k฿</span>
            </div>
            {/* 37500฿ line (75%) */}
            <div className="absolute left-0 right-8 h-px bg-gray-200 opacity-50" style={{ top: '25%' }}>
              <span className="absolute -left-16 -top-2 text-xs text-gray-400">37.5k฿</span>
            </div>
            {/* 25000฿ line (50% - middle) */}
            <div className="absolute left-0 right-8 h-px bg-blue-300 opacity-60" style={{ top: '50%' }}>
              <span className="absolute -left-12 -top-2 text-xs text-blue-500 font-medium">25k฿</span>
            </div>
            {/* 12500฿ line (25%) */}
            <div className="absolute left-0 right-8 h-px bg-gray-200 opacity-50" style={{ top: '75%' }}>
              <span className="absolute -left-16 -top-2 text-xs text-gray-400">12.5k฿</span>
            </div>
            {/* 0฿ line (bottom) */}
            <div className="absolute bottom-0 left-0 right-8 h-px bg-gray-300 opacity-60">
              <span className="absolute -left-8 -top-2 text-xs text-gray-500">0฿</span>
            </div>
          </div>

          <div className="flex items-end justify-between space-x-2 h-96 mb-4 ml-16">
            {monthlyData.map((month, index) => {
              const maxProfit = 50000
              const heightPercentage = month.profit > 0 ? Math.max((month.profit / maxProfit) * 100, 2) : 0
              const heightPixels = barAnimated ? Math.max((heightPercentage / 100) * 384, 0) : 0
              const transitionDelay = barAnimated ? `${index * 140}ms` : '0ms'
              const gradient = monthGradients[index % monthGradients.length]
              // ใช้ cubic-bezier แบบ easeOutBack
              const transition = 'height 1.2s cubic-bezier(0.34,1.56,0.64,1)';
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                    <div className="font-bold">{month.fullMonthName}</div>
                    <div>ยอดขาย: {month.revenue.toLocaleString()}฿</div>
                    <div>กำไร: {month.profit.toLocaleString()}฿</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                  
                  {/* Bar */}
                  <div
                    className="w-full rounded-t-lg transition-all hover:shadow-lg relative overflow-hidden cursor-pointer border border-gray-200"
                    style={{
                      height: `${heightPixels}px`,
                      maxHeight: '384px',
                      background: month.profit > 0 ? `linear-gradient(135deg, ${gradient})` : '#f3f4f6',
                      transition,
                      transitionDelay,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      transform: 'translateZ(0)',
                      minHeight: '0px'
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
                    
                    {/* Profit label always shown in center */}
                    {month.profit > 0 && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold opacity-95 text-center drop-shadow">
                        {month.profit >= 1000 ? `${(month.profit / 1000).toFixed(1)}K฿` : `${month.profit}฿`}
                      </div>
                    )}
                  </div>
                  
                  {/* Month label */}
                  <div className="mt-6 text-sm font-medium text-gray-700">
                    {month.monthName}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* คำอธิบายการอ่านกราฟ */}
        <div className="mt-4 mb-6 text-center">
          <div className="text-xs text-gray-500 mb-2">
            💡 <strong>วิธีอ่านกราฟ:</strong> ความสูงของแถบแสดงกำไรรายเดือน (สูงสุด 50,000฿)
          </div>
          <div className="text-xs text-gray-400">
            เลื่อนเมาส์ไปที่แถบเพื่อดูรายละเอียดยอดขายและกำไร
          </div>
        </div>

        {/* สรุปยอดรวม */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* ยอดขายเดือนนี้ */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">ยอดขายเดือนนี้</p>
              <p className="text-2xl font-bold text-orange-800">
                {(() => {
                  const month = dayjs().format('YYYY-MM');
                  const monthTransactions = transactions.filter(t => t.date.startsWith(month));
                  const total = monthTransactions.reduce((sum, t) => sum + t.price, 0);
                  return total.toLocaleString();
                })()}฿
              </p>
            </div>
            <div className="bg-orange-500 bg-opacity-10 rounded-lg p-2">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          {/* กำไรเดือนนี้ */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">กำไรเดือนนี้</p>
              <p className="text-2xl font-bold text-green-800">
                {(() => {
                  const month = dayjs().format('YYYY-MM');
                  const monthTransactions = transactions.filter(t => t.date.startsWith(month));
                  const total = monthTransactions.reduce((sum, t) => sum + t.profit, 0);
                  return total.toLocaleString();
                })()}฿
              </p>
            </div>
            <div className="bg-green-500 bg-opacity-10 rounded-lg p-2">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* การ์ดยอดขาย/กำไรรวม 6 เดือนล่าสุด */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* ยอดขายรวม 6 เดือนล่าสุด */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">ยอดขายรวม 6 เดือนล่าสุด</p>
              <p className="text-2xl font-bold text-purple-800">
                {monthlyData.reduce((sum, m) => sum + m.revenue, 0).toLocaleString()}฿
              </p>
            </div>
            <div className="bg-purple-500 bg-opacity-10 rounded-lg p-2">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          {/* กำไรรวม 6 เดือนล่าสุด */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">กำไรรวม 6 เดือนล่าสุด</p>
              <p className="text-2xl font-bold text-blue-800">
                {monthlyData.reduce((sum, m) => sum + m.profit, 0).toLocaleString()}฿
              </p>
            </div>
            <div className="bg-blue-500 bg-opacity-10 rounded-lg p-2">
              <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

   
    </div>
  );
}
