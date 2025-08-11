import React, { useState, useEffect, useMemo } from "react";

// 定数定義
const ASSET_TYPES = ["株式", "REIT", "投資信託", "債券", "貯金", "年金", "保険"];
const RISK_TAGS = ["低リスク", "中リスク", "高リスク"];
const CURRENCIES = ["JPY", "USD", "EUR", "GBP", "AUD", "CAD", "CNY", "KRW"];
const STOCK_ACCOUNT_TYPES = ["特定口座", "一般口座", "旧NISA", "成長NISA"];
const FUND_ACCOUNT_TYPES = ["特定口座", "一般口座", "旧NISA", "成長NISA", "積立NISA"];
const DEPOSIT_TYPES = ["定期", "普通"];
const PENSION_TYPES = ["国民年金", "厚生年金", "企業年金", "個人年金保険", "確定拠出年金(企業型)", "確定拠出年金(個人型/iDeCo)"];
const INSURANCE_TYPES = ["終身保険", "養老保険", "個人年金保険", "変額保険", "外貨建保険"];
const ACCOUNTS = ["楽天証券", "SBI証券", "みずほ銀行", "三菱UFJ銀行", "マネックス証券", "その他"];

// カスタムフック：データ永続化
const usePersistedState = (key, defaultValue) => {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultValue;
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {}
  }, [key, state]);
  return [state, setState];
};

// バリデーション
const validateAssetForm = (form) => {
  const errors = {};
  if (!form.name?.trim() && form.assetType !== "貯金") {
    errors.name = "銘柄名・名称を入力してください";
  }
  if (form.assetType === "貯金" && !form.bankName?.trim()) {
    errors.bankName = "銀行名を入力してください";
  }
  if (form.assetType === "株式" || form.assetType === "REIT") {
    if (!form.shares || Number(form.shares) <= 0) errors.shares = "有効な保有数量を入力してください";
    if (!form.acquisitionPrice || Number(form.acquisitionPrice) <= 0) errors.acquisitionPrice = "有効な取得単価を入力してください";
  } else if (form.assetType === "投資信託") {
    if (!form.units || Number(form.units) <= 0) errors.units = "有効な保有口数を入力してください";
    if (!form.acquisitionPrice || Number(form.acquisitionPrice) <= 0) errors.acquisitionPrice = "有効な取得単価を入力してください";
  } else if (form.assetType === "債券") {
    if (!form.units || Number(form.units) <= 0) errors.units = "有効な口数を入力してください";
    if (!form.acquisitionPrice || Number(form.acquisitionPrice) <= 0) errors.acquisitionPrice = "有効な取得価格を入力してください";
    if (!form.maturityDate) errors.maturityDate = "満期日を入力してください";
    if (!form.isZeroCoupon && (!form.couponRate || Number(form.couponRate) < 0)) errors.couponRate = "有効な利率を入力してください";
    if (!form.redemptionPrice || Number(form.redemptionPrice) <= 0) errors.redemptionPrice = "有効な償還価格を入力してください";
  } else if (form.assetType === "貯金") {
    if (!form.amount || Number(form.amount) <= 0) errors.amount = "有効な金額を入力してください";
  } else if (form.assetType === "年金") {
    if (!form.expectedMonthlyBenefit || Number(form.expectedMonthlyBenefit) <= 0) errors.expectedMonthlyBenefit = "有効な予想月額受給額を入力してください";
  } else if (form.assetType === "保険") {
    if (!form.monthlyPremium || Number(form.monthlyPremium) <= 0) errors.monthlyPremium = "有効な月額保険料を入力してください";
  }
  return errors;
};

const ErrorMessage = ({ error }) => {
  if (!error) return null;
  return (
    <div style={{ 
      color: "#ff4757", fontSize: 12, marginTop: 6,
      padding: "8px 12px", backgroundColor: "rgba(255, 71, 87, 0.05)",
      borderRadius: 8, border: "1px solid rgba(255, 71, 87, 0.15)", fontWeight: "500"
    }}>{error}</div>
  );
};

const LoadingSpinner = () => (
  <div style={{
    display: "inline-block", width: 16, height: 16,
    border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #ffffff",
    borderRadius: "50%", animation: "spin 1s linear infinite", marginRight: 8
  }}>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

// 広告バナー（下部固定）
const BannerAd = () => (
  <div style={{
    position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9999,
    width: "100%", background: "#222", color: "#fff", textAlign: "center",
    padding: "18px 0", borderTop: "2px solid #ff6b35", boxShadow: "0 -2px 18px rgba(0,0,0,0.17)"
  }}>
    <span style={{ fontWeight: "bold", fontSize: 16 }}>
      🔷PR: <a href="https://www.sonota1.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#ffe47a", textDecoration: "underline" }}>資産運用オンライン相談（sonota1）</a> で無料相談受付中！
    </span>
  </div>
);

// ページ遷移時の全画面広告モーダル
const InterstitialAd = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(30,0,0,0.77)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", color: "#222", borderRadius: 20, padding: 40, minWidth: 330, boxShadow: "0 8px 48px rgba(0,0,0,0.21)", textAlign: "center"
      }}>
        <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 20, color: "#ff6b35" }}>広告</div>
        <div style={{ marginBottom: 18 }}>
          <img src="https://assets.st-note.com/production/uploads/images/123805675/rectangle_large_type_2_8718d1e086f2737a2e18c1d5b1e9fbb2.png" alt="ad" style={{ maxWidth: 220, borderRadius: 12, marginBottom: 10 }} />
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>資産管理の相談はsonota1オンライン！</div>
          <div style={{ color: "#666", fontSize: 14 }}>経験豊富なFPがあなたの資産形成をサポートします。<br />今なら無料相談受付中！</div>
        </div>
        <a
          href="https://www.sonota1.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block", padding: "12px 48px", background: "#ff6b35",
            color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 18, textDecoration: "none", marginBottom: 14
          }}>
          詳しくはこちら
        </a>
        <br />
        <button onClick={onClose} style={{
          marginTop: 10, padding: "10px 34px", background: "#eee",
          color: "#444", border: "none", borderRadius: 9, fontWeight: 700, cursor: "pointer"
        }}>
          閉じる
        </button>
      </div>
    </div>
  );
};

function App() {
  // 状態管理
  const [assets, setAssets] = usePersistedState("assets", []);
  const [goals, setGoals] = usePersistedState("goals", {
    retirementAge: 65, targetAmount: 50000000, currentAge: 30, monthlyContribution: 100000
  });
  const [exchangeRates, setExchangeRates] = usePersistedState("exchangeRates", {
    USD: 150, EUR: 165, GBP: 190, AUD: 100, CAD: 110, CNY: 21, KRW: 0.11
  });

  // UI状態
  const [activeTab, setActiveTab] = useState("assets");
  const [selectedType, setSelectedType] = useState("株式");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  // ページ遷移時に全画面広告を表示
  const handleTabChangeWithAd = (tabKey) => {
    setShowInterstitialAd(true);
    setPendingTab(tabKey);
  };
  useEffect(() => {
    if (showInterstitialAd && pendingTab) {
      const timer = setTimeout(() => {
        setShowInterstitialAd(false);
        setActiveTab(pendingTab);
        setPendingTab(null);
      }, 2400); // 2.4秒間広告表示
      return () => clearTimeout(timer);
    }
  }, [showInterstitialAd, pendingTab]);

  // フォーム初期値
  const getInitialForm = (assetType = "株式") => ({
    id: null,
    assetType,
    account: ACCOUNTS[0],
    name: "",
    riskTag: RISK_TAGS[1],
    currency: "JPY",
    shares: "", acquisitionPrice: "", currentPrice: "", dividendPerShare: "", accountType: STOCK_ACCOUNT_TYPES[0],
    units: "", distributionPer10k: "",
    maturityDate: "", couponRate: "", redemptionPrice: "", rating: "", isZeroCoupon: false,
    bankName: "", amount: "", depositType: DEPOSIT_TYPES[0], interestRate: "",
    pensionType: PENSION_TYPES[0], benefitStartAge: "65", expectedMonthlyBenefit: "",
    insuranceType: INSURANCE_TYPES[0], monthlyPremium: "", surrenderValue: "", maturityBenefit: "", insuranceCompany: "", maturityDateInsurance: "",
  });
  const [form, setForm] = useState(getInitialForm());

  // 通貨変換
  const convertToJPY = (amount, currency) => {
    if (currency === "JPY" || !amount) return amount;
    return amount * (exchangeRates[currency] || 1);
  };

  // フィルタ・ソート
  const filteredAssets = useMemo(() => {
    let filtered = assets.filter(asset => asset.assetType === selectedType);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset =>
        (asset.name && asset.name.toLowerCase().includes(query)) ||
        (asset.account && asset.account.toLowerCase().includes(query)) ||
        (asset.bankName && asset.bankName.toLowerCase().includes(query))
      );
    }
    return filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [assets, selectedType, searchQuery, sortBy, sortOrder]);

  // 資産評価額
  const calculateAssetValue = (asset) => {
    let baseValue = 0;
    switch (asset.assetType) {
      case "株式":
      case "REIT":
        baseValue = (asset.shares || 0) * (asset.currentPrice || asset.acquisitionPrice || 0);
        break;
      case "投資信託":
        baseValue = (asset.units || 0) * (asset.currentPrice || asset.acquisitionPrice || 0);
        break;
      case "債券":
        baseValue = (asset.units || 0) * (asset.acquisitionPrice || 0);
        break;
      case "貯金":
        baseValue = asset.amount || 0;
        break;
      case "年金":
        return 0;
      case "保険":
        baseValue = asset.surrenderValue || 0;
        break;
      default:
        return 0;
    }
    return convertToJPY(baseValue, asset.currency || "JPY");
  };

  // 評価損益
  const calculateProfitLoss = (asset) => {
    if (asset.assetType === "年金") return { profit: 0, profitRate: 0 };
    const currentValue = calculateAssetValue(asset);
    let acquisitionValue = 0;
    switch (asset.assetType) {
      case "株式":
      case "REIT":
        acquisitionValue = convertToJPY((asset.shares || 0) * (asset.acquisitionPrice || 0), asset.currency || "JPY");
        break;
      case "投資信託":
        acquisitionValue = convertToJPY((asset.units || 0) * (asset.acquisitionPrice || 0), asset.currency || "JPY");
        break;
      case "債券":
        acquisitionValue = convertToJPY((asset.units || 0) * (asset.acquisitionPrice || 0), asset.currency || "JPY");
        break;
      default:
        return { profit: 0, profitRate: 0 };
    }
    const profit = currentValue - acquisitionValue;
    const profitRate = acquisitionValue > 0 ? (profit / acquisitionValue) * 100 : 0;
    return { profit, profitRate };
  };

  // 配当・分配金
  const calculateDividend = (asset) => {
    let baseAmount = 0;
    switch (asset.assetType) {
      case "株式":
      case "REIT":
        baseAmount = (asset.shares || 0) * (asset.dividendPerShare || 0);
        break;
      case "投資信託":
        baseAmount = ((asset.units || 0) / 10000) * (asset.distributionPer10k || 0);
        break;
      case "年金":
        baseAmount = (asset.expectedMonthlyBenefit || 0) * 12;
        break;
      case "債券":
        if (!asset.isZeroCoupon) {
          baseAmount = (asset.units || 0) * (asset.couponRate || 0) * (asset.redemptionPrice || 0) / 100;
        }
        break;
      default:
        return 0;
    }
    return convertToJPY(baseAmount, asset.currency || "JPY");
  };
  // 年利
  const calculateAnnualYield = (asset) => {
    if (asset.assetType === "年金") return 0;
    const currentValue = calculateAssetValue(asset);
    const dividend = calculateDividend(asset);
    if (currentValue <= 0) return 0;
    return (dividend / currentValue) * 100;
  };

  // サマリー等
  const summary = useMemo(() => ASSET_TYPES.reduce((acc, type) => {
    const filtered = assets.filter((a) => a.assetType === type);
    const totalValue = filtered.reduce((sum, a) => sum + calculateAssetValue(a), 0);
    acc[type] = totalValue;
    return acc;
  }, {}), [assets, exchangeRates]);

  const totalAssets = useMemo(() => Object.values(summary).reduce((sum, value) => sum + value, 0), [summary]);

  // ハンドラ
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setForm(prev => ({
      ...prev,
      [name]: newValue,
      ...(name === 'isZeroCoupon' && checked ? { couponRate: '0' } : {})
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  }
  function handleGoalChange(e) {
    const { name, value } = e.target;
    setGoals(prev => ({ ...prev, [name]: Number(value) }));
  }
  function handleExchangeRateChange(e) {
    const { name, value } = e.target;
    setExchangeRates(prev => ({ ...prev, [name]: Number(value) }));
  }
  function handleAssetTypeTab(type) {
    setSelectedType(type);
    setSearchQuery("");
    if (!form.id) setForm(getInitialForm(type));
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    const formErrors = validateAssetForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsLoading(false);
      return;
    }
    try {
      const assetData = {
        ...form,
        shares: form.shares ? Number(form.shares) : 0,
        acquisitionPrice: form.acquisitionPrice ? Number(form.acquisitionPrice) : 0,
        currentPrice: form.currentPrice ? Number(form.currentPrice) : 0,
        dividendPerShare: form.dividendPerShare ? Number(form.dividendPerShare) : 0,
        units: form.units ? Number(form.units) : 0,
        distributionPer10k: form.distributionPer10k ? Number(form.distributionPer10k) : 0,
        couponRate: form.couponRate ? Number(form.couponRate) : 0,
        redemptionPrice: form.redemptionPrice ? Number(form.redemptionPrice) : 0,
        amount: form.amount ? Number(form.amount) : 0,
        interestRate: form.interestRate ? Number(form.interestRate) : 0,
        benefitStartAge: form.benefitStartAge ? Number(form.benefitStartAge) : 65,
        expectedMonthlyBenefit: form.expectedMonthlyBenefit ? Number(form.expectedMonthlyBenefit) : 0,
        monthlyPremium: form.monthlyPremium ? Number(form.monthlyPremium) : 0,
        surrenderValue: form.surrenderValue ? Number(form.surrenderValue) : 0,
        maturityBenefit: form.maturityBenefit ? Number(form.maturityBenefit) : 0,
        createdAt: form.id ? form.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (form.id) {
        setAssets(prev => prev.map(a => a.id === form.id ? assetData : a));
      } else {
        setAssets(prev => [...prev, { ...assetData, id: Date.now() }]);
      }
      resetForm();
      setErrors({});
    } catch (error) {
      alert('保存エラー');
    } finally {
      setIsLoading(false);
    }
  }
  function resetForm() {
    setForm(getInitialForm(selectedType));
    setErrors({});
  }
  function handleEdit(id) {
    const asset = assets.find(a => a.id === id);
    if (asset) {
      setForm({
        ...asset,
        shares: asset.shares?.toString() || "",
        acquisitionPrice: asset.acquisitionPrice?.toString() || "",
        currentPrice: asset.currentPrice?.toString() || "",
        dividendPerShare: asset.dividendPerShare?.toString() || "",
        units: asset.units?.toString() || "",
        distributionPer10k: asset.distributionPer10k?.toString() || "",
        couponRate: asset.couponRate?.toString() || "",
        redemptionPrice: asset.redemptionPrice?.toString() || "",
        amount: asset.amount?.toString() || "",
        interestRate: asset.interestRate?.toString() || "",
        benefitStartAge: asset.benefitStartAge?.toString() || "65",
        expectedMonthlyBenefit: asset.expectedMonthlyBenefit?.toString() || "",
        monthlyPremium: asset.monthlyPremium?.toString() || "",
        surrenderValue: asset.surrenderValue?.toString() || "",
        maturityBenefit: asset.maturityBenefit?.toString() || "",
      });
      setSelectedType(asset.assetType);
    }
  }
  function handleDelete(id) {
    if (window.confirm("本当に削除しますか？")) {
      setAssets(prev => prev.filter(a => a.id !== id));
      if (form.id === id) resetForm();
    }
  }
  function exportData() {
    const data = { assets, goals, exchangeRates, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `資産管理データ_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 入力スタイル
  const inputStyle = (hasError = false) => ({
    width: "100%", padding: "12px 16px", borderRadius: 12,
    border: hasError ? "2px solid #ff4757" : "2px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)", color: "#ffffff", fontSize: 14, fontWeight: "500", outline: "none", transition: "all 0.2s ease", boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  });
  const labelStyle = {
    display: "block", marginBottom: 8, fontWeight: "600", fontSize: 14,
    color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.5px"
  };

  // --- フォーム項目レンダリング ---
  // ...（ここは前回ご提示のrenderFormFieldsを利用してください。長いため省略します）

  // --- テーブルヘッダー・行レンダリング ---
  // ...（ここも前回のgetTableHeaders, renderTableRowを利用してください）

  return (
    <div style={{
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: 20, color: "#ffffff", paddingBottom: 100 /* バナー余白 */
    }}>
      <InterstitialAd open={showInterstitialAd} onClose={() => { setShowInterstitialAd(false); if (pendingTab) { setActiveTab(pendingTab); setPendingTab(null); } }} />
      <div style={{ maxWidth: 1600, margin: "auto" }}>
        {/* ヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, padding: "0 20px" }}>
          <div>
            <h1 style={{
              color: "#ffffff", margin: 0, fontSize: 42, fontWeight: "800",
              background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textShadow: "0 4px 20px rgba(255, 107, 53, 0.3)"
            }}>Portfolio Manager</h1>
            <p style={{
              color: "rgba(255, 255, 255, 0.7)", margin: "8px 0 0 0",
              fontSize: 16, fontWeight: "500"
            }}>Advanced Asset Management & Retirement Planning</p>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <button
              onClick={exportData}
              style={{
                padding: "12px 24px", borderRadius: 16,
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: "600",
                boxShadow: "0 8px 25px rgba(79, 172, 254, 0.4)", transition: "all 0.3s ease"
              }}>Export Data</button>
            <div style={{
              fontSize: 18, display: "flex", alignItems: "center",
              padding: "16px 32px", background: "rgba(255, 255, 255, 0.1)",
              borderRadius: 20, backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
            }}>
              <span style={{ marginRight: 12, opacity: 0.8 }}>Total Assets</span>
              <strong style={{ color: "#ff6b35", fontSize: 24, fontWeight: "800" }}>¥{totalAssets.toLocaleString()}</strong>
            </div>
          </div>
        </div>
        {/* メインタブ */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40, padding: "0 20px" }}>
          {[
            { key: "assets", label: "Assets", icon: "📊" },
            { key: "goals", label: "Goals", icon: "🎯" },
            { key: "analysis", label: "Analytics", icon: "📈" },
            { key: "exchange", label: "Exchange", icon: "💱" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChangeWithAd(tab.key)}
              style={{
                padding: "16px 32px", borderRadius: 16, border: "none",
                background: activeTab === tab.key
                  ? "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)"
                  : "rgba(255, 255, 255, 0.1)",
                color: activeTab === tab.key ? "white" : "rgba(255, 255, 255, 0.7)",
                cursor: "pointer", fontWeight: "600", fontSize: 16, transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
                boxShadow: activeTab === tab.key
                  ? "0 8px 25px rgba(255, 107, 53, 0.4)"
                  : "0 4px 15px rgba(0, 0, 0, 0.1)",
                display: "flex", alignItems: "center", gap: 12
              }}>
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        {/* 各タブ内容 */}
        {activeTab === "exchange" && (
          <div style={{
            background: "rgba(255, 255, 255, 0.1)", padding: 40, borderRadius: 24,
            backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)", margin: "0 20px"
          }}>
            <h2 style={{
              margin: "0 0 30px 0", color: "#ffffff", fontSize: 28,
              fontWeight: "700"
            }}>Exchange Rate Settings</h2>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24
            }}>
              {Object.entries(exchangeRates).map(([currency, rate]) => (
                <div key={currency} style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: 24, borderRadius: 16, border: "1px solid rgba(255, 255, 255, 0.1)"
                }}>
                  <label style={{
                    display: "block", marginBottom: 12, fontWeight: "600", fontSize: 16,
                    color: "#ff6b35"
                  }}>
                    {currency} to JPY
                  </label>
                  <input
                    type="number" name={currency} value={rate}
                    onChange={handleExchangeRateChange}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 12,
                      border: "2px solid rgba(255, 255, 255, 0.1)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#ffffff", fontSize: 16, fontWeight: "500", outline: "none"
                    }}
                    step="0.01" placeholder={`1 ${currency} = ? JPY`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {/* 他のタブは省略。assetsタブの内容をメインに記載 */}
        {activeTab === "assets" && (
          <div style={{ padding: "0 20px" }}>
            {/* 資産タイプタブ */}
            <div style={{ display: "flex", gap: 12, marginBottom: 30, flexWrap: "wrap" }}>
              {ASSET_TYPES.map(type => {
                const count = assets.filter(a => a.assetType === type).length;
                const typeIcons = {
                  "株式": "📈", "REIT": "🏢", "投資信託": "💹", "債券": "💵", "貯金": "🏦", "年金": "👵", "保険": "🛡"
                };
                return (
                  <button
                    key={type}
                    onClick={() => handleAssetTypeTab(type)}
                    style={{
                      padding: "10px 22px", borderRadius: 14, border: "none",
                      background: selectedType === type ? "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)" : "rgba(255,255,255,0.09)",
                      color: selectedType === type ? "#fff" : "#ff6b35", fontWeight: 700, fontSize: 15,
                      cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8
                    }}>
                    <span style={{ fontSize: 19 }}>{typeIcons[type]}</span>
                    {type}
                    <span style={{
                      marginLeft: 7, background: "#fff", color: "#ff6b35", borderRadius: 9,
                      fontSize: 12, fontWeight: 700, padding: "1px 9px"
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>
            {/* --- 資産入力フォーム --- */}
            <form onSubmit={handleSubmit} style={{
              background: "rgba(255,255,255,0.08)", borderRadius: 18,
              padding: 32, marginBottom: 32, boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
              maxWidth: 680, marginLeft: "auto", marginRight: "auto"
            }}>
              <h3 style={{ color: "#ff6b35", fontWeight: 700, marginBottom: 24 }}>
                {form.id ? "資産編集" : "新規資産追加"}
              </h3>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24
              }}>
                {/* --- ここにrenderFormFields()の内容を貼り付けてください --- */}
              </div>
              <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
                <button type="submit" disabled={isLoading} style={{
                  padding: "14px 32px", borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                  color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: isLoading ? 0.7 : 1
                }}>{isLoading && <LoadingSpinner />}{form.id ? "更新" : "追加"}</button>
                <button type="button" onClick={resetForm} style={{
                  padding: "14px 32px", borderRadius: 14, border: "none",
                  background: "rgba(255,255,255,0.18)", color: "#fff",
                  fontWeight: 700, fontSize: 16, cursor: "pointer"
                }}>リセット</button>
              </div>
            </form>
            {/* --- 検索・並び替え --- */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 24, gap: 16, flexWrap: "wrap"
            }}>
              <input type="text" placeholder="キーワード検索..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: "10px 16px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.13)",
                  background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 15, width: 260
                }} />
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <label style={{ color: "#fff", fontWeight: 500, marginRight: 5 }}>Sort by:</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  style={{ borderRadius: 8, padding: "8px 16px", fontSize: 15 }}>
                  <option value="name">名称</option>
                  <option value="account">口座</option>
                  <option value="acquisitionPrice">取得単価</option>
                  <option value="currentPrice">現在単価</option>
                  <option value="amount">金額</option>
                  <option value="expectedMonthlyBenefit">年金月額</option>
                </select>
                <button onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}
                  style={{
                    background: "transparent", border: "none", color: "#ff6b35",
                    fontWeight: "bold", fontSize: 20, cursor: "pointer"
                  }} title="昇順/降順">{sortOrder === "asc" ? "▲" : "▼"}</button>
              </div>
            </div>
            {/* --- 資産テーブル --- */}
            <div style={{ overflowX: "auto", marginBottom: 56 }}>
              <table style={{
                width: "100%", borderCollapse: "collapse",
                background: "rgba(255,255,255,0.03)", borderRadius: 17, overflow: "hidden"
              }}>
                <thead>
                  <tr>
                    {/* --- ここにgetTableHeaders().map --- */}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={99} style={{
                        textAlign: "center", padding: "32px 0", color: "#fff"
                      }}>
                        データがありません
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map(asset => /* --- ここにrenderTableRow(asset) --- */ null)
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <BannerAd />
    </div>
  );
}
export default App;