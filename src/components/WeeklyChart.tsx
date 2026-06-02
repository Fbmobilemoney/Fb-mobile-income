"use client"
import { useState, useEffect, useMemo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)
dayjs.locale('th')

interface Transaction {
  id: string
  date: string
  price: number
  profit: number
}

interface WeeklyChartProps {
  transactions: Transaction[]
}

interface DayData {
  date: string
  dayName: string
  amount: number
  profit: number
  color: string
}

// สีสำหรับแต่ละวันในสัปดาห์ (จันทร์-อาทิตย์)
const dayNames = [
  'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'
]
const dayColors = [
  '#22c55e', // จันทร์
  '#8b5cf6', // อังคาร
  '#f97316', // พุธ
  '#ef4444', // พฤหัสบดี
  '#06b6d4', // ศุกร์
  '#84cc16', // เสาร์
  '#3b82f6', // อาทิตย์
]

export function WeeklyChart({ transactions }: WeeklyChartProps) {
  // ใช้ isoWeekday(1) เพื่อให้ currentWeek เริ่มที่วันจันทร์เสมอ
  const [currentWeek, setCurrentWeek] = useState(dayjs().isoWeekday(1))
  const [isAnimating, setIsAnimating] = useState(false)

  // Animation เมื่อ component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // คำนวณข้อมูลสัปดาห์ปัจจุบัน
  const weekData = useMemo(() => {
    // ให้เริ่มต้นสัปดาห์ที่จันทร์ (จันทร์-อาทิตย์) ด้วย isoWeekday(1)
    const startOfWeek = currentWeek.isoWeekday(1)
    // สร้าง array ของวันที่จันทร์-อาทิตย์
    const weekDates = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
    const data: DayData[] = weekDates.map((date, i) => {
      const dateStr = date.format('YYYY-MM-DD')
      // หาข้อมูลรายการในวันนั้น
      const dayTransactions = transactions.filter(t => t.date === dateStr)
      const amount = dayTransactions.reduce((sum, t) => sum + t.price, 0)
      const profit = dayTransactions.reduce((sum, t) => sum + t.profit, 0)
      return {
        date: dateStr,
        dayName: dayNames[i],
        amount,
        profit,
        color: dayColors[i]
      }
    })
    return data
  }, [currentWeek, transactions])

  const goToPrevWeek = () => {
    setCurrentWeek(prev => prev.subtract(1, 'week').isoWeekday(1))
    setIsAnimating(false)
    setTimeout(() => setIsAnimating(true), 50)
  }

  const goToNextWeek = () => {
    setCurrentWeek(prev => prev.add(1, 'week').isoWeekday(1))
    setIsAnimating(false)
    setTimeout(() => setIsAnimating(true), 50)
  }

  const goToCurrentWeek = () => {
    setCurrentWeek(dayjs().isoWeekday(1))
    setIsAnimating(false)
    setTimeout(() => setIsAnimating(true), 50)
  }

  const formatWeekRange = () => {
    const start = currentWeek.isoWeekday(1)
    const end = currentWeek.isoWeekday(7)
    return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`
  }

  const totalWeekAmount = weekData.reduce((sum, d) => sum + d.amount, 0)
  const totalWeekProfit = weekData.reduce((sum, d) => sum + d.profit, 0)

  // ยอดขายและกำไรของเดือนปัจจุบัน
  const currentMonth = dayjs().format('YYYY-MM')
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth))
  const totalMonthAmount = monthTransactions.reduce((sum, t) => sum + t.price, 0)
  const totalMonthProfit = monthTransactions.reduce((sum, t) => sum + t.profit, 0)

  // ยอดขายและกำไร 6 เดือนล่าสุด
  const last6Months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(i, 'month').format('YYYY-MM'));
  const last6MonthsTransactions = transactions.filter(t => last6Months.includes(t.date.slice(0, 7)));
  const total6MonthAmount = last6MonthsTransactions.reduce((sum, t) => sum + t.price, 0);
  const total6MonthProfit = last6MonthsTransactions.reduce((sum, t) => sum + t.profit, 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      {/* กล่องยอดขาย/กำไร 6 เดือน ด้านบนสุด */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* ยอดขายรวม 6 เดือน */}
        <div className="bg-fuchsia-50 rounded-xl p-4 border border-fuchsia-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-fuchsia-700 font-medium">ยอดขายรวม 6 เดือนล่าสุด</p>
              <p className="text-2xl font-bold text-fuchsia-800">
                {total6MonthAmount.toLocaleString()}฿
              </p>
            </div>
            <div className="bg-fuchsia-500 bg-opacity-10 rounded-lg p-2">
              <svg className="w-6 h-6 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4.5V15" />
              </svg>
            </div>
          </div>
        </div>
        {/* กำไรรวม 6 เดือน */}
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-medium">กำไรรวม 6 เดือน</p>
              <p className="text-2xl font-bold text-emerald-800">
                {total6MonthProfit.toLocaleString()}฿
              </p>
            </div>
            <div className="bg-emerald-500 bg-opacity-10 rounded-lg p-2">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l5 5L20 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* กล่องยอดขาย/กำไรเดือนนี้ ด้านบนสุด */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* ยอดขายรวมเดือนนี้ */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">ยอดขายรวมเดือนนี้</p>
              <p className="text-2xl font-bold text-purple-700">
                {totalMonthAmount.toLocaleString()}฿
              </p>
            </div>
            <div className="bg-purple-500 bg-opacity-10 rounded-lg p-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
        {/* กำไรรวมเดือนนี้ */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">กำไรรวมเดือนนี้</p>
              <p className="text-2xl font-bold text-green-700">
                {totalMonthProfit.toLocaleString()}฿
              </p>
            </div>
            <div className="bg-green-500 bg-opacity-10 rounded-lg p-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">ยอดขายรายสัปดาห์</h2>
          <p className="text-sm text-gray-600">{formatWeekRange()}</p>
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

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {weekData.map((day, index) => (
          <div
            key={day.date}
            className="rounded-2xl p-4 text-white relative overflow-hidden transform transition-all duration-900 ease-in-out hover:scale-105"
            style={{
              backgroundColor: day.color,
              opacity: isAnimating ? 1 : 0,
              transform: `translateY(${isAnimating ? '0' : '40px'})`,
              transitionDelay: `${index * 120}ms`
            }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
            
            {/* วันในสัปดาห์ */}
            <div className="relative z-10">
              <h3 className="text-sm font-medium opacity-90 mb-1">
                {day.dayName}
              </h3>
              
              {/* ยอดขาย */}
              <div className="mb-3">
                <p className="text-xl font-bold">
                  {day.amount > 0 ? `${(day.amount / 1000).toFixed(1)}k` : '0'}฿
                </p>
                <p className="text-xs opacity-75">
                  {day.amount > 0 ? `กำไร: ${day.profit.toLocaleString()}฿` : 'ไม่มีรายการ'}
                </p>
              </div>
              
              {/* วันที่ */}
              <p className="text-xs opacity-75">
                {dayjs(day.date).format('D/M')}
              </p>
            </div>

            {/* Icon มุมขวาล่าง */}
            <div className="absolute bottom-2 right-2 opacity-20">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19C3 20.1 3.9 21 5 21H11V19H5V3H13V9H21ZM17 12L20.5 15.5L17 19V17H13V14H17V12Z"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* legend สีประจำวัน: จันทร์-อาทิตย์ */}
      <div className="flex justify-center gap-3 mt-4 text-xs">
        {dayNames.map((name, i) => (
          <div key={name} className="flex items-center gap-1">
            <span style={{ backgroundColor: dayColors[i], width: 12, height: 12, borderRadius: '50%', display: 'inline-block' }}></span>
            <span>{name}</span>
          </div>
        ))}
      </div>

      {/* สรุปยอดรวมสัปดาห์ */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* ยอดขายรวมสัปดาห์ */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">ยอดขายรวมสัปดาห์นี้</p>
              <p className="text-2xl font-bold text-blue-700">
                {totalWeekAmount.toLocaleString()}฿
              </p>
            </div>
            <div className="bg-blue-500 bg-opacity-10 rounded-lg p-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
        {/* กำไรรวมสัปดาห์ */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">กำไรรวมสัปดาห์นี้</p>
              <p className="text-2xl font-bold text-green-700">
                {totalWeekProfit.toLocaleString()}฿
              </p>
            </div>
            <div className="bg-green-500 bg-opacity-10 rounded-lg p-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* สถิติเพิ่มเติม */}
      {totalWeekAmount > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">วันที่ขายได้มากที่สุด:</span>
            <span className="font-bold text-gray-900">
              {(() => {
                const maxDay = weekData.reduce((prev, current) => 
                  prev.amount > current.amount ? prev : current
                )
                return maxDay.amount > 0 
                  ? `${maxDay.dayName} (${maxDay.amount.toLocaleString()}฿)`
                  : 'ไม่มีข้อมูล'
              })()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">ค่าเฉลี่ยต่อวัน:</span>
            <span className="font-medium text-gray-900">
              {Math.round(totalWeekAmount / 7).toLocaleString()}฿
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
