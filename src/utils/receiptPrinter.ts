export interface ReceiptItem {
  displayTitle: string
  price: number
  category?: string
}

export const saveReceiptAsImage = async (items: ReceiptItem[], date?: string) => {
  const total = items.reduce((sum, item) => sum + item.price, 0)
  const printDate = date || new Date().toLocaleString('th-TH')

  // Create a temporary container
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  document.body.appendChild(container)

  // Create receipt HTML with 58mm width (standard thermal receipt size)
  container.innerHTML = `
      <div style="font-family: 'Courier New', monospace; width: 220px; text-align: center; font-size: 12px; padding: 16px; background: white; line-height: 1.6; color: #000;">
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #000;">FB mobile</div>
        <div style="font-size: 12px; margin-bottom: 8px; font-weight: 600; color: #000;">ซ่อมมือถือ/ซื้อขาย/ฝาก</div>
        <div style="border-bottom: 2px solid #000; margin: 8px 0;"></div>
        <div style="text-align: left; font-size: 10px; margin-bottom: 8px; font-weight: 600; color: #000;">วันที่: ${printDate}</div>
        <div style="border-bottom: 2px solid #000; margin: 8px 0;"></div>
        
        ${items.map(item => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; text-align: left; font-size: 11px; font-weight: 600; color: #000;">
            <span style="width: 65%; word-wrap: break-word;">${item.displayTitle}</span>
            <span style="white-space: nowrap;">${item.price.toLocaleString()}</span>
          </div>
        `).join('')}
        
        <div style="border-bottom: 2px solid #000; margin: 8px 0;"></div>
        <div style="font-size: 14px; font-weight: bold; margin-top: 10px; text-align: right; color: #000;">รวมทั้งสิ้น: ${total.toLocaleString()} บาท</div>
        <div style="border-bottom: 2px solid #000; margin: 8px 0;"></div>

        ${items.some(item => item.category === 'ขายโทรศัพท์') ? `
        <div style="text-align: left; margin-top: 10px; font-size: 10px; color: #000;">
            <div style="display: flex; align-items: flex-end; margin-bottom: 6px;">
              <span style="white-space: nowrap; font-weight: 600;">Email</span>
              <span style="border-bottom: 1px dotted #000; flex-grow: 1; margin-left: 4px; height: 16px;"></span>
            </div>
            <div style="display: flex; align-items: flex-end;">
              <span style="white-space: nowrap; font-weight: 600;">Password</span>
              <span style="border-bottom: 1px dotted #000; flex-grow: 1; margin-left: 4px; height: 16px;"></span>
            </div>
        </div>
        <div style="border-bottom: 2px solid #000; margin: 8px 0;"></div>
        ` : ''}
        <div style="margin-top: 10px; font-size: 10px; font-weight: 600; color: #000;">
          ขอบคุณที่ใช้บริการ<br/>
          091-235-5710<br/>
          092-918-0335
        </div>
      </div>
    `

  try {
    // Dynamically import html2canvas
    const html2canvas = (await import('html2canvas')).default

    // Convert to canvas with high quality settings
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      scale: 3, // Higher scale for better quality
      backgroundColor: '#ffffff',
      logging: false,
      width: 220,
      height: container.firstElementChild?.scrollHeight,
    } as any)

    // Convert canvas to blob as PNG for better quality
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob: Blob | null) => {
        resolve(blob!)
      }, 'image/png')
    })

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    link.download = `receipt_${timestamp}.png`
    link.href = url
    link.click()

    // Cleanup
    URL.revokeObjectURL(url)
    document.body.removeChild(container)
  } catch (error) {
    console.error('Error generating receipt image:', error)
    document.body.removeChild(container)
    throw error
  }
}
