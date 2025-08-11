import React, { useState, useEffect, useMemo } from "react";

// 定数定義
const ASSET_TYPES = ["株式", "REIT", "投資信託", "債券", "貯金", "年金", "保険"];
const RISK_TAGS = ["低リスク", "中リスク", "高リスク"];

// 口座種別定義
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
      // localStorage が使用できない環境では defaultValue を返す
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue;
      }
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      console.warn('データの保存に失敗しました:', error);
    }
  }, [key, state]);

  return [state, setState];
};

// バリデーション関数
const validateAssetForm = (form) => {
  const errors = {};

  if (!form.name?.trim()) {
    errors.name = "銘柄名・名称を入力してください";
  }

  if (form.assetType === "株式" || form.assetType === "REIT") {
    if (!form.shares || Number(form.shares) <= 0) {
      errors.shares = "有効な保有数量を入力してください";
    }
    if (!form.acquisitionPrice || Number(form.acquisitionPrice) <= 0) {
      errors.acquisitionPrice = "有効な取得単価を入力してください";
    }
  } else if (form.assetType === "投資信託") {
    if (!form.units || Number(form.units) <= 0) {
      errors.units = "有効な保有口数を入力してください";
    }
    if (!form.acquisitionPrice || Number(form.acquisitionPrice) <= 0) {
      errors.acquisitionPrice = "有効な取得単価を入力してください";
    }
  } else if (form.assetType === "債券") {
    if (!form.units || Number(form.units) <= 0) {
      errors.units = "有効な口数を入力してください";
    }
    if (!form.acquisitionPrice || Number(form.acquisitionPrice) <= 0) {
      errors.acquisitionPrice = "有効な取得価格を入力してください";
    }
    if (!form.maturityDate) {
      errors.maturityDate = "満期日を入力してください";
    }
    if (!form.couponRate || Number(form.couponRate) < 0) {
      errors.couponRate = "有効な利率を入力してください";
    }
    if (!form.redemptionPrice || Number(form.redemptionPrice) <= 0) {
      errors.redemptionPrice = "有効な償還価格を入力してください";
    }
  } else if (form.assetType === "貯金") {
    if (!form.amount || Number(form.amount) <= 0) {
      errors.amount = "有効な金額を入力してください";
    }
    if (!form.bankName?.trim()) {
      errors.bankName = "銀行名を入力してください";
    }
  } else if (form.assetType === "年金") {
    if (!form.monthlyContribution || Number(form.monthlyContribution) <= 0) {
      errors.monthlyContribution = "有効な月額拠出額を入力してください";
    }
  } else if (form.assetType === "保険") {
    if (!form.monthlyPremium || Number(form.monthlyPremium) <= 0) {
      errors.monthlyPremium = "有効な月額保険料を入力してください";
    }
  }

  return errors;
};

// エラー表示コンポーネント
const ErrorMessage = ({ error }) => {
  if (!error) return null;
  return (
    <div style={{ 
      color: "#d32f2f", 
      fontSize: 12, 
      marginTop: 4,
      padding: "4px 8px",
      backgroundColor: "#ffebee",
      borderRadius: 4,
      border: "1px solid #ffcdd2"
    }}>
      {error}
    </div>
  );
};

// ローディングスピナー
const LoadingSpinner = () => (
  <div style={{
    display: "inline-block",
    width: 16,
    height: 16,
    border: "2px solid #f3f3f3",
    borderTop: "2px solid #007bff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginRight: 8
  }}>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  // 状態管理（永続化対応）
  const [assets, setAssets] = usePersistedState("assets", []);
  const [goals, setGoals] = usePersistedState("goals", {
    retirementAge: 65,
    targetAmount: 50000000,
    currentAge: 30,
    monthlyContribution: 100000
  });
  
  // UI状態
  const [activeTab, setActiveTab] = useState("assets");
  const [selectedType, setSelectedType] = useState("株式");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // フォーム初期値
  const getInitialForm = (assetType = "株式") => ({
    id: null,
    assetType,
    account: ACCOUNTS[0],
    name: "", // 銘柄名・商品名
    riskTag: RISK_TAGS[1], // デフォルトは中リスク
    
    // 株式・REIT用フィールド
    shares: "", // 保有数量
    acquisitionPrice: "", // 取得単価
    currentPrice: "", // 現在単価（任意）
    dividendPerShare: "", // 一株配当（任意）
    accountType: STOCK_ACCOUNT_TYPES[0], // 口座種別
    
    // 投資信託用フィールド
    units: "", // 保有口数
    distributionPer10k: "", // 1万口分配金（任意）
    
    // 債券用フィールド
    maturityDate: "", // 満期日
    couponRate: "", // 利率
    redemptionPrice: "", // 償還価格
    rating: "", // 格付け（任意）
    
    // 貯金用フィールド
    bankName: "", // 銀行名
    amount: "", // 金額
    depositType: DEPOSIT_TYPES[0], // 預金種別
    interestRate: "", // 金利
    
    // 年金用フィールド
    pensionType: PENSION_TYPES[0],
    monthlyContribution: "", // 月額拠出額
    totalContributions: "", // 累計拠出額
    benefitStartAge: "65", // 受給開始年齢
    expectedMonthlyBenefit: "", // 予想月額受給額
    
    // 保険用フィールド
    insuranceType: INSURANCE_TYPES[0],
    monthlyPremium: "", // 月額保険料
    surrenderValue: "", // 解約返戻金
    maturityBenefit: "", // 満期保険金
    insuranceCompany: "", // 保険会社名
    maturityDateInsurance: "", // 保険満期日
  });

  const [form, setForm] = useState(getInitialForm());

  // メモ化された計算値
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

  // 資産評価計算
  const calculateAssetValue = (asset) => {
    switch (asset.assetType) {
      case "株式":
      case "REIT":
        const currentPrice = asset.currentPrice || asset.acquisitionPrice || 0;
        return (asset.shares || 0) * currentPrice;
      
      case "投資信託":
        const currentUnitPrice = asset.currentPrice || asset.acquisitionPrice || 0;
        return (asset.units || 0) * currentUnitPrice;
      
      case "債券":
        return (asset.units || 0) * (asset.acquisitionPrice || 0);
      
      case "貯金":
        return asset.amount || 0;
      
      case "年金":
        return asset.totalContributions || 0;
      
      case "保険":
        return asset.surrenderValue || 0;
      
      default:
        return 0;
    }
  };

  // 評価損益計算
  const calculateProfitLoss = (asset) => {
    const currentValue = calculateAssetValue(asset);
    let acquisitionValue = 0;

    switch (asset.assetType) {
      case "株式":
      case "REIT":
        acquisitionValue = (asset.shares || 0) * (asset.acquisitionPrice || 0);
        break;
      case "投資信託":
        acquisitionValue = (asset.units || 0) * (asset.acquisitionPrice || 0);
        break;
      case "債券":
        acquisitionValue = (asset.units || 0) * (asset.acquisitionPrice || 0);
        break;
      default:
        return { profit: 0, profitRate: 0 };
    }

    const profit = currentValue - acquisitionValue;
    const profitRate = acquisitionValue > 0 ? (profit / acquisitionValue) * 100 : 0;
    
    return { profit, profitRate };
  };

  // 配当・分配金計算
  const calculateDividend = (asset) => {
    switch (asset.assetType) {
      case "株式":
      case "REIT":
        return (asset.shares || 0) * (asset.dividendPerShare || 0);
      case "投資信託":
        return ((asset.units || 0) / 10000) * (asset.distributionPer10k || 0);
      default:
        return 0;
    }
  };

  // 年利計算
  const calculateAnnualYield = (asset) => {
    const currentValue = calculateAssetValue(asset);
    const dividend = calculateDividend(asset);
    
    if (currentValue <= 0) return 0;
    return (dividend / currentValue) * 100;
  };

  const summary = useMemo(() => {
    return ASSET_TYPES.reduce((acc, type) => {
      const filtered = assets.filter((a) => a.assetType === type);
      const totalValue = filtered.reduce((sum, a) => sum + calculateAssetValue(a), 0);
      acc[type] = totalValue;
      return acc;
    }, {});
  }, [assets]);

  const totalAssets = useMemo(() => {
    return Object.values(summary).reduce((sum, value) => sum + value, 0);
  }, [summary]);

  const riskDistribution = useMemo(() => {
    return RISK_TAGS.reduce((acc, risk) => {
      const filtered = assets.filter((a) => a.riskTag === risk);
      const totalValue = filtered.reduce((sum, a) => sum + calculateAssetValue(a), 0);
      acc[risk] = totalValue;
      return acc;
    }, {});
  }, [assets]);

  // イベントハンドラー
  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }

  function handleGoalChange(e) {
    const { name, value } = e.target;
    setGoals(prev => ({ ...prev, [name]: Number(value) }));
  }

  function handleTabChange(type) {
    setSelectedType(type);
    setSearchQuery("");
    if (!form.id) {
      setForm(getInitialForm(type));
    }
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
        // 数値変換
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
        monthlyContribution: form.monthlyContribution ? Number(form.monthlyContribution) : 0,
        totalContributions: form.totalContributions ? Number(form.totalContributions) : 0,
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
      console.error('保存エラー:', error);
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
        // 文字列に変換
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
        monthlyContribution: asset.monthlyContribution?.toString() || "",
        totalContributions: asset.totalContributions?.toString() || "",
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
      if (form.id === id) {
        resetForm();
      }
    }
  }

  function exportData() {
    const data = {
      assets,
      goals,
      exportedAt: new Date().toISOString()
    };
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

  // フォーム項目レンダリング関数
  const renderFormFields = () => {
    const commonFields = (
      <>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>口座・機関 *</label>
          <select 
            name="account" 
            value={form.account} 
            onChange={handleFormChange}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          >
            {ACCOUNTS.map(acc => <option key={acc} value={acc}>{acc}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
            {selectedType === "貯金" ? "銀行名" : "銘柄名"} *
          </label>
          <input 
            type="text" 
            name={selectedType === "貯金" ? "bankName" : "name"}
            value={selectedType === "貯金" ? form.bankName : form.name} 
            onChange={handleFormChange}
            style={{ 
              width: "100%", 
              padding: 8, 
              borderRadius: 4, 
              border: errors.name || errors.bankName ? "1px solid #d32f2f" : "1px solid #ccc" 
            }}
            placeholder={selectedType === "貯金" ? "例: 三菱UFJ銀行" : "例: トヨタ自動車"}
          />
          <ErrorMessage error={errors.name || errors.bankName} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>リスクラベル</label>
          <select 
            name="riskTag" 
            value={form.riskTag} 
            onChange={handleFormChange}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          >
            {RISK_TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>
      </>
    );

    switch (selectedType) {
      case "株式":
      case "REIT":
        return (
          <>
            {commonFields}
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>保有数量 *</label>
              <input 
                type="number" 
                name="shares" 
                value={form.shares} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.shares ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
                min="0" 
                step="1"
                placeholder="例: 100"
              />
              <ErrorMessage error={errors.shares} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>取得単価（円）*</label>
              <input 
                type="number" 
                name="acquisitionPrice" 
                value={form.acquisitionPrice} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.acquisitionPrice ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
                min="0" 
                step="0.01"
                placeholder="例: 2500.50"
              />
              <ErrorMessage error={errors.acquisitionPrice} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>現在単価（円）</label>
              <input 
                type="number" 
                name="currentPrice" 
                value={form.currentPrice} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                min="0" 
                step="0.01"
                placeholder="例: 2800.00"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>一株配当（円）</label>
              <input 
                type="number" 
                name="dividendPerShare" 
                value={form.dividendPerShare} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                min="0" 
                step="0.01"
                placeholder="例: 80.00"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>口座種別</label>
              <select 
                name="accountType" 
                value={form.accountType} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              >
                {STOCK_ACCOUNT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </>
        );

      case "投資信託":
        return (
          <>
            {commonFields}
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>保有口数 *</label>
              <input 
                type="number" 
                name="units" 
                value={form.units} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.units ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
                min="0" 
                step="0.01"
                placeholder="例: 10000.50"
              />
              <ErrorMessage error={errors.units} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>取得単価（円）*</label>
              <input 
                type="number" 
                name="acquisitionPrice" 
                value={form.acquisitionPrice} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.acquisitionPrice ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
                min="0" 
                step="0.01"
                placeholder="例: 15000.00"
              />
              <ErrorMessage error={errors.acquisitionPrice} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>現在単価（円）</label>
              <input 
                type="number" 
                name="currentPrice" 
                value={form.currentPrice} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                min="0" 
                step="0.01"
                placeholder="例: 16200.00"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>1万口分配金（円）</label>
              <input 
                type="number" 
                name="distributionPer10k" 
                value={form.distributionPer10k} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                min="0" 
                step="1"
                placeholder="例: 500"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>口座種別</label>
              <select 
                name="accountType" 
                value={form.accountType || FUND_ACCOUNT_TYPES[0]} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              >
                {FUND_ACCOUNT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </>
        );

      case "債券":
        return (
          <>
            {commonFields}
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>口数 *</label>
              <input 
                type="number" 
                name="units" 
                value={form.units} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.units ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
                min="0" 
                step="1"
                placeholder="例: 10"
              />
              <ErrorMessage error={errors.units} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>取得価格（円）*</label>
              <input 
                type="number" 
                name="acquisitionPrice" 
                value={form.acquisitionPrice} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.acquisitionPrice ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
                min="0" 
                step="0.01"
                placeholder="例: 98.50"
              />
              <ErrorMessage error={errors.acquisitionPrice} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>満期日 *</label>
              <input 
                type="date" 
                name="maturityDate" 
                value={form.maturityDate} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.maturityDate ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
              />
              <ErrorMessage error={errors.maturityDate} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>利率（年率%）*</label>
              <input 
                type="number" 
                name="couponRate" 
                value={form.couponRate} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.couponRate ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
                min="0" 
                step="0.01"
                placeholder="例: 2.5"
              />
              <ErrorMessage error={errors.couponRate} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>償還価格（円）*</label>
              <input 
                type="number" 
                name="redemptionPrice" 
                value={form.redemptionPrice} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.redemptionPrice ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
                min="0" 
                step="0.01"
                placeholder="例: 100.00"
              />
              <ErrorMessage error={errors.redemptionPrice} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>格付け</label>
              <input 
                type="text" 
                name="rating" 
                value={form.rating} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                placeholder="例: AAA, AA+, A"
              />
            </div>
          </>
        );

      case "貯金":
        return (
          <>
            {commonFields}
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>金額（円）*</label>
              <input 
                type="number" 
                name="amount" 
                value={form.amount} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.amount ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
                min="0" 
                step="1000"
                placeholder="例: 1000000"
              />
              <ErrorMessage error={errors.amount} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>預金種別</label>
              <select 
                name="depositType" 
                value={form.depositType} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              >
                {DEPOSIT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>金利（年率%）</label>
              <input 
                type="number" 
                name="interestRate" 
                value={form.interestRate} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                min="0" 
                step="0.01"
                placeholder="例: 0.5"
              />
            </div>
          </>
        );

      case "年金":
        return (
          <>
            {commonFields}
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>年金種別</label>
              <select 
                name="pensionType" 
                value={form.pensionType} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              >
                {PENSION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>月額拠出額（円）*</label>
              <input 
                type="number" 
                name="monthlyContribution" 
                value={form.monthlyContribution} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.monthlyContribution ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
                min="0" 
                step="1000"
                placeholder="例: 23000"
              />
              <ErrorMessage error={errors.monthlyContribution} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>累計拠出額（円）</label>
              <input 
                type="number" 
                name="totalContributions" 
                value={form.totalContributions} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                min="0" 
                step="10000"
                placeholder="例: 2760000"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>受給開始年齢</label>
              <input 
                type="number" 
                name="benefitStartAge" 
                value={form.benefitStartAge} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                min="60" 
                max="75"
                placeholder="例: 65"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>予想月額受給額（円）</label>
              <input 
                type="number" 
                name="expectedMonthlyBenefit" 
                value={form.expectedMonthlyBenefit} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                min="0" 
                step="1000"
                placeholder="例: 150000"
              />
            </div>
          </>
        );

      case "保険":
        return (
          <>
            {commonFields}
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>保険種別</label>
              <select 
                name="insuranceType" 
                value={form.insuranceType} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              >
                {INSURANCE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>月額保険料（円）*</label>
              <input 
                type="number" 
                name="monthlyPremium" 
                value={form.monthlyPremium} 
                onChange={handleFormChange}
                style={{ 
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 4, 
                  border: errors.monthlyPremium ? "1px solid #d32f2f" : "1px solid #ccc" 
                }}
                min="0" 
                step="1000"
                placeholder="例: 15000"
              />
              <ErrorMessage error={errors.monthlyPremium} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>解約返戻金（円）</label>
              <input 
                type="number" 
                name="surrenderValue" 
                value={form.surrenderValue} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                min="0" 
                step="10000"
                placeholder="例: 800000"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>満期保険金（円）</label>
              <input 
                type="number" 
                name="maturityBenefit" 
                value={form.maturityBenefit} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                min="0" 
                step="10000"
                placeholder="例: 1000000"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>保険会社名</label>
              <input 
                type="text" 
                name="insuranceCompany" 
                value={form.insuranceCompany} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                placeholder="例: 日本生命"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>保険満期日</label>
              <input 
                type="date" 
                name="maturityDateInsurance" 
                value={form.maturityDateInsurance} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              />
            </div>
          </>
        );

      default:
        return commonFields;
    }
  };

  // テーブルヘッダー生成
  const getTableHeaders = () => {
    const headers = ["口座", "銘柄名", "リスク"];
    
    switch (selectedType) {
      case "株式":
      case "REIT":
        headers.splice(2, 0, "数量", "取得単価", "現在単価", "評価額", "評価損益", "損益率", "配当額", "年利", "口座種別");
        break;
      case "投資信託":
        headers.splice(2, 0, "口数", "取得単価", "現在単価", "評価額", "評価損益", "損益率", "分配金", "年利", "口座種別");
        break;
      case "債券":
        headers.splice(2, 0, "口数", "取得価格", "利率", "満期日", "償還価格", "評価額", "格付け");
        break;
      case "貯金":
        headers.splice(1, 1, "銀行名");
        headers.splice(2, 0, "金額", "預金種別", "金利");
        break;
      case "年金":
        headers.splice(2, 0, "年金種別", "月額拠出", "累計拠出", "受給開始年齢", "予想月額受給");
        break;
      case "保険":
        headers.splice(2, 0, "保険種別", "月額保険料", "解約返戻金", "満期保険金", "保険会社", "満期日");
        break;
    }
    
    headers.push("操作");
    return headers;
  };

  // テーブル行レンダリング
  const renderTableRow = (asset) => {
    const { profit, profitRate } = calculateProfitLoss(asset);
    const dividend = calculateDividend(asset);
    const annualYield = calculateAnnualYield(asset);
    const evaluationValue = calculateAssetValue(asset);

    const commonCells = (
      <>
        <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.account}</td>
        <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", fontWeight: "bold" }}>
          {asset.name || asset.bankName}
        </td>
      </>
    );

    const riskCell = (
      <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>
        <span style={{
          padding: "2px 6px", 
          borderRadius: 10, 
          fontSize: 11,
          backgroundColor: 
            asset.riskTag === "低リスク" ? "#d4edda" : 
            asset.riskTag === "中リスク" ? "#fff3cd" : "#f8d7da",
          color: 
            asset.riskTag === "低リスク" ? "#155724" : 
            asset.riskTag === "中リスク" ? "#856404" : "#721c24"
        }}>
          {asset.riskTag}
        </span>
      </td>
    );

    const actionCell = (
      <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button 
            onClick={() => handleEdit(asset.id)} 
            style={{
              padding: "4px 8px", 
              cursor: "pointer", 
              backgroundColor: "#28a745", 
              color: "white",
              border: "none", 
              borderRadius: 3, 
              fontSize: 11,
            }}
          >
            編集
          </button>
          <button 
            onClick={() => handleDelete(asset.id)} 
            style={{
              padding: "4px 8px", 
              cursor: "pointer", 
              backgroundColor: "#dc3545", 
              color: "white",
              border: "none", 
              borderRadius: 3, 
              fontSize: 11,
            }}
          >
            削除
          </button>
        </div>
      </td>
    );

    switch (selectedType) {
      case "株式":
      case "REIT":
        return (
          <tr key={asset.id} style={{ backgroundColor: "white" }}>
            {commonCells}
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              {asset.shares?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{asset.acquisitionPrice?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{asset.currentPrice?.toLocaleString() || asset.acquisitionPrice?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right", fontWeight: "bold" }}>
              ¥{evaluationValue.toLocaleString()}
            </td>
            <td style={{ 
              border: "1px solid #dee2e6", 
              padding: "8px 6px", 
              textAlign: "right",
              color: profit >= 0 ? "#28a745" : "#dc3545",
              fontWeight: "bold"
            }}>
              {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
            </td>
            <td style={{ 
              border: "1px solid #dee2e6", 
              padding: "8px 6px", 
              textAlign: "right",
              color: profitRate >= 0 ? "#28a745" : "#dc3545",
              fontWeight: "bold"
            }}>
              {profitRate >= 0 ? "+" : ""}{profitRate.toFixed(2)}%
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{dividend.toLocaleString()}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              {annualYield.toFixed(2)}%
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.accountType}</td>
            {riskCell}
            {actionCell}
          </tr>
        );

      case "投資信託":
        return (
          <tr key={asset.id} style={{ backgroundColor: "white" }}>
            {commonCells}
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              {asset.units?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{asset.acquisitionPrice?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{asset.currentPrice?.toLocaleString() || asset.acquisitionPrice?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right", fontWeight: "bold" }}>
              ¥{evaluationValue.toLocaleString()}
            </td>
            <td style={{ 
              border: "1px solid #dee2e6", 
              padding: "8px 6px", 
              textAlign: "right",
              color: profit >= 0 ? "#28a745" : "#dc3545",
              fontWeight: "bold"
            }}>
              {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
            </td>
            <td style={{ 
              border: "1px solid #dee2e6", 
              padding: "8px 6px", 
              textAlign: "right",
              color: profitRate >= 0 ? "#28a745" : "#dc3545",
              fontWeight: "bold"
            }}>
              {profitRate >= 0 ? "+" : ""}{profitRate.toFixed(2)}%
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{dividend.toLocaleString()}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              {annualYield.toFixed(2)}%
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.accountType}</td>
            {riskCell}
            {actionCell}
          </tr>
        );

      case "債券":
        return (
          <tr key={asset.id} style={{ backgroundColor: "white" }}>
            {commonCells}
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              {asset.units?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{asset.acquisitionPrice?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              {asset.couponRate || 0}%
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>
              {asset.maturityDate || "-"}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{asset.redemptionPrice?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right", fontWeight: "bold" }}>
              ¥{evaluationValue.toLocaleString()}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.rating || "-"}</td>
            {riskCell}
            {actionCell}
          </tr>
        );

      case "貯金":
        return (
          <tr key={asset.id} style={{ backgroundColor: "white" }}>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.account}</td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", fontWeight: "bold" }}>{asset.bankName}</td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right", fontWeight: "bold" }}>
              ¥{asset.amount?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.depositType}</td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              {asset.interestRate || 0}%
            </td>
            {riskCell}
            {actionCell}
          </tr>
        );

      case "年金":
        return (
          <tr key={asset.id} style={{ backgroundColor: "white" }}>
            {commonCells}
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.pensionType}</td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{asset.monthlyContribution?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right", fontWeight: "bold" }}>
              ¥{asset.totalContributions?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "center" }}>
              {asset.benefitStartAge}歳
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{asset.expectedMonthlyBenefit?.toLocaleString() || 0}
            </td>
            {riskCell}
            {actionCell}
          </tr>
        );

      case "保険":
        return (
          <tr key={asset.id} style={{ backgroundColor: "white" }}>
            {commonCells}
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.insuranceType}</td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{asset.monthlyPremium?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right", fontWeight: "bold" }}>
              ¥{asset.surrenderValue?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
              ¥{asset.maturityBenefit?.toLocaleString() || 0}
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.insuranceCompany || "-"}</td>
            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>
              {asset.maturityDateInsurance || "-"}
            </td>
            {riskCell}
            {actionCell}
          </tr>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 1400, margin: "auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ color: "#333", margin: 0 }}>📊 資産運用・老後設計アプリ</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={exportData}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: 14
            }}
          >
            📤 データエクスポート
          </button>
          <div style={{ 
            fontSize: 16, 
            color: "#666",
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            backgroundColor: "#f8f9fa",
            borderRadius: 8,
            border: "2px solid #007bff20"
          }}>
            💰 総資産: <strong style={{ color: "#007bff", marginLeft: 8, fontSize: 18 }}>¥{totalAssets.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* メインタブ */}
      <div style={{ display: "flex", gap: 12, marginBottom: 30, borderBottom: "2px solid #dee2e6" }}>
        {[
          { key: "assets", label: "📈 資産管理", icon: "📈" },
          { key: "goals", label: "🎯 目標設定", icon: "🎯" },
          { key: "analysis", label: "📊 分析・予測", icon: "📊" }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "12px 24px",
              borderRadius: "8px 8px 0 0",
              border: activeTab === tab.key ? "2px solid #007bff" : "1px solid #ccc",
              borderBottom: activeTab === tab.key ? "2px solid white" : "1px solid #ccc",
              backgroundColor: activeTab === tab.key ? "white" : "#f8f9fa",
              cursor: "pointer",
              fontWeight: activeTab === tab.key ? "bold" : "normal",
              marginBottom: "-2px",
              transition: "all 0.2s ease",
              fontSize: 16
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 資産管理タブ */}
      {activeTab === "assets" && (
        <>
          {/* 資産タイプタブ */}
          <div style={{ display: "flex", gap: 12, marginBottom: 25, flexWrap: "wrap" }}>
            {ASSET_TYPES.map(type => {
              const count = assets.filter(a => a.assetType === type).length;
              const typeIcons = {
                "株式": "📈", "REIT": "🏢", "投資信託": "📊", "債券": "📋", 
                "貯金": "💰", "年金": "👴", "保険": "🛡️"
              };
              
              return (
                <button
                  key={type}
                  onClick={() => handleTabChange(type)}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: selectedType === type ? "2px solid #007bff" : "1px solid #ccc",
                    backgroundColor: selectedType === type ? "#e0f0ff" : "white",
                    cursor: "pointer",
                    fontWeight: selectedType === type ? "bold" : "normal",
                    fontSize: 14,
                    transition: "all 0.2s ease",
                    boxShadow: selectedType === type ? "0 2px 8px rgba(0,123,255,0.2)" : "none"
                  }}
                >
                  {typeIcons[type]} {type} ({count})
                </button>
              );
            })}
          </div>

          {/* フォーム */}
          <div style={{ 
            border: "2px solid #e3f2fd", 
            borderRadius: 15, 
            padding: 25,
            marginBottom: 30, 
            backgroundColor: "#fafafa",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ margin: "0 0 25px 0", color: "#333", fontSize: 20 }}>
              {form.id ? "✏️ 資産編集" : "➕ 資産追加"} ({selectedType})
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
                gap: 20, 
                marginBottom: 25 
              }}>
                {renderFormFields()}
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button 
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: "12px 24px", 
                    borderRadius: 8, 
                    backgroundColor: isLoading ? "#6c757d" : "#007bff", 
                    color: "white",
                    border: "none", 
                    cursor: isLoading ? "not-allowed" : "pointer", 
                    fontWeight: "bold", 
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    boxShadow: isLoading ? "none" : "0 2px 4px rgba(0,123,255,0.3)"
                  }}
                >
                  {isLoading && <LoadingSpinner />}
                  {form.id ? "🔄 更新" : "➕ 追加"}
                </button>
                
                {form.id && (
                  <button 
                    type="button"
                    onClick={resetForm} 
                    style={{
                      padding: "12px 24px", 
                      borderRadius: 8, 
                      backgroundColor: "#6c757d", 
                      color: "white",
                      border: "none", 
                      cursor: "pointer", 
                      fontSize: 16,
                    }}
                  >
                    ❌ キャンセル
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* 検索・ソート */}
          <div style={{ 
            display: "flex", 
            gap: 15, 
            marginBottom: 25, 
            alignItems: "center",
            padding: "15px 20px",
            backgroundColor: "#f8f9fa",
            borderRadius: 10,
            border: "1px solid #dee2e6"
          }}>
            <div style={{ flex: 1, maxWidth: 400 }}>
              <input
                type="text"
                placeholder="🔍 資産を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 15px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  fontSize: 14
                }}
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ 
                padding: "10px 15px", 
                borderRadius: 8, 
                border: "1px solid #ccc",
                fontSize: 14 
              }}
            >
              <option value="name">📝 名前順</option>
              <option value="account">🏦 口座順</option>
              <option value="createdAt">📅 作成日順</option>
            </select>
            
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: "10px 15px",
                borderRadius: 8,
                border: "1px solid #ccc",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: 16
              }}
            >
              {sortOrder === 'asc' ? '⬆️' : '⬇️'}
            </button>
          </div>

          {/* 資産一覧テーブル */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ color: "#333", marginBottom: 20, fontSize: 18 }}>
              📋 {selectedType}一覧 ({filteredAssets.length}件)
              {searchQuery && (
                <span style={{ color: "#666", fontSize: 14, fontWeight: "normal" }}>
                  　（"{searchQuery}" で検索中）
                </span>
              )}
            </h2>
            
            {filteredAssets.length === 0 ? (
              <div style={{ 
                padding: 50, 
                textAlign: "center", 
                backgroundColor: "#f8f9fa", 
                borderRadius: 12, 
                border: "1px solid #dee2e6" 
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                <p style={{ margin: 0, color: "#6c757d", fontSize: 16 }}>
                  {searchQuery ? "検索条件に一致するデータがありません。" : "データがありません。"}
                </p>
                {!searchQuery && (
                  <p style={{ margin: "8px 0 0 0", color: "#999", fontSize: 14 }}>
                    上のフォームから資産を追加してください。
                  </p>
                )}
              </div>
            ) : (
              <div style={{ 
                overflowX: "auto",
                borderRadius: 12,
                border: "1px solid #dee2e6",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                      {getTableHeaders().map((header, index) => (
                        <th key={index} style={{ 
                          border: "1px solid #dee2e6", 
                          padding: "12px 8px", 
                          fontWeight: "bold", 
                          textAlign: "left", 
                          fontSize: 12,
                          backgroundColor: "#e9ecef",
                          color: "#495057"
                        }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map(asset => renderTableRow(asset))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 資産サマリー */}
          <div style={{ 
            backgroundColor: "#f8f9fa", 
            padding: 25, 
            borderRadius: 15,
            border: "1px solid #dee2e6",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ margin: "0 0 25px 0", color: "#333", fontSize: 20 }}>📊 資産サマリー</h2>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: 16,
              marginBottom: 25
            }}>
              {ASSET_TYPES.map(type => {
                const value = summary[type];
                const percentage = totalAssets > 0 ? ((value / totalAssets) * 100).toFixed(1) : 0;
                const typeIcons = {
                  "株式": "📈", "REIT": "🏢", "投資信託": "📊", "債券": "📋", 
                  "貯金": "💰", "年金": "👴", "保険": "🛡️"
                };
                
                return (
                  <div 
                    key={type} 
                    style={{ 
                      backgroundColor: "white", 
                      padding: 20, 
                      borderRadius: 12, 
                      border: "1px solid #dee2e6", 
                      textAlign: "center",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}
                    onClick={() => handleTabChange(type)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{typeIcons[type]}</div>
                    <div style={{ fontWeight: "bold", marginBottom: 8, color: "#333", fontSize: 14 }}>{type}</div>
                    <div style={{ fontSize: 18, fontWeight: "bold", color: "#007bff", marginBottom: 6 }}>
                      ¥{value.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ 
              marginTop: 25, 
              padding: 25, 
              background: "linear-gradient(135deg, #007bff, #0056b3)", 
              color: "white", 
              borderRadius: 15, 
              textAlign: "center",
              boxShadow: "0 6px 20px rgba(0,123,255,0.4)"
            }}>
              <div style={{ fontSize: 20, marginBottom: 10, opacity: 0.9 }}>💎 総資産</div>
              <div style={{ fontSize: 36, fontWeight: "bold", marginBottom: 10 }}>
                ¥{totalAssets.toLocaleString()}
              </div>
              
              {(() => {
                const totalDividends = assets.reduce((sum, asset) => sum + calculateDividend(asset), 0);
                const avgYield = totalAssets > 0 ? (totalDividends / totalAssets * 100).toFixed(2) : 0;
                
                return (
                  <div style={{ fontSize: 14, opacity: 0.8, display: "flex", justifyContent: "space-around", flexWrap: "wrap" }}>
                    <span>📈 年間配当収入: ¥{totalDividends.toLocaleString()}</span>
                    <span>🎯 平均利回り: {avgYield}%</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* 目標設定タブ */}
      {activeTab === "goals" && (
        <div style={{ 
          backgroundColor: "#f8f9fa", 
          padding: 30, 
          borderRadius: 15,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ margin: "0 0 30px 0", color: "#333", fontSize: 24 }}>🎯 老後資産形成目標設定</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 30 }}>
            {/* 基本設定 */}
            <div style={{ 
              backgroundColor: "white", 
              padding: 30, 
              borderRadius: 15, 
              border: "1px solid #dee2e6",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ margin: "0 0 25px 0", color: "#007bff", fontSize: 20 }}>📝 基本情報</h3>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: "bold", fontSize: 16 }}>現在の年齢</label>
                <input 
                  type="number" 
                  name="currentAge" 
                  value={goals.currentAge} 
                  onChange={handleGoalChange}
                  style={{ 
                    width: "100%", 
                    padding: 15, 
                    borderRadius: 8, 
                    border: "1px solid #ccc",
                    fontSize: 16
                  }}
                  min="18" 
                  max="100" 
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: "bold", fontSize: 16 }}>退職予定年齢</label>
                <input 
                  type="number" 
                  name="retirementAge" 
                  value={goals.retirementAge} 
                  onChange={handleGoalChange}
                  style={{ 
                    width: "100%", 
                    padding: 15, 
                    borderRadius: 8, 
                    border: "1px solid #ccc",
                    fontSize: 16
                  }}
                  min="50" 
                  max="100" 
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: "bold", fontSize: 16 }}>目標資産額（円）</label>
                <input 
                  type="number" 
                  name="targetAmount" 
                  value={goals.targetAmount} 
                  onChange={handleGoalChange}
                  style={{ 
                    width: "100%", 
                    padding: 15, 
                    borderRadius: 8, 
                    border: "1px solid #ccc",
                    fontSize: 16
                  }}
                  min="0" 
                  step="1000000" 
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: "bold", fontSize: 16 }}>月次積立予定額（円）</label>
                <input 
                  type="number" 
                  name="monthlyContribution" 
                  value={goals.monthlyContribution} 
                  onChange={handleGoalChange}
                  style={{ 
                    width: "100%", 
                    padding: 15, 
                    borderRadius: 8, 
                    border: "1px solid #ccc",
                    fontSize: 16
                  }}
                  min="0" 
                  step="10000" 
                />
              </div>
            </div>

            {/* 目標達成予測 */}
            <div style={{ 
              backgroundColor: "white", 
              padding: 30, 
              borderRadius: 15, 
              border: "1px solid #dee2e6",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ margin: "0 0 25px 0", color: "#007bff", fontSize: 20 }}>📊 目標達成予測</h3>
              
              {(() => {
                const yearsToRetirement = goals.retirementAge - goals.currentAge;
                const totalContributions = goals.monthlyContribution * 12 * yearsToRetirement;
                const projectedAmount = totalAssets + totalContributions;
                const shortfall = Math.max(0, goals.targetAmount - projectedAmount);
                const achievementRate = goals.targetAmount > 0 ? (projectedAmount / goals.targetAmount * 100).toFixed(1) : 0;

                return (
                  <>
                    <div style={{ marginBottom: 20, padding: 20, backgroundColor: "#e3f2fd", borderRadius: 12 }}>
                      <div style={{ fontWeight: "bold", marginBottom: 10, fontSize: 16 }}>⏰ 退職まで残り年数</div>
                      <div style={{ fontSize: 28, color: "#1976d2", fontWeight: "bold" }}>{yearsToRetirement}年</div>
                    </div>

                    <div style={{ marginBottom: 20, padding: 20, backgroundColor: "#f3e5f5", borderRadius: 12 }}>
                      <div style={{ fontWeight: "bold", marginBottom: 10, fontSize: 16 }}>💰 現在の資産額</div>
                      <div style={{ fontSize: 24, color: "#7b1fa2", fontWeight: "bold" }}>¥{totalAssets.toLocaleString()}</div>
                    </div>

                    <div style={{ marginBottom: 20, padding: 20, backgroundColor: "#e8f5e8", borderRadius: 12 }}>
                      <div style={{ fontWeight: "bold", marginBottom: 10, fontSize: 16 }}>📈 積立予定総額</div>
                      <div style={{ fontSize: 24, color: "#388e3c", fontWeight: "bold" }}>¥{totalContributions.toLocaleString()}</div>
                    </div>

                    <div style={{ marginBottom: 20, padding: 20, backgroundColor: projectedAmount >= goals.targetAmount ? "#e8f5e8" : "#fff3e0", borderRadius: 12 }}>
                      <div style={{ fontWeight: "bold", marginBottom: 10, fontSize: 16 }}>🎯 予想到達額</div>
                      <div style={{ fontSize: 24, color: projectedAmount >= goals.targetAmount ? "#388e3c" : "#f57c00", fontWeight: "bold" }}>
                        ¥{projectedAmount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
                        達成率: {achievementRate}%
                      </div>
                    </div>

                    {shortfall > 0 && (
                      <div style={{ padding: 20, backgroundColor: "#ffebee", borderRadius: 12, border: "2px solid #f44336" }}>
                        <div style={{ fontWeight: "bold", marginBottom: 10, color: "#d32f2f", fontSize: 16 }}>⚠️ 目標まで不足額</div>
                        <div style={{ fontSize: 20, color: "#d32f2f", fontWeight: "bold", marginBottom: 8 }}>¥{shortfall.toLocaleString()}</div>
                        <div style={{ fontSize: 14, color: "#666" }}>
                          追加の月額積立必要額: <strong>¥{Math.ceil(shortfall / (yearsToRetirement * 12)).toLocaleString()}</strong>
                        </div>
                      </div>
                    )}

                    {achievementRate >= 100 && (
                      <div style={{ padding: 20, backgroundColor: "#e8f5e8", borderRadius: 12, border: "2px solid #4caf50" }}>
                        <div style={{ fontSize: 18, color: "#2e7d32", fontWeight: "bold", textAlign: "center" }}>
                          🎉 目標達成可能です！
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 分析・予測タブ */}
      {activeTab === "analysis" && (
        <div>
          <h2 style={{ color: "#333", marginBottom: 30, fontSize: 24 }}>📊 ポートフォリオ分析・キャッシュフロー予測</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 30 }}>
            {/* リスク分散分析 */}
            <div style={{ 
              backgroundColor: "#f8f9fa", 
              padding: 30, 
              borderRadius: 15,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 25px 0", color: "#007bff", fontSize: 20 }}>⚖️ リスク分散状況</h3>
              
              {Object.entries(riskDistribution).map(([risk, value]) => {
                const percentage = totalAssets > 0 ? ((value / totalAssets) * 100).toFixed(1) : 0;
                const riskIcons = { "低リスク": "🟢", "中リスク": "🟡", "高リスク": "🔴" };
                
                return (
                  <div key={risk} style={{ marginBottom: 25 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontWeight: "bold", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        {riskIcons[risk]} {risk}
                      </span>
                      <span style={{ fontWeight: "bold", fontSize: 18 }}>{percentage}%</span>
                    </div>
                    <div style={{ width: "100%", height: 15, backgroundColor: "#e0e0e0", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: "100%",
                        backgroundColor: 
                          risk === "低リスク" ? "#4caf50" : 
                          risk === "中リスク" ? "#ff9800" : "#f44336",
                        borderRadius: 8,
                        transition: "width 1s ease"
                      }} />
                    </div>
                    <div style={{ fontSize: 14, color: "#666", marginTop: 8, textAlign: "right" }}>
                      ¥{value.toLocaleString()}
                    </div>
                  </div>
                );
              })}

              <div style={{ 
                marginTop: 30, 
                padding: 25, 
                backgroundColor: "white", 
                borderRadius: 15, 
                border: "2px solid #e3f2fd",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}>
                <h4 style={{ margin: "0 0 20px 0", color: "#1976d2", fontSize: 18 }}>💡 推奨配分</h4>
                <div style={{ fontSize: 14, color: "#555", lineHeight: 2 }}>
                  <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: "bold", color: "#4caf50" }}>🟢 低リスク: 40-60%</span>
                    <span style={{ color: "#666", fontSize: 12 }}>(債券・貯金・保険・年金)</span>
                  </div>
                  <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: "bold", color: "#ff9800" }}>🟡 中リスク: 30-40%</span>
                    <span style={{ color: "#666", fontSize: 12 }}>(投資信託・REIT)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: "bold", color: "#f44336" }}>🔴 高リスク: 10-20%</span>
                    <span style={{ color: "#666", fontSize: 12 }}>(個別株式)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 配当・分配金分析 */}
            <div style={{ 
              backgroundColor: "#f8f9fa", 
              padding: 30, 
              borderRadius: 15,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 25px 0", color: "#007bff", fontSize: 20 }}>💰 配当・分配金分析</h3>
              
              {(() => {
                const dividendAssets = assets.filter(a => 
                  (a.assetType === "株式" || a.assetType === "REIT" || a.assetType === "投資信託") 
                  && calculateDividend(a) > 0
                );
                
                const totalAnnualDividends = dividendAssets.reduce((sum, a) => sum + calculateDividend(a), 0);
                const monthlyDividends = totalAnnualDividends / 12;
                const dividendYield = totalAssets > 0 ? (totalAnnualDividends / totalAssets * 100).toFixed(2) : 0;

                return (
                  <>
                    <div style={{ marginBottom: 25, padding: 25, backgroundColor: "white", borderRadius: 15, border: "2px solid #e8f5e8" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                        <span style={{ fontWeight: "bold", fontSize: 18 }}>📈 年間配当収入</span>
                        <span style={{ fontSize: 24, fontWeight: "bold", color: "#4caf50" }}>
                          ¥{totalAnnualDividends.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: "#666" }}>
                        株式・REIT・投資信託からの配当・分配金合計
                      </div>
                    </div>

                    <div style={{ marginBottom: 25, padding: 25, backgroundColor: "white", borderRadius: 15, border: "2px solid #fff3cd" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                        <span style={{ fontWeight: "bold", fontSize: 18 }}>📅 月間配当収入</span>
                        <span style={{ fontSize: 20, fontWeight: "bold", color: "#f57c00" }}>
                          ¥{monthlyDividends.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: "#666" }}>
                        年間配当収入を12ヶ月で割った金額
                      </div>
                    </div>

                    <div style={{ marginBottom: 25, padding: 25, backgroundColor: "white", borderRadius: 15, border: "2px solid #f3e5f5" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                        <span style={{ fontWeight: "bold", fontSize: 18 }}>📊 平均配当利回り</span>
                        <span style={{ fontSize: 20, fontWeight: "bold", color: "#7b1fa2" }}>
                          {dividendYield}%
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: "#666" }}>
                        総資産に対する年間配当収入の割合
                      </div>
                    </div>

                    {dividendAssets.length > 0 && (
                      <div style={{ padding: 20, backgroundColor: "white", borderRadius: 15, border: "2px solid #e3f2fd" }}>
                        <h4 style={{ margin: "0 0 15px 0", color: "#1976d2", fontSize: 16 }}>🏆 配当上位銘柄</h4>
                        <div style={{ maxHeight: 200, overflowY: "auto" }}>
                          {dividendAssets
                            .sort((a, b) => calculateDividend(b) - calculateDividend(a))
                            .slice(0, 5)
                            .map(asset => (
                              <div key={asset.id} style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center",
                                padding: "8px 0",
                                borderBottom: "1px solid #eee"
                              }}>
                                <span style={{ fontSize: 14, fontWeight: "bold" }}>{asset.name}</span>
                                <span style={{ fontSize: 14, color: "#4caf50" }}>
                                  ¥{calculateDividend(asset).toLocaleString()}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;