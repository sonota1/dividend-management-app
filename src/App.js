import React, { useState, useMemo } from "react";

// --- 定数定義 ---
const RISK_TAGS = ["低リスク", "中リスク", "高リスク"];
const CURRENCIES = ["JPY", "USD"];
const STOCK_ACCOUNT_TYPES = ["特定口座", "一般口座", "旧NISA", "成長NISA"];
const FUND_ACCOUNT_TYPES = [...STOCK_ACCOUNT_TYPES, "積立NISA"];
const DEPOSIT_TYPES = ["定期", "普通"];
const PENSION_TYPES = [
  "国民年金",
  "厚生年金",
  "企業年金",
  "個人年金保険",
  "確定拠出年金(企業型)",
  "確定拠出年金(個人型/iDeCo)",
];
const INSURANCE_TYPES = [
  "終身保険",
  "養老保険",
  "個人年金保険",
  "変額保険",
  "外貨建保険",
];
const ASSET_TYPES = [
  "株式",
  "REIT",
  "投資信託",
  "債券",
  "貯金",
  "年金",
  "保険",
];

// --- フォーム初期値 ---
function getInitialForm(type = "株式") {
  switch (type) {
    case "株式":
    case "REIT":
      return {
        assetType: type,
        name: "",
        shares: "",
        acquisitionPrice: "",
        currentPrice: "",
        dividendPerShare: "",
        accountType: STOCK_ACCOUNT_TYPES[0],
        riskTag: RISK_TAGS[0],
        currency: "JPY",
        label: "",
      };
    case "投資信託":
      return {
        assetType: type,
        name: "",
        units: "",
        acquisitionPrice: "",
        currentPrice: "",
        distributionPer10k: "",
        accountType: FUND_ACCOUNT_TYPES[0],
        riskTag: RISK_TAGS[0],
        currency: "JPY",
        label: "",
      };
    case "貯金":
      return {
        assetType: type,
        bankName: "",
        amount: "",
        depositType: DEPOSIT_TYPES[0],
        riskTag: RISK_TAGS[0],
        label: "",
      };
    case "年金":
      return {
        assetType: type,
        pensionType: PENSION_TYPES[0],
        totalContribution: "",
        benefitStartAge: "65",
        expectedMonthlyBenefit: "",
        riskTag: RISK_TAGS[0],
        label: "",
      };
    case "債券":
      return {
        assetType: type,
        name: "",
        units: "",
        acquisitionPrice: "",
        maturityDate: "",
        couponRate: "",
        redemptionPrice: "",
        rating: "",
        isZeroCoupon: false,
        riskTag: RISK_TAGS[0],
        currency: "JPY",
        label: "",
      };
    case "保険":
      return {
        assetType: type,
        insuranceType: INSURANCE_TYPES[0],
        monthlyPremium: "",
        surrenderValue: "",
        maturityBenefit: "",
        insuranceCompany: "",
        maturityDateInsurance: "",
        riskTag: RISK_TAGS[0],
        label: "",
      };
    default:
      return {};
  }
}

// --- ユーティリティ ---
function toJPY(amount, currency, usdRate) {
  if (!amount) return 0;
  return currency === "USD" ? amount * usdRate : Number(amount);
}

// --- 桜井政博風UIパーツ ---
function SakuraiButton({ children, selected, ...props }) {
  return (
    <button
      {...props}
      style={{
        marginRight: 10,
        marginBottom: 7,
        padding: "10px 24px",
        borderRadius: 14,
        border: selected ? "2px solid #e66465" : "2px solid #ddd",
        background: selected
          ? "linear-gradient(90deg, #fff6f6 0%, #ffe2e2 100%)"
          : "linear-gradient(90deg, #f6f6fa 0%, #f9f9ff 100%)",
        color: selected ? "#e66465" : "#555",
        fontWeight: selected ? "bold" : "normal",
        fontSize: 17,
        boxShadow: selected
          ? "0 0 0 3px #ffe2e2"
          : "0 2px 6px rgba(220,220,220,0.11)",
        outline: "none",
        cursor: "pointer",
        transition: "all .2s",
        borderBottom: selected ? "5px solid #e66465" : "none",
      }}
    >
      {children}
    </button>
  );
}
function SakuraiSection({ title, children }) {
  return (
    <section style={{
      margin: "32px 0 18px 0",
      background: "rgba(255,255,255,0.94)",
      borderRadius: 18,
      padding: "22px 24px 17px 24px",
      boxShadow: "0 6px 17px -6px #e6646533",
      borderLeft: "8px solid #e66465"
    }}>
      <h3 style={{
        margin: 0,
        marginBottom: 10,
        color: "#e66465",
        fontWeight: 800,
        fontSize: 22,
        letterSpacing: 1,
        fontFamily: "'M PLUS 1p', 'Inter', sans-serif"
      }}>{title}</h3>
      {children}
    </section>
  );
}
function PieChart({ data, colors, size = 130, legend = [] }) {
  const sum = data.reduce((a, b) => a + b.value, 0) || 1;
  let acc = 0;
  const arcs = data.map((d, i) => {
    const start = acc;
    acc += d.value / sum * 360;
    const end = acc;
    const r = size / 2;
    const x1 = r + r * Math.cos((Math.PI * 2 * (start - 90)) / 360);
    const y1 = r + r * Math.sin((Math.PI * 2 * (start - 90)) / 360);
    const x2 = r + r * Math.cos((Math.PI * 2 * (end - 90)) / 360);
    const y2 = r + r * Math.sin((Math.PI * 2 * (end - 90)) / 360);
    const large = end - start > 180 ? 1 : 0;
    const path = `M${r},${r} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`;
    return <path key={i} d={path} fill={colors[i % colors.length]} />;
  });
  return (
    <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
      <svg width={size} height={size} style={{ background: "#fff", borderRadius: "50%" }}>
        {arcs}
      </svg>
      <div>
        {legend.map((l, i) => (
          <div key={i} style={{ fontSize: 14, marginBottom: 3 }}>
            <span style={{
              display: "inline-block", width: 15, height: 15, background: colors[i % colors.length], marginRight: 7, borderRadius: 3, verticalAlign: "middle"
            }} />{l}: <b>{data[i].value.toLocaleString()}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
function LineChart({ data, width = 340, height = 120, color = "#e66465", label = "" }) {
  const minY = Math.min(...data.map(d => d.value));
  const maxY = Math.max(...data.map(d => d.value));
  const rangeY = maxY - minY || 1;
  const n = data.length;
  const points = data.map((d, i) => {
    const x = (i / (n - 1)) * (width - 30) + 16;
    const y = height - 20 - ((d.value - minY) / rangeY) * (height - 35);
    return [x, y];
  });
  const pathD = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  return (
    <div style={{ width, height: height + 25 }}>
      <svg width={width} height={height}>
        <path d={pathD} fill="none" stroke={color} strokeWidth={3} />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2} fill={color} />
        ))}
      </svg>
      <div style={{ textAlign: "center", fontSize: 13, color: "#555" }}>{label}</div>
    </div>
  );
}

// --- CSVエクスポート ---
function CsvExportButton({ assets, usdRate }) {
  const csvHeaders = [
    { label: "資産タイプ", key: "assetType" },
    { label: "銘柄名/銀行/保険会社", key: (a) => a.name || a.bankName || a.insuranceCompany || "" },
    { label: "口座種別", key: "accountType" },
    { label: "数量/口数", key: (a) => a.shares ?? a.units ?? "" },
    { label: "取得単価/取得価格", key: "acquisitionPrice" },
    { label: "現在単価", key: "currentPrice" },
    { label: "配当・分配金", key: (a) => a.dividendPerShare ?? a.distributionPer10k ?? "" },
    { label: "通貨", key: "currency" },
    { label: "金額", key: (a) => a.amount ?? a.surrenderValue ?? a.maturityBenefit ?? "" },
    { label: "預金種別", key: "depositType" },
    { label: "年金種別", key: "pensionType" },
    { label: "累計拠出額", key: "totalContribution" },
    { label: "受給開始年齢", key: "benefitStartAge" },
    { label: "予想月額受給額", key: "expectedMonthlyBenefit" },
    { label: "満期日", key: (a) => a.maturityDate || a.maturityDateInsurance || "" },
    { label: "利率", key: "couponRate" },
    { label: "償還価格", key: "redemptionPrice" },
    { label: "格付け", key: "rating" },
    { label: "ゼロクーポン債", key: (a) => a.isZeroCoupon ? "Yes" : "" },
    { label: "保険種別", key: "insuranceType" },
    { label: "月額保険料", key: "monthlyPremium" },
    { label: "解約返戻金", key: "surrenderValue" },
    { label: "満期保険金", key: "maturityBenefit" },
    { label: "保険会社名", key: "insuranceCompany" },
    { label: "リスクラベル", key: "riskTag" },
    { label: "ラベル", key: "label" },
  ];

  function escapeCsv(value) {
    if (value == null) return "";
    let s = String(value);
    if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function handleExport() {
    const rows = [csvHeaders.map((h) => h.label)];
    for (const asset of assets) {
      const row = csvHeaders.map((h) => {
        let v = typeof h.key === "function" ? h.key(asset) : asset[h.key];
        if (
          (h.key === "acquisitionPrice" ||
            h.key === "currentPrice" ||
            h.key === "amount" ||
            h.key === "surrenderValue") &&
          asset.currency === "USD" &&
          v
        ) {
          v = `${v} (USD) / ${(v * usdRate).toFixed(0)} (JPY)`;
        }
        return escapeCsv(v);
      });
      rows.push(row);
    }
    const csv = rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const fname = `assets_${new Date().toISOString().replace(/[:\-T]/g, "").slice(0, 12)}.csv`;
    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={handleExport} style={{
      marginLeft: 16,
      padding: "10px 22px",
      borderRadius: 14,
      border: "none",
      background: "linear-gradient(135deg, #e66465 0%, #ffd6e0 100%)",
      color: "#e66465",
      fontWeight: "bold",
      fontSize: 15,
      cursor: "pointer",
      boxShadow: "0 2px 12px #ffe2e2"
    }}>
      CSV出力
    </button>
  );
}

// --- メイン ---
export default function App() {
  const [assets, setAssets] = useState([]);
  const [selectedType, setSelectedType] = useState("株式");
  const [form, setForm] = useState(getInitialForm("株式"));
  const [usdRate, setUsdRate] = useState(150);
  const [search, setSearch] = useState("");
  const [monthlyLiving, setMonthlyLiving] = useState(250000);
  const [growthRate, setGrowthRate] = useState(0.03);
  const [simYears, setSimYears] = useState(30);

  // --- 入力・登録 ---
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }
  function handleSubmit(e) {
    e.preventDefault();
    setAssets((prev) => [...prev, { ...form }]);
    setForm(getInitialForm(selectedType));
  }

  // --- 集計 ---
  const assetSummaries = useMemo(() => {
    let total = 0;
    let riskDist = { "低リスク": 0, "中リスク": 0, "高リスク": 0 };
    let classDist = Object.fromEntries(ASSET_TYPES.map(t => [t, 0]));
    let annualCF = 0, monthlyCF = 0;
    let cfBreakdown = Object.fromEntries(["株式", "REIT", "投資信託", "債券", "年金"].map(x => [x, 0]));
    for (const a of assets) {
      let v = 0;
      let cf = 0;
      switch (a.assetType) {
        case "株式":
        case "REIT": {
          v = toJPY(a.currentPrice || a.acquisitionPrice, a.currency, usdRate) * (a.shares || 0);
          cf = (Number(a.dividendPerShare) || 0) * (Number(a.shares) || 0);
          cfBreakdown[a.assetType] += cf;
          break;
        }
        case "投資信託": {
          v = toJPY(a.currentPrice || a.acquisitionPrice, a.currency, usdRate) * (a.units || 0);
          cf = ((Number(a.units) || 0) / 10000) * (Number(a.distributionPer10k) || 0);
          cfBreakdown[a.assetType] += cf;
          break;
        }
        case "債券": {
          v = toJPY(a.acquisitionPrice, a.currency, usdRate) * (a.units || 0);
          if (!a.isZeroCoupon) {
            cf = (Number(a.units) || 0) * (Number(a.couponRate) || 0) * (Number(a.redemptionPrice) || 0) / 100;
          }
          cfBreakdown[a.assetType] += cf;
          break;
        }
        case "貯金": {
          v = Number(a.amount) || 0;
          break;
        }
        case "年金": {
          v = 0;
          cf = (Number(a.expectedMonthlyBenefit) || 0) * 12;
          cfBreakdown[a.assetType] += cf;
          break;
        }
        case "保険": {
          v = Number(a.surrenderValue) || 0;
          break;
        }
        default: break;
      }
      if (a.assetType !== "年金") total += v;
      riskDist[a.riskTag] += v;
      classDist[a.assetType] += v;
      annualCF += cf;
    }
    monthlyCF = annualCF / 12;
    return { total, riskDist, classDist, annualCF, monthlyCF, cfBreakdown };
  }, [assets, usdRate]);

  const livingCoverRate = assetSummaries.monthlyCF / monthlyLiving * 100;

  // --- 資産成長/キャッシュフローシミュレーション ---
  const growthSim = useMemo(() => {
    let asset = assetSummaries.total;
    const res = [];
    for (let y = 0; y <= simYears; ++y) {
      res.push({ year: y, asset: Math.round(asset) });
      asset *= 1 + growthRate;
    }
    return res;
  }, [assetSummaries.total, growthRate, simYears]);
  const cashFlowSim = useMemo(() => {
    let asset = assetSummaries.total;
    let cf = assetSummaries.annualCF;
    let living = monthlyLiving * 12;
    let rows = [];
    for (let y = 0; y <= simYears; ++y) {
      let withdraw = Math.max(living - cf, 0);
      rows.push({
        year: y,
        asset: Math.max(asset, 0),
        annualCF: cf,
        cover: cf / living * 100,
      });
      asset = asset * (1 + growthRate) + cf - living;
    }
    return rows;
  }, [assetSummaries.total, assetSummaries.annualCF, monthlyLiving, growthRate, simYears]);

  // --- テーブル用 ---
  function getAssetDisplay(asset) {
    if (["株式", "REIT"].includes(asset.assetType)) {
      const evalValue = toJPY(asset.currentPrice || asset.acquisitionPrice, asset.currency, usdRate) * (asset.shares || 0);
      const acqValue = toJPY(asset.acquisitionPrice, asset.currency, usdRate) * (asset.shares || 0);
      const profit = evalValue - acqValue;
      const profitRate = acqValue ? (profit / acqValue) * 100 : 0;
      const dividend = (Number(asset.dividendPerShare) || 0) * (Number(asset.shares) || 0);
      const annualYield = evalValue ? (dividend / evalValue) * 100 : 0;
      return { evalValue, profit, profitRate, dividend, annualYield };
    }
    if (asset.assetType === "投資信託") {
      const evalValue = toJPY(asset.currentPrice || asset.acquisitionPrice, asset.currency, usdRate) * (asset.units || 0);
      const acqValue = toJPY(asset.acquisitionPrice, asset.currency, usdRate) * (asset.units || 0);
      const profit = evalValue - acqValue;
      const profitRate = acqValue ? (profit / acqValue) * 100 : 0;
      const dividend = ((Number(asset.units) || 0) / 10000) * (Number(asset.distributionPer10k) || 0);
      const annualYield = evalValue ? (dividend / evalValue) * 100 : 0;
      return { evalValue, profit, profitRate, dividend, annualYield };
    }
    if (asset.assetType === "債券") {
      const evalValue = toJPY(asset.acquisitionPrice, asset.currency, usdRate) * (asset.units || 0);
      let dividend = 0;
      if (!asset.isZeroCoupon) {
        dividend = (Number(asset.units) || 0) * (Number(asset.couponRate) || 0) * (Number(asset.redemptionPrice) || 0) / 100;
      }
      return { evalValue, dividend };
    }
    if (asset.assetType === "貯金") {
      return { evalValue: Number(asset.amount) || 0 };
    }
    if (asset.assetType === "年金") {
      return { evalValue: 0, dividend: (Number(asset.expectedMonthlyBenefit) || 0) * 12 };
    }
    if (asset.assetType === "保険") {
      return { evalValue: Number(asset.surrenderValue) || 0 };
    }
    return {};
  }

  // --- フォーム ---
  function renderForm() {
    switch (selectedType) {
      case "株式":
      case "REIT":
        return (
          <>
            <input name="name" placeholder="銘柄名" value={form.name} onChange={handleFormChange} required />
            <input name="acquisitionPrice" type="number" placeholder="取得単価" value={form.acquisitionPrice} onChange={handleFormChange} required />
            <input name="shares" type="number" placeholder="数量" value={form.shares} onChange={handleFormChange} required />
            <select name="accountType" value={form.accountType} onChange={handleFormChange}>
              {STOCK_ACCOUNT_TYPES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <select name="currency" value={form.currency} onChange={handleFormChange}>
              {CURRENCIES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <input name="currentPrice" type="number" placeholder="現在単価（任意）" value={form.currentPrice} onChange={handleFormChange} />
            <input name="dividendPerShare" type="number" placeholder="一株配当（任意）" value={form.dividendPerShare} onChange={handleFormChange} />
            <select name="riskTag" value={form.riskTag} onChange={handleFormChange}>
              {RISK_TAGS.map((x) => <option key={x}>{x}</option>)}
            </select>
            <input name="label" placeholder="ラベル（任意）" value={form.label} onChange={handleFormChange} />
          </>
        );
      case "投資信託":
        return (
          <>
            <input name="name" placeholder="銘柄名" value={form.name} onChange={handleFormChange} required />
            <input name="acquisitionPrice" type="number" placeholder="取得単価" value={form.acquisitionPrice} onChange={handleFormChange} required />
            <input name="units" type="number" placeholder="口数" value={form.units} onChange={handleFormChange} required />
            <select name="accountType" value={form.accountType} onChange={handleFormChange}>
              {FUND_ACCOUNT_TYPES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <select name="currency" value={form.currency} onChange={handleFormChange}>
              {CURRENCIES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <input name="currentPrice" type="number" placeholder="現在単価（任意）" value={form.currentPrice} onChange={handleFormChange} />
            <input name="distributionPer10k" type="number" placeholder="1万口分配金（任意）" value={form.distributionPer10k} onChange={handleFormChange} />
            <select name="riskTag" value={form.riskTag} onChange={handleFormChange}>
              {RISK_TAGS.map((x) => <option key={x}>{x}</option>)}
            </select>
            <input name="label" placeholder="ラベル（任意）" value={form.label} onChange={handleFormChange} />
          </>
        );
      case "貯金":
        return (
          <>
            <input name="bankName" placeholder="銀行名" value={form.bankName} onChange={handleFormChange} required />
            <input name="amount" type="number" placeholder="金額" value={form.amount} onChange={handleFormChange} required />
            <select name="depositType" value={form.depositType} onChange={handleFormChange}>
              {DEPOSIT_TYPES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <select name="riskTag" value={form.riskTag} onChange={handleFormChange}>
              {RISK_TAGS.map((x) => <option key={x}>{x}</option>)}
            </select>
            <input name="label" placeholder="ラベル（任意）" value={form.label} onChange={handleFormChange} />
          </>
        );
      case "年金":
        return (
          <>
            <select name="pensionType" value={form.pensionType} onChange={handleFormChange}>
              {PENSION_TYPES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <input name="totalContribution" type="number" placeholder="累計拠出額" value={form.totalContribution} onChange={handleFormChange} />
            <input name="benefitStartAge" type="number" placeholder="受給開始年齢" value={form.benefitStartAge} onChange={handleFormChange} />
            <input name="expectedMonthlyBenefit" type="number" placeholder="予想月額受給額" value={form.expectedMonthlyBenefit} onChange={handleFormChange} />
            <select name="riskTag" value={form.riskTag} onChange={handleFormChange}>
              {RISK_TAGS.map((x) => <option key={x}>{x}</option>)}
            </select>
            <input name="label" placeholder="ラベル（任意）" value={form.label} onChange={handleFormChange} />
          </>
        );
      case "債券":
        return (
          <>
            <input name="name" placeholder="債券名" value={form.name} onChange={handleFormChange} required />
            <input name="units" type="number" placeholder="口数" value={form.units} onChange={handleFormChange} required />
            <input name="acquisitionPrice" type="number" placeholder="取得価格" value={form.acquisitionPrice} onChange={handleFormChange} required />
            <input name="maturityDate" type="date" placeholder="満期日" value={form.maturityDate} onChange={handleFormChange} />
            {!form.isZeroCoupon && (
              <input name="couponRate" type="number" placeholder="利率" value={form.couponRate} onChange={handleFormChange} />
            )}
            <input name="redemptionPrice" type="number" placeholder="償還価格" value={form.redemptionPrice} onChange={handleFormChange} />
            <input name="rating" placeholder="格付け(任意)" value={form.rating} onChange={handleFormChange} />
            <label>
              ゼロクーポン債
              <input type="checkbox" name="isZeroCoupon" checked={form.isZeroCoupon} onChange={handleFormChange} />
            </label>
            <select name="currency" value={form.currency} onChange={handleFormChange}>
              {CURRENCIES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <select name="riskTag" value={form.riskTag} onChange={handleFormChange}>
              {RISK_TAGS.map((x) => <option key={x}>{x}</option>)}
            </select>
            <input name="label" placeholder="ラベル（任意）" value={form.label} onChange={handleFormChange} />
          </>
        );
      case "保険":
        return (
          <>
            <select name="insuranceType" value={form.insuranceType} onChange={handleFormChange}>
              {INSURANCE_TYPES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <input name="monthlyPremium" type="number" placeholder="月額保険料" value={form.monthlyPremium} onChange={handleFormChange} />
            <input name="surrenderValue" type="number" placeholder="解約返戻金" value={form.surrenderValue} onChange={handleFormChange} />
            <input name="maturityBenefit" type="number" placeholder="満期保険金" value={form.maturityBenefit} onChange={handleFormChange} />
            <input name="insuranceCompany" placeholder="保険会社名" value={form.insuranceCompany} onChange={handleFormChange} />
            <input name="maturityDateInsurance" type="date" placeholder="保険満期日" value={form.maturityDateInsurance} onChange={handleFormChange} />
            <select name="riskTag" value={form.riskTag} onChange={handleFormChange}>
              {RISK_TAGS.map((x) => <option key={x}>{x}</option>)}
            </select>
            <input name="label" placeholder="ラベル（任意）" value={form.label} onChange={handleFormChange} />
          </>
        );
      default:
        return null;
    }
  }

  // --- フィルタ済み資産 ---
  const filteredAssets = useMemo(() => {
    if (!search) return assets;
    return assets.filter((a) =>
      (a.name || a.bankName || a.insuranceCompany || "")
        .toString()
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [assets, search]);

  // --- 年金スケジュール表示 ---
  function renderPensionSchedule(asset) {
    if (!asset.benefitStartAge || !asset.expectedMonthlyBenefit) return null;
    return (
      <div style={{ fontSize: 12, color: "#666" }}>
        <span>
          {asset.benefitStartAge}歳から年額{(Number(asset.expectedMonthlyBenefit) * 12).toLocaleString()}円受給
        </span>
      </div>
    );
  }

  // --- 収入源ごとの合計 ---
  const incomeSourceLabels = ["株式", "REIT", "投資信託", "債券", "年金"];

  // --- UI ---
  return (
    <div style={{
      fontFamily: "'M PLUS 1p', 'Inter', sans-serif",
      maxWidth: 1100,
      margin: "auto",
      padding: 22,
      background: "linear-gradient(120deg, #fff4f6 0%, #f8fcff 100%)"
    }}>
      <header style={{
        textAlign: "center",
        marginBottom: 40
      }}>
        <h1 style={{
          letterSpacing: 2,
          fontWeight: 900,
          color: "#e66465",
          fontSize: 38,
          fontFamily: "'M PLUS 1p', 'Inter', sans-serif",
          textShadow: "0 3px 0 #ffe2e2"
        }}>Portfolio Master（資産形成）</h1>
        <div style={{
          fontSize: 16,
          color: "#555",
          marginTop: 8,
          letterSpacing: 1,
          fontFamily: "'M PLUS 1p', 'Inter', sans-serif"
        }}>
          「誰でも直感的・快適に」<b style={{ color: "#e66465" }}>老後資産・キャッシュフロー分析</b>ができるアプリです
        </div>
      </header>

      {/* 桜井政博風のアセット種別タブ */}
      <div style={{ marginBottom: 10 }}>
        {ASSET_TYPES.map((type) => (
          <SakuraiButton
            key={type}
            selected={selectedType === type}
            onClick={() => {
              setSelectedType(type);
              setForm(getInitialForm(type));
            }}
          >
            {type}
          </SakuraiButton>
        ))}
      </div>

      {/* 入力フォーム */}
      <SakuraiSection title="資産入力">
        <form onSubmit={handleSubmit} style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px,1fr))",
          gap: 14
        }}>
          {renderForm()}
          <button type="submit" style={{
            gridColumn: "1/-1",
            marginTop: 14,
            padding: "13px 0",
            borderRadius: 14,
            background: "linear-gradient(90deg, #e66465 0%, #ffd6e0 100%)",
            border: "none",
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            letterSpacing: 2,
            cursor: "pointer",
            boxShadow: "0 2px 12px #ffe2e2"
          }}>
            追加
          </button>
        </form>
      </SakuraiSection>

      {/* 検索・為替・CSV */}
      <div style={{ margin: "13px 0 19px 0", display: "flex", alignItems: "center", gap: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="名称などで検索"
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1.5px solid #e66465",
            width: 230,
            fontSize: 15,
            background: "#fff5f7"
          }}
        />
        <label>
          USD/JPY:
          <input
            type="number"
            value={usdRate}
            onChange={e => setUsdRate(Number(e.target.value))}
            style={{
              width: 90,
              padding: "4px 9px",
              marginLeft: 7,
              border: "1px solid #e66465",
              borderRadius: 7,
              background: "#fff"
            }}
          />
        </label>
        <CsvExportButton assets={assets} usdRate={usdRate} />
      </div>

      {/* 生活費カバー率・シミュレーション・分析 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, margin: "36px 0", alignItems: "flex-start" }}>
        <SakuraiSection title="生活費カバー率">
          <div style={{ fontSize: 28, color: livingCoverRate >= 100 ? "#3c8d00" : "#e66465", fontWeight: "bold" }}>
            {livingCoverRate.toFixed(1)}%
          </div>
          <div style={{ color: "#888", fontSize: 14 }}>月間生活費:{monthlyLiving.toLocaleString()}円 / 月</div>
          <div>月間予想収入:{assetSummaries.monthlyCF.toLocaleString()}円</div>
          <div style={{ marginTop: 6 }}>
            <label>生活費:
              <input type="number" value={monthlyLiving} onChange={e => setMonthlyLiving(Number(e.target.value))} style={{
                width: 100, marginLeft: 8, border: "1px solid #e66465", borderRadius: 7
              }} />
              円
            </label>
          </div>
        </SakuraiSection>
        <SakuraiSection title="資産成長シミュレーション">
          <div>
            <label>年利成長率:
              <input type="number" step="0.001" value={growthRate} onChange={e => setGrowthRate(Number(e.target.value))} style={{
                width: 70, marginLeft: 6, border: "1px solid #e66465", borderRadius: 7
              }} />
              （例: 0.03=3%）
            </label>
            <label style={{ marginLeft: 15 }}>
              シミュレーション年数:
              <input type="number" value={simYears} min={1} max={60} onChange={e => setSimYears(Number(e.target.value))} style={{
                width: 60, marginLeft: 6, border: "1px solid #e66465", borderRadius: 7
              }} />年
            </label>
          </div>
          <LineChart
            data={growthSim.map(v => ({ year: v.year, value: v.asset }))}
            label="資産額推移（年）"
            color="#e66465"
            width={310}
            height={110}
          />
        </SakuraiSection>
        <SakuraiSection title="リスク分散状況">
          <PieChart
            data={Object.entries(assetSummaries.riskDist).map(([label, value]) => ({ label, value }))}
            colors={["#4caf50", "#ff9800", "#f44336"]}
            legend={Object.keys(assetSummaries.riskDist)}
          />
        </SakuraiSection>
        <SakuraiSection title="資産クラス別構成">
          <PieChart
            data={Object.entries(assetSummaries.classDist).map(([label, value]) => ({ label, value }))}
            colors={["#4f98ca", "#a2b8ca", "#ffe066", "#b49a67", "#a9e5bb", "#f6c28b", "#ee7674"]}
            legend={Object.keys(assetSummaries.classDist)}
          />
        </SakuraiSection>
      </div>

      <SakuraiSection title="キャッシュフローシミュレーション">
        <LineChart
          data={cashFlowSim.map(v => ({ year: v.year, value: v.annualCF }))}
          label="年間配当・分配金・利息収入（年）"
          color="#72c8b7"
          width={420}
          height={100}
        />
        <div style={{ margin: "17px 0 0 0" }}>
          <table style={{ fontSize: 14, minWidth: 600, background: "#fff", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#ffe2e2" }}>
                <th>年</th>
                <th>資産額</th>
                <th>年間CF</th>
                <th>生活費充足率</th>
              </tr>
            </thead>
            <tbody>
              {cashFlowSim.map((row, i) => (
                <tr key={i}>
                  <td>{row.year}</td>
                  <td>¥{row.asset.toLocaleString()}</td>
                  <td>¥{row.annualCF.toLocaleString()}</td>
                  <td>{row.cover.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SakuraiSection>

      <SakuraiSection title="年間キャッシュフロー予測">
        <div style={{ fontSize: 22, color: "#3b6ad4", fontWeight: "bold" }}>
          合計: {assetSummaries.annualCF.toLocaleString()} 円／年　
          <span style={{ fontSize: 15, color: "#888" }}>
            （月間: {assetSummaries.monthlyCF.toLocaleString()} 円）
          </span>
        </div>
        <div style={{ margin: "9px 0 0 18px", fontSize: 16 }}>
          {incomeSourceLabels.map(label => (
            <div key={label}>
              {label}：{assetSummaries.cfBreakdown[label]?.toLocaleString()} 円／年
            </div>
          ))}
        </div>
      </SakuraiSection>

      <SakuraiSection title="資産一覧・詳細">
        <div style={{ overflowX: "auto" }}>
          <table border={1} cellPadding={5} style={{ width: "100%", minWidth: 800, background: "#fff", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#ffe2e2" }}>
                <th>タイプ</th>
                <th>名称/銀行/会社</th>
                <th>評価額</th>
                <th>配当・分配金/年金年額</th>
                <th>評価損益</th>
                <th>損益率</th>
                <th>年利</th>
                <th>リスク</th>
                <th>ラベル</th>
                <th>備考</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, i) => {
                const disp = getAssetDisplay(asset);
                return (
                  <tr key={i}>
                    <td>{asset.assetType}</td>
                    <td>{asset.name || asset.bankName || asset.insuranceCompany || ""}</td>
                    <td>
                      {disp.evalValue !== undefined ? `¥${disp.evalValue.toLocaleString()}` : ""}
                    </td>
                    <td>
                      {["株式", "REIT", "投資信託"].includes(asset.assetType) && disp.dividend
                        ? `¥${disp.dividend.toLocaleString()}`
                        : asset.assetType === "債券" && disp.dividend
                        ? `¥${disp.dividend.toLocaleString()}`
                        : asset.assetType === "年金" && disp.dividend
                        ? `¥${disp.dividend.toLocaleString()}`
                        : ""}
                    </td>
                    <td>
                      {disp.profit !== undefined ? `¥${disp.profit.toLocaleString()}` : ""}
                    </td>
                    <td>
                      {disp.profitRate !== undefined ? disp.profitRate.toFixed(2) + "%" : ""}
                    </td>
                    <td>
                      {disp.annualYield !== undefined ? disp.annualYield.toFixed(2) + "%" : ""}
                    </td>
                    <td>{asset.riskTag}</td>
                    <td>{asset.label}</td>
                    <td>
                      {asset.assetType === "年金" ? renderPensionSchedule(asset) : ""}
                      {asset.assetType === "債券" && asset.isZeroCoupon ? "ゼロクーポン債" : ""}
                      {asset.accountType ? asset.accountType : ""}
                      {asset.depositType ? asset.depositType : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SakuraiSection>
      <footer style={{ color: "#e66465", textAlign: "center", marginTop: 38, fontWeight: 600, letterSpacing: 1 }}>
        © 2025 Portfolio Master - Designed in the spirit of Masahiro Sakurai's UI philosophy.
      </footer>
    </div>
  );
}