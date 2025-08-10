import React, { useState, useEffect } from "react";

// 定数定義
const ASSET_TYPES = ["株式", "債券", "貯金", "投資信託"];
const RISK_TAGS = ["低リスク", "中リスク", "高リスク"];
const STOCK_PURCHASE_TYPES = ["NISA", "iDeCo", "一般"];
const BOND_PURCHASE_TYPES = ["国債", "社債"];
const DEPOSIT_TYPES = ["普通", "定期"];
const ACCOUNTS = ["楽天証券", "SBI証券", "みずほ銀行", "三菱UFJ銀行"];

function App() {
  // 資産情報（ローカルストレージの代わりにuseStateのみ使用）
  const [assets, setAssets] = useState([]);
  
  // 選択中の資産タイプタブ
  const [selectedType, setSelectedType] = useState("株式");

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
    bondGrade: "",
    depositType: DEPOSIT_TYPES[0],
  });

  // 入力ハンドラ
  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  // タブ切り替え時の処理を改善
  function handleTabChange(type) {
    setSelectedType(type);
    // 編集中でない場合のみフォームをリセット
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
        bondGrade: "",
        depositType: DEPOSIT_TYPES[0],
      });
    }
  }

  // 資産タイプに応じたデフォルト購入種別を取得
  function getDefaultPurchaseType(assetType) {
    if (assetType === "株式" || assetType === "投資信託") {
      return STOCK_PURCHASE_TYPES[0];
    } else if (assetType === "債券") {
      return BOND_PURCHASE_TYPES[0];
    }
    return "";
  }

  // バリデーション関数
  function validateForm() {
    if (!form.name.trim()) {
      alert("名称を入力してください");
      return false;
    }
    if (!form.sharesOrAmount || form.sharesOrAmount <= 0) {
      alert("有効な数量/金額を入力してください");
      return false;
    }
    // 貯金以外は取得価格が必要
    if (form.assetType !== "貯金" && (!form.purchasePrice || form.purchasePrice <= 0)) {
      alert("有効な取得価格を入力してください");
      return false;
    }
    return true;
  }

  // 追加 or 更新
  function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const assetData = {
      ...form,
      sharesOrAmount: Number(form.sharesOrAmount),
      purchasePrice: form.assetType === "貯金" ? 1 : Number(form.purchasePrice),
    };

    if (form.id) {
      // 更新
      setAssets((prev) =>
        prev.map((a) => (a.id === form.id ? assetData : a))
      );
    } else {
      // 追加
      setAssets((prev) => [
        ...prev,
        {
          ...assetData,
          id: Date.now(),
        },
      ]);
    }
    
    // フォームリセット
    resetForm();
  }

  // フォームリセット関数
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
      bondGrade: "",
      depositType: DEPOSIT_TYPES[0],
    });
  }

  // 編集開始
  function handleEdit(id) {
    const asset = assets.find((a) => a.id === id);
    if (asset) {
      setForm({ ...asset, purchasePrice: asset.purchasePrice.toString(), sharesOrAmount: asset.sharesOrAmount.toString() });
      setSelectedType(asset.assetType);
    }
  }

  // 削除
  function handleDelete(id) {
    if (window.confirm("本当に削除しますか？")) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      // 削除した資産が編集中だった場合、フォームをリセット
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

  // 総資産計算
  const totalAssets = Object.values(summary).reduce((sum, value) => sum + value, 0);

  // 現在のタブの資産リスト
  const currentAssets = assets.filter((a) => a.assetType === selectedType);

  // 表のヘッダーを動的に生成
  function getTableHeaders() {
    const headers = ["口座", "名称"];
    
    if (selectedType === "貯金") {
      headers.push("預金額");
    } else if (selectedType === "債券") {
      headers.push("保有額", "取得価格");
    } else {
      headers.push(selectedType === "株式" ? "保有株数" : "保有口数", "取得価格");
    }
    
    headers.push("リスク");
    
    if (selectedType === "株式" || selectedType === "投資信託" || selectedType === "債券") {
      headers.push("購入種別");
    }
    if (selectedType === "債券") {
      headers.push("格付け");
    }
    if (selectedType === "貯金") {
      headers.push("預金種別");
    }
    
    headers.push("評価額", "操作");
    return headers;
  }

  // 評価額計算
  function calculateValue(asset) {
    if (asset.assetType === "貯金") {
      return asset.sharesOrAmount;
    }
    return asset.sharesOrAmount * asset.purchasePrice;
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 1000, margin: "auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>資産管理アプリ</h1>

      {/* タブ切り替え */}
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
              transition: "all 0.2s",
            }}
          >
            {type} ({assets.filter(a => a.assetType === type).length})
          </button>
        ))}
      </div>

      {/* 入力フォーム */}
      <div style={{ 
        border: "1px solid #ccc", 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 30, 
        backgroundColor: "#fafafa",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>
          {form.id ? "資産編集" : "資産追加"} ({selectedType})
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {/* 口座 */}
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              口座
            </label>
            <select 
              name="account" 
              value={form.account} 
              onChange={handleFormChange}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            >
              {ACCOUNTS.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </div>

          {/* 名前 */}
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              {selectedType === "株式" && "会社名"}
              {selectedType === "投資信託" && "ファンド名"}
              {selectedType === "債券" && "債券名"}
              {selectedType === "貯金" && "銀行名・口座名"}
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              placeholder="名称を入力してください"
            />
          </div>

          {/* 保有数 or 口数 */}
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              {selectedType === "株式" && "保有株数"}
              {selectedType === "投資信託" && "保有口数"}
              {selectedType === "債券" && "保有額"}
              {selectedType === "貯金" && "預金額"}
            </label>
            <input
              type="number"
              name="sharesOrAmount"
              value={form.sharesOrAmount}
              onChange={handleFormChange}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              placeholder="数量を入力してください"
              min="0"
              step={selectedType === "株式" ? "1" : "0.01"}
            />
          </div>

          {/* 取得価格 */}
          {selectedType !== "貯金" && (
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                取得価格（円）
              </label>
              <input
                type="number"
                name="purchasePrice"
                value={form.purchasePrice}
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                placeholder="取得価格を入力してください"
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* リスクタグ */}
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              リスクタグ
            </label>
            <select 
              name="riskTag" 
              value={form.riskTag} 
              onChange={handleFormChange}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            >
              {RISK_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* 購入種別 */}
          {(selectedType === "株式" || selectedType === "投資信託") && (
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                購入種別
              </label>
              <select 
                name="purchaseType" 
                value={form.purchaseType} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              >
                {STOCK_PURCHASE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedType === "債券" && (
            <>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                  購入種別
                </label>
                <select 
                  name="purchaseType" 
                  value={form.purchaseType} 
                  onChange={handleFormChange}
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                >
                  {BOND_PURCHASE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                  格付け（任意）
                </label>
                <input
                  type="text"
                  name="bondGrade"
                  value={form.bondGrade}
                  onChange={handleFormChange}
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                  placeholder="例: AAA, AA+, A"
                />
              </div>
            </>
          )}

          {selectedType === "貯金" && (
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                預金種別
              </label>
              <select 
                name="depositType" 
                value={form.depositType} 
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              >
                {DEPOSIT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button
            onClick={handleSubmit}
            style={{
              padding: "10px 20px",
              borderRadius: 6,
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 14,
            }}
          >
            {form.id ? "更新" : "追加"}
          </button>
          {form.id && (
            <button
              onClick={resetForm}
              style={{
                padding: "10px 20px",
                borderRadius: 6,
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              キャンセル
            </button>
          )}
        </div>
      </div>

      {/* 一覧表示 */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ color: "#333" }}>
          {selectedType}一覧 ({currentAssets.length}件)
        </h2>
        
        {currentAssets.length === 0 ? (
          <div style={{ 
            padding: 40, 
            textAlign: "center", 
            backgroundColor: "#f8f9fa", 
            borderRadius: 8,
            border: "1px solid #dee2e6"
          }}>
            <p style={{ margin: 0, color: "#6c757d" }}>データがありません。</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  {getTableHeaders().map((header, index) => (
                    <th key={index} style={{ 
                      border: "1px solid #dee2e6", 
                      padding: "12px 8px",
                      fontWeight: "bold",
                      textAlign: "left"
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentAssets.map((asset) => (
                  <tr key={asset.id} style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{asset.account}</td>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{asset.name}</td>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px", textAlign: "right" }}>
                      {asset.sharesOrAmount.toLocaleString()}
                    </td>
                    {selectedType !== "貯金" && (
                      <td style={{ border: "1px solid #dee2e6", padding: "8px", textAlign: "right" }}>
                        ¥{asset.purchasePrice.toLocaleString()}
                      </td>
                    )}
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 12,
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
                    {(selectedType === "株式" || selectedType === "投資信託" || selectedType === "債券") && (
                      <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{asset.purchaseType}</td>
                    )}
                    {selectedType === "債券" && (
                      <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{asset.bondGrade || "-"}</td>
                    )}
                    {selectedType === "貯金" && (
                      <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{asset.depositType}</td>
                    )}
                    <td style={{ border: "1px solid #dee2e6", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                      ¥{calculateValue(asset).toLocaleString()}
                    </td>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => handleEdit(asset.id)}
                          style={{
                            padding: "4px 8px",
                            cursor: "pointer",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            fontSize: 12,
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
                            borderRadius: 4,
                            fontSize: 12,
                          }}
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* サマリー */}
      <div style={{ 
        borderTop: "2px solid #007bff", 
        paddingTop: 20,
        backgroundColor: "#f8f9fa",
        padding: 20,
        borderRadius: 8,
        marginTop: 30
      }}>
        <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>資産サマリー</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {ASSET_TYPES.map((type) => (
            <div key={type} style={{ 
              backgroundColor: "white", 
              padding: 16, 
              borderRadius: 8, 
              border: "1px solid #dee2e6",
              textAlign: "center"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: 8, color: "#333" }}>{type}</div>
              <div style={{ fontSize: 18, fontWeight: "bold", color: "#007bff" }}>
                ¥{summary[type].toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div style={{ 
          marginTop: 20, 
          padding: 20, 
          backgroundColor: "#007bff", 
          color: "white", 
          borderRadius: 8, 
          textAlign: "center" 
        }}>
          <div style={{ fontSize: 16, marginBottom: 8 }}>総資産</div>
          <div style={{ fontSize: 24, fontWeight: "bold" }}>
            ¥{totalAssets.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;