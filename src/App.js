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
  }
};

// --- ここから下はver.10ベース ---
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
  // Google Cloud Consoleで発行したクライアントIDを設定してください
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
  // CSV変換
  const header = Object.keys(data[0] || {});
  const rows = [header, ...data.map(a => header.map(k => a[k]))];
  const csv = rows.map(r => r.map(x =>
    typeof x === "string" && /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x
  ).join(",")).join("\r\n");
  // アップロード
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

// --- ver.10のメイン ---（UI・機能そのまま、設定パネル・広告・多言語・フォントサイズ連動を追加）
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

  // フォントサイズ反映
  const fontStyles = { small: 13, medium: 16, large: 21 };

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
  // ...（ver.10のまま、略）

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

  // --- GoogleDriveバックアップ ---
  async function handleBackupGD() {
    await backupToGoogleDrive(assets, "assets-backup.csv", lang);
  }

  // --- UI ---
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
        }}>
          「誰でも直感的・快適に」<b style={{ color: "#e66465" }}>老後資産・キャッシュフロー分析</b>ができるアプリです
        </div>
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
      {/* --- 以降はver.10のまま。省略 --- */}
      {/* ...資産種別タブ、入力フォーム、集計、グラフ等... */}
      <BannerAd lang={lang} />
    </div>
  );
}