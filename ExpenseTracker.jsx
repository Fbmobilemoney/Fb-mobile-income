import { useState } from "react";

// ── Design Tokens (จาก Figma) ──────────────────────────────────────
const COLORS = {
  bg:       "#0F0E0C",
  bg2:      "#1A1916",
  gold:     "#C9A84C",
  income:   "#6AAF8A",
  expense:  "#C47068",
  text1:    "#F4EED8",
  text2:    "#A09880",
  border:   "rgba(201,168,76,0.2)",
  borderMd: "rgba(201,168,76,0.25)",
};

// ── Data ───────────────────────────────────────────────────────────
const CHART_DATA = [
  { month: "ม.ค.", inc: 38, exp: 24 },
  { month: "ก.พ.", inc: 46, exp: 18 },
  { month: "มี.ค.", inc: 32, exp: 28 },
  { month: "เม.ย.", inc: 52, exp: 15 },
  { month: "พ.ค.", inc: 42, exp: 22 },
  { month: "มิ.ย.", inc: 58, exp: 32, current: true },
];

const TRANSACTIONS = [
  { id: 1, icon: "💰", name: "เงินเดือน",          cat: "รายได้ · งาน",           amount: "+฿65,000", date: "01 มิ.ย.", income: true },
  { id: 2, icon: "🏠", name: "ค่าเช่า",             cat: "รายจ่าย · ที่อยู่",      amount: "-฿12,000", date: "01 มิ.ย.", income: false },
  { id: 3, icon: "🍽️", name: "อาหาร & เครื่องดื่ม", cat: "รายจ่าย · ชีวิตประจำวัน", amount: "-฿4,280",  date: "วานนี้",  income: false },
  { id: 4, icon: "📈", name: "ปันผลหุ้น",           cat: "รายได้ · การลงทุน",     amount: "+฿8,400",  date: "วันนี้",  income: true },
];

const NAV_ITEMS = [
  { label: "หน้าหลัก", active: true },
  { label: "สถิติ",    active: false },
  { label: "",         active: false }, // FAB placeholder
  { label: "กระเป๋า",  active: false },
  { label: "ตั้งค่า",  active: false },
];

const PERIODS = ["สัปดาห์", "เดือน", "ปี"];

// ── Sub-components ─────────────────────────────────────────────────

function StatusBar() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 24px 0", color: COLORS.text2 }}>
      <span style={{ fontSize: 15, fontWeight: 500 }}>9:41</span>
      <span style={{ fontSize: 12 }}>●●●</span>
    </div>
  );
}

function Avatar({ initial = "ว" }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: COLORS.gold,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 600, color: COLORS.bg,
      border: `1px solid ${COLORS.borderMd}`,
      flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

function BalanceSection({ balance, changePercent }) {
  return (
    <div style={{ padding: "14px 24px 0" }}>
      <p style={{ fontSize: 11, color: COLORS.text2, margin: "0 0 6px", letterSpacing: "0.1em" }}>
        ยอดคงเหลือทั้งหมด
      </p>
      <p style={{ fontSize: 44, fontWeight: 300, color: COLORS.text1, margin: 0, lineHeight: 1 }}>
        {balance}
      </p>
      <p style={{ fontSize: 12, color: COLORS.income, marginTop: 8 }}>
        ↑ {changePercent}% จากเดือนที่แล้ว
      </p>
    </div>
  );
}

function SummaryStrip({ incomeAmount, expenseAmount, period }) {
  const cellStyle = { padding: "14px 16px", flex: 1 };
  const labelStyle = { fontSize: 10, margin: "0 0 4px", letterSpacing: "0.08em" };
  const valueStyle = { fontSize: 22, fontWeight: 500, margin: "0 0 6px", lineHeight: 1.2 };
  const subStyle   = { fontSize: 10, color: COLORS.text2, margin: 0 };

  return (
    <div style={{
      margin: "16px 24px 0",
      background: COLORS.bg2,
      border: `0.5px solid ${COLORS.borderMd}`,
      borderRadius: 16,
      display: "flex",
      overflow: "hidden",
    }}>
      <div style={cellStyle}>
        <p style={{ ...labelStyle, color: COLORS.income }}>● รายรับ</p>
        <p style={{ ...valueStyle, color: COLORS.income }}>{incomeAmount}</p>
        <p style={subStyle}>{period}</p>
      </div>
      <div style={{ width: "0.5px", background: COLORS.borderMd, margin: "12px 0" }} />
      <div style={cellStyle}>
        <p style={{ ...labelStyle, color: COLORS.expense }}>● รายจ่าย</p>
        <p style={{ ...valueStyle, color: COLORS.expense }}>{expenseAmount}</p>
        <p style={subStyle}>{period}</p>
      </div>
    </div>
  );
}

function BarChart({ data, activePeriod, onPeriodChange }) {
  const maxH = 60;
  return (
    <div style={{ margin: "20px 24px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: COLORS.text2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          ภาพรวมรายเดือน
        </span>
        {/* Period tabs */}
        <div style={{
          display: "flex", gap: 2,
          background: COLORS.bg2,
          border: `0.5px solid ${COLORS.borderMd}`,
          borderRadius: 8, padding: 2,
        }}>
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              style={{
                fontSize: 9, padding: "3px 9px", borderRadius: 6,
                border: "none", cursor: "pointer", fontFamily: "inherit",
                background: activePeriod === p ? COLORS.gold : "transparent",
                color: activePeriod === p ? COLORS.bg : COLORS.text2,
                fontWeight: activePeriod === p ? 500 : 400,
                transition: "all 0.15s",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80, paddingBottom: 4 }}>
        {data.map((d) => (
          <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end", width: "100%" }}>
              <div style={{
                flex: 1, borderRadius: "4px 4px 0 0",
                height: d.inc,
                background: COLORS.income,
                opacity: d.current ? 1 : 0.7,
              }} />
              <div style={{
                flex: 1, borderRadius: "4px 4px 0 0",
                height: d.exp,
                background: COLORS.expense,
                opacity: d.current ? 1 : 0.7,
              }} />
            </div>
            <span style={{ fontSize: 9, color: d.current ? COLORS.gold : COLORS.text2, marginTop: 4 }}>
              {d.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionItem({ icon, name, cat, amount, date, income }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: COLORS.bg2,
      border: `0.5px solid ${COLORS.border}`,
      borderRadius: 14, padding: "12px 14px",
      cursor: "pointer",
      transition: "border-color 0.2s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = COLORS.borderMd}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = COLORS.border}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: income ? "rgba(106,175,138,0.12)" : "rgba(196,112,104,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>
        {icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: COLORS.text1, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </p>
        <p style={{ fontSize: 11, color: COLORS.text2, margin: "3px 0 0" }}>{cat}</p>
      </div>

      {/* Amount */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: income ? COLORS.income : COLORS.expense, margin: 0 }}>
          {amount}
        </p>
        <p style={{ fontSize: 10, color: COLORS.text2, margin: "3px 0 0" }}>{date}</p>
      </div>
    </div>
  );
}

function NavBar({ items, onSelect }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "12px 24px 28px",
    }}>
      {items.map((item, i) => {
        if (!item.label) return <div key={i} style={{ width: 56 }} />;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              border: "none", background: "none", cursor: "pointer", padding: 0,
            }}
          >
            <span style={{ fontSize: 10, color: item.active ? COLORS.gold : COLORS.text2, fontFamily: "inherit", fontWeight: item.active ? 500 : 400 }}>
              {item.label}
            </span>
            {item.active && (
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.gold }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function FABButton({ onPress }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", paddingBottom: 24 }}>
      <button
        onClick={onPress}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: COLORS.gold,
          border: "none", borderRadius: 25, padding: "14px 28px",
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 8px 24px rgba(201,168,76,0.3)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(201,168,76,0.4)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)";    e.currentTarget.style.boxShadow = "0 8px 24px rgba(201,168,76,0.3)"; }}
        onMouseDown={(e)  => { e.currentTarget.style.transform = "scale(0.97)"; }}
        onMouseUp={(e)    => { e.currentTarget.style.transform = "scale(1.03)"; }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: COLORS.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: COLORS.gold, lineHeight: 1,
        }}>+</div>
        <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.bg, letterSpacing: "0.04em" }}>
          บันทึกรายการ
        </span>
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function ExpenseTracker() {
  const [activePeriod, setActivePeriod] = useState("เดือน");
  const [navItems, setNavItems]         = useState(NAV_ITEMS);

  const handleNavSelect = (index) => {
    setNavItems((prev) => prev.map((item, i) => ({ ...item, active: i === index })));
  };

  const handleAddTransaction = () => {
    alert("เปิดหน้าบันทึกรายการ");
  };

  return (
    <div style={{
      background: COLORS.bg,
      width: 440,
      minHeight: 956,
      borderRadius: 44,
      overflow: "hidden",
      border: `0.5px solid rgba(201,168,76,0.2)`,
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Status Bar */}
      <StatusBar />

      {/* Greeting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 0" }}>
        <span style={{ fontSize: 13, color: COLORS.text2 }}>สวัสดี, คุณวรินทร์</span>
        <Avatar initial="ว" />
      </div>

      {/* Balance */}
      <BalanceSection balance="฿128,450" changePercent="+12.4" />

      {/* Summary */}
      <SummaryStrip incomeAmount="฿84,000" expenseAmount="฿31,820" period="มิถุนายน 2026" />

      {/* Chart */}
      <BarChart data={CHART_DATA} activePeriod={activePeriod} onPeriodChange={setActivePeriod} />

      {/* Transactions */}
      <div style={{ margin: "20px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text1, margin: 0 }}>รายการล่าสุด</h2>
          <span style={{ fontSize: 11, color: COLORS.gold, cursor: "pointer", letterSpacing: "0.06em" }}>ทั้งหมด →</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TRANSACTIONS.map((tx) => (
            <TransactionItem key={tx.id} {...tx} />
          ))}
        </div>
      </div>

      {/* Gold divider */}
      <div style={{ width: 40, height: 1, background: COLORS.gold, margin: "20px auto 0" }} />

      {/* Nav */}
      <NavBar items={navItems} onSelect={handleNavSelect} />

      {/* FAB */}
      <FABButton onPress={handleAddTransaction} />
    </div>
  );
}
