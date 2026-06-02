-- สร้างตาราง finance_transactions สำหรับทำรายรับรายจ่ายแยกต่างหาก
-- รันคำสั่งนี้ใน Supabase SQL Editor

CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    detail TEXT,
    date DATE NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    profit DECIMAL(10,2) DEFAULT 0,
    repair_detail TEXT,
    accessory_detail TEXT,
    service_detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง index สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category ON finance_transactions(category);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_brand ON finance_transactions(brand);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_model ON finance_transactions(model);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_created_at ON finance_transactions(created_at);

-- เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

-- ตรวจสอบและสร้าง policy (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'finance_transactions' 
        AND policyname = 'Enable all operations for all users'
    ) THEN
        CREATE POLICY "Enable all operations for all users" ON finance_transactions
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- สร้างฟังก์ชันสำหรับอัปเดตเวลาอัตโนมัติ (เผื่อยังไม่มีในระบบ)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger สำหรับอัปเดต updated_at อัตโนมัติ
DROP TRIGGER IF EXISTS update_finance_transactions_updated_at ON finance_transactions;
CREATE TRIGGER update_finance_transactions_updated_at
    BEFORE UPDATE ON finance_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
