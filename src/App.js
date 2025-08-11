import React, { useState, useMemo } from "react";

// 定数定義
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
const ACCOUNTS = [
  "楽天証券",
  "SBI証券",
  "みずほ銀行",
  "三菱UFJ銀行",
  "マネックス証券",
  "その他",
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

// フォーム初期値
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

// CSVエクスポート
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
      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      color: "white",
      fontWeight: "bold",
      fontSize: 15,
      cursor: "pointer"
    }}>
      CSV出力
    </button>
  );
}

// メイン
export default function App() {
  const [assets, setAssets] = useState([]);
  const [selectedType, setSelectedType] = useState("株式");
  const [form, setForm] = useState(getInitialForm("株式"));
  const [usdRate, setUsdRate] = useState(150);
  const [search, setSearch] = useState("");

  // フォーム変更
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  // 登録
  function handleSubmit(e) {
    e.preventDefault();
    setAssets((prev) => [...prev, { ...form }]);
    setForm(getInitialForm(selectedType));
  }

  // 通貨変換
  function toJPY(amount, currency) {
    if (!amount) return 0;
    return currency === "USD" ? amount * usdRate : Number(amount);
  }

  // 各資産の表示値
  function getAssetDisplay(asset) {
    if (["株式", "REIT"].includes(asset.assetType)) {
      const evalValue = toJPY(asset.currentPrice || asset.acquisitionPrice, asset.currency) * (asset.shares || 0);
      const acqValue = toJPY(asset.acquisitionPrice, asset.currency) * (asset.shares || 0);
      const profit = evalValue - acqValue;
      const profitRate = acqValue ? (profit / acqValue) * 100 : 0;
      const dividend = (Number(asset.dividendPerShare) || 0) * (Number(asset.shares) || 0);
      const annualYield = evalValue ? (dividend / evalValue) * 100 : 0;
      return { evalValue, profit, profitRate, dividend, annualYield };
    }
    if (asset.assetType === "投資信託") {
      const evalValue = toJPY(asset.currentPrice || asset.acquisitionPrice, asset.currency) * (asset.units || 0);
      const acqValue = toJPY(asset.acquisitionPrice, asset.currency) * (asset.units || 0);
      const profit = evalValue - acqValue;
      const profitRate = acqValue ? (profit / acqValue) * 100 : 0;
      const dividend = ((Number(asset.units) || 0) / 10000) * (Number(asset.distributionPer10k) || 0);
      const annualYield = evalValue ? (dividend / evalValue) * 100 : 0;
      return { evalValue, profit, profitRate, dividend, annualYield };
    }
    if (asset.assetType === "債券") {
      const evalValue = toJPY(asset.acquisitionPrice, asset.currency) * (asset.units || 0);
      return { evalValue };
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

  // フォーム
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
            <input name="couponRate" type="number" placeholder="利率" value={form.couponRate} onChange={handleFormChange} />
            <input name="redemptionPrice" type="number" placeholder="償還価格" value={form.redemptionPrice} onChange={handleFormChange} />
            <input name="rating" placeholder="格付け(任意)" value={form.rating} onChange={handleFormChange} />
            <label>
              ゼロクーポン債<input type="checkbox" name="isZeroCoupon" checked={form.isZeroCoupon} onChange={handleFormChange} />
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

  // フィルタ済み資産
  const filteredAssets = useMemo(() => {
    if (!search) return assets;
    return assets.filter((a) =>
      (a.name || a.bankName || a.insuranceCompany || "")
        .toString()
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [assets, search]);

  // 年金スケジュール表示例
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

  return (
    <div style={{ maxWidth: 950, margin: "auto", padding: 24 }}>
      <h2>資産管理アプリ（CSV出力・外貨・リスク・配当/損益自動計算）</h2>
      <div>
        {ASSET_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => {
              setSelectedType(type);
              setForm(getInitialForm(type));
            }}
            style={{
              marginRight: 8,
              padding: "6px 17px",
              borderRadius: 10,
              border: "1px solid #ccc",
              background: selectedType === type ? "#ffedd6" : "#fff",
              color: selectedType === type ? "#d45400" : "#333",
              fontWeight: selectedType === type ? 700 : 400,
            }}
          >
            {type}
          </button>
        ))}
      </div>
      <div style={{ margin: "22px 0" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px,1fr))", gap: 16 }}>
          {renderForm()}
          <button type="submit" style={{ gridColumn: "1/-1", padding: "9px 0", borderRadius: 9, background: "#ff6b35", color: "#fff", fontWeight: "bold", border: "none" }}>
            追加
          </button>
        </form>
      </div>
      <div style={{ margin: "14px 0 24px 0" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="名称などで検索"
          style={{
            padding: "6px 18px",
            borderRadius: 7,
            border: "1px solid #aaa",
            width: 230,
            marginRight: 15,
          }}
        />
        <label>
          USD/JPYレート:{" "}
          <input
            type="number"
            value={usdRate}
            onChange={(e) => setUsdRate(Number(e.target.value))}
            style={{ width: 90, padding: "4px 10px" }}
          />
        </label>
        <CsvExportButton assets={assets} usdRate={usdRate} />
      </div>
      <div>
        <h3>入力資産一覧</h3>
        <div style={{ overflowX: "auto" }}>
          <table border={1} cellPadding={5} style={{ width: "100%", minWidth: 700, background: "#fff", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#ffe6ca" }}>
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
      </div>
    </div>
  );
}