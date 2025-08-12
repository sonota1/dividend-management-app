import React, { useState, useMemo } from "react";

// --- 定数 ---
const RISK_TAGS = ["低リスク", "中リスク", "高リスク"];
const CURRENCIES = ["JPY", "USD"];
const ASSET_TYPES = ["株式", "REIT", "投資信託", "債券", "貯金", "年金", "保険"];
const LANGUAGES = { ja: "日本語", en: "English", zh: "中文" };
const FONT_SIZES = { small: "小", medium: "中", large: "大" };

// --- 多言語テキスト ---
const TEXTS = {
  ja: {
    title: "資産管理アプリ",
    add: "追加",
    assetType: "資産種別",
    amount: "金額",
    risk: "リスク",
    label: "ラベル",
    currency: "通貨",
    dividend: "配当/分配金",
    annualCF: "年間CF",
    covered: "生活費カバー率",
    settings: "設定",
    lang: "言語",
    font: "フォントサイズ",
    howto: "使い方",
    contact: "問い合わせ",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    exportCSV: "CSV出力",
    importCSV: "CSVインポート",
    search: "検索",
    usage: "ここに資産を入力し、年度ごとの成長や配当予測、リスク配分などを分析できます。",
    adMsg: "🔷PR: 資産運用オンライン相談はこちら（sonota1）",
    backup: "バックアップ",
    backupGD: "Google Driveにバックアップ",
    importGD: "Google Driveからインポート"
  },
  en: {
    title: "Asset Management App",
    add: "Add",
    assetType: "Asset Type",
    amount: "Amount",
    risk: "Risk",
    label: "Label",
    currency: "Currency",
    dividend: "Dividend",
    annualCF: "Annual CF",
    covered: "Living Cost Coverage",
    settings: "Settings",
    lang: "Language",
    font: "Font Size",
    howto: "How to Use",
    contact: "Contact",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    exportCSV: "Export CSV",
    importCSV: "Import CSV",
    search: "Search",
    usage: "Input your assets here and analyze annual growth, income forecast, and risk allocation.",
    adMsg: "🔷PR: Online asset consulting (sonota1)",
    backup: "Backup",
    backupGD: "Backup to Google Drive",
    importGD: "Import from Google Drive"
  },
  zh: {
    title: "资产管理应用",
    add: "添加",
    assetType: "资产类型",
    amount: "金额",
    risk: "风险",
    label: "标签",
    currency: "货币",
    dividend: "分红/分配金",
    annualCF: "年现金流",
    covered: "生活费覆盖率",
    settings: "设置",
    lang: "语言",
    font: "字体大小",
    howto: "使用说明",
    contact: "联系",
    terms: "使用条款",
    privacy: "隐私政策",
    exportCSV: "导出CSV",
    importCSV: "导入CSV",
    search: "搜索",
    usage: "在此输入您的资产，分析年度增长、分红预测和风险分布。",
    adMsg: "🔷广告：在线资产咨询（sonota1）",
    backup: "备份",
    backupGD: "备份到Google Drive",
    importGD: "从Google Drive导入"
  },
};

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

// --- CSVエクスポート ---
function exportCSV(assets, filename = "assets.csv") {
  if (!assets.length) return;
  const header = Object.keys(assets[0]);
  const rows = [header, ...assets.map(a => header.map(k => a[k] ?? ""))];
  const csv = rows.map(r => r.map(x =>
    typeof x === "string" && /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x
  ).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- CSVインポート ---
function importCSV(file, onImport) {
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return onImport([]);
    const header = lines[0].split(",").map(x => x.replace(/^"|"$/g, ""));
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
    onImport(data);
  };
  reader.readAsText(file);
}
function CsvImportButton({ onImport, label = "CSVインポート" }) {
  const inputRef = React.useRef();
  return (
    <>
      <button
        onClick={() => inputRef.current && inputRef.current.click()}
        style={{
          border: "none", borderRadius: 8, background: "#ffe2e2", color: "#e66465",
          fontWeight: 700, padding: "7px 18px", marginLeft: 12, cursor: "pointer"
        }}
      >{label}</button>
      <input
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        ref={inputRef}
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            importCSV(e.target.files[0], onImport);
          }
        }}
      />
    </>
  );
}

// --- Google Driveバックアップ ---
function GoogleDriveBackupButton({ data, filename = "assets-backup.csv", lang = "ja" }) {
  const pickerScriptLoaded = React.useRef(false);

  function exportCSVLocal() {
    const header = Object.keys(data[0] || {});
    const rows = [header, ...data.map(a => header.map(k => a[k]))];
    return rows.map(r => r.map(x =>
      typeof x === "string" && /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x
    ).join(",")).join("\r\n");
  }

  async function handleBackup() {
    // CLIENT_IDをGoogle Cloud Consoleのものに差し替えてください
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

    const fileContent = exportCSVLocal();
    const file = new Blob([fileContent], { type: "text/csv" });
    const metadata = {
      name: filename,
      mimeType: "text/csv"
    };
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

  React.useEffect(() => {
    if (pickerScriptLoaded.current) return;
    if (!document.getElementById("gapi-script")) {
      const s = document.createElement("script");
      s.src = "https://apis.google.com/js/api.js";
      s.async = true; s.id = "gapi-script";
      document.body.appendChild(s);
    }
    pickerScriptLoaded.current = true;
  }, []);

  return (
    <button onClick={handleBackup} style={{
      border: "none", borderRadius: 8, background: "#4285F4", color: "#fff",
      fontWeight: 700, padding: "7px 18px", marginLeft: 12, cursor: "pointer"
    }}>
      <span style={{ marginRight: 4, verticalAlign: "middle" }}>⬆️</span>
      {TEXTS[lang].backupGD}
    </button>
  );
}

// --- 設定パネル ---
function SettingsPanel({ lang, setLang, fontSize, setFontSize, show, onClose }) {
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
        <div style={{ margin: "12px 0 17px" }}>
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
        <button onClick={onClose} style={{
          marginTop: 12, padding: "8px 38px", borderRadius: 10,
          background: "#ffe2e2", color: "#e66465", fontWeight: 700, border: "none", cursor: "pointer"
        }}>OK</button>
      </div>
    </div>
  );
}

// --- メイン ---
export default function App() {
  const [assets, setAssets] = useState([]);
  const [selectedType, setSelectedType] = useState(ASSET_TYPES[0]);
  const [form, setForm] = useState({});
  const [usdRate, setUsdRate] = useState(150);
  const [monthlyLiving, setMonthlyLiving] = useState(250000);
  const [lang, setLang] = useState("ja");
  const [fontSize, setFontSize] = useState("medium");
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState("");

  const fontStyles = { small: 13, medium: 16, large: 21 };

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }
  function handleSubmit(e) {
    e.preventDefault();
    setAssets(prev => [...prev, { ...form, assetType: selectedType }]);
    setForm({});
  }

  const total = useMemo(() => assets.reduce((sum, a) => sum + (Number(a.amount) || 0), 0), [assets]);
  const annualCF = useMemo(() => assets.reduce((sum, a) => sum + (Number(a.dividend) || 0), 0), [assets]);
  const monthlyCF = annualCF / 12;
  const livingCoverRate = monthlyLiving ? (monthlyCF / monthlyLiving) * 100 : 0;
  const filteredAssets = search
    ? assets.filter(a => Object.values(a).join().toLowerCase().includes(search.toLowerCase()))
    : assets;

  function renderForm() {
    return (
      <>
        <input name="amount" type="number" placeholder={TEXTS[lang].amount} value={form.amount || ""} onChange={handleFormChange} />
        <select name="currency" value={form.currency || "JPY"} onChange={handleFormChange}>
          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input name="dividend" type="number" placeholder={TEXTS[lang].dividend} value={form.dividend || ""} onChange={handleFormChange} />
        <select name="risk" value={form.risk || RISK_TAGS[0]} onChange={handleFormChange}>
          {RISK_TAGS.map(r => <option key={r}>{r}</option>)}
        </select>
        <input name="label" placeholder={TEXTS[lang].label} value={form.label || ""} onChange={handleFormChange} />
      </>
    );
  }

  return (
    <div style={{
      fontFamily: "'M PLUS 1p', 'Inter', sans-serif",
      maxWidth: 650,
      margin: "auto",
      padding: 18,
      fontSize: fontStyles[fontSize],
      background: "linear-gradient(120deg, #fff4f6 0%, #f6fcff 100%)",
      paddingBottom: 80 // バナー分余白
    }}>
      <header style={{ textAlign: "center", marginBottom: 18 }}>
        <h2 style={{
          color: "#e66465",
          fontWeight: 900,
          fontSize: fontSize === "large" ? 32 : fontSize === "small" ? 18 : 24,
          letterSpacing: 1,
        }}>{TEXTS[lang].title}</h2>
        <span style={{ color: "#888", fontSize: fontStyles[fontSize] - 3 }}>{TEXTS[lang].usage}</span>
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
      </header>

      <SettingsPanel
        lang={lang}
        setLang={setLang}
        fontSize={fontSize}
        setFontSize={setFontSize}
        show={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* タブ状シンプル入力 */}
      <div style={{ marginBottom: 11 }}>
        {ASSET_TYPES.map(type => (
          <button
            key={type}
            onClick={() => { setSelectedType(type); setForm({}); }}
            style={{
              margin: 2,
              padding: "7px 21px",
              borderRadius: 8,
              border: selectedType === type ? "2px solid #e66465" : "1px solid #ccc",
              background: selectedType === type ? "#ffe2e2" : "#fff",
              color: selectedType === type ? "#d43b00" : "#555",
              fontWeight: selectedType === type ? 700 : 400,
              fontSize: fontStyles[fontSize] - 1,
            }}>{type}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 15 }}>
        {renderForm()}
        <button type="submit" style={{
          border: "none", borderRadius: 8, background: "#e66465", color: "#fff",
          fontWeight: 700, padding: "7px 20px", fontSize: fontStyles[fontSize] - 1, cursor: "pointer"
        }}>{TEXTS[lang].add}</button>
      </form>

      <div style={{ margin: "12px 0" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={TEXTS[lang].search}
          style={{ padding: "6px 18px", borderRadius: 7, border: "1px solid #e66465", width: 130, marginRight: 13 }}
        />
        <label style={{ marginRight: 14 }}>
          USD/JPY:
          <input type="number" value={usdRate} onChange={e => setUsdRate(Number(e.target.value))}
            style={{ width: 60, marginLeft: 4, border: "1px solid #e66465", borderRadius: 6 }} />
        </label>
        <button onClick={() => exportCSV(assets)} style={{
          border: "none", borderRadius: 8, background: "#ffd6e0", color: "#e66465",
          fontWeight: 700, padding: "7px 20px", cursor: "pointer"
        }}>{TEXTS[lang].exportCSV}</button>
        <CsvImportButton onImport={data => setAssets(data)} label={TEXTS[lang].importCSV} />
        <GoogleDriveBackupButton data={assets} lang={lang} />
      </div>

      {/* シンプルな集計・予測 */}
      <div style={{
        background: "#fff", borderRadius: 14, padding: 15,
        marginBottom: 20, boxShadow: "0 1px 6px #e6646512"
      }}>
        <div>{TEXTS[lang].covered}: <b style={{ color: livingCoverRate >= 100 ? "#3c8d00" : "#e66465" }}>{livingCoverRate.toFixed(1)}%</b>
          <span style={{ color: "#888", marginLeft: 16 }}>月間収入 {monthlyCF.toLocaleString()}円 / 月</span>
        </div>
        <div>{TEXTS[lang].annualCF}: <b>{annualCF.toLocaleString()} 円/年</b></div>
        <div>{TEXTS[lang].amount}: <b>{total.toLocaleString()} 円</b></div>
        <div style={{ marginTop: 4 }}>
          <label>生活費:
            <input type="number" value={monthlyLiving} onChange={e => setMonthlyLiving(Number(e.target.value))}
              style={{ width: 100, marginLeft: 7, border: "1px solid #e66465", borderRadius: 7 }} />円/月
          </label>
        </div>
      </div>

      {/* 資産一覧 */}
      <table style={{
        width: "100%", background: "#fff", borderRadius: 10, overflow: "hidden",
        fontSize: fontStyles[fontSize] - 2, marginBottom: 70
      }}>
        <thead style={{ background: "#ffe2e2" }}>
          <tr>
            <th>{TEXTS[lang].assetType}</th>
            <th>{TEXTS[lang].amount}</th>
            <th>{TEXTS[lang].currency}</th>
            <th>{TEXTS[lang].dividend}</th>
            <th>{TEXTS[lang].risk}</th>
            <th>{TEXTS[lang].label}</th>
          </tr>
        </thead>
        <tbody>
          {filteredAssets.map((a, i) => (
            <tr key={i}>
              <td>{a.assetType}</td>
              <td>{a.amount}</td>
              <td>{a.currency}</td>
              <td>{a.dividend}</td>
              <td>{a.risk}</td>
              <td>{a.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <BannerAd lang={lang} />
    </div>
  );
}