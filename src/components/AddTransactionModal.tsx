"use client"
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import clsx from 'clsx'

const categories = [
  'ขายโทรศัพท์',
  'ซ่อมโทรศัพท์',
  'โอนเงิน',
  'เติมเงิน',
  'อื่นๆ',
] as const

const phoneModelsSell = [
  'VIVO', 'OPPO', 'Samsung', 'Infinix', 'TECNO', 'realme','iphone' ,'ปุ่มกด', 'อื่นๆ',
] as const
const phoneModelsRepair = [
  'iPhone', 'VIVO', 'OPPO', 'Samsung', 'Infinix', 'TECNO', 'realme', 'อื่นๆ',
] as const

const transactionSchema = z.object({
  category: z.enum(categories),
  model: z.string().optional(),
  deviceModel: z.string().optional(),
  repairDetail: z.string().optional(),
  cost: z.number().min(0).optional(),
  price: z.number().min(0),
  date: z.string(),
})

type TransactionForm = z.infer<typeof transactionSchema>

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TransactionForm) => void
  defaultValues?: Partial<TransactionForm>
  modelSuggestions?: string[]
}

export function AddTransactionModal({ isOpen, onClose, onSubmit, defaultValues, modelSuggestions = [] }: AddTransactionModalProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      ...defaultValues
    }
  })
  // reset form เมื่อ defaultValues เปลี่ยน (เช่น เปิด modal edit)
  useEffect(() => {
    reset({
      date: new Date().toISOString().split('T')[0],
      ...defaultValues
    })
  }, [defaultValues, reset])

  const selectedCategory = watch('category')
  const showModelSell = selectedCategory === 'ขายโทรศัพท์'
  const showModelRepair = selectedCategory === 'ซ่อมโทรศัพท์'
  const showRepairDetail = selectedCategory === 'ซ่อมโทรศัพท์'
  const showCostField = selectedCategory !== 'โอนเงิน' && selectedCategory !== 'เติมเงิน'

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-white" />
        </Transition.Child>
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
                  className="text-xl font-semibold leading-6 text-gray-900 mb-6"
                >
                  เพิ่มรายการใหม่
                </Dialog.Title>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่
                    </label>
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หมวดหมู่
                    </label>
                    <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                          <option value="">เลือกหมวดหมู่</option>
                          {categories.map(category => (
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
                  {showModelSell && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ</label>
                      <Controller control={control} name="model" render={({ field }) => (
                        <select
                          {...field}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                          <option value="">เลือกยี่ห้อ</option>
                          {phoneModelsSell.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      )} />
                      {/* ถ้าเลือก 'อื่นๆ' ให้แสดง input ระบุยี่ห้อเอง */}
                      {watch('model') === 'อื่นๆ' && (
                        <input
                          type="text"
                          {...register('model', { value: watch('model') })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-2"
                          placeholder="ระบุยี่ห้อเอง"
                        />
                      )}
                      {/* textbox สำหรับกรอกรุ่น ไม่มีแนะนำ */}
                      <input
                        type="text"
                        {...register('deviceModel')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-2"
                        placeholder="กรอกชื่อรุ่น"
                        autoComplete="off"
                      />
                    </div>
                  )}
                  {showModelRepair && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ</label>
                      <Controller control={control} name="model" render={({ field }) => (
                        <select
                          {...field}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                          <option value="">เลือกยี่ห้อ</option>
                          {phoneModelsRepair.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      )} />
                      {/* ถ้าเลือก 'อื่นๆ' ให้แสดง input ระบุยี่ห้อเอง */}
                      {watch('model') === 'อื่นๆ' && (
                        <input
                          type="text"
                          {...register('model', { value: watch('model') })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-2"
                          placeholder="ระบุยี่ห้อเอง"
                        />
                      )}
                      {/* textbox สำหรับกรอกรุ่น ไม่มีแนะนำ */}
                      <input
                        type="text"
                        {...register('deviceModel')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-2"
                        placeholder="กรอกชื่อรุ่น"
                        autoComplete="off"
                      />
                    </div>
                  )}
                  {showRepairDetail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        รายละเอียดการซ่อม
                      </label>
                      <input
                        type="text"
                        {...register('repairDetail')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        placeholder="ระบุรายการซ่อม"
                      />
                    </div>
                  )}
                  {showCostField && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ต้นทุน
                      </label>
                      <input
                        type="number"
                        {...register('cost', { valueAsNumber: true })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        placeholder="0"
                      />
                      {errors.cost && (
                        <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย</label>
                    <input
                      type="number"
                      {...register('price', { valueAsNumber: true })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="0"
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      บันทึก
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
