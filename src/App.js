import React, { useState } from "react";

const TAG_OPTIONS = ["NISA", "特定", "一般"];
const SORT_OPTIONS = [
  { key: "name_asc", label: "銘柄名昇順" },
  { key: "name_desc", label: "銘柄名降順" },
  { key: "yield_desc", label: "配当利回り順" },
  { key: "shares_desc", label: "保有株数順" },
  { key: "price_change_desc", label: "値上がり率" },
];

async function fetchStockInfo(symbol) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("APIエラー");
    const data = await res.json();
    const quote = data?.quoteResponse?.result?.[0];
    if (!quote) throw new Error("銘柄情報が見つかりません");

    return {
      currentPrice: quote.regularMarketPrice ?? null,
      dividendYield: quote.dividendYield ? quote.dividendYield * 100 : null,
      dividendRate: quote.dividendRate ?? null,
      priceChangePercent: quote.regularMarketChangePercent ?? null,
      name: quote.shortName ?? "",
      sector: quote?.sector ?? "",
    };
  } catch (e) {
    console.error("Yahoo Finance取得エラー:", e.message);
    return null;
  }
}

export default function SakuraiStyledStockApp() {
  const [stocks, setStocks] = useState([]);
  const [form, setForm] = useState({
    symbol: "",
    shares: "",
    purchasePrice: "",
    tag: TAG_OPTIONS[0],
  });
  const [sortKey, setSortKey] = useState("name_asc");
  const [editStock, setEditStock] = useState(null);
  const [loadingSymbol, setLoadingSymbol] = useState(null);
  const [error, setError] = useState("");

  const addStock = async () => {
    setError("");
    const symbol = form.symbol.trim().toUpperCase();
    const shares = Number(form.shares);
    const purchasePrice = Number(form.purchasePrice);

    if (!symbol) {
      setError("銘柄コードは必須です");
      return;
    }
    if (!shares || shares <= 0) {
      setError("保有株数は正の数で入力してください");
      return;
    }
    if (stocks.find((s) => s.symbol === symbol)) {
      setError("既に同じ銘柄コードがあります");
      return;
    }

    setLoadingSymbol(symbol);
    const stockInfo = await fetchStockInfo(symbol);
    setLoadingSymbol(null);

    if (!stockInfo) {
      setError("株価情報が取得できませんでした。手入力で登録してください。");
      return;
    }

    setStocks((prev) => [
      ...prev,
      {
        symbol,
        name: stockInfo.name || symbol,
        shares,
        purchasePrice: purchasePrice || 0,
        currentPrice: stockInfo.currentPrice || 0,
        dividendYield: stockInfo.dividendYield ?? 0,
        dividendRate: stockInfo.dividendRate ?? 0,
        sector: stockInfo.sector || "",
        tag: form.tag,
        priceChangePercent: stockInfo.priceChangePercent ?? 0,
      },
    ]);
    setForm({ symbol: "", shares: "", purchasePrice: "", tag: TAG_OPTIONS[0] });
  };

  const startEdit = (stock) => {
    setEditStock({ ...stock });
    setError("");
  };

  const saveEdit = async () => {
    if (!editStock.symbol || !editStock.shares || editStock.shares <= 0) {
      setError("銘柄コード、保有株数は必須で、株数は正の数です");
      return;
    }
    setLoadingSymbol(editStock.symbol);
    const stockInfo = await fetchStockInfo(editStock.symbol);
    setLoadingSymbol(null);

    if (stockInfo) {
      editStock.currentPrice = stockInfo.currentPrice ?? editStock.currentPrice ?? 0;
      editStock.dividendYield = stockInfo.dividendYield ?? editStock.dividendYield ?? 0;
      editStock.dividendRate = stockInfo.dividendRate ?? editStock.dividendRate ?? 0;
      editStock.sector = stockInfo.sector || editStock.sector || "";
      editStock.priceChangePercent = stockInfo.priceChangePercent ?? editStock.priceChangePercent ?? 0;
      editStock.name = stockInfo.name || editStock.name;
    }

    setStocks((prev) =>
      prev.map((s) => (s.symbol === editStock.symbol ? { ...editStock, shares: Number(editStock.shares) } : s))
    );
    setEditStock(null);
    setError("");
  };

  const cancelEdit = () => {
    setEditStock(null);
    setError("");
  };

  const deleteStock = (symbol) => {
    if (window.confirm(`${symbol} を削除しますか？`)) {
      setStocks(stocks.filter((s) => s.symbol !== symbol));
    }
  };

  const sortedStocks = [...stocks].sort((a, b) => {
    switch (sortKey) {
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "yield_desc":
        return b.dividendYield - a.dividendYield;
      case "shares_desc":
        return b.shares - a.shares;
      case "price_change_desc":
        return b.priceChangePercent - a.priceChangePercent;
      default:
        return 0;
    }
  });

  return (
    <div
      style={{
        maxWidth: 920,
        margin: "40px auto",
        fontFamily: '"Segoe UI", "Yu Gothic", "ヒラギノ角ゴシック", sans-serif',
        color: "#333",
        lineHeight: 1.7,
        userSelect: "none",
      }}
    >
      <h1
        style={{
          fontWeight: "700",
          fontSize: 26,
          letterSpacing: 0.1,
          marginBottom: 24,
          textAlign: "center",
          color: "#1a237e",
          userSelect: "text",
        }}
      >
        銘柄管理アプリ (桜井政博風UI)
      </h1>

      <section
        style={{
          backgroundColor: "#fafafa",
          padding: 18,
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: 32,
          border: "1px solid #e3e3e3",
        }}
      >
        <h2 style={{ fontWeight: 600, fontSize: 18, marginBottom: 14, color: "#303f9f" }}>銘柄追加</h2>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            placeholder="銘柄コード (例: AAPL)"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
            style={{
              padding: "8px 14px",
              fontSize: 15,
              borderRadius: 6,
              border: "1px solid #cfd8dc",
              outline: "none",
              width: 140,
              color: "#1a237e",
              fontWeight: 600,
              letterSpacing: 0.05,
              boxShadow: loadingSymbol === form.symbol ? "0 0 8px #7986cb" : "none",
              transition: "box-shadow 0.3s ease",
              userSelect: "text",
            }}
            disabled={loadingSymbol !== null}
          />
          <input
            type="number"
            placeholder="保有株数"
            value={form.shares}
            onChange={(e) => setForm({ ...form, shares: e.target.value })}
            style={{
              padding: "8px 14px",
              fontSize: 15,
              borderRadius: 6,
              border: "1px solid #cfd8dc",
              outline: "none",
              width: 110,
              userSelect: "text",
            }}
            disabled={loadingSymbol !== null}
          />
          <input
            type="number"
            placeholder="取得価格"
            value={form.purchasePrice}
            onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
            style={{
              padding: "8px 14px",
              fontSize: 15,
              borderRadius: 6,
              border: "1px solid #cfd8dc",
              outline: "none",
              width: 120,
              userSelect: "text",
            }}
            disabled={loadingSymbol !== null}
            step="0.01"
          />
          <select
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            style={{
              padding: "8px 14px",
              fontSize: 15,
              borderRadius: 6,
              border: "1px solid #cfd8dc",
              outline: "none",
              width: 100,
              userSelect: "text",
              color: "#1a237e",
              fontWeight: 600,
              letterSpacing: 0.03,
              backgroundColor: "#f5f7fa",
            }}
            disabled={loadingSymbol !== null}
          >
            {TAG_OPTIONS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <button
            onClick={addStock}
            disabled={loadingSymbol !== null}
            style={{
              padding: "9px 22px",
              fontSize: 15,
              borderRadius: 8,
              border: "none",
              backgroundColor: loadingSymbol !== null ? "#a3bffa" : "#3949ab",
              color: "#fff",
              fontWeight: "700",
              cursor: loadingSymbol !== null ? "not-allowed" : "pointer",
              transition: "background-color 0.25s ease",
              userSelect: "none",
              boxShadow: loadingSymbol !== null ? "none" : "0 2px 6px rgba(57,73,171,0.5)",
            }}
          >
            {loadingSymbol === form.symbol ? "取得中..." : "追加"}
          </button>
        </div>
        {error && (
          <p
            style={{
              color: "#d32f2f",
              marginTop: 14,
              fontWeight: 600,
              fontSize: 14,
              userSelect: "text",
            }}
          >
            {error}
          </p>
        )}
      </section>

      <section style={{ marginBottom: 20, userSelect: "none" }}>
        <label
          htmlFor="sort-select"
          style={{
            fontWeight: 600,
            fontSize: 15,
            marginRight: 14,
            color: "#455a64",
            userSelect: "text",
          }}
        >
          並べ替え:
        </label>
        <select
          id="sort-select"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          style={{
            padding: "7px 14px",
            fontSize: 15,
            borderRadius: 6,
            border: "1px solid #cfd8dc",
            outline: "none",
            width: 180,
            userSelect: "text",
            backgroundColor: "#f5f7fa",
            color: "#1a237e",
            fontWeight: 600,
            letterSpacing: 0.03,
          }}
        >
          {SORT_OPTIONS.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </section>

      <section style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0 8px",
            userSelect: "none",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#e8eaf6",
                textAlign: "center",
                fontWeight: 600,
                fontSize: 14,
                color: "#3949ab",
                userSelect: "text",
              }}
            >
              <th style={{ padding: "12px 14px", borderRadius: "8px 0 0 8px" }}>銘柄コード</th>
              <th style={{ padding: "12px 14px" }}>銘柄名</th>
              <th style={{ padding: "12px 14px" }}>保有株数</th>
              <th style={{ padding: "12px 14px" }}>取得価格</th>
              <th style={{ padding: "12px 14px" }}>現在価格</th>
              <th style={{ padding: "12px 14px" }}>配当利回り(%)</th>
              <th style={{ padding: "12px 14px" }}>配当金(年率)</th>
              <th style={{ padding: "12px 14px" }}>セクター</th>
              <th style={{ padding: "12px 14px" }}>タグ</th>
              <th style={{ padding: "12px 14px" }}>値上がり率(%)</th>
              <th
                style={{
                  padding: "12px 14px",
                  borderRadius: "0 8px 8px 0",
                  minWidth: 130,
                }}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStocks.map((stock) =>
              editStock && editStock.symbol === stock.symbol ? (
                <tr
                  key={stock.symbol}
                  style={{
                    backgroundColor: "#fff8e1",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#212121",
                  }}
                >
                  <td style={{ padding: "10px 14px" }}>{stock.symbol}</td>
                  <td style={{ padding: "10px 14px" }}>{stock.name}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      type="number"
                      value={editStock.shares}
                      onChange={(e) => setEditStock({ ...editStock, shares: e.target.value })}
                      style={{
                        width: 70,
                        borderRadius: 6,
                        border: "1px solid #cfd8dc",
                        padding: "6px 10px",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      type="number"
                      value={editStock.purchasePrice}
                      onChange={(e) => setEditStock({ ...editStock, purchasePrice: e.target.value })}
                      style={{
                        width: 90,
                        borderRadius: 6,
                        border: "1px solid #cfd8dc",
                        padding: "6px 10px",
                        fontSize: 14,
                        outline: "none",
                      }}
                      step="0.01"
                    />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {stock.currentPrice ? Number(stock.currentPrice).toLocaleString() : "-"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      type="number"
                      value={editStock.dividendYield}
                      onChange={(e) => setEditStock({ ...editStock, dividendYield: e.target.value })}
                      style={{
                        width: 90,
                        borderRadius: 6,
                        border: "1px solid #cfd8dc",
                        padding: "6px 10px",
                        fontSize: 14,
                        outline: "none",
                      }}
                      step="0.01"
                    />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      type="number"
                      value={editStock.dividendRate}
                      onChange={(e) => setEditStock({ ...editStock, dividendRate: e.target.value })}
                      style={{
                        width: 90,
                        borderRadius: 6,
                        border: "1px solid #cfd8dc",
                        padding: "6px 10px",
                        fontSize: 14,
                        outline: "none",
                      }}
                      step="0.01"
                    />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      value={editStock.sector}
                      onChange={(e) => setEditStock({ ...editStock, sector: e.target.value })}
                      style={{
                        width: 120,
                        borderRadius: 6,
                        border: "1px solid #cfd8dc",
                        padding: "6px 10px",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <select
                      value={editStock.tag}
                      onChange={(e) => setEditStock({ ...editStock, tag: e.target.value })}
                      style={{
                        width: 100,
                        borderRadius: 6,
                        border: "1px solid #cfd8dc",
                        padding: "6px 10px",
                        fontSize: 14,
                        outline: "none",
                        color: "#1a237e",
                        fontWeight: 600,
                        backgroundColor: "#f5f7fa",
                      }}
                    >
                      {TAG_OPTIONS.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      type="number"
                      value={editStock.priceChangePercent}
                      onChange={(e) => setEditStock({ ...editStock, priceChangePercent: e.target.value })}
                      style={{
                        width: 90,
                        borderRadius: 6,
                        border: "1px solid #cfd8dc",
                        padding: "6px 10px",
                        fontSize: 14,
                        outline: "none",
                      }}
                      step="0.01"
                    />
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      display: "flex",
                      gap: 10,
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={saveEdit}
                      disabled={loadingSymbol !== null}
                      style={{
                        padding: "6px 18px",
                        fontSize: 14,
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "#3949ab",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: loadingSymbol !== null ? "not-allowed" : "pointer",
                        userSelect: "none",
                        boxShadow: "0 2px 5px rgba(57,73,171,0.5)",
                        transition: "background-color 0.3s ease",
                      }}
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={loadingSymbol !== null}
                      style={{
                        padding: "6px 18px",
                        fontSize: 14,
                        borderRadius: 6,
                        border: "1px solid #cfd8dc",
                        backgroundColor: "#fff",
                        color: "#455a64",
                        fontWeight: 700,
                        cursor: loadingSymbol !== null ? "not-allowed" : "pointer",
                        userSelect: "none",
                      }}
                    >
                      キャンセル
                    </button>
                  </td>
                </tr>
              ) : (
                <tr
                  key={stock.symbol}
                  style={{
                    backgroundColor: "#f9f9fb",
                    fontSize: 14,
                    color: "#212121",
                    fontWeight: 600,
                    userSelect: "text",
                  }}
                >
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>{stock.symbol}</td>
                  <td style={{ padding: "10px 14px", textAlign: "left" }}>{stock.name}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>{stock.shares}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    {stock.purchasePrice ? Number(stock.purchasePrice).toLocaleString() : "-"}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    {stock.currentPrice ? Number(stock.currentPrice).toLocaleString() : "-"}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    {stock.dividendYield ? Number(stock.dividendYield).toFixed(2) : "-"}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    {stock.dividendRate ? Number(stock.dividendRate).toFixed(2) : "-"}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>{stock.sector}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>{stock.tag}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    {stock.priceChangePercent ? Number(stock.priceChangePercent).toFixed(2) : "-"}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                      userSelect: "none",
                    }}
                  >
                    <button
                      onClick={() => startEdit(stock)}
                      disabled={loadingSymbol !== null}
                      style={{
                        padding: "6px 18px",
                        fontSize: 14,
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "#3949ab",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: loadingSymbol !== null ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 5px rgba(57,73,171,0.5)",
                        transition: "background-color 0.3s ease",
                        userSelect: "none",
                      }}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => deleteStock(stock.symbol)}
                      disabled={loadingSymbol !== null}
                      style={{
                        padding: "6px 18px",
                        fontSize: 14,
                        borderRadius: 6,
                        border: "1px solid #cfd8dc",
                        backgroundColor: "#fff",
                        color: "#455a64",
                        fontWeight: 700,
                        cursor: loadingSymbol !== null ? "not-allowed" : "pointer",
                        userSelect: "none",
                      }}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
