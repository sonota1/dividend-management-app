import React, { useState } from "react";

function AccountManager({ accounts, onAddAccount }) {
  const [accountName, setAccountName] = useState("");

  const handleAdd = () => {
    if (!accountName.trim()) return alert("口座名を入力してください");
    onAddAccount({ id: Date.now().toString(), name: accountName.trim() });
    setAccountName("");
  };

  return (
    <div style={{ marginBottom: 30 }}>
      <h2>口座管理</h2>
      <input
        type="text"
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
    </div>
  );
}

function AssetForm({ accounts, onAddAsset, onUpdateAsset, editingAsset, onCancelEdit }) {
  const [assetType, setAssetType] = useState(editingAsset?.assetType || "株式");
  const [name, setName] = useState(editingAsset?.name || "");
  const [shares, setShares] = useState(editingAsset?.shares ?? "");
  const [purchasePrice, setPurchasePrice] = useState(editingAsset?.purchasePrice ?? "");
  const [accountId, setAccountId] = useState(editingAsset?.accountId || "");

  React.useEffect(() => {
    if (editingAsset) {
      setAssetType(editingAsset.assetType);
      setName(editingAsset.name);
      setShares(editingAsset.shares ?? "");
      setPurchasePrice(editingAsset.purchasePrice);
      setAccountId(editingAsset.accountId);
    } else {
      setAssetType("株式");
      setName("");
      setShares("");
      setPurchasePrice("");
      setAccountId("");
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
      if (!shares || !purchasePrice) {
        alert("株数と取得価格を入力してください");
        return;
      }
    }

    const assetData = {
      assetType,
      name: name.trim(),
      shares: assetType === "貯金" ? null : Number(shares),
      purchasePrice: Number(purchasePrice),
      accountId,
    };

    if (editingAsset) {
      onUpdateAsset({ ...editingAsset, ...assetData });
    } else {
      onAddAsset({ id: Date.now().toString(), ...assetData });
    }

    // リセット
    setAssetType("株式");
    setName("");
    setShares("");
    setPurchasePrice("");
    setAccountId("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
      <h2>{editingAsset ? "資産編集" : "資産追加フォーム"}</h2>

      <div>
        <label>資産タイプ：</label>
        <select
          value={assetType}
          onChange={(e) => setAssetType(e.target.value)}
          disabled={!!editingAsset} // 編集中はタイプ変更不可に
          style={{ marginBottom: 10 }}
        >
          <option value="株式">株式</option>
          <option value="債券">債券</option>
          <option value="貯金">貯金</option>
        </select>
      </div>

      <div>
        <label>名称：</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: 10 }}
        />
      </div>

      {assetType !== "貯金" ? (
        <>
          <div>
            <label>保有株数：</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          </div>
          <div>
            <label>取得価格：</label>
            <input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          </div>
        </>
      ) : (
        <div>
          <label>金額：</label>
          <input
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            style={{ marginBottom: 10 }}
          />
        </div>
      )}

      <div>
        <label>口座選択：</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          style={{ marginBottom: 10 }}
        >
          <option value="">選択してください</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </div>

      <button type="submit">{editingAsset ? "更新" : "追加"}</button>
      {editingAsset && (
        <button type="button" onClick={onCancelEdit} style={{ marginLeft: 10 }}>
          キャンセル
        </button>
      )}
    </form>
  );
}

function AssetList({ assets, accounts, onEdit, onDelete }) {
  return (
    <div>
      <h2>資産一覧</h2>
      {assets.length === 0 ? (
        <p>登録された資産はありません。</p>
      ) : (
        <table
          border="1"
          cellPadding="5"
          cellSpacing="0"
          style={{ width: "100%", textAlign: "left" }}
        >
          <thead>
            <tr>
              <th>資産タイプ</th>
              <th>名称</th>
              <th>口座名</th>
              <th>株数/金額</th>
              <th>取得価格</th>
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
                  <td>{account ? account.name : "-"}</td>
                  <td>
                    {a.assetType === "貯金"
                      ? a.purchasePrice.toLocaleString() + " 円"
                      : a.shares}
                  </td>
                  <td>
                    {a.assetType === "貯金"
                      ? "-"
                      : a.purchasePrice.toLocaleString() + " 円"}
                  </td>
                  <td>
                    <button onClick={() => onEdit(a)}>編集</button>
                    <button onClick={() => onDelete(a.id)} style={{ marginLeft: 10 }}>
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AssetSummary({ assets }) {
  const totalAssets = assets.reduce((acc, a) => {
    if (a.assetType === "貯金") {
      return acc + a.purchasePrice;
    } else {
      return acc + (a.shares || 0) * a.purchasePrice;
    }
  }, 0);

  const byType = assets.reduce(
    (acc, a) => {
      if (a.assetType === "貯金") acc["貯金"] += a.purchasePrice;
      else if (a.assetType === "株式") acc["株式"] += (a.shares || 0) * a.purchasePrice;
      else if (a.assetType === "債券") acc["債券"] += (a.shares || 0) * a.purchasePrice;
      return acc;
    },
    { 株式: 0, 債券: 0, 貯金: 0 }
  );

  return (
    <div style={{ marginBottom: 30 }}>
      <h2>資産サマリー</h2>
      <p>総資産額: {totalAssets.toLocaleString()} 円</p>
      <ul>
        <li>株式: {byType["株式"].toLocaleString()} 円</li>
        <li>債券: {byType["債券"].toLocaleString()} 円</li>
        <li>貯金: {byType["貯金"].toLocaleString()} 円</li>
      </ul>
    </div>
  );
}

export default function AssetManagementApp() {
  const [accounts, setAccounts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [editingAsset, setEditingAsset] = useState(null);

  const addAccount = (acc) => {
    setAccounts((prev) => [...prev, acc]);
  };

  const addAsset = (asset) => {
    setAssets((prev) => [...prev, asset]);
  };

  const updateAsset = (updated) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditingAsset(null);
  };

  const deleteAsset = (id) => {
    if (window.confirm("本当に削除しますか？")) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      if (editingAsset && editingAsset.id === id) {
        setEditingAsset(null);
      }
    }
  };

  const startEdit = (asset) => {
    setEditingAsset(asset);
  };

  const cancelEdit = () => {
    setEditingAsset(null);
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h1>資産運用管理アプリ</h1>

      <AccountManager accounts={accounts} onAddAccount={addAccount} />

      <AssetForm
        accounts={accounts}
        onAddAsset={addAsset}
        onUpdateAsset={updateAsset}
        editingAsset={editingAsset}
        onCancelEdit={cancelEdit}
      />

      <AssetSummary assets={assets} />

      <AssetList
        assets={assets}
        accounts={accounts}
        onEdit={startEdit}
        onDelete={deleteAsset}
      />
    </div>
  );
}
