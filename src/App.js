import React, { useState, useEffect } from "react";

// --- シンプルなカラーパレットとフォント ---
const colors = {
  background: "#f5f7fa",
  cardBg: "#ffffff",
  primary: "#2b2b2b",
  secondary: "#555555",
  accent: "#4a90e2",
  error: "#d9534f",
  success: "#5cb85c",
  border: "#e0e0e0",
};

const fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// --- 共通スタイル ---
const styles = {
  app: {
    fontFamily,
    backgroundColor: colors.background,
    minHeight: "100vh",
    padding: 20,
    color: colors.primary,
    maxWidth: 960,
    margin: "0 auto",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    borderBottom: `2px solid ${colors.accent}`,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  button: {
    backgroundColor: colors.accent,
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: 14,
    transition: "background-color 0.3s",
  },
  input: {
    fontSize: 14,
    padding: 8,
    borderRadius: 4,
    border: `1px solid ${colors.border}`,
    width: "100%",
    marginBottom: 12,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontWeight: "600",
    fontSize: 14,
    color: colors.secondary,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 12,
  },
  th: {
    textAlign: "left",
    borderBottom: `1px solid ${colors.border}`,
    padding: "8px 12px",
    fontWeight: "700",
    fontSize: 14,
  },
  td: {
    padding: "8px 12px",
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
  },
};

// --- 配当管理アプリ本体 ---
export default function DividendApp() {
  // 銘柄データ構造例
  const [stocks, setStocks] = useState(() => {
    const saved = localStorage.getItem("stocks");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            name: "トヨタ自動車",
            ticker: "7203.T",
            shares: 100,
            price: 2000,
            dividend: 50,
            sector: "自動車",
            risk: "中",
            dividendType: "普通",
            priceHistory: [1980, 1995, 2010, 2000, 2005, 1998, 2002],
            dividendHistory: [45, 48, 50, 50, 52, 51, 50],
          },
        ];
  });

  // 新規銘柄フォーム状態
  const [form, setForm] = useState({
    name: "",
    ticker: "",
    shares: "",
    price: "",
    dividend: "",
    sector: "",
    risk: "",
    dividendType: "",
  });

  const [error, setError] = useState("");

  // localStorage に保存
  useEffect(() => {
    localStorage.setItem("stocks", JSON.stringify(stocks));
  }, [stocks]);

  // 入力変更ハンドラ
  const onChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // 銘柄追加
  const addStock = () => {
    if (!form.name || !form.ticker || !form.shares || !form.price || !form.dividend) {
      setError("必須項目をすべて入力してください。");
      return;
    }
    const newStock = {
      id: Date.now(),
      name: form.name.trim(),
      ticker: form.ticker.trim(),
      shares: Number(form.shares),
      price: Number(form.price),
      dividend: Number(form.dividend),
      sector: form.sector.trim() || "未設定",
      risk: form.risk.trim() || "未設定",
      dividendType: form.dividendType.trim() || "普通",
      priceHistory: [],
      dividendHistory: [],
    };
    setStocks((prev) => [...prev, newStock]);
    setForm({
      name: "",
      ticker: "",
      shares: "",
      price: "",
      dividend: "",
      sector: "",
      risk: "",
      dividendType: "",
    });
    setError("");
  };

  // 銘柄削除
  const removeStock = (id) => {
    setStocks((prev) => prev.filter((s) => s.id !== id));
  };

  // 銘柄編集（ここでは簡易にpriceとdividendだけ）
  const editStockField = (id, field, value) => {
    setStocks((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, [field]: field === "name" || field === "ticker" || field === "sector" || field === "risk" || field === "dividendType" ? value : Number(value) } : s
      )
    );
  };

  // 総資産・配当合計計算
  const totalAssets = stocks.reduce((sum, s) => sum + s.price * s.shares, 0);
  const totalDividend = stocks.reduce((sum, s) => sum + s.dividend * s.shares, 0);

  // ミニチャート用（スパークライン的表示）
  const MiniSparkline = ({ data }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data
      .map(
        (v, i) =>
          `${(i * (100 / (data.length - 1))).toFixed(2)},${(100 - ((v - min) / range) * 100).toFixed(2)}`
      )
      .join(" ");
    return (
      <svg width="100" height="30" style={{ display: "block" }}>
        <polyline
          fill="none"
          stroke={colors.accent}
          strokeWidth="2"
          points={points}
          style={{ shapeRendering: "geometricPrecision" }}
        />
      </svg>
    );
  };

  return (
    <div style={styles.app}>
      <h1 style={styles.header}>配当管理アプリ</h1>

      {/* 総資産・配当サマリー */}
      <section style={styles.card}>
        <h2>サマリー</h2>
        <p>総資産額: <strong>¥{totalAssets.toLocaleString()}</strong></p>
        <p>年間配当額（予想）: <strong>¥{totalDividend.toLocaleString()}</strong></p>
      </section>

      {/* 銘柄追加フォーム */}
      <section style={styles.card}>
        <h2>銘柄追加</h2>
        <label style={styles.label}>銘柄名（必須）</label>
        <input
          style={styles.input}
          name="name"
          value={form.name}
          onChange={onChangeForm}
          placeholder="例: トヨタ自動車"
        />
        <label style={styles.label}>ティッカー（必須）</label>
        <input
          style={styles.input}
          name="ticker"
          value={form.ticker}
          onChange={onChangeForm}
          placeholder="例: 7203.T"
        />
        <label style={styles.label}>保有株数（必須）</label>
        <input
          type="number"
          style={styles.input}
          name="shares"
          value={form.shares}
          onChange={onChangeForm}
          placeholder="例: 100"
        />
        <label style={styles.label}>現在株価（必須）</label>
        <input
          type="number"
          style={styles.input}
          name="price"
          value={form.price}
          onChange={onChangeForm}
          placeholder="例: 2000"
        />
        <label style={styles.label}>1株配当（必須）</label>
        <input
          type="number"
          style={styles.input}
          name="dividend"
          value={form.dividend}
          onChange={onChangeForm}
          placeholder="例: 50"
        />
        <label style={styles.label}>セクター</label>
        <input
          style={styles.input}
          name="sector"
          value={form.sector}
          onChange={onChangeForm}
          placeholder="例: 自動車"
        />
        <label style={styles.label}>リスク</label>
        <input
          style={styles.input}
          name="risk"
          value={form.risk}
          onChange={onChangeForm}
          placeholder="例: 中"
        />
        <label style={styles.label}>配当タイプ</label>
        <input
          style={styles.input}
          name="dividendType"
          value={form.dividendType}
          onChange={onChangeForm}
          placeholder="例: 普通"
        />
        {error && <div style={styles.errorText}>{error}</div>}
        <button style={styles.button} onClick={addStock}>
          追加
        </button>
      </section>

      {/* 銘柄一覧テーブル */}
      <section style={styles.card}>
        <h2>保有銘柄一覧</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>銘柄名</th>
              <th style={styles.th}>ティッカー</th>
              <th style={styles.th}>株数</th>
              <th style={styles.th}>現在価格</th>
              <th style={styles.th}>配当/株</th>
              <th style={styles.th}>配当利回り</th>
              <th style={styles.th}>価格推移</th>
              <th style={styles.th}>配当推移</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => (
              <tr key={s.id}>
                <td style={styles.td}>{s.name}</td>
                <td style={styles.td}>{s.ticker}</td>
                <td style={styles.td}>{s.shares}</td>
                <td style={styles.td}>¥{s.price.toLocaleString()}</td>
                <td style={styles.td}>¥{s.dividend.toLocaleString()}</td>
                <td style={styles.td}>
                  {((s.dividend / s.price) * 100).toFixed(2)}%
                </td>
                <td style={styles.td}>
                  <MiniSparkline data={s.priceHistory} />
                </td>
                <td style={styles.td}>
                  <MiniSparkline data={s.dividendHistory} />
                </td>
                <td style={styles.td}>
                  <button
                    style={{
                      ...styles.button,
                      backgroundColor: colors.error,
                      fontSize: 12,
                      padding: "4px 8px",
                    }}
                    onClick={() => removeStock(s.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {stocks.length === 0 && (
              <tr>
                <td colSpan={9} style={styles.td}>
                  銘柄がありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
