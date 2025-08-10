import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

// === 銘柄管理フォーム（追加・削除・修正） ===
const StockForm = ({ onAdd, onUpdate, editingStock, onCancelEdit }) => {
  const [ticker, setTicker] = useState(editingStock?.ticker || "");
  const [shares, setShares] = useState(editingStock?.shares || "");
  const [price, setPrice] = useState(editingStock?.price || "");
  const [dividend, setDividend] = useState(editingStock?.dividendPerShare || "");
  const [sector, setSector] = useState(editingStock?.sector || "");
  const [risk, setRisk] = useState(editingStock?.risk || "");
  const [divType, setDivType] = useState(editingStock?.dividendType || "");

  useEffect(() => {
    if (editingStock) {
      setTicker(editingStock.ticker);
      setShares(editingStock.shares);
      setPrice(editingStock.price);
      setDividend(editingStock.dividendPerShare);
      setSector(editingStock.sector || "");
      setRisk(editingStock.risk || "");
      setDivType(editingStock.dividendType || "");
    }
  }, [editingStock]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const stock = {
      ticker: ticker.trim().toUpperCase(),
      shares: Number(shares),
      price: Number(price),
      dividendPerShare: Number(dividend),
      sector,
      risk,
      dividendType: divType,
      costPerShare: price, // 簡易的に価格を原価に
      priceHistory: generateDummyPriceHistory(),
      dividendHistory: generateDummyDividendHistory(),
    };
    if (editingStock) {
      onUpdate(stock);
    } else {
      onAdd(stock);
    }
    clearForm();
  };

  const clearForm = () => {
    setTicker("");
    setShares("");
    setPrice("");
    setDividend("");
    setSector("");
    setRisk("");
    setDivType("");
    onCancelEdit && onCancelEdit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginBottom: 20,
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 8,
        maxWidth: 600,
      }}
    >
      <h3>{editingStock ? "銘柄編集" : "銘柄追加"}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input
          required
          placeholder="銘柄コード"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          style={{ flex: "1 0 120px" }}
        />
        <input
          required
          type="number"
          placeholder="保有株数"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          style={{ flex: "1 0 100px" }}
          min="0"
        />
        <input
          required
          type="number"
          step="0.01"
          placeholder="現在価格"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ flex: "1 0 100px" }}
          min="0"
        />
        <input
          required
          type="number"
          step="0.01"
          placeholder="配当/株"
          value={dividend}
          onChange={(e) => setDividend(e.target.value)}
          style={{ flex: "1 0 100px" }}
          min="0"
        />
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="セクター"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          style={{ flex: "1 0 150px" }}
        />
        <input
          placeholder="リスク"
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          style={{ flex: "1 0 150px" }}
        />
        <input
          placeholder="配当タイプ"
          value={divType}
          onChange={(e) => setDivType(e.target.value)}
          style={{ flex: "1 0 150px" }}
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <button type="submit" style={{ marginRight: 8 }}>
          {editingStock ? "更新" : "追加"}
        </button>
        {editingStock && (
          <button type="button" onClick={clearForm}>
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};

// === 銘柄一覧テーブル ===
const StockList = ({
  stocks,
  onEdit,
  onDelete,
  filters,
  setFilters,
  sortKey,
  setSortKey,
}) => {
  // フィルター処理
  const filteredStocks = useMemo(() => {
    return stocks
      .filter((s) =>
        filters.sector ? s.sector === filters.sector : true
      )
      .filter((s) =>
        filters.risk ? s.risk === filters.risk : true
      )
      .filter((s) =>
        filters.dividendType ? s.dividendType === filters.dividendType : true
      );
  }, [stocks, filters]);

  // 並べ替え処理
  const sortedStocks = useMemo(() => {
    const arr = [...filteredStocks];
    switch (sortKey) {
      case "tickerAsc":
        arr.sort((a, b) => a.ticker.localeCompare(b.ticker));
        break;
      case "tickerDesc":
        arr.sort((a, b) => b.ticker.localeCompare(a.ticker));
        break;
      case "divYield":
        arr.sort(
          (a, b) =>
            (b.dividendPerShare / b.price || 0) -
            (a.dividendPerShare / a.price || 0)
        );
        break;
      case "shares":
        arr.sort((a, b) => b.shares - a.shares);
        break;
      case "priceChange":
        arr.sort((a, b) => {
          const aChange = a.price - (a.costPerShare || a.price);
          const bChange = b.price - (b.costPerShare || b.price);
          return bChange - aChange;
        });
        break;
      default:
        break;
    }
    return arr;
  }, [filteredStocks, sortKey]);

  // フィルター用選択肢取得
  const sectors = Array.from(new Set(stocks.map((s) => s.sector).filter(Boolean)));
  const risks = Array.from(new Set(stocks.map((s) => s.risk).filter(Boolean)));
  const divTypes = Array.from(new Set(stocks.map((s) => s.dividendType).filter(Boolean)));

  return (
    <div style={{ maxWidth: 900, margin: "auto", marginBottom: 20 }}>
      <h3>銘柄一覧</h3>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 10,
          alignItems: "center",
        }}
      >
        <select
          value={filters.sector}
          onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
        >
          <option value="">すべてのセクター</option>
          {sectors.map((sec) => (
            <option key={sec} value={sec}>
              {sec}
            </option>
          ))}
        </select>

        <select
          value={filters.risk}
          onChange={(e) => setFilters({ ...filters, risk: e.target.value })}
        >
          <option value="">すべてのリスク</option>
          {risks.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={filters.dividendType}
          onChange={(e) =>
            setFilters({ ...filters, dividendType: e.target.value })
          }
        >
          <option value="">すべての配当タイプ</option>
          {divTypes.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="">並べ替えなし</option>
          <option value="tickerAsc">銘柄名昇順</option>
          <option value="tickerDesc">銘柄名降順</option>
          <option value="divYield">配当利回り順</option>
          <option value="shares">保有株数順</option>
          <option value="priceChange">値上がり率順</option>
        </select>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: 20,
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>銘柄</th>
            <th style={thStyle}>保有株数</th>
            <th style={thStyle}>現在価格</th>
            <th style={thStyle}>配当/株</th>
            <th style={thStyle}>配当利回り</th>
            <th style={thStyle}>セクター</th>
            <th style={thStyle}>リスク</th>
            <th style={thStyle}>配当タイプ</th>
            <th style={thStyle}>値上がり率</th>
            <th style={thStyle}>価格推移</th>
            <th style={thStyle}>配当推移</th>
            <th style={thStyle}>操作</th>
          </tr>
        </thead>
        <tbody>
          {sortedStocks.map((s) => (
            <tr key={s.ticker}>
              <td style={tdStyle}>{s.ticker}</td>
              <td style={tdStyle}>{s.shares}</td>
              <td style={tdStyle}>¥{s.price.toFixed(2)}</td>
              <td style={tdStyle}>¥{s.dividendPerShare.toFixed(2)}</td>
              <td style={tdStyle}>
                {((s.dividendPerShare / s.price) * 100).toFixed(2)}%
              </td>
              <td style={tdStyle}>{s.sector || "-"}</td>
              <td style={tdStyle}>{s.risk || "-"}</td>
              <td style={tdStyle}>{s.dividendType || "-"}</td>
              <td style={tdStyle}>
                {((s.price - (s.costPerShare || s.price)) /
                  (s.costPerShare || s.price || 1) *
                  100
                ).toFixed(2)}
                %
              </td>
              <td style={tdStyle}>
                <Sparkline data={s.priceHistory} color="#8884d8" />
              </td>
              <td style={tdStyle}>
                <Sparkline data={s.dividendHistory} color="#82ca9d" />
              </td>
              <td style={tdStyle}>
                <button onClick={() => onEdit(s)}>編集</button>{" "}
                <button onClick={() => onDelete(s.ticker)}>削除</button>
              </td>
            </tr>
          ))}
          {sortedStocks.length === 0 && (
            <tr>
              <td colSpan={12} style={{ textAlign: "center", padding: 8 }}>
                表示する銘柄がありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = {
  borderBottom: "1px solid #ccc",
  padding: 8,
  textAlign: "center",
  backgroundColor: "#f7f7f7",
};
const tdStyle = {
  borderBottom: "1px solid #eee",
  padding: 6,
  textAlign: "center",
};

// === スパークライン（ミニチャート） ===
const Sparkline = ({ data, color }) => {
  if (!data || data.length === 0) return null;

  // 簡易スパークライン描画（SVGで折れ線グラフ）
  const width = 100;
  const height = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// === 総資産・損益サマリーカード ===
const SummaryCard = ({ holdings }) => {
  const totalAsset = holdings.reduce((sum, h) => sum + h.price * h.shares, 0);
  const totalCost = holdings.reduce(
    (sum, h) => sum + (h.costPerShare ? h.costPerShare * h.shares : 0),
    0
  );
  const totalProfit = totalAsset - totalCost;
  const totalDividend = holdings.reduce(
    (sum, h) => sum + h.dividendPerShare * h.shares,
    0
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        marginBottom: 20,
        maxWidth: 900,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <div
        style={{
          padding: 16,
          border: "1px solid #ccc",
          borderRadius: 8,
          width: "30%",
          textAlign: "center",
        }}
      >
        <h3>総資産</h3>
        <p style={{ fontSize: 24, color: "#007bff" }}>
          ¥{totalAsset.toLocaleString()}
        </p>
      </div>
      <div
        style={{
          padding: 16,
          border: "1px solid #ccc",
          borderRadius: 8,
          width: "30%",
          textAlign: "center",
        }}
      >
        <h3>損益</h3>
        <p style={{ fontSize: 24, color: totalProfit >= 0 ? "green" : "red" }}>
          ¥{totalProfit.toLocaleString()}
        </p>
      </div>
      <div
        style={{
          padding: 16,
          border: "1px solid #ccc",
          borderRadius: 8,
          width: "30%",
          textAlign: "center",
        }}
      >
        <h3>年間配当予想</h3>
        <p style={{ fontSize: 24, color: "#28a745" }}>
          ¥{totalDividend.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

// === 月別配当グラフ ===
const MonthlyDividendChart = ({ monthlyDividends }) => (
  <div style={{ width: "100%", height: 300, marginBottom: 40, maxWidth: 900, margin: "auto" }}>
    <h3>月別配当（過去12ヶ月）</h3>
    <ResponsiveContainer>
      <BarChart data={monthlyDividends}>
        <XAxis dataKey="month" tickFormatter={(str) => str.slice(5)} />
        <YAxis />
        <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
        <Bar dataKey="dividend" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// === 配当推移グラフ（累積配当も含む） ===
const DividendTrendChart = ({ dividendTrends }) => (
  <div style={{ width: "100%", height: 350, marginBottom: 40, maxWidth: 900, margin: "auto" }}>
    <h3>配当推移（税引前・税引後・累積）</h3>
    <ResponsiveContainer>
      <LineChart data={dividendTrends}>
        <XAxis dataKey="month" tickFormatter={(str) => str.slice(5)} />
        <YAxis />
        <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
        <Legend verticalAlign="top" height={36} />
        <Line type="monotone" dataKey="preTax" stroke="#8884d8" name="税引前" />
        <Line type="monotone" dataKey="postTax" stroke="#82ca9d" name="税引後" />
        <Line type="monotone" dataKey="cumulative" stroke="#ff7300" name="累積配当額" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// === ダミーデータ生成 ===
const generateDummyPriceHistory = () => {
  // 12ヶ月の価格データ (適当に上下動をつける)
  let base = 100 + Math.random() * 100;
  return Array.from({ length: 12 }).map(() => {
    base += (Math.random() - 0.5) * 5;
    return Math.round(base * 100) / 100;
  });
};
const generateDummyDividendHistory = () => {
  // 12ヶ月の配当データ
  return Array.from({ length: 12 }).map(() =>
    Math.round((Math.random() * 5 + 1) * 100) / 100
  );
};

// === メインコンポーネント ===
export default function App() {
  const [stocks, setStocks] = useState([
    {
      ticker: "AAPL",
      shares: 10,
      price: 175,
      dividendPerShare: 0.88,
      costPerShare: 160,
      sector: "テクノロジー",
      risk: "中",
      dividendType: "普通配当",
      priceHistory: generateDummyPriceHistory(),
      dividendHistory: generateDummyDividendHistory(),
    },
    {
      ticker: "MSFT",
      shares: 5,
      price: 320,
      dividendPerShare: 0.56,
      costPerShare: 300,
      sector: "テクノロジー",
      risk: "低",
      dividendType: "普通配当",
      priceHistory: generateDummyPriceHistory(),
      dividendHistory: generateDummyDividendHistory(),
    },
    {
      ticker: "KO",
      shares: 20,
      price: 60,
      dividendPerShare: 0.45,
      costPerShare: 55,
      sector: "消費財",
      risk: "低",
      dividendType: "特別配当",
      priceHistory: generateDummyPriceHistory(),
      dividendHistory: generateDummyDividendHistory(),
    },
  ]);
  const [editingStock, setEditingStock] = useState(null);
  const [filters, setFilters] = useState({
    sector: "",
    risk: "",
    dividendType: "",
  });
  const [sortKey, setSortKey] = useState("");

  // 銘柄追加
  const handleAddStock = (stock) => {
    if (stocks.find((s) => s.ticker === stock.ticker)) {
      alert("同じ銘柄コードが既に存在します。");
      return;
    }
    setStocks([...stocks, stock]);
  };

  // 銘柄編集更新
  const handleUpdateStock = (updatedStock) => {
    setStocks(
      stocks.map((s) => (s.ticker === updatedStock.ticker ? updatedStock : s))
    );
    setEditingStock(null);
  };

  // 銘柄削除
  const handleDeleteStock = (ticker) => {
    if (window.confirm(`銘柄 ${ticker} を削除しますか？`)) {
      setStocks(stocks.filter((s) => s.ticker !== ticker));
      if (editingStock?.ticker === ticker) setEditingStock(null);
    }
  };

  // 編集モード開始
  const handleEditStock = (stock) => {
    setEditingStock(stock);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 配当集計（月別）
  const monthlyDividends = useMemo(() => {
    // 過去12ヶ月をキーに合計配当計算（かなり単純化）
    // 月を YYYY-MM形式に固定し毎月配当を均等割り
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return d.toISOString().slice(0, 7);
    });

    const monthMap = {};
    months.forEach((m) => (monthMap[m] = 0));

    stocks.forEach(({ dividendPerShare, shares }) => {
      months.forEach((m) => {
        monthMap[m] += dividendPerShare * shares;
      });
    });

    return months.map((m) => ({ month: m, dividend: Math.round(monthMap[m]) }));
  }, [stocks]);

  // 累積配当額を計算
  let cumulativeSum = 0;
  const dividendTrends = monthlyDividends.map(({ month, dividend }) => {
    cumulativeSum += dividend;
    return {
      month,
      preTax: dividend,
      postTax: Math.round(dividend * 0.8),
      cumulative: cumulativeSum,
    };
  });

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ textAlign: "center" }}>配当管理アプリ</h2>

      <StockForm
        onAdd={handleAddStock}
        onUpdate={handleUpdateStock}
        editingStock={editingStock}
        onCancelEdit={() => setEditingStock(null)}
      />

      <StockList
        stocks={stocks}
        onEdit={handleEditStock}
        onDelete={handleDeleteStock}
        filters={filters}
        setFilters={setFilters}
        sortKey={sortKey}
        setSortKey={setSortKey}
      />

      <SummaryCard holdings={stocks} />

      <MonthlyDividendChart monthlyDividends={monthlyDividends} />

      <DividendTrendChart dividendTrends={dividendTrends} />
    </div>
  );
}

