import React, { useState, useMemo } from "react";

// --- 定数類 ---
const RISK_TAGS = ["低リスク", "中リスク", "高リスク"];
const CURRENCIES = ["JPY", "USD"];
const ASSET_TYPES = ["株式", "REIT", "投資信託", "債券", "貯金", "年金", "保険"];
const LANGUAGES = { ja: "日本語", en: "English", zh: "中文" };
const FONT_SIZES = { small: "小", medium: "中", large: "大" };

// --- 多言語テキスト（日本語のみ記載） ---
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
    usage: "資産タイプごとに最適な項目を入力し、年度ごとの成長や配当予測、リスク配分などを分析できます。",
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

// --- CSVエクスポート・インポート・GDriveは省略（前回と同じでOK） ---

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

  // --- 集計 ---
  const total = useMemo(() => assets.reduce((sum, a) => sum + getAssetValue(a), 0), [assets]);
  const annualCF = useMemo(() => assets.reduce((sum, a) => sum + getAssetDividend(a), 0), [assets]);
  const monthlyCF = annualCF / 12;
  const livingCoverRate = monthlyLiving ? (monthlyCF / monthlyLiving) * 100 : 0;
  const filteredAssets = search
    ? assets.filter(a => Object.values(a).join().toLowerCase().includes(search.toLowerCase()))
    : assets;

  // --- 金額・配当計算 ---
  function getAssetValue(a) {
    switch (a.assetType) {
      case "株式":
      case "REIT":
        return (Number(a.price) || 0) * (Number(a.shares) || 0);
      case "投資信託":
        return (Number(a.unitPrice) || 0) * (Number(a.units) || 0);
      case "債券":
        return (Number(a.faceValue) || 0) * (Number(a.units) || 0);
      case "貯金":
        return Number(a.amount) || 0;
      default:
        return Number(a.amount) || 0;
    }
  }
  function getAssetDividend(a) {
    switch (a.assetType) {
      case "株式":
      case "REIT":
        return (Number(a.dividendPerShare) || 0) * (Number(a.shares) || 0);
      case "投資信託":
        return Number(a.dividend) || 0;
      case "債券":
        if (a.faceValue && a.units && a.couponRate)
          return Number(a.faceValue) * Number(a.units) * (Number(a.couponRate) / 100);
        return Number(a.dividend) || 0;
      default:
        return 0;
    }
  }

  // --- 入力フォーム ---
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }
  function handleSubmit(e) {
    e.preventDefault();
    setAssets(prev => [...prev, { ...form, assetType: selectedType }]);
    setForm({});
  }
  function renderForm() {
    switch (selectedType) {
      case "株式":
      case "REIT":
        return (
          <>
            <input name="name" placeholder="銘柄名" value={form.name || ""} onChange={handleFormChange} required />
            <input name="shares" type="number" placeholder="数量" value={form.shares || ""} onChange={handleFormChange} required />
            <input name="price" type="number" placeholder="取得単価(円)" value={form.price || ""} onChange={handleFormChange} required />
            <input name="dividendPerShare" type="number" placeholder="1株配当(円/年)" value={form.dividendPerShare || ""} onChange={handleFormChange} />
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
            <input name="units" type="number" placeholder="保有本数" value={form.units || ""} onChange={handleFormChange} required />
            <input name="couponRate" type="number" step="0.01" placeholder="利率(%)" value={form.couponRate || ""} onChange={handleFormChange} />
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
      // 年金・保険も必要に応じ追加
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

  return (
    <div style={{ fontFamily: "'M PLUS 1p', 'Inter', sans-serif", maxWidth: 700, margin: "auto", padding: 18, paddingBottom: 80 }}>
      <header style={{ textAlign: "center", marginBottom: 18 }}>
        <h2 style={{
          color: "#e66465",
          fontWeight: 900,
          fontSize: fontSize === "large" ? 32 : fontSize === "small" ? 18 : 24,
          letterSpacing: 1,
        }}>{TEXTS[lang].title}</h2>
        <span style={{ color: "#888", fontSize: 15 }}>{TEXTS[lang].usage}</span>
      </header>
      <div style={{ marginBottom: 11 }}>
        {ASSET_TYPES.map(type => (
          <button
            key={type}
            onClick={() => { setSelectedType(type); setForm({}); }}
            style={{
              margin: 2, padding: "7px 21px", borderRadius: 8,
              border: selectedType === type ? "2px solid #e66465" : "1px solid #ccc",
              background: selectedType === type ? "#ffe2e2" : "#fff",
              color: selectedType === type ? "#d43b00" : "#555",
              fontWeight: selectedType === type ? 700 : 400,
            }}>{type}</button>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 15, flexWrap: "wrap" }}>
        {renderForm()}
        <button type="submit" style={{
          border: "none", borderRadius: 8, background: "#e66465", color: "#fff",
          fontWeight: 700, padding: "7px 20px", cursor: "pointer"
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
        {/* CSV・GDrive等はここに追加可能 */}
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 15, marginBottom: 20 }}>
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
        width: "100%", background: "#fff", borderRadius: 10, overflow: "hidden", marginBottom: 70
      }}>
        <thead style={{ background: "#ffe2e2" }}>
          <tr>
            <th>タイプ</th>
            <th>名称/銀行</th>
            <th>数量/口数</th>
            <th>額面/単価</th>
            <th>金額合計</th>
            <th>配当/分配金/利息</th>
            <th>リスク</th>
            <th>ラベル</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a, i) => (
            <tr key={i}>
              <td>{a.assetType}</td>
              <td>{a.name || a.bankName || ""}</td>
              <td>{a.shares || a.units || ""}</td>
              <td>{a.price || a.unitPrice || a.faceValue || ""}</td>
              <td>{getAssetValue(a).toLocaleString()}</td>
              <td>{getAssetDividend(a).toLocaleString()}</td>
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
