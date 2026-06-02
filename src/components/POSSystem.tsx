"use client"
import { useState, useMemo } from 'react'
import {
    categories,
    phoneModelsSell,
    phoneModelsRepair,
    repairOptions,
    accessoryOptions,
    serviceOptions
} from '@/constants/options'
import { TrashIcon, CheckCircleIcon, ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/solid'
import { saveReceiptAsImage } from '@/utils/receiptPrinter'


interface POSSystemProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (data: any) => Promise<void>
    onCancel: () => void
}

type POSStep = 'CATEGORY' | 'SUB_CATEGORY' | 'MODEL' | 'REPAIR_SELECT' | 'PRICE' | 'COST' | 'CONFIRM'

interface CartItem {
    id: string
    category: string
    brand?: string
    model?: string
    detail?: string
    price: number
    cost: number
    displayTitle: string
}

export function POSSystem({ onSave, onCancel }: POSSystemProps) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [currentStep, setCurrentStep] = useState<POSStep>('CATEGORY')
    const [tempItem, setTempItem] = useState<Partial<CartItem>>({})
    const [inputValue, setInputValue] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    // Determine sub-options based on category
    const subOptions = useMemo(() => {
        switch (tempItem.category) {
            case 'ขายโทรศัพท์': return phoneModelsSell
            case 'ซ่อมโทรศัพท์': return phoneModelsRepair // First select brand, then repair detail? Simplified to just brand for now or custom flow
            case 'ขายอุปกรณ์เสริม': return accessoryOptions
            case 'ติดฟิล์ม': return phoneModelsSell // Usually need model for film
            case 'บริการเสริม': return serviceOptions
            default: return []
        }
    }, [tempItem.category])

    const handleCategorySelect = (category: string) => {
        setTempItem({ category, id: Date.now().toString() })

        // Determine next step
        if (['ขายโทรศัพท์', 'ซ่อมโทรศัพท์', 'ติดฟิล์ม'].includes(category)) {
            // Need Brand/Model
            setCurrentStep('SUB_CATEGORY')
        } else if (['ขายอุปกรณ์เสริม', 'บริการเสริม'].includes(category)) {
            // Need Detail
            setCurrentStep('SUB_CATEGORY')
        } else {
            // Go straight to price
            setInputValue('')
            setCurrentStep('PRICE')
        }
    }

    const handleSubSelect = (value: string) => {
        const newItem = { ...tempItem }

        if (['ขายโทรศัพท์', 'ซ่อมโทรศัพท์', 'ติดฟิล์ม'].includes(newItem.category || '')) {
            newItem.brand = value
            setTempItem(newItem)
            setInputValue('') // Reset input for model typing
            setCurrentStep('MODEL')
        } else {
            newItem.detail = value
            setTempItem(newItem)
            setInputValue('')
            setCurrentStep('PRICE')
        }
    }

    const handleModelSubmit = () => {
        let model = inputValue.trim()
        if (!model) model = '-'
        setTempItem((prev) => ({ ...prev, model }))
        setInputValue('')

        if (tempItem.category === 'ซ่อมโทรศัพท์') {
            setCurrentStep('REPAIR_SELECT')
        } else {
            setCurrentStep('PRICE')
        }
    }

    const handleNumpadInput = (num: string) => {
        if (num === 'DEL') {
            setInputValue(prev => prev.slice(0, -1))
        } else if (num === '.') {
            if (!inputValue.includes('.')) setInputValue(prev => prev + '.')
        } else {
            setInputValue(prev => prev + num)
        }
    }

    const handlePriceSubmit = () => {
        const price = parseFloat(inputValue) || 0
        setTempItem(prev => ({ ...prev, price }))

        // Check if we need cost
        const needsCost = !['โอนเงิน', 'เติม&จ่ายบิล'].includes(tempItem.category || '') || tempItem.category === 'ขายซิม'

        if (needsCost) {
            setInputValue('')
            setCurrentStep('COST')
        } else {
            addToCart({ ...tempItem, price, cost: 0 } as CartItem)
        }
    }

    const handleCostSubmit = () => {
        const cost = parseFloat(inputValue) || 0
        addToCart({ ...tempItem, cost } as CartItem)
    }

    const addToCart = (item: CartItem) => {
        // Generate display title
        let title = item.category
        if (item.brand) title += ` ${item.brand}`
        if (item.model && item.model !== '-') title += ` ${item.model}`
        if (item.detail) title += ` (${item.detail})`

        const finalItem = { ...item, displayTitle: title }
        setCart([...cart, finalItem])

        // Reset
        setTempItem({})
        setInputValue('')
        setCurrentStep('CATEGORY')
    }

    const handleCheckout = async (shouldSaveImage = false) => {
        if (cart.length === 0) return

        try {
            setIsProcessing(true)
            const date = new Date().toISOString().split('T')[0]
            const currentCartQueue = [...cart] // Copy before clear

            // Process each item
            for (const item of cart) {
                // Map to transaction format
                const transactionData = {
                    category: item.category,
                    brand: item.brand,
                    model: item.model === '-' ? '' : item.model,
                    detail: item.detail,
                    price: item.price,
                    cost: item.cost,
                    date, // Today
                    // Add specific fields based on category mapping if needed
                    accessoryDetail: item.category === 'ขายอุปกรณ์เสริม' ? item.detail : undefined,
                    serviceDetail: item.category === 'บริการเสริม' ? item.detail : undefined,
                    repairDetail: item.category === 'ซ่อมโทรศัพท์' ? item.detail : undefined,
                }

                await onSave(transactionData)
            }

            if (shouldSaveImage) {
                try {
                    await saveReceiptAsImage(currentCartQueue)
                } catch (error) {
                    console.error('Error saving receipt image:', error)
                    alert('ไม่สามารถบันทึกรูปภาพได้')
                }
            }

            setCart([])
        } catch (error) {
            console.error(error)
            alert('เกิดข้อผิดพลาด')
        } finally {
            setIsProcessing(false)
        }
    }

    // Render Helpers
    const renderNumpad = (onSubmit: () => void, label: string) => (
        <div className="flex flex-col h-full">
            <div className="text-2xl font-bold text-center mb-4 text-[#4682A9]">{label}</div>
            <div className="bg-white border-2 border-[#91C8E4] rounded-xl p-4 mb-4 text-3xl font-mono text-right h-16 flex items-center justify-end">
                {inputValue || '0'}
            </div>
            <div className="grid grid-cols-3 gap-2 flex-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'DEL'].map(k => (
                    <button
                        key={k}
                        onClick={() => handleNumpadInput(String(k))}
                        className={`text-2xl font-bold rounded-lg shadow-sm active:scale-95 transition-transform
              ${k === 'DEL' ? 'bg-red-100 text-red-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        {k}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                    onClick={() => {
                        setInputValue('')
                        setCurrentStep('CATEGORY')
                        setTempItem({})
                    }}
                    className="p-4 bg-gray-400 text-white rounded-xl text-xl font-bold shadow"
                >
                    ยกเลิก
                </button>
                <button
                    onClick={onSubmit}
                    className="p-4 bg-[#4682A9] text-white rounded-xl text-xl font-bold shadow hover:bg-[#3a6d8f]"
                >
                    ตกลง
                </button>
            </div>
        </div>
    )

    const getBrandLogoPath = (brand: string) => {
        const normalized = brand.toLowerCase().trim()
        // Map specific files based on directory listing
        const fileMap: Record<string, string> = {
            'oppo': 'oppo.jpg',
            'realme': 'realme.jpg',
            'samsung': 'samsung.jpg',
            'infinix': 'infinix.jpg',
            'iphone': 'iphone.jpg',
            'nokia': 'nokia.jpg',
            'redmi': 'redmi.jpg',
            'tecno': 'techno.jpg',
            'techno': 'techno.jpg',
            'vivo': 'vivo.jpg'
        }

        const fileName = fileMap[normalized]
        // fallback to jpg if standard format
        if (fileName) return `/brand_logo/${fileName}`

        // Default attempts for others (unlikely to match mixed case properly without map but try)
        return `/brand_logo/${brand}.jpg`
    }

    const renderGrid = (items: readonly string[], onSelect: (val: string) => void, isBrandList = false) => (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[60svh] p-1">
            {items.map(item => (
                <button
                    key={item}
                    onClick={() => onSelect(item)}
                    className={`relative p-4 bg-white border border-[#91C8E4] text-[#4682A9] rounded-xl font-bold shadow-sm hover:bg-[#e0f2fe] hover:scale-105 transition-all text-lg min-h-[100px] flex flex-col items-center justify-center text-center break-words overflow-hidden group
                        ${isBrandList ? 'h-[120px]' : ''}`}
                >
                    {isBrandList ? (
                        <>
                            {/* Brand Image - Covers entire button */}
                            <img
                                src={getBrandLogoPath(item)}
                                alt={item}
                                className="absolute inset-0 w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-110"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    // Make sure text is visible if image fails
                                    const textSpan = e.currentTarget.parentElement?.querySelector('span');
                                    if (textSpan) textSpan.classList.remove('opacity-0');
                                }}
                                onLoad={(e) => {
                                    // Hide text if image loads successfully
                                    const textSpan = e.currentTarget.parentElement?.querySelector('span');
                                    if (textSpan) textSpan.classList.add('opacity-0');
                                }}
                            />
                            {/* Text - hidden if image loads successfully via opacity class manipulation */}
                            <span className="z-10 relative pointer-events-none font-bold text-lg transition-opacity duration-200">{item}</span>
                        </>
                    ) : (
                        item
                    )}
                </button>
            ))}
        </div>
    )

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-4">
            {/* Left Panel: Selection / Input */}
            <div className="flex-1 bg-white/50 rounded-2xl p-4 shadow-inner flex flex-col">
                {currentStep === 'CATEGORY' && (
                    <>
                        <h2 className="text-xl font-bold text-[#4682A9] mb-4 flex items-center gap-2">
                            <span className="bg-[#4682A9] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                            เลือกหมวดหมู่
                        </h2>
                        {renderGrid(categories, handleCategorySelect)}
                    </>
                )}

                {currentStep === 'SUB_CATEGORY' && (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setCurrentStep('CATEGORY')} className="p-1 hover:bg-gray-200 rounded-full">
                                <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
                            </button>
                            <h2 className="text-xl font-bold text-[#4682A9]">
                                ระบุรายละเอียด ({tempItem.category})
                            </h2>
                        </div>
                        {/* Only use Brand logic if category is relevant */}
                        {renderGrid(subOptions, handleSubSelect, ['ขายโทรศัพท์', 'ซ่อมโทรศัพท์', 'ติดฟิล์ม', 'ขายอุปกรณ์เสริม'].includes(tempItem.category || ''))}
                    </>
                )}

                {currentStep === 'MODEL' && (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setCurrentStep('SUB_CATEGORY')} className="p-1 hover:bg-gray-200 rounded-full">
                                <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
                            </button>
                            <h2 className="text-xl font-bold text-[#4682A9]">ระบุรุ่น ({tempItem.brand})</h2>
                        </div>

                        <input
                            autoFocus
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full text-2xl p-4 border-2 border-[#91C8E4] rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#4682A9]"
                            placeholder="พิมพ์ชื่อรุ่น..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleModelSubmit()
                            }}
                        />

                        <div className="flex justify-end mt-auto">
                            <button
                                onClick={handleModelSubmit}
                                className="px-8 py-3 bg-[#4682A9] text-white text-xl font-bold rounded-xl shadow hover:bg-[#3a6d8f]"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 'REPAIR_SELECT' && (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setCurrentStep('MODEL')} className="p-1 hover:bg-gray-200 rounded-full">
                                <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
                            </button>
                            <h2 className="text-xl font-bold text-[#4682A9]">
                                ระบุอาการเสีย
                            </h2>
                        </div>
                        {renderGrid(repairOptions, (val) => {
                            setTempItem(prev => ({ ...prev, detail: val }))
                            setInputValue('')
                            setCurrentStep('PRICE')
                        })}
                    </>
                )}

                {currentStep === 'PRICE' && renderNumpad(handlePriceSubmit, `ระบุราคาขาย (${tempItem.category})`)}
                {currentStep === 'COST' && renderNumpad(handleCostSubmit, 'ระบุต้นทุน (Cost)')}
            </div>

            {/* Right Panel: Cart */}
            <div className="w-full md:w-96 bg-white rounded-2xl shadow-xl p-4 flex flex-col border border-[#91C8E4]">
                <h2 className="text-xl font-bold text-[#4682A9] mb-4 flex items-center gap-2">
                    ตระกร้าสินค้า
                    <span className="bg-[#4682A9] text-white px-2 py-0.5 rounded-full text-xs">{cart.length}</span>
                </h2>

                <div className="flex-1 overflow-y-auto space-y-2 mb-4 p-1">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">ยังไม่มีรายการ</div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                <div>
                                    <div className="font-bold text-gray-800">{item.displayTitle}</div>
                                    <div className="text-xs text-gray-500">
                                        ราคา: {item.price.toLocaleString()} {item.cost > 0 && `(ทุน ${item.cost})`}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-lg">
                        <span className="text-gray-600">รวมเงินทั้งสิ้น</span>
                        <span className="font-bold text-[#4682A9] text-2xl">
                            {cart.reduce((sum, item) => sum + item.price, 0).toLocaleString()} ฿
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => handleCheckout(false)} // Save only
                            disabled={cart.length === 0 || isProcessing}
                            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 text-lg font-bold text-white shadow-lg transition-all
                  ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#4682A9] hover:bg-[#3a6d8f] active:scale-95'}`}
                        >
                            {isProcessing ? '...' : <><CheckCircleIcon className="w-6 h-6" /> บันทึก</>}
                        </button>

                        <button
                            onClick={() => handleCheckout(true)} // Save and Save Image
                            disabled={cart.length === 0 || isProcessing}
                            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 text-lg font-bold text-white shadow-lg transition-all
                  ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 active:scale-95'}`}
                        >
                            {isProcessing ? '...' : <><PrinterIcon className="w-6 h-6" /> บันทึกรูป</>}
                        </button>
                    </div>

                    <button
                        onClick={onCancel}
                        className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                    >
                        กลับหน้าหลัก
                    </button>
                </div>
            </div>
        </div>
    )
}
