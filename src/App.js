import React, { useState, useMemo } from "react";

// --- 多言語定義 ---
const LANGUAGES = { ja: "日本語", en: "English", zh: "中文" };
const FONT_SIZES = { small: "小", medium: "中", large: "大" };
const TEXTS = {
  ja: {
    settings: "設定",
    lang: "言語",
    font: "フォントサイズ",
    howto: "使い方",
    contact: "問い合わせ",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    adMsg: "🔷PR: 資産運用オンライン相談はこちら（sonota1）",
    backupGD: "Google Driveにバックアップ",
    importCSV: "CSVインポート",
    ok: "OK",
    usage: "資産の入力方法や使い方: 各資産タイプ・項目を入力して追加してください。",
    add: "追加",
    search: "検索",
    exportCSV: "CSV出力",
    amount: "金額",
    currency: "通貨",
    risk: "リスク",
    label: "ラベル",
    assetType: "資産種別",
    annualCF: "年間CF",
    covered: "生活費カバー率",
  },
  en: {
    settings: "Settings",
    lang: "Language",
    font: "Font Size",
    howto: "How to Use",
    contact: "Contact",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    adMsg: "🔷PR: Online asset consulting (sonota1)",
    backupGD: "Backup to Google Drive",
    importCSV: "Import CSV",
    ok: "OK",
    usage: "How to use: Enter and add each asset type and field as needed.",
    add: "Add",
    search: "Search",
    exportCSV: "Export CSV",
    amount: "Amount",
    currency: "Currency",
    risk: "Risk",
    label: "Label",
    assetType: "Asset Type",
    annualCF: "Annual CF",
    covered: "Living Cost Coverage",
  },
  zh: {
    settings: "设置",
    lang: "语言",
    font: "字体大小",
    howto: "使用说明",
    contact: "联系",
    terms: "使用条款",
    privacy: "隐私政策",
    adMsg: "🔷广告：在线资产咨询（sonota1）",
    backupGD: "备份到Google Drive",
    importCSV: "导入CSV",
    ok: "OK",
    usage: "使用方法: 请填写各资产类型和项目并添加。",
    add: "添加",
    search: "搜索",
    exportCSV: "导出CSV",
    amount: "金额",
    currency: "货币",
    risk: "风险",
    label: "标签",
    assetType: "资产类型",
    annualCF: "年现金流",
    covered: "生活费覆盖率",
  }
};

// --- 定数 ---
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
const INCOME_SOURCES = [
  { key: "株式", color: "#d43b00", label: "株式" },
  { key: "REIT", color: "#e6b400", label: "REIT" },
  { key: "投資信託", color: "#1c9cdb", label: "投資信託" },
  { key: "債券", color: "#6bbb69", label: "債券" },
  { key: "年金", color: "#6f62b5", label: "年金" },
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

// --- 広告バナー ---
function BannerAd({ lang }) {
  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9999,
      background: "#fff2f2", color: "#d43b00", textAlign: "center",
      padding: "12px 0", borderTop: "2px solid #e66465", fontWeight: 600
    }}>
      <span>{TEXTS[lang].adMsg} <a href="https://www.sonota1.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#ee3344" }}>sonota1.com</a></span>
    </div>
  );
}

// --- 設定パネル ---
function SettingsPanel({ lang, setLang, fontSize, setFontSize, show, onClose, onImportCSV, onBackupGD }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(100,0,0,0.18)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, padding: 36, minWidth: 340,
        boxShadow: "0 8px 48px rgba(220,0,0,0.09)", textAlign: "center"
      }}>
        <h3 style={{ color: "#e66465" }}>{TEXTS[lang].settings}</h3>
        <div style={{ margin: "16px 0" }}>
          <b>{TEXTS[lang].lang}:</b>
          {Object.keys(LANGUAGES).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                margin: 6, padding: "7px 19px",
                borderRadius: 9, border: lang === l ? "2px solid #e66465" : "1px solid #ccc",
                background: lang === l ? "#ffe2e2" : "#fff",
                color: lang === l ? "#d43b00" : "#555", fontWeight: 600, cursor: "pointer"
              }}
            >{LANGUAGES[l]}</button>
          ))}
        </div>
        <div style={{ margin: "10px 0 17px" }}>
          <b>{TEXTS[lang].font}:</b>
          {Object.keys(FONT_SIZES).map(f => (
            <button
              key={f}
              onClick={() => setFontSize(f)}
              style={{
                margin: 6, padding: "7px 19px",
                borderRadius: 9, border: fontSize === f ? "2px solid #e66465" : "1px solid #ccc",
                background: fontSize === f ? "#ffe2e2" : "#fff",
                color: fontSize === f ? "#d43b00" : "#555", fontWeight: 600, cursor: "pointer"
              }}
            >{FONT_SIZES[f]}</button>
          ))}
        </div>
        <div style={{ margin: "10px 0", fontSize: 15, color: "#555" }}>
          <div><a href="#" onClick={e => { e.preventDefault(); alert(TEXTS[lang].usage); }}>{TEXTS[lang].howto}</a></div>
          <div><a href="mailto:info@sonota1.com" target="_blank" rel="noopener noreferrer">{TEXTS[lang].contact}</a></div>
          <div><a href="https://www.sonota1.com/terms" target="_blank" rel="noopener noreferrer">{TEXTS[lang].terms}</a></div>
          <div><a href="https://www.sonota1.com/privacy" target="_blank" rel="noopener noreferrer">{TEXTS[lang].privacy}</a></div>
        </div>
        <div style={{ margin: "18px 0" }}>
          {/* GoogleDriveバックアップ & CSVインポート */}
          <button
            onClick={onBackupGD}
            style={{ marginRight: 10, padding: "10px 18px", borderRadius: 10, border: "none", background: "#4285F4", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
          >{TEXTS[lang].backupGD}</button>
          <input
            id="csv-import-input"
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={onImportCSV}
          />
          <button
            onClick={() => document.getElementById("csv-import-input").click()}
            style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#ffd6e0", color: "#e66465", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
          >{TEXTS[lang].importCSV}</button>
        </div>
        <button onClick={onClose} style={{
          marginTop: 12, padding: "8px 38px", borderRadius: 10,
          background: "#ffe2e2", color: "#e66465", fontWeight: 700, border: "none", cursor: "pointer"
        }}>{TEXTS[lang].ok}</button>
      </div>
    </div>
  );
}

// --- Google Driveバックアップ（CSVでアップロード） ---
async function backupToGoogleDrive(data, filename = "assets-backup.csv", lang = "ja") {
  const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
  const SCOPES = "https://www.googleapis.com/auth/drive.file";
  if (!window.gapi) {
    alert("Google APIがロードされていません。");
    return;
  }
  await new Promise(resolve => window.gapi.load("client:auth2", resolve));
  await window.gapi.client.init({
    clientId: CLIENT_ID,
    scope: SCOPES,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  });
  const auth = window.gapi.auth2.getAuthInstance();
  await auth.signIn();
  const header = Object.keys(data[0] || {});
  const rows = [header, ...data.map(a => header.map(k => a[k]))];
  const csv = rows.map(r => r.map(x =>
    typeof x === "string" && /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x
  ).join(",")).join("\r\n");
  const file = new Blob([csv], { type: "text/csv" });
  const metadata = { name: filename, mimeType: "text/csv" };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);
  const accessToken = window.gapi.auth.getToken().access_token;
  const resp = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { Authorization: "Bearer " + accessToken },
    body: form,
  });
  if (resp.ok) {
    alert(lang === "ja" ? "Google Driveにバックアップしました！" : lang === "zh" ? "已备份到Google Drive！" : "Backup to Google Drive completed!");
  } else {
    alert("Google Driveへのバックアップに失敗しました。");
  }
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
  const [lang, setLang] = useState("ja");
  const [fontSize, setFontSize] = useState("medium");
  const [showSettings, setShowSettings] = useState(false);

  const fontStyles = { small: 13, medium: 16, large: 21 };

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }
  function handleSubmit(e) {
    e.preventDefault();
    setAssets((prev) => [...prev, { ...form }]);
    setForm(getInitialForm(selectedType));
  }

  // --- ファイルインポート ---
  function handleImportCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.split(/\r?\n/).filter(Boolean);
      if (!lines.length) return;
      const header = lines[0].split(",");
      const data = lines.slice(1).map(line => {
        const cols = [];
        let cur = "", inQuote = false;
        for (let i = 0; i < line.length; ++i) {
          const c = line[i];
          if (c === '"') {
            if (inQuote && line[i + 1] === '"') { cur += '"'; ++i; }
            else inQuote = !inQuote;
          } else if (c === "," && !inQuote) {
            cols.push(cur);
            cur = "";
          } else {
            cur += c;
          }
        }
        cols.push(cur);
        return Object.fromEntries(header.map((k, i) => [k, cols[i] ?? ""]));
      });
      setAssets(data);
      setForm(getInitialForm(selectedType));
      alert(lang === "ja" ? "CSVインポートが完了しました。" : lang === "zh" ? "CSV导入完成。" : "CSV Import Complete.");
    };
    reader.readAsText(file);
  }

  async function handleBackupGD() {
    await backupToGoogleDrive(assets, "assets-backup.csv", lang);
  }

  // --- 分析・集計 ---
  const { total, riskDist, classDist, annualCF, monthlyCF, cfBreakdown } = useMemo(() => {
    let total = 0;
    let riskDist = { "低リスク": 0, "中リスク": 0, "高リスク": 0 };
    let classDist = Object.fromEntries(ASSET_TYPES.map(t => [t, 0]));
    let annualCF = 0, monthlyCF = 0;
    let cfBreakdown = Object.fromEntries(INCOME_SOURCES.map(x => [x.key, 0]));
    for (const a of assets) {
      let v = 0, cf = 0;
      switch (a.assetType) {
        case "株式":
        case "REIT":
          v = toJPY(a.currentPrice || a.acquisitionPrice, a.currency, usdRate) * (a.shares || 0);
          cf = (Number(a.dividendPerShare) || 0) * (Number(a.shares) || 0);
          break;
        case "投資信託":
          v = toJPY(a.currentPrice || a.acquisitionPrice, a.currency, usdRate) * (a.units || 0);
          cf = ((Number(a.units) || 0) / 10000) * (Number(a.distributionPer10k) || 0);
          break;
        case "債券":
          v = toJPY(a.acquisitionPrice, a.currency, usdRate) * (a.units || 0);
          if (!a.isZeroCoupon) {
            cf = (Number(a.units) || 0) * (Number(a.couponRate) || 0) * (Number(a.redemptionPrice) || 0) / 100;
          }
          break;
        case "貯金":
          v = Number(a.amount) || 0;
          break;
        case "年金":
          v = 0;
          cf = (Number(a.expectedMonthlyBenefit) || 0) * 12;
          break;
        case "保険":
          v = Number(a.surrenderValue) || 0;
          break;
        default: break;
      }
      if (a.assetType !== "年金") total += v;
      riskDist[a.riskTag] += v;
      classDist[a.assetType] += v;
      annualCF += cf;
      if (cfBreakdown[a.assetType] !== undefined) cfBreakdown[a.assetType] += cf;
    }
    monthlyCF = annualCF / 12;
    return { total, riskDist, classDist, annualCF, monthlyCF, cfBreakdown };
  }, [assets, usdRate]);

  const livingCoverRate = monthlyCF / monthlyLiving * 100;

  // --- 資産成長シミュレーション ---
  const growthSimData = useMemo(() => {
    let asset = total;
    const arr = [];
    for (let y = 0; y <= simYears; ++y) {
      arr.push({ year: y, value: Math.round(asset) });
      asset *= 1 + growthRate;
    }
    return arr;
  }, [total, growthRate, simYears]);

  // --- キャッシュフローシミュレーション ---
  const cashFlowSim = useMemo(() => {
    let asset = total;
    let cf = annualCF;
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
  }, [total, annualCF, monthlyLiving, growthRate, simYears]);

  // --- 資産入力フォーム ---
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

  return (
    <div style={{
      fontFamily: "'M PLUS 1p', 'Inter', sans-serif",
      fontSize: fontStyles[fontSize],
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
          fontSize: fontSize === "large" ? 38 : fontSize === "small" ? 24 : 32,
          fontFamily: "'M PLUS 1p', 'Inter', sans-serif",
          textShadow: "0 3px 0 #ffe2e2"
        }}>Portfolio Master</h1>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            float: "right",
            marginTop: -36,
            marginRight: 2,
            background: "#fff",
            color: "#e66465",
            border: "2px solid #e66465",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: fontStyles[fontSize] - 2,
            cursor: "pointer",
            padding: "5px 18px"
          }}>{TEXTS[lang].settings}</button>
        <div style={{
          fontSize: 16,
          color: "#555",
          marginTop: 8,
          letterSpacing: 1,
          fontFamily: "'M PLUS 1p', 'Inter', sans-serif"
        }}>{TEXTS[lang].usage}</div>
      </header>
      <SettingsPanel
        lang={lang}
        setLang={setLang}
        fontSize={fontSize}
        setFontSize={setFontSize}
        show={showSettings}
        onClose={() => setShowSettings(false)}
        onImportCSV={handleImportCSV}
        onBackupGD={handleBackupGD}
      />
      {/* --- 資産種別タブ --- */}
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
      {/* --- 入力フォーム --- */}
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
            {TEXTS[lang].add}
          </button>
        </form>
      </SakuraiSection>
      {/* --- 分析機能 --- */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, margin: "36px 0", alignItems: "flex-start" }}>
        <SakuraiSection title="生活費カバー率">
          <div style={{ fontSize: 28, color: livingCoverRate >= 100 ? "#3c8d00" : "#e66465", fontWeight: "bold" }}>
            {livingCoverRate.toFixed(1)}%
          </div>
          <div style={{ color: "#888", fontSize: 14 }}>月間生活費:{monthlyLiving.toLocaleString()}円 / 月</div>
          <div>月間予想収入:{monthlyCF.toLocaleString()}円</div>
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
            data={growthSimData}
            label="資産額推移（年）"
            color="#e66465"
            width={310}
            height={110}
          />
        </SakuraiSection>
        <SakuraiSection title="リスク分散状況">
          <PieChart
            data={Object.entries(riskDist).map(([label, value]) => ({ label, value }))}
            colors={["#4caf50", "#ff9800", "#f44336"]}
            legend={Object.keys(riskDist)}
          />
        </SakuraiSection>
        <SakuraiSection title="資産クラス別構成">
          <PieChart
            data={Object.entries(classDist).map(([label, value]) => ({ label, value }))}
            colors={["#4f98ca", "#a2b8ca", "#ffe066", "#b49a67", "#a9e5bb", "#f6c28b", "#ee7674"]}
            legend={Object.keys(classDist)}
          />
        </SakuraiSection>
      </div>
      <SakuraiSection title="年間キャッシュフロー予測">
        <div style={{ fontSize: 22, color: "#3b6ad4", fontWeight: "bold" }}>
          合計: {annualCF.toLocaleString()} 円／年　
          <span style={{ fontSize: 15, color: "#888" }}>
            （月間: {monthlyCF.toLocaleString()} 円）
          </span>
        </div>
        <div style={{ margin: "9px 0 0 18px", fontSize: 16 }}>
          {INCOME_SOURCES.map(source => (
            <div key={source.key}>
              {source.label}：{cfBreakdown[source.key]?.toLocaleString()} 円／年
            </div>
          ))}
        </div>
      </SakuraiSection>
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
      <BannerAd lang={lang} />
    </div>
  );
}