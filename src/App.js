import React, { useState, useMemo } from "react";

// --- 定数 ---
const RISK_TAGS = ["低リスク", "中リスク", "高リスク"];
const CURRENCIES = ["JPY", "USD"];
const ASSET_TYPES = ["株式", "REIT", "投資信託", "債券", "貯金", "年金", "保険"];
const LANGUAGES = { ja: "日本語", en: "English", zh: "中文" };
const FONT_SIZES = { small: "小", medium: "中", large: "大" };

// --- テキスト ---
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
    backupGD: "Google Driveにバックアップ"
  },
  // ...en, zhは省略
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

// --- CSVエクスポート・インポート・GDriveは省略（前回のまま） ---

// --- 設定パネル省略 ---

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
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }
  function handleSubmit(e) {
    e.preventDefault();
    setAssets(prev => [...prev, { ...form, assetType: selectedType }]);
    setForm({});
  }

  // --- 正しいフォーム分岐 ---
  function renderForm() {
    switch (selectedType) {
      case "株式":
      case "REIT":
        return (
          <>
            <input name="name" placeholder="銘柄名" value={form.name || ""} onChange={handleFormChange} required />
            <input name="amount" type="number" placeholder="評価額(円)" value={form.amount || ""} onChange={handleFormChange} required />
            <input name="dividend" type="number" placeholder="年間配当(円)" value={form.dividend || ""} onChange={handleFormChange} />
            <select name="currency" value={form.currency || "JPY"} onChange={handleFormChange}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select name="risk" value={form.risk || RISK_TAGS[0]} onChange={handleFormChange}>
              {RISK_TAGS.map(r => <option key={r}>{r}</option>)}
            </select>
            <input name="label" placeholder={TEXTS[lang].label} value={form.label || ""} onChange={handleFormChange} />
          </>
        );
      case "投資信託":
        return (
          <>
            <input name="name" placeholder="ファンド名" value={form.name || ""} onChange={handleFormChange} required />
            <input name="units" type="number" placeholder="保有口数" value={form.units || ""} onChange={handleFormChange} required />
            <input name="unitPrice" type="number" placeholder="基準価額(円)" value={form.unitPrice || ""} onChange={handleFormChange} required />
            <input name="dividend" type="number" placeholder="年間分配金(円)" value={form.dividend || ""} onChange={handleFormChange} />
            <select name="currency" value={form.currency || "JPY"} onChange={handleFormChange}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select name="risk" value={form.risk || RISK_TAGS[0]} onChange={handleFormChange}>
              {RISK_TAGS.map(r => <option key={r}>{r}</option>)}
            </select>
            <input name="label" placeholder={TEXTS[lang].label} value={form.label || ""} onChange={handleFormChange} />
          </>
        );
      case "債券":
        return (
          <>
            <input name="name" placeholder="債券名" value={form.name || ""} onChange={handleFormChange} required />
            <input name="faceValue" type="number" placeholder="額面金額(円)" value={form.faceValue || ""} onChange={handleFormChange} required />
            <input name="units" type="number" placeholder="保有本数/口数" value={form.units || ""} onChange={handleFormChange} required />
            <input name="couponRate" type="number" step="0.01" placeholder="利率(%)" value={form.couponRate || ""} onChange={handleFormChange} />
            <input name="dividend" type="number" placeholder="年間利息(円)" value={form.dividend || ""} onChange={handleFormChange} />
            <select name="currency" value={form.currency || "JPY"} onChange={handleFormChange}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select name="risk" value={form.risk || RISK_TAGS[0]} onChange={handleFormChange}>
              {RISK_TAGS.map(r => <option key={r}>{r}</option>)}
            </select>
            <input name="label" placeholder={TEXTS[lang].label} value={form.label || ""} onChange={handleFormChange} />
          </>
        );
      case "貯金":
        return (
          <>
            <input name="bankName" placeholder="銀行名" value={form.bankName || ""} onChange={handleFormChange} required />
            <input name="amount" type="number" placeholder="預金額(円)" value={form.amount || ""} onChange={handleFormChange} required />
            <select name="currency" value={form.currency || "JPY"} onChange={handleFormChange}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select name="risk" value={form.risk || RISK_TAGS[0]} onChange={handleFormChange}>
              {RISK_TAGS.map(r => <option key={r}>{r}</option>)}
            </select>
            <input name="label" placeholder={TEXTS[lang].label} value={form.label || ""} onChange={handleFormChange} />
          </>
        );
      // 年金・保険は省略（前回同様）
      default:
        return (
          <>
            <input name="name" placeholder="名称" value={form.name || ""} onChange={handleFormChange} required />
            <input name="amount" type="number" placeholder="金額" value={form.amount || ""} onChange={handleFormChange} required />
            <select name="currency" value={form.currency || "JPY"} onChange={handleFormChange}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select name="risk" value={form.risk || RISK_TAGS[0]} onChange={handleFormChange}>
              {RISK_TAGS.map(r => <option key={r}>{r}</option>)}
            </select>
            <input name="label" placeholder={TEXTS[lang].label} value={form.label || ""} onChange={handleFormChange} />
          </>
        );
    }
  }

  // --- テーブル集計も、各資産タイプに応じた表示にする例
  function getDisplayAmount(asset) {
    switch (asset.assetType) {
      case "投資信託":
        return asset.units && asset.unitPrice ? (Number(asset.units) * Number(asset.unitPrice)).toLocaleString() : "";
      case "債券":
        return asset.faceValue && asset.units ? (Number(asset.faceValue) * Number(asset.units)).toLocaleString() : "";
      default:
        return asset.amount ? Number(asset.amount).toLocaleString() : "";
    }
  }
  function getDisplayDividend(asset) {
    if (asset.dividend) return Number(asset.dividend).toLocaleString();
    if (asset.assetType === "債券" && asset.faceValue && asset.units && asset.couponRate)
      return (Number(asset.faceValue) * Number(asset.units) * (Number(asset.couponRate) / 100)).toLocaleString();
    return "";
  }

  // ...省略: 設定パネル、バナー、集計、UI構成は前回と同様...

  return (
    <div style={{ fontFamily: "'M PLUS 1p', 'Inter', sans-serif", maxWidth: 700, margin: "auto", padding: 18, paddingBottom: 80 }}>
      {/* ...ヘッダー・設定パネル・資産種別タブ... */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 15, flexWrap: "wrap" }}>
        {renderForm()}
        <button type="submit" style={{
          border: "none", borderRadius: 8, background: "#e66465", color: "#fff",
          fontWeight: 700, padding: "7px 20px", cursor: "pointer"
        }}>{TEXTS[lang].add}</button>
      </form>
      {/* ...検索・CSV・GDrive・集計... */}
      <table style={{ width: "100%", background: "#fff", borderRadius: 10, overflow: "hidden", marginBottom: 70 }}>
        <thead style={{ background: "#ffe2e2" }}>
          <tr>
            <th>{TEXTS[lang].assetType}</th>
            <th>名称</th>
            <th>金額</th>
            <th>{TEXTS[lang].dividend}</th>
            <th>{TEXTS[lang].risk}</th>
            <th>{TEXTS[lang].label}</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a, i) => (
            <tr key={i}>
              <td>{a.assetType}</td>
              <td>{a.name || a.bankName || ""}</td>
              <td>{getDisplayAmount(a)}</td>
              <td>{getDisplayDividend(a)}</td>
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