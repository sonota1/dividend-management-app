import React, { useState, useEffect } from "react";

// --- 定数 ---
const ASSET_TYPES = ["株式", "債券", "貯金"];
const RISK_TAGS = ["低リスク", "中リスク", "高リスク"];
const STOCK_PURCHASE_TYPES = ["NISA", "iDeCo", "一般"];
const BOND_PURCHASE_TYPES = ["国債", "社債"];
const DEPOSIT_TYPES = ["普通", "定期"];

// --- 口座管理 ---
function AccountManager({ accounts, onAddAccount }) {
  const [accountName, setAccountName] = useState("");

  const handleAdd = () => {
    if (!accountName.trim()) {
      alert("口座名を入力してください");
      return;
    }
    onAddAccount({ id: Date.now().toString(), name: accountName.trim() });
    setAccountName("");
  };

  return (
    <section style={{ marginBottom: 40 }}>
      <h2>口座管理</h2>
      <input
        placeholder="口座名を入力"
        value={accountName}
        onChange={(e) => setAccountName(e.target.value)}
      />
      <button onClick={handleAdd}>口座追加</button>
      <ul>
        {accounts.map((acc) => (
          <li key={acc.id}>{acc.name}</li>
        ))}
      </ul>
    </section>
  );
}

// --- 資産フォーム ---
function AssetForm({ accounts, onAddAsset, onUpdateAsset, editingAsset, onCancelEdit }) {
  const [assetType, setAssetType] = useState(editingAsset?.assetType || "株式");
  const [name, setName] = useState(editingAsset?.name || "");
  const [sharesOrAmount, setSharesOrAmount] = useState(editingAsset?.shares ?? "");
  const [purchasePrice, setPurchasePrice] = useState(editingAsset?.purchasePrice ?? "");
  const [accountId, setAccountId] = useState(editingAsset?.accountId || "");
  const [riskTag, setRiskTag] = useState(editingAsset?.riskTag || "中リスク");

  // 購入種別 or 預金種別
  const [purchaseType, setPurchaseType] = useState(editingAsset?.purchaseType || (assetType === "貯金" ? "普通" : "一般"));
  const [bondRating, setBondRating] = useState(editingAsset?.bondRating || "");

  React.useEffect(() => {
    if (editingAsset) {
      setAssetType(editingAsset.assetType);
      setName(editingAsset.name);
      setSharesOrAmount(editingAsset.shares ?? "");
      setPurchasePrice(editingAsset.purchasePrice);
      setAccountId(editingAsset.accountId);
      setRiskTag(editingAsset.riskTag || "中リスク");
      setPurchaseType(editingAsset.purchaseType || (editingAsset.assetType === "貯金" ? "普通" : "一般"));
      setBondRating(editingAsset.bondRating || "");
    } else {
      setAssetType("株式");
      setName("");
      setSharesOrAmount("");
      setPurchasePrice("");
      setAccountId("");
      setRiskTag("中リスク");
      setPurchaseType("一般");
      setBondRating("");
    }
  }, [editingAsset]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !accountId) {
      alert("名称と口座選択は必須です");
      return;
    }

    if (assetType === "貯金") {
      if (!purchasePrice) {
        alert("金額を入力してください");
        return;
      }
    } else {
      if (!sharesOrAmount || !purchasePrice) {
        alert("保有数または保有額と取得価格を入力してください");
        return;
      }
      if (assetType === "債券" && !purchaseType) {
        alert("購入種別（国債・社債）を選択してください");
        return;
      }
    }

    const assetData = {
      assetType,
      name: name.trim(),
      shares: assetType === "貯金" ? null : Number(sharesOrAmount),
      purchasePrice: Number(purchasePrice),
      accountId,
      riskTag,
      purchaseType: assetType === "貯金" ? undefined : purchaseType,
      bondRating: assetType === "債券" ? bondRating : undefined,
      depositType: assetType === "貯金" ? purchaseType : undefined,
      id: editingAsset ? editingAsset.id : Date.now().toString(),
    };

    if (editingAsset) {
      onUpdateAsset(assetData);
    } else {
      onAddAsset(assetData);
    }

    // リセット
    setAssetType("株式");
    setName("");
    setSharesOrAmount("");
    setPurchasePrice("");
    setAccountId("");
    setRiskTag("中リスク");
    setPurchaseType("一般");
    setBondRating("");
  };

  return (
    <section style={{ marginBottom: 40 }}>
      <h2>{editingAsset ? "資産編集" : "資産追加フォーム"}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>資産タイプ: </label>
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            disabled={!!editingAsset}
          >
            {ASSET_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>
            {assetType === "株式" && "会社名"}
            {assetType === "債券" && "債券名"}
            {assetType === "貯金" && "預金先名"}
            ：
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {assetType === "貯金" ? (
          <div style={{ marginBottom: 10 }}>
            <label>金額（円）: </label>
            <input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 10 }}>
              <label>
                {assetType === "株式" && "保有株数"}
                {assetType === "債券" && "保有額（単位など）"}
                ：
              </label>
              <input
                type="number"
                value={sharesOrAmount}
                onChange={(e) => setSharesOrAmount(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>取得価格（円）: </label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
          </>
        )}

        <div style={{ marginBottom: 10 }}>
          <label>口座: </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">選択してください</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>リスクタグ: </label>
          <select
            value={riskTag}
            onChange={(e) => setRiskTag(e.target.value)}
          >
            {RISK_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {/* 購入種別 or 預金種別 */}
        {assetType === "株式" && (
          <div style={{ marginBottom: 10 }}>
            <label>購入種別: </label>
            <select
              value={purchaseType}
              onChange={(e) => setPurchaseType(e.target.value)}
            >
              {STOCK_PURCHASE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}

        {assetType === "債券" && (
          <>
            <div style={{ marginBottom: 10 }}>
              <label>購入種別: </label>
              <select
                value={purchaseType}
                onChange={(e) => setPurchaseType(e.target.value)}
              >
                {BOND_PURCHASE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>格付け: </label>
              <input
                type="text"
                placeholder="例：AAA、AAなど"
                value={bondRating}
                onChange={(e) => setBondRating(e.target.value)}
              />
            </div>
          </>
        )}

        {assetType === "貯金" && (
          <div style={{ marginBottom: 10 }}>
            <label>預金種別: </label>
            <select
              value={purchaseType}
              onChange={(e) => setPurchaseType(e.target.value)}
            >
              {DEPOSIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit">{editingAsset ? "更新" : "追加"}</button>
        {editingAsset && (
          <button
            type="button"
            onClick={onCancelEdit}
            style={{ marginLeft: 10 }}
          >
            キャンセル
          </button>
        )}
      </form>
    </section>
  );
}

// --- 資産一覧 ---
function AssetList({ assets, accounts, onEdit, onDelete }) {
  return (
    <section>
      <h2>資産一覧</h2>
      {assets.length === 0 && <p>登録された資産がありません。</p>}
      <table border="1" cellPadding="6" cellSpacing="0" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>資産タイプ</th>
            <th>名称</th>
            <th>保有数/額</th>
            <th>取得価格</th>
            <th>口座</th>
            <th>リスク</th>
            <th>購入種別/預金種別</th>
            <th>格付け</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => {
            const account = accounts.find((acc) => acc.id === a.accountId);
            return (
              <tr key={a.id}>
                <td>{a.assetType}</td>
                <td>{a.name}</td>
                <td>
                  {a.assetType === "貯金" ? (
                    a.purchasePrice.toLocaleString()
                  ) : (
                    a.shares?.toLocaleString()
                  )}
                </td>
                <td>{a.purchasePrice.toLocaleString()}</td>
                <td>{account ? account.name : "不明"}</td>
                <td>{a.riskTag}</td>
                <td>{a.assetType === "貯金" ? a.depositType : a.purchaseType}</td>
                <td>{a.assetType === "債券" ? a.bondRating || "-" : "-"}</td>
                <td>
                  <button onClick={() => onEdit(a)}>編集</button>
                  <button onClick={() => onDelete(a.id)} style={{ marginLeft: 5 }}>
                    削除
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

// --- 資産集計＆チャート表示 ---
function AssetSummaryAndChart({ assets }) {
  // 資産タイプごとの合計計算
  const summary = ASSET_TYPES.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {});

  assets.forEach((a) => {
    // 金額ベースの集計: 
    // 株式・債券は 保有数 * 取得価格 で計算。貯金は購入価格だけ
    let value = 0;
    if (a.assetType === "貯金") {
      value = a.purchasePrice;
    } else {
      value = (a.shares ?? 0) * (a.purchasePrice ?? 0);
    }
    summary[a.assetType] += value;
  });

  // 簡易棒グラフ用スタイル
  const maxValue = Math.max(...Object.values(summary), 1);

  return (
    <section style={{ marginTop: 40 }}>
      <h2>資産集計</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {ASSET_TYPES.map((type) => (
          <li key={type} style={{ marginBottom: 10 }}>
            <strong>{type}</strong> : {summary[type].toLocaleString()} 円
            <div
              style={{
                backgroundColor: "#4caf50",
                height: 20,
                width: `${(summary[type] / maxValue) * 100}%`,
                maxWidth: 600,
                transition: "width 0.5s ease",
                marginTop: 4,
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- メイン ---
export default function AssetManagerApp() {
  const [accounts, setAccounts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [editingAsset, setEditingAsset] = useState(null);

  // 口座追加
  const addAccount = (newAccount) => {
    setAccounts((prev) => [...prev, newAccount]);
  };

  // 資産追加
  const addAsset = (newAsset) => {
    setAssets((prev) => [...prev, newAsset]);
  };

  // 資産更新
  const updateAsset = (updatedAsset) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a))
    );
    setEditingAsset(null);
  };

  // 編集開始
  const editAsset = (asset) => {
    setEditingAsset(asset);
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingAsset(null);
  };

  // 削除
  const deleteAsset = (id) => {
    if (window.confirm("本当に削除しますか？")) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      if (editingAsset?.id === id) {
        setEditingAsset(null);
      }
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1>資産運用管理アプリ</h1>

      <AccountManager accounts={accounts} onAddAccount={addAccount} />

      <AssetForm
        accounts={accounts}
        onAddAsset={addAsset}
        onUpdateAsset={updateAsset}
        editingAsset={editingAsset}
        onCancelEdit={cancelEdit}
      />

      <AssetList
        assets={assets}
        accounts={accounts}
        onEdit={editAsset}
        onDelete={deleteAsset}
      />

      <AssetSummaryAndChart assets={assets} />
    </div>
  );
}
