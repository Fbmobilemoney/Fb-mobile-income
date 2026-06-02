"use client"
import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const categories = [
  'ขายโทรศัพท์',
  'ซ่อมโทรศัพท์',
  'ขายอุปกรณ์เสริม',
  'ติดฟิล์ม',
  'บริการเสริม',
  'โอนเงิน',
  'เติม&จ่ายบิล',
  'ขายซิม', // เพิ่มหมวดหมู่ขายซิม
  'อื่นๆ',
] as const

const phoneModelsSell = [
  'VIVO', 'OPPO', 'Samsung', 'Infinix', 'TECNO', 'Realme','Redmi','iPhone' ,'ปุ่มกด', 'อื่นๆ',
] as const
const phoneModelsRepair = [
  'iPhone', 'VIVO', 'OPPO', 'Samsung', 'Infinix', 'TECNO', 'Realme', 'Redmi', 'อื่นๆ',
] as const

const repairOptions = [
  'เปลี่ยนจอ',
  'เปลี่ยนแบต',
  'ซ่อมก้นชาร์จ',
  'เปลี่ยนปุ่มข้าง',
  'อื่นๆ',
] as const

const accessoryOptions = [
  'สายชาร์จ',
  'หัวชาร์จ',
  'ชุดชาร์จ',
  'หูฟัง',
  'เคส',
  'อื่นๆ',
] as const

const serviceOptions = [
  'ล้างไวรัส',
  'สมัคร gmail',
  'สมัคร line',
  'อื่นๆ',
] as const

const transactionSchema = z.object({
  category: z.enum(categories),
  brand: z.string().optional(),
  model: z.string().optional(),
  detail: z.string().optional(),
  repairDetail: z.string().optional(),
  accessoryDetail: z.string().optional(),
  serviceDetail: z.string().optional(),
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
  isLoading?: boolean
}

export function AddTransactionModal({ isOpen, onClose, onSubmit, defaultValues, isLoading }: AddTransactionModalProps) {
  const [customAccessoryDetail, setCustomAccessoryDetail] = useState('')
  const [customServiceDetail, setCustomServiceDetail] = useState('')
  const [customRepairDetail, setCustomRepairDetail] = useState('')
  const [customBrand, setCustomBrand] = useState('')
  
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
  // reset form เมื่อ defaultValues เปลี่ยน (เช่น เปิด modal edit) หรือเมื่อเปิด modal ใหม่
  useEffect(() => {
    if (defaultValues) {
      // หากมี defaultValues (โหมดแก้ไข) ให้ใช้ข้อมูลเดิม
      reset({
        ...defaultValues,
        date: defaultValues.date || new Date().toISOString().split('T')[0]
      })
    } else {
      // หากไม่มี defaultValues (โหมดเพิ่มใหม่) ให้ reset เป็นค่าเริ่มต้น
      reset({
        date: new Date().toISOString().split('T')[0],
        category: undefined,
        brand: undefined,
        model: undefined,
        detail: undefined,
        repairDetail: undefined,
        accessoryDetail: undefined,
        serviceDetail: undefined,
        cost: undefined,
        price: undefined,
      })
    }
    // Reset custom states
    setCustomAccessoryDetail('')
    setCustomServiceDetail('')
    setCustomRepairDetail('')
    setCustomBrand('')
  }, [defaultValues, reset, isOpen])

  const selectedCategory = watch('category')
  const showModelSell = selectedCategory === 'ขายโทรศัพท์'
  const showModelRepair = selectedCategory === 'ซ่อมโทรศัพท์'
  const showRepairDetail = selectedCategory === 'ซ่อมโทรศัพท์'
  const showAccessoryDetail = selectedCategory === 'ขายอุปกรณ์เสริม'
  const showServiceDetail = selectedCategory === 'บริการเสริม'
  const showDetailField = selectedCategory === 'อื่นๆ'
  const showCostField = !['โอนเงิน', 'เติม&จ่ายบิล'].includes(selectedCategory || '') || selectedCategory === 'ขายซิม'
  
  // Custom submit handler
  const handleFormSubmit = (data: TransactionForm) => {
    console.log('Form data before processing:', data) // Debug log
    
    // สำหรับหมวดหมู่ที่ไม่ต้องการ brand/model ให้ส่ง undefined
    const isNonPhoneCategory = ['โอนเงิน', 'เติม&จ่ายบิล', 'อื่นๆ', 'ขายอุปกรณ์เสริม', 'ติดฟิล์ม', 'บริการเสริม'].includes(data.category)
    
    // รวม detail จากหมวดหมู่ต่างๆ โดยใช้ custom state เมื่อเลือก "อื่นๆ"
    let finalDetail = data.detail || '';
    const finalAccessoryDetail = data.accessoryDetail === 'อื่นๆ' ? customAccessoryDetail : data.accessoryDetail || '';
    const finalServiceDetail = data.serviceDetail === 'อื่นๆ' ? customServiceDetail : data.serviceDetail || '';
    const finalRepairDetail = data.repairDetail === 'อื่นๆ' ? customRepairDetail : data.repairDetail || '';
    const finalBrand = data.brand === 'อื่นๆ' ? customBrand : data.brand;
    
    if (finalAccessoryDetail) {
      finalDetail = finalAccessoryDetail;
    } else if (finalServiceDetail) {
      finalDetail = finalServiceDetail;
    }
    
    const processedData = {
      ...data,
      brand: isNonPhoneCategory ? undefined : (finalBrand || undefined),
      model: isNonPhoneCategory ? undefined : (data.model || undefined),
      detail: finalDetail,
      repairDetail: finalRepairDetail,
      accessoryDetail: finalAccessoryDetail,
      serviceDetail: finalServiceDetail,
      cost: data.cost || 0
    }
    
    console.log('Processed data:', processedData) // Debug log
    console.log('Is non-phone category:', isNonPhoneCategory) // Debug log
    
    onSubmit(processedData)
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
                  className="text-xl font-bold leading-6 text-black mb-6"
                >
                  {defaultValues ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
                </Dialog.Title>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">
                      วันที่
                    </label>
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">
                      หมวดหมู่
                    </label>
                    <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
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
                      <label className="block text-sm font-bold text-black mb-1">ยี่ห้อ</label>
                      <Controller control={control} name="brand" render={({ field }) => (
                        <select
                          {...field}
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                        >
                          <option value="">เลือกยี่ห้อ</option>
                          {phoneModelsSell.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      )} />
                      {/* ถ้าเลือก 'อื่นๆ' ให้แสดง input ระบุยี่ห้อเอง */}
                      {watch('brand') === 'อื่นๆ' && (
                        <input
                          type="text"
                          value={customBrand}
                          onChange={(e) => setCustomBrand(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 mt-2 text-base text-black"
                          placeholder="ระบุยี่ห้อเอง"
                        />
                      )}
                      {/* textbox สำหรับกรอกรุ่น ไม่มีแนะนำ */}
                      <input
                        type="text"
                        {...register('model')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 mt-2 text-base text-black"
                        placeholder="กรอกชื่อรุ่น"
                        autoComplete="off"
                      />
                    </div>
                  )}
                  {showModelRepair && (
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">ยี่ห้อ</label>
                      <Controller control={control} name="brand" render={({ field }) => (
                        <select
                          {...field}
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                        >
                          <option value="">เลือกยี่ห้อ</option>
                          {phoneModelsRepair.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      )} />
                      {/* ถ้าเลือก 'อื่นๆ' ให้แสดง input ระบุยี่ห้อเอง */}
                      {watch('brand') === 'อื่นๆ' && (
                        <input
                          type="text"
                          value={customBrand}
                          onChange={(e) => setCustomBrand(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 mt-2 text-base text-black"
                          placeholder="ระบุยี่ห้อเอง"
                        />
                      )}
                      {/* textbox สำหรับกรอกรุ่น ไม่มีแนะนำ */}
                      <input
                        type="text"
                        {...register('model')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 mt-2 text-base text-black"
                        placeholder="กรอกชื่อรุ่น"
                        autoComplete="off"
                      />
                    </div>
                  )}
                  {showRepairDetail && (
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">
                        รายละเอียดการซ่อม
                      </label>
                      <Controller
                        control={control}
                        name="repairDetail"
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                          >
                            <option value="">เลือกรายการซ่อม</option>
                            {repairOptions.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      {/* ถ้าเลือก 'อื่นๆ' ให้แสดง input ระบุรายละเอียดเอง */}
                      {watch('repairDetail') === 'อื่นๆ' && (
                        <input
                          type="text"
                          value={customRepairDetail}
                          onChange={(e) => setCustomRepairDetail(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 mt-2 text-base text-black"
                          placeholder="ระบุรายละเอียดการซ่อมเอง"
                        />
                      )}
                    </div>
                  )}
                  {showAccessoryDetail && (
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">
                        รายการอุปกรณ์เสริม
                      </label>
                      <Controller
                        control={control}
                        name="accessoryDetail"
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                          >
                            <option value="">เลือกอุปกรณ์เสริม</option>
                            {accessoryOptions.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      {/* ถ้าเลือก 'อื่นๆ' ให้แสดง input ระบุรายละเอียดเอง */}
                      {watch('accessoryDetail') === 'อื่นๆ' && (
                        <input
                          type="text"
                          value={customAccessoryDetail}
                          onChange={(e) => setCustomAccessoryDetail(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 mt-2 text-base text-black"
                          placeholder="ระบุอุปกรณ์เสริมเอง"
                        />
                      )}
                    </div>
                  )}
                  {showServiceDetail && (
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">
                        รายการบริการเสริม
                      </label>
                      <Controller
                        control={control}
                        name="serviceDetail"
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                          >
                            <option value="">เลือกบริการเสริม</option>
                            {serviceOptions.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      {/* ถ้าเลือก 'อื่นๆ' ให้แสดง input ระบุรายละเอียดเอง */}
                      {watch('serviceDetail') === 'อื่นๆ' && (
                        <input
                          type="text"
                          value={customServiceDetail}
                          onChange={(e) => setCustomServiceDetail(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 mt-2 text-base text-black"
                          placeholder="ระบุบริการเสริมเอง"
                        />
                      )}
                    </div>
                  )}
                  {showDetailField && (
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">
                        รายละเอียด
                      </label>
                      <input
                        type="text"
                        {...register('detail')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                        placeholder="ระบุรายละเอียด"
                      />
                    </div>
                  )}
                  {showCostField && (
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">
                        ต้นทุน
                      </label>
                      <input
                        type="number"
                        {...register('cost', { valueAsNumber: true })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
                        placeholder="0"
                      />
                      {errors.cost && (
                        <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">ราคาขาย</label>
                    <input
                      type="number"
                      {...register('price', { valueAsNumber: true })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base text-black"
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
                      className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={isLoading}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
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
