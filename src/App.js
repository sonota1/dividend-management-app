import React, { useState, useEffect } from "react";

// 定数定義
const ASSET_TYPES = ["株式", "債券", "REIT", "貯金", "投資信託"];
const RISK_TAGS = ["低リスク", "中リスク", "高リスク"];
const STOCK_PURCHASE_TYPES = ["NISA", "iDeCo", "一般"];
const BOND_PURCHASE_TYPES = ["国債", "社債", "地方債", "外国債"];
const BOND_CURRENCIES = ["JPY", "USD", "EUR", "GBP", "AUD"];
const DEPOSIT_TYPES = ["普通", "定期"];
const ACCOUNTS = ["楽天証券", "SBI証券", "みずほ銀行", "三菱UFJ銀行", "マネックス証券"];

function App() {
  // 資産情報
  const [assets, setAssets] = useState([]);
  
  // 選択中のタブ
  const [activeTab, setActiveTab] = useState("assets");
  const [selectedType, setSelectedType] = useState("株式");

  // 目標設定
  const [goals, setGoals] = useState({
    retirementAge: 65,
    targetAmount: 50000000,
    currentAge: 30,
    monthlyContribution: 100000
  });

  // フォーム入力状態
  const [form, setForm] = useState({
    id: null,
    assetType: "株式",
    account: ACCOUNTS[0],
    name: "",
    sharesOrAmount: "",
    purchasePrice: "",
    riskTag: RISK_TAGS[0],
    purchaseType: STOCK_PURCHASE_TYPES[0],
    // 債券専用フィールド
    maturityDate: "",
    couponRate: "",
    redemptionPrice: "",
    issuer: "",
    currency: "JPY",
    // その他
    bondGrade: "",
    depositType: DEPOSIT_TYPES[0],
    // 配当・分配金
    dividendRate: "",
    distributionRate: "",
  });

  // 入力ハンドラ
  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleGoalChange(e) {
    const { name, value } = e.target;
    setGoals((g) => ({ ...g, [name]: Number(value) }));
  }

  // タブ切り替え
  function handleTabChange(type) {
    setSelectedType(type);
    if (!form.id) {
      setForm({
        id: null,
        assetType: type,
        account: ACCOUNTS[0],
        name: "",
        sharesOrAmount: "",
        purchasePrice: "",
        riskTag: RISK_TAGS[0],
        purchaseType: getDefaultPurchaseType(type),
        maturityDate: "",
        couponRate: "",
        redemptionPrice: "",
        issuer: "",
        currency: "JPY",
        bondGrade: "",
        depositType: DEPOSIT_TYPES[0],
        dividendRate: "",
        distributionRate: "",
      });
    }
  }

  function getDefaultPurchaseType(assetType) {
    if (assetType === "株式" || assetType === "投資信託" || assetType === "REIT") {
      return STOCK_PURCHASE_TYPES[0];
    } else if (assetType === "債券") {
      return BOND_PURCHASE_TYPES[0];
    }
    return "";
  }

  function validateForm() {
    if (!form.name.trim()) {
      alert("名称を入力してください");
      return false;
    }
    if (!form.sharesOrAmount || form.sharesOrAmount <= 0) {
      alert("有効な数量/金額を入力してください");
      return false;
    }
    if (form.assetType !== "貯金" && (!form.purchasePrice || form.purchasePrice <= 0)) {
      alert("有効な取得価格を入力してください");
      return false;
    }
    if (form.assetType === "債券") {
      if (!form.maturityDate) {
        alert("満期日を入力してください");
        return false;
      }
      if (!form.couponRate || form.couponRate < 0) {
        alert("有効な利率を入力してください");
        return false;
      }
    }
    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const assetData = {
      ...form,
      sharesOrAmount: Number(form.sharesOrAmount),
      purchasePrice: form.assetType === "貯金" ? 1 : Number(form.purchasePrice),
      couponRate: form.couponRate ? Number(form.couponRate) : 0,
      redemptionPrice: form.redemptionPrice ? Number(form.redemptionPrice) : Number(form.purchasePrice),
      dividendRate: form.dividendRate ? Number(form.dividendRate) : 0,
      distributionRate: form.distributionRate ? Number(form.distributionRate) : 0,
    };

    if (form.id) {
      setAssets((prev) => prev.map((a) => (a.id === form.id ? assetData : a)));
    } else {
      setAssets((prev) => [...prev, { ...assetData, id: Date.now() }]);
    }
    
    resetForm();
  }

  function resetForm() {
    setForm({
      id: null,
      assetType: selectedType,
      account: ACCOUNTS[0],
      name: "",
      sharesOrAmount: "",
      purchasePrice: "",
      riskTag: RISK_TAGS[0],
      purchaseType: getDefaultPurchaseType(selectedType),
      maturityDate: "",
      couponRate: "",
      redemptionPrice: "",
      issuer: "",
      currency: "JPY",
      bondGrade: "",
      depositType: DEPOSIT_TYPES[0],
      dividendRate: "",
      distributionRate: "",
    });
  }

  function handleEdit(id) {
    const asset = assets.find((a) => a.id === id);
    if (asset) {
      setForm({ 
        ...asset, 
        purchasePrice: asset.purchasePrice.toString(), 
        sharesOrAmount: asset.sharesOrAmount.toString(),
        couponRate: asset.couponRate?.toString() || "",
        redemptionPrice: asset.redemptionPrice?.toString() || "",
        dividendRate: asset.dividendRate?.toString() || "",
        distributionRate: asset.distributionRate?.toString() || "",
      });
      setSelectedType(asset.assetType);
    }
  }

  function handleDelete(id) {
    if (window.confirm("本当に削除しますか？")) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      if (form.id === id) {
        resetForm();
      }
    }
  }

  // 資産別集計
  const summary = ASSET_TYPES.reduce((acc, type) => {
    const filtered = assets.filter((a) => a.assetType === type);
    const totalValue = filtered.reduce((sum, a) => {
      if (a.assetType === "貯金") {
        return sum + a.sharesOrAmount;
      }
      return sum + a.sharesOrAmount * a.purchasePrice;
    }, 0);
    acc[type] = totalValue;
    return acc;
  }, {});

  const totalAssets = Object.values(summary).reduce((sum, value) => sum + value, 0);
  const currentAssets = assets.filter((a) => a.assetType === selectedType);

  // リスク分散計算
  const riskDistribution = RISK_TAGS.reduce((acc, risk) => {
    const filtered = assets.filter((a) => a.riskTag === risk);
    const totalValue = filtered.reduce((sum, a) => {
      if (a.assetType === "貯金") return sum + a.sharesOrAmount;
      return sum + a.sharesOrAmount * a.purchasePrice;
    }, 0);
    acc[risk] = totalValue;
    return acc;
  }, {});

  // キャッシュフロー計算
  const annualIncome = assets.reduce((sum, a) => {
    let income = 0;
    if (a.assetType === "株式" || a.assetType === "REIT") {
      income = a.sharesOrAmount * a.purchasePrice * (a.dividendRate / 100 || 0);
    } else if (a.assetType === "債券") {
      income = a.sharesOrAmount * (a.couponRate / 100 || 0);
    } else if (a.assetType === "投資信託") {
      income = a.sharesOrAmount * a.purchasePrice * (a.distributionRate / 100 || 0);
    }
    return sum + income;
  }, 0);

  // 目標達成予測
  const yearsToRetirement = goals.retirementAge - goals.currentAge;
  const totalContributions = goals.monthlyContribution * 12 * yearsToRetirement;
  const projectedAmount = totalAssets + totalContributions;
  const shortfall = Math.max(0, goals.targetAmount - projectedAmount);

  function calculateValue(asset) {
    if (asset.assetType === "貯金") {
      return asset.sharesOrAmount;
    }
    return asset.sharesOrAmount * asset.purchasePrice;
  }

  function getTableHeaders() {
    const headers = ["口座", "名称"];
    
    if (selectedType === "貯金") {
      headers.push("預金額");
    } else if (selectedType === "債券") {
      headers.push("保有額", "取得価格", "利率", "満期日");
    } else {
      headers.push(selectedType === "株式" ? "保有株数" : selectedType === "REIT" ? "保有口数" : "保有口数", "取得価格");
    }
    
    headers.push("リスク");
    
    if (selectedType === "株式" || selectedType === "投資信託" || selectedType === "債券" || selectedType === "REIT") {
      headers.push("購入種別");
    }
    if (selectedType === "債券") {
      headers.push("発行体", "格付け");
    }
    if (selectedType === "貯金") {
      headers.push("預金種別");
    }
    if (selectedType === "株式" || selectedType === "REIT") {
      headers.push("配当率");
    }
    if (selectedType === "投資信託") {
      headers.push("分配率");
    }
    
    headers.push("評価額", "操作");
    return headers;
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 1200, margin: "auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>資産運用・老後設計アプリ</h1>

      {/* メインタブ */}
      <div style={{ display: "flex", gap: 12, marginBottom: 30, borderBottom: "2px solid #dee2e6" }}>
        {["assets", "goals", "analysis"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 24px",
              borderRadius: "8px 8px 0 0",
              border: activeTab === tab ? "2px solid #007bff" : "1px solid #ccc",
              borderBottom: activeTab === tab ? "2px solid white" : "1px solid #ccc",
              backgroundColor: activeTab === tab ? "white" : "#f8f9fa",
              cursor: "pointer",
              fontWeight: activeTab === tab ? "bold" : "normal",
              marginBottom: "-2px",
            }}
          >
            {tab === "assets" && "資産管理"}
            {tab === "goals" && "目標設定"}
            {tab === "analysis" && "分析・予測"}
          </button>
        ))}
      </div>

      {/* 資産管理タブ */}
      {activeTab === "assets" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            {ASSET_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleTabChange(type)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: selectedType === type ? "2px solid #007bff" : "1px solid #ccc",
                  backgroundColor: selectedType === type ? "#e0f0ff" : "white",
                  cursor: "pointer",
                  fontWeight: selectedType === type ? "bold" : "normal",
                  fontSize: 14,
                }}
              >
                {type} ({assets.filter(a => a.assetType === type).length})
              </button>
            ))}
          </div>

          <div style={{ border: "1px solid #ccc", borderRadius: 12, padding: 20, marginBottom: 30, backgroundColor: "#fafafa" }}>
            <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>
              {form.id ? "資産編集" : "資産追加"} ({selectedType})
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>口座</label>
                <select name="account" value={form.account} onChange={handleFormChange}
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}>
                  {ACCOUNTS.map((acc) => <option key={acc} value={acc}>{acc}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                  {selectedType === "株式" && "会社名"}
                  {selectedType === "投資信託" && "ファンド名"}
                  {selectedType === "債券" && "債券名"}
                  {selectedType === "REIT" && "REIT名"}
                  {selectedType === "貯金" && "銀行名・口座名"}
                </label>
                <input type="text" name="name" value={form.name} onChange={handleFormChange}
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                  placeholder="名称を入力してください" />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                  {selectedType === "株式" && "保有株数"}
                  {selectedType === "投資信託" && "保有口数"}
                  {selectedType === "REIT" && "保有口数"}
                  {selectedType === "債券" && "保有額（円）"}
                  {selectedType === "貯金" && "預金額"}
                </label>
                <input type="number" name="sharesOrAmount" value={form.sharesOrAmount} onChange={handleFormChange}
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                  min="0" step={selectedType === "株式" ? "1" : "0.01"} />
              </div>

              {selectedType !== "貯金" && (
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>取得価格（円）</label>
                  <input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleFormChange}
                    style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                    min="0" step="0.01" />
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>リスクタグ</label>
                <select name="riskTag" value={form.riskTag} onChange={handleFormChange}
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}>
                  {RISK_TAGS.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                </select>
              </div>

              {selectedType === "債券" && (
                <>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>満期日 *</label>
                    <input type="date" name="maturityDate" value={form.maturityDate} onChange={handleFormChange}
                      style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>利率（年率%）*</label>
                    <input type="number" name="couponRate" value={form.couponRate} onChange={handleFormChange}
                      style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                      min="0" step="0.01" placeholder="例: 2.5" />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>発行体</label>
                    <input type="text" name="issuer" value={form.issuer} onChange={handleFormChange}
                      style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                      placeholder="例: 日本国, トヨタ自動車" />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>通貨</label>
                    <select name="currency" value={form.currency} onChange={handleFormChange}
                      style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}>
                      {BOND_CURRENCIES.map((curr) => <option key={curr} value={curr}>{curr}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>格付け（任意）</label>
                    <input type="text" name="bondGrade" value={form.bondGrade} onChange={handleFormChange}
                      style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                      placeholder="例: AAA, AA+, A" />
                  </div>
                </>
              )}

              {(selectedType === "株式" || selectedType === "REIT") && (
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>配当利回り（年率%）</label>
                  <input type="number" name="dividendRate" value={form.dividendRate} onChange={handleFormChange}
                    style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                    min="0" step="0.01" placeholder="例: 3.2" />
                </div>
              )}

              {selectedType === "投資信託" && (
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>分配利回り（年率%）</label>
                  <input type="number" name="distributionRate" value={form.distributionRate} onChange={handleFormChange}
                    style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                    min="0" step="0.01" placeholder="例: 1.8" />
                </div>
              )}

              {(selectedType === "株式" || selectedType === "投資信託" || selectedType === "REIT") && (
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>購入種別</label>
                  <select name="purchaseType" value={form.purchaseType} onChange={handleFormChange}
                    style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}>
                    {STOCK_PURCHASE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              )}

              {selectedType === "債券" && (
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>購入種別</label>
                  <select name="purchaseType" value={form.purchaseType} onChange={handleFormChange}
                    style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}>
                    {BOND_PURCHASE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              )}

              {selectedType === "貯金" && (
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>預金種別</label>
                  <select name="depositType" value={form.depositType} onChange={handleFormChange}
                    style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}>
                    {DEPOSIT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <button onClick={handleSubmit} style={{
                padding: "10px 20px", borderRadius: 6, backgroundColor: "#007bff", color: "white",
                border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 14,
              }}>
                {form.id ? "更新" : "追加"}
              </button>
              {form.id && (
                <button onClick={resetForm} style={{
                  padding: "10px 20px", borderRadius: 6, backgroundColor: "#6c757d", color: "white",
                  border: "none", cursor: "pointer", fontSize: 14,
                }}>
                  キャンセル
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <h2 style={{ color: "#333" }}>{selectedType}一覧 ({currentAssets.length}件)</h2>
            
            {currentAssets.length === 0 ? (
              <div style={{ 
                padding: 40, textAlign: "center", backgroundColor: "#f8f9fa", 
                borderRadius: 8, border: "1px solid #dee2e6" 
              }}>
                <p style={{ margin: 0, color: "#6c757d" }}>データがありません。</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                      {getTableHeaders().map((header, index) => (
                        <th key={index} style={{ 
                          border: "1px solid #dee2e6", padding: "10px 6px", 
                          fontWeight: "bold", textAlign: "left", fontSize: 12
                        }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentAssets.map((asset) => (
                      <tr key={asset.id} style={{ backgroundColor: "white" }}>
                        <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.account}</td>
                        <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.name}</td>
                        <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
                          {asset.sharesOrAmount.toLocaleString()}
                        </td>
                        {selectedType !== "貯金" && (
                          <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
                            ¥{asset.purchasePrice.toLocaleString()}
                          </td>
                        )}
                        {selectedType === "債券" && (
                          <>
                            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
                              {asset.couponRate}%
                            </td>
                            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>
                              {asset.maturityDate}
                            </td>
                          </>
                        )}
                        <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>
                          <span style={{
                            padding: "2px 6px", borderRadius: 10, fontSize: 11,
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
                        {(selectedType === "株式" || selectedType === "投資信託" || selectedType === "債券" || selectedType === "REIT") && (
                          <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.purchaseType}</td>
                        )}
                        {selectedType === "債券" && (
                          <>
                            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.issuer || "-"}</td>
                            <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.bondGrade || "-"}</td>
                          </>
                        )}
                        {selectedType === "貯金" && (
                          <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>{asset.depositType}</td>
                        )}
                        {(selectedType === "株式" || selectedType === "REIT") && (
                          <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
                            {asset.dividendRate || 0}%
                          </td>
                        )}
                        {selectedType === "投資信託" && (
                          <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right" }}>
                            {asset.distributionRate || 0}%
                          </td>
                        )}
                        <td style={{ border: "1px solid #dee2e6", padding: "8px 6px", textAlign: "right", fontWeight: "bold" }}>
                          ¥{calculateValue(asset).toLocaleString()}
                        </td>
                        <td style={{ border: "1px solid #dee2e6", padding: "8px 6px" }}>
                          <div style={{ display: "flex", gap: 2 }}>
                            <button onClick={() => handleEdit(asset.id)} style={{
                              padding: "3px 6px", cursor: "pointer", backgroundColor: "#28a745", color: "white",
                              border: "none", borderRadius: 3, fontSize: 11,
                            }}>編集</button>
                            <button onClick={() => handleDelete(asset.id)} style={{
                              padding: "3px 6px", cursor: "pointer", backgroundColor: "#dc3545", color: "white",
                              border: "none", borderRadius: 3, fontSize: 11,
                            }}>削除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: "#f8f9fa", padding: 20, borderRadius: 8 }}>
            <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>資産サマリー</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              {ASSET_TYPES.map((type) => (
                <div key={type} style={{ 
                  backgroundColor: "white", padding: 16, borderRadius: 8, border: "1px solid #dee2e6", textAlign: "center"
                }}>
                  <div style={{ fontWeight: "bold", marginBottom: 8, color: "#333" }}>{type}</div>
                  <div style={{ fontSize: 16, fontWeight: "bold", color: "#007bff" }}>
                    ¥{summary[type].toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ 
              marginTop: 20, padding: 20, backgroundColor: "#007bff", color: "white", 
              borderRadius: 8, textAlign: "center" 
            }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>総資産</div>
              <div style={{ fontSize: 24, fontWeight: "bold" }}>
                ¥{totalAssets.toLocaleString()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 目標設定タブ */}
      {activeTab === "goals" && (
        <div style={{ backgroundColor: "#f8f9fa", padding: 30, borderRadius: 12 }}>
          <h2 style={{ margin: "0 0 30px 0", color: "#333" }}>老後資産形成目標設定</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            <div style={{ backgroundColor: "white", padding: 20, borderRadius: 8, border: "1px solid #dee2e6" }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#007bff" }}>基本情報</h3>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>現在の年齢</label>
                <input type="number" name="currentAge" value={goals.currentAge} onChange={handleGoalChange}
                  style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
                  min="18" max="100" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>退職予定年齢</label>
                <input type="number" name="retirementAge" value={goals.retirementAge} onChange={handleGoalChange}
                  style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
                  min="50" max="100" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>目標資産額（円）</label>
                <input type="number" name="targetAmount" value={goals.targetAmount} onChange={handleGoalChange}
                  style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
                  min="0" step="1000000" />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>月次積立予定額（円）</label>
                <input type="number" name="monthlyContribution" value={goals.monthlyContribution} onChange={handleGoalChange}
                  style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
                  min="0" step="10000" />
              </div>
            </div>

            <div style={{ backgroundColor: "white", padding: 20, borderRadius: 8, border: "1px solid #dee2e6" }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#007bff" }}>目標達成予測</h3>
              
              <div style={{ marginBottom: 16, padding: 15, backgroundColor: "#e3f2fd", borderRadius: 6 }}>
                <div style={{ fontWeight: "bold", marginBottom: 8 }}>退職まで残り年数</div>
                <div style={{ fontSize: 20, color: "#1976d2" }}>{yearsToRetirement}年</div>
              </div>

              <div style={{ marginBottom: 16, padding: 15, backgroundColor: "#f3e5f5", borderRadius: 6 }}>
                <div style={{ fontWeight: "bold", marginBottom: 8 }}>現在の資産額</div>
                <div style={{ fontSize: 20, color: "#7b1fa2" }}>¥{totalAssets.toLocaleString()}</div>
              </div>

              <div style={{ marginBottom: 16, padding: 15, backgroundColor: "#e8f5e8", borderRadius: 6 }}>
                <div style={{ fontWeight: "bold", marginBottom: 8 }}>積立予定総額</div>
                <div style={{ fontSize: 20, color: "#388e3c" }}>¥{totalContributions.toLocaleString()}</div>
              </div>

              <div style={{ marginBottom: 16, padding: 15, backgroundColor: projectedAmount >= goals.targetAmount ? "#e8f5e8" : "#fff3e0", borderRadius: 6 }}>
                <div style={{ fontWeight: "bold", marginBottom: 8 }}>予想到達額（運用なし）</div>
                <div style={{ fontSize: 20, color: projectedAmount >= goals.targetAmount ? "#388e3c" : "#f57c00" }}>
                  ¥{projectedAmount.toLocaleString()}
                </div>
              </div>

              {shortfall > 0 && (
                <div style={{ padding: 15, backgroundColor: "#ffebee", borderRadius: 6, border: "1px solid #f44336" }}>
                  <div style={{ fontWeight: "bold", marginBottom: 8, color: "#d32f2f" }}>目標まで不足額</div>
                  <div style={{ fontSize: 18, color: "#d32f2f" }}>¥{shortfall.toLocaleString()}</div>
                  <div style={{ fontSize: 12, marginTop: 8, color: "#666" }}>
                    運用利回りや追加積立が必要です
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 分析・予測タブ */}
      {activeTab === "analysis" && (
        <div>
          <h2 style={{ color: "#333", marginBottom: 30 }}>ポートフォリオ分析・キャッシュフロー予測</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 30 }}>
            {/* リスク分散分析 */}
            <div style={{ backgroundColor: "#f8f9fa", padding: 25, borderRadius: 12 }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#007bff" }}>リスク分散状況</h3>
              
              {Object.entries(riskDistribution).map(([risk, value]) => {
                const percentage = totalAssets > 0 ? ((value / totalAssets) * 100).toFixed(1) : 0;
                return (
                  <div key={risk} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: "bold" }}>{risk}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div style={{ width: "100%", height: 8, backgroundColor: "#e0e0e0", borderRadius: 4 }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: "100%",
                        backgroundColor: risk === "低リスク" ? "#4caf50" : risk === "中リスク" ? "#ff9800" : "#f44336",
                        borderRadius: 4,
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                    <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                      ¥{value.toLocaleString()}
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 20, padding: 15, backgroundColor: "white", borderRadius: 8 }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>推奨配分</h4>
                <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
                  • 低リスク: 30-50% (債券・貯金)<br/>
                  • 中リスク: 30-40% (投資信託・REIT)<br/>
                  • 高リスク: 10-30% (個別株式)
                </div>
              </div>
            </div>

            {/* 資産クラス別分析 */}
            <div style={{ backgroundColor: "#f8f9fa", padding: 25, borderRadius: 12 }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#007bff" }}>資産クラス別構成</h3>
              
              {ASSET_TYPES.map((type) => {
                const value = summary[type];
                const percentage = totalAssets > 0 ? ((value / totalAssets) * 100).toFixed(1) : 0;
                const color = type === "株式" ? "#2196f3" : type === "債券" ? "#4caf50" : 
                             type === "REIT" ? "#ff9800" : type === "貯金" ? "#9c27b0" : "#607d8b";
                
                return (
                  <div key={type} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: "bold" }}>{type}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div style={{ width: "100%", height: 8, backgroundColor: "#e0e0e0", borderRadius: 4 }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: "100%",
                        backgroundColor: color,
                        borderRadius: 4,
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                    <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                      ¥{value.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* キャッシュフロー予測 */}
            <div style={{ backgroundColor: "#f8f9fa", padding: 25, borderRadius: 12 }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#007bff" }}>年間キャッシュフロー予測</h3>
              
              <div style={{ backgroundColor: "white", padding: 20, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontWeight: "bold", fontSize: 18 }}>年間収入予想</span>
                  <span style={{ fontSize: 24, fontWeight: "bold", color: "#4caf50" }}>
                    ¥{annualIncome.toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: "#666" }}>
                  配当・利息・分配金の合計
                </div>
              </div>

              <div style={{ backgroundColor: "white", padding: 20, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontWeight: "bold", fontSize: 18 }}>月間収入予想</span>
                  <span style={{ fontSize: 20, fontWeight: "bold", color: "#2196f3" }}>
                    ¥{(annualIncome / 12).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: "#666" }}>
                  年間収入 ÷ 12ヶ月
                </div>
              </div>

              <div style={{ backgroundColor: "white", padding: 20, borderRadius: 8 }}>
                <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>収入源別内訳</h4>
                {[
                  { type: "株式配当", assets: assets.filter(a => a.assetType === "株式") },
                  { type: "債券利息", assets: assets.filter(a => a.assetType === "債券") },
                  { type: "REIT分配", assets: assets.filter(a => a.assetType === "REIT") },
                  { type: "投信分配", assets: assets.filter(a => a.assetType === "投資信託") }
                ].map(({ type, assets: typeAssets }) => {
                  const income = typeAssets.reduce((sum, a) => {
                    if (a.assetType === "株式" || a.assetType === "REIT") {
                      return sum + a.sharesOrAmount * a.purchasePrice * (a.dividendRate / 100 || 0);
                    } else if (a.assetType === "債券") {
                      return sum + a.sharesOrAmount * (a.couponRate / 100 || 0);
                    } else if (a.assetType === "投資信託") {
                      return sum + a.sharesOrAmount * a.purchasePrice * (a.distributionRate / 100 || 0);
                    }
                    return sum;
                  }, 0);
                  
                  return income > 0 ? (
                    <div key={type} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span>{type}:</span>
                      <span style={{ fontWeight: "bold" }}>¥{income.toLocaleString()}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {/* 債券満期予定 */}
          {assets.filter(a => a.assetType === "債券").length > 0 && (
            <div style={{ marginTop: 30, backgroundColor: "#f8f9fa", padding: 25, borderRadius: 12 }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#007bff" }}>債券満期スケジュール</h3>
              
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: 8 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#e3f2fd" }}>
                      <th style={{ border: "1px solid #90caf9", padding: 12, textAlign: "left" }}>債券名</th>
                      <th style={{ border: "1px solid #90caf9", padding: 12, textAlign: "left" }}>満期日</th>
                      <th style={{ border: "1px solid #90caf9", padding: 12, textAlign: "right" }}>保有額</th>
                      <th style={{ border: "1px solid #90caf9", padding: 12, textAlign: "right" }}>年間利息</th>
                      <th style={{ border: "1px solid #90caf9", padding: 12, textAlign: "center" }}>残り期間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets
                      .filter(a => a.assetType === "債券")
                      .sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate))
                      .map((bond) => {
                        const maturityDate = new Date(bond.maturityDate);
                        const today = new Date();
                        const daysToMaturity = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));
                        const yearsToMaturity = (daysToMaturity / 365).toFixed(1);
                        const annualInterest = bond.sharesOrAmount * (bond.couponRate / 100 || 0);
                        
                        return (
                          <tr key={bond.id}>
                            <td style={{ border: "1px solid #e3f2fd", padding: 12 }}>{bond.name}</td>
                            <td style={{ border: "1px solid #e3f2fd", padding: 12 }}>{bond.maturityDate}</td>
                            <td style={{ border: "1px solid #e3f2fd", padding: 12, textAlign: "right" }}>
                              ¥{bond.sharesOrAmount.toLocaleString()}
                            </td>
                            <td style={{ border: "1px solid #e3f2fd", padding: 12, textAlign: "right" }}>
                              ¥{annualInterest.toLocaleString()}
                            </td>
                            <td style={{ border: "1px solid #e3f2fd", padding: 12, textAlign: "center" }}>
                              <span style={{
                                padding: "4px 8px",
                                borderRadius: 12,
                                fontSize: 12,
                                backgroundColor: daysToMaturity < 365 ? "#ffebee" : daysToMaturity < 1825 ? "#fff3e0" : "#e8f5e8",
                                color: daysToMaturity < 365 ? "#c62828" : daysToMaturity < 1825 ? "#ef6c00" : "#2e7d32"
                              }}>
                                {yearsToMaturity}年
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;