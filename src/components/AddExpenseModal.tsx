"use client"
import { Fragment, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const expenseCategories = [
  'ค่าอาหาร/เครื่องดื่ม',
  'ค่าจ้าง/เงินเดือน',
  'ค่าเช่า',
  'ค่าน้ำ/ค่าไฟ',
  'ค่าโทรศัพท์/อินเทอร์เน็ต',
  'ซื้ออุปกรณ์/อะไหล่เข้าร้าน',
  'ค่าเดินทาง',
  'อื่นๆ',
] as const

const expenseSchema = z.object({
  category: z.enum(expenseCategories),
  detail: z.string().optional(),
  amount: z.number().min(0, 'จำนวนเงินต้องมากกว่า 0'),
  date: z.string(),
})

export type ExpenseForm = z.infer<typeof expenseSchema>

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ExpenseForm) => void
  defaultValues?: Partial<ExpenseForm>
  isLoading?: boolean
}

export function AddExpenseModal({ isOpen, onClose, onSubmit, defaultValues, isLoading }: AddExpenseModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      ...defaultValues
    }
  })

  useEffect(() => {
    if (defaultValues) {
      reset({
        ...defaultValues,
        date: defaultValues.date || new Date().toISOString().split('T')[0]
      })
    } else {
      reset({
        date: new Date().toISOString().split('T')[0],
        category: undefined,
        detail: undefined,
        amount: undefined,
      })
    }
  }, [defaultValues, reset, isOpen])

  const handleFormSubmit = (data: ExpenseForm) => {
    onSubmit(data)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="min-h-full p-4 flex items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md mx-auto bg-white rounded-xl shadow-xl p-6">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-bold leading-6 text-[#3730A3] mb-6"
                >
                  {defaultValues ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่ายใหม่'}
                </Dialog.Title>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                  {/* วันที่ */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">วันที่</label>
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>

                  {/* หมวดหมู่ */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">หมวดหมู่</label>
                    <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                        >
                          <option value="">เลือกหมวดหมู่</option>
                          {expenseCategories.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  {/* รายละเอียด */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">รายละเอียด</label>
                    <input
                      type="text"
                      {...register('detail')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                      placeholder="ระบุรายละเอียด (ไม่จำเป็น)"
                    />
                  </div>

                  {/* จำนวนเงิน */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">จำนวนเงิน (บาท)</label>
                    <input
                      type="number"
                      {...register('amount', { valueAsNumber: true })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                      placeholder="0"
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                    )}
                  </div>

                  {/* ปุ่ม */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={isLoading}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 text-base font-medium text-white bg-[#4F46E5] rounded-lg hover:bg-[#4338CA]"
                      disabled={isLoading}
                    >
                      {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
