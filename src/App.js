import React, { useState, useEffect, useRef } from 'react';

const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const YAHOO_API_BASE = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=';

// 30分キャッシュ用
const cache = {};

// タグ選択肢
const TAG_OPTIONS = ['NISA', '特定', '一般'];

// 並べ替え選択肢
const SORT_OPTIONS = [
  { key: 'name_asc', label: '銘柄名昇順' },
  { key: 'name_desc', label: '銘柄名降順' },
  { key: 'yield_desc', label: '配当利回り順' },
  { key: 'shares_desc', label: '保有株数順' },
  { key: 'price_change_desc', label: '値上がり率' },
];

// セクターはAPIから取得（簡易版）
const getSectorFromAPI = (data) => data?.quoteType === 'EQUITY' ? data.sector || '不明' : '不明';

const fetchStockData = async (symbol) => {
  const now = Date.now();
  if (cache[symbol] && now - cache[symbol].timestamp < 30 * 60 * 1000) {
    return cache[symbol].data;
  }

  const url = CORS_PROXY + YAHOO_API_BASE + symbol;
  const res = await fetch(url);
  if (!res.ok) throw new Error('API取得失敗');
  const json = await res.json();
  if (json.quoteResponse.result.length === 0) throw new Error('銘柄が見つかりません');

  const stock = json.quoteResponse.result[0];
  const data = {
    symbol: stock.symbol,
    shortName: stock.shortName,
    currentPrice: stock.regularMarketPrice,
    dividendYield: stock.dividendYield || 0,
    dividendRate: stock.dividendRate || 0,
    sector: stock.sector || '不明',
    priceChangePercent: stock.regularMarketChangePercent || 0,
  };
  cache[symbol] = { data, timestamp: now };
  return data;
};

export default function StockApp() {
  const [symbolInput, setSymbolInput] = useState('');
  const [sharesInput, setSharesInput] = useState('');
  const [tagInput, setTagInput] = useState(TAG_OPTIONS[0]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState('name_asc');
  const [editStock, setEditStock] = useState(null);

  // 銘柄追加
  const addStock = async () => {
    setError('');
    const symbol = symbolInput.trim().toUpperCase();
    const shares = Number(sharesInput);

    if (!symbol) {
      setError('銘柄コードを入力してください');
      return;
    }
    if (!shares || shares <= 0) {
      setError('保有株数は正の数を入力してください');
      return;
    }
    if (stocks.find((s) => s.symbol === symbol)) {
      setError('既に追加済みの銘柄です');
      return;
    }

    try {
      setLoading(true);
      const data = await fetchStockData(symbol);
      setStocks((prev) => [
        ...prev,
        {
          symbol: data.symbol,
          name: data.shortName,
          shares,
          currentPrice: data.currentPrice,
          dividendYield: data.dividendYield,
          dividendRate: data.dividendRate,
          sector: data.sector,
          tag: tagInput,
          priceChangePercent: data.priceChangePercent,
        },
      ]);
      setSymbolInput('');
      setSharesInput('');
      setTagInput(TAG_OPTIONS[0]);
    } catch (e) {
      setError(e.message || '銘柄情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 銘柄削除
  const deleteStock = (symbol) => {
    if (window.confirm(`${symbol} を削除しますか？`)) {
      setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
    }
  };

  // 編集開始
  const startEdit = (stock) => {
    setEditStock({ ...stock });
  };

  // 編集保存
  const saveEdit = () => {
    if (!editStock.symbol || !editStock.shares || editStock.shares <= 0) {
      alert('銘柄コードと正の保有株数が必要です');
      return;
    }
    setStocks((prev) =>
      prev.map((s) => (s.symbol === editStock.symbol ? { ...s, shares: Number(editStock.shares), tag: editStock.tag } : s))
    );
    setEditStock(null);
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditStock(null);
  };

  // 並べ替え適用
  const sortedStocks = [...stocks].sort((a, b) => {
    switch (sortKey) {
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'yield_desc':
        return b.dividendYield - a.dividendYield;
      case 'shares_desc':
        return b.shares - a.shares;
      case 'price_change_desc':
        return b.priceChangePercent - a.priceChangePercent;
      default:
        return 0;
    }
  });

  return (
    <div style={{ maxWidth: 800, margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>銘柄追加・管理（Yahoo Finance API + キャッシュ）</h2>

      {/* 銘柄追加フォーム */}
      <div style={{ marginBottom: 16, border: '1px solid #ccc', padding: 12, borderRadius: 8 }}>
        <h3>銘柄追加</h3>
        <input
          placeholder="銘柄コード (例: AAPL)"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          disabled={loading}
          style={{ padding: 6, marginRight: 8, width: '30%' }}
        />
        <input
          type="number"
          placeholder="保有株数"
          value={sharesInput}
          onChange={(e) => setSharesInput(e.target.value)}
          disabled={loading}
          style={{ padding: 6, marginRight: 8, width: '20%' }}
        />
        <select
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          disabled={loading}
          style={{ padding: 6, marginRight: 8 }}
        >
          {TAG_OPTIONS.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <button onClick={addStock} disabled={loading}>
          追加
        </button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </div>

      {/* 並べ替え */}
      <div style={{ marginBottom: 12 }}>
        <label>並べ替え: </label>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} style={{ padding: 6 }}>
          {SORT_OPTIONS.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 銘柄一覧 */}
      <table
        border="1"
        cellPadding="6"
        style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, textAlign: 'center' }}
      >
        <thead style={{ backgroundColor: '#f0f0f0' }}>
          <tr>
            <th>銘柄コード</th>
            <th>銘柄名</th>
            <th>保有株数</th>
            <th>現在価格</th>
            <th>配当利回り</th>
            <th>配当金(年率)</th>
            <th>評価額</th>
            <th>セクター</th>
            <th>タグ</th>
            <th>値上がり率(%)</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {sortedStocks.map((stock) =>
            editStock && editStock.symbol === stock.symbol ? (
              <tr key={stock.symbol} style={{ backgroundColor: '#fff3cd' }}>
                <td>{stock.symbol}</td>
                <td>{stock.name}</td>
                <td>
                  <input
                    type="number"
                    value={editStock.shares}
                    onChange={(e) => setEditStock({ ...editStock, shares: e.target.value })}
                    style={{ width: 70 }}
                  />
                </td>
                <td>{stock.currentPrice?.toLocaleString() ?? '-'}</td>
                <td>{stock.dividendYield ? (stock.dividendYield * 100).toFixed(2) + '%' : '-'}</td>
                <td>{stock.dividendRate ? stock.dividendRate.toFixed(2) : '-'}</td>
                <td>{stock.currentPrice ? (editStock.shares * stock.currentPrice).toLocaleString() : '-'}</td>
                <td>{stock.sector}</td>
                <td>
                  <select
                    value={editStock.tag}
                    onChange={(e) => setEditStock({ ...editStock, tag: e.target.value })}
                    style={{ width: 70 }}
                  >
                    {TAG_OPTIONS.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{stock.priceChangePercent.toFixed(2)}</td>
                <td>
                  <button onClick={saveEdit} style={{ marginRight: 4 }}>
                    保存
                  </button>
                  <button onClick={cancelEdit}>キャンセル</button>
                </td>
              </tr>
            ) : (
              <tr key={stock.symbol}>
                <td>{stock.symbol}</td>
                <td>{stock.name}</td>
                <td>{stock.shares}</td>
                <td>{stock.currentPrice?.toLocaleString() ?? '-'}</td>
                <td>{stock.dividendYield ? (stock.dividendYield * 100).toFixed(2) + '%' : '-'}</td>
                <td>{stock.dividendRate ? stock.dividendRate.toFixed(2) : '-'}</td>
                <td>{stock.currentPrice ? (stock.shares * stock.currentPrice).toLocaleString() : '-'}</td>
                <td>{stock.sector}</td>
                <td>{stock.tag}</td>
                <td>{stock.priceChangePercent.toFixed(2)}</td>
                <td>
                  <button onClick={() => startEdit(stock)} style={{ marginRight: 4 }}>
                    編集
                  </button>
                  <button onClick={() => deleteStock(stock.symbol)}>削除</button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {/* 総資産・配当サマリー */}
      <SummaryCard stocks={stocks} />

      {/* 月別配当グラフ */}
      <MonthlyDividendChart stocks={stocks} />

      {/* 配当推移グラフ */}
      <DividendTrendChart stocks={stocks} />
    </div>
  );
}

// ----------- 総資産・配当サマリーコンポーネント -----------
function SummaryCard({ stocks }) {
  const totalValue = stocks.reduce((acc, s) => acc + s.currentPrice * s.shares, 0);
  const totalDividends = stocks.reduce((acc, s) => acc + s.dividendRate * s.shares, 0);

  return (
    <div style={{ marginBottom: 24, padding: 12, border: '1px solid #aaa', borderRadius: 8, backgroundColor: '#e3f2fd' }}>
      <h3>総資産・配当サマリー</h3>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <div>
          <strong>総資産評価額</strong>
          <div style={{ fontSize: '1.5rem', color: '#1565c0' }}>{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} 円</div>
        </div>
        <div>
          <strong>年間配当予想</strong>
          <div style={{ fontSize: '1.5rem', color: '#2e7d32' }}>{totalDividends.toFixed(2)} 円</div>
        </div>
      </div>
    </div>
  );
}

// ----------- 月別配当グラフコンポーネント（簡易） -----------
function MonthlyDividendChart({ stocks }) {
  // 簡単に今月だけ年間配当÷12として表示するだけに留める
  if (stocks.length === 0) return null;

  // 月別配当配列（12ヶ月分に均等割り）
  const monthlyDividends = Array(12).fill(0);
  stocks.forEach((s) => {
    const monthly = (s.dividendRate * s.shares) / 12;
    for (let i = 0; i < 12; i++) monthlyDividends[i] += monthly;
  });

  return (
    <div style={{ marginBottom: 24, padding: 12, border: '1px solid #aaa', borderRadius: 8, backgroundColor: '#fff3e0' }}>
      <h3>月別配当（年間配当を均等割り）</h3>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {monthlyDividends.map((val, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>{i + 1}月</div>
            <div>{val.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------- 配当推移グラフコンポーネント（簡易） -----------
function DividendTrendChart({ stocks }) {
  // 過去数年分の推移などの本格的なグラフは難しいので、配当率の平均値を年毎にプロットする簡易版として実装可能

  if (stocks.length === 0) return null;

  // 仮に3年分を現在配当利回りで固定としてプロット
  const years = [2023, 2024, 2025];
  const avgDividendYield =
    stocks.reduce((acc, s) => acc + (s.dividendYield || 0), 0) / stocks.length;

  return (
    <div style={{ marginBottom: 24, padding: 12, border: '1px solid #aaa', borderRadius: 8, backgroundColor: '#e8f5e9' }}>
      <h3>配当推移（仮・平均配当利回り）</h3>
      <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>年</th>
            {years.map((y) => (
              <th key={y}>{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>平均配当利回り(%)</td>
            {years.map((y) => (
              <td key={y}>{(avgDividendYield * 100).toFixed(2)}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
