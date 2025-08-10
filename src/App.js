import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TAGS = ['NISA', '特定', '一般'];

function AddStockForm({ onAdd }) {
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!symbol || !shares || !purchasePrice) {
      setError('すべての項目を入力してください');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/quote/${symbol}`);
      if (!res.ok) throw new Error('銘柄情報取得失敗');
      const data = await res.json();

      // 簡易セクター推定
      const sector = data.shortName.includes('Tech') ? '情報技術' : 'その他';

      onAdd({
        symbol,
        companyName: data.shortName,
        shares: Number(shares),
        purchasePrice: Number(purchasePrice),
        sector,
        tag: 'NISA',
        currentPrice: data.regularMarketPrice,
        dividendYield: data.dividendYield || 0,
        dividendRate: data.dividendRate || 0,
      });

      setSymbol('');
      setShares('');
      setPurchasePrice('');
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <input
        placeholder="銘柄コード"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
      />
      <input
        placeholder="保有株数"
        value={shares}
        onChange={(e) => setShares(e.target.value)}
        type="number"
      />
      <input
        placeholder="取得価格"
        value={purchasePrice}
        onChange={(e) => setPurchasePrice(e.target.value)}
        type="number"
      />
      <button onClick={handleAdd}>追加</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}

function StockTable({ stocks, onDelete }) {
  return (
    <table border="1" cellPadding="5" style={{ width: '100%', marginBottom: 20 }}>
      <thead>
        <tr>
          <th>銘柄コード</th>
          <th>会社名</th>
          <th>保有株数</th>
          <th>取得価格</th>
          <th>現在価格</th>
          <th>配当利回り</th>
          <th>タグ</th>
          <th>セクター</th>
          <th>削除</th>
        </tr>
      </thead>
      <tbody>
        {stocks.map((stock, idx) => (
          <tr key={idx}>
            <td>{stock.symbol}</td>
            <td>{stock.companyName}</td>
            <td>{stock.shares}</td>
            <td>{stock.purchasePrice}</td>
            <td>{stock.currentPrice}</td>
            <td>{(stock.dividendYield * 100).toFixed(2)}%</td>
            <td>{stock.tag}</td>
            <td>{stock.sector}</td>
            <td>
              <button onClick={() => onDelete(stock.symbol)}>削除</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// --- 総資産・損益サマリーコンポーネント ---
function SummaryCard({ stocks }) {
  const totalAssets = stocks.reduce(
    (sum, s) => sum + s.currentPrice * s.shares,
    0
  );
  const totalCost = stocks.reduce(
    (sum, s) => sum + s.purchasePrice * s.shares,
    0
  );
  const profitLoss = totalAssets - totalCost;
  const profitLossPercent = totalCost ? (profitLoss / totalCost) * 100 : 0;

  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: 15,
        marginBottom: 20,
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-around',
        backgroundColor: '#f9f9f9',
      }}
    >
      <div>
        <strong>総資産:</strong>
        <div>{totalAssets.toLocaleString()} 円</div>
      </div>
      <div>
        <strong>損益:</strong>
        <div
          style={{ color: profitLoss >= 0 ? 'green' : 'red' }}
        >
          {profitLoss.toLocaleString()} 円 ({profitLossPercent.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
}

// --- 配当推移グラフ（簡易版）---
// 月ごとの配当を合計したデータを作成（固定過去12ヶ月と仮定）
function DividendChart({ stocks }) {
  // 簡単に毎月配当額を計算（月間配当 = 年間配当率 * 現在価格 * 保有株数 / 12）
  // 実際は配当月に基づく詳細管理が必要

  // 過去12ヶ月の配当推移用ダミーデータ作成
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return `${d.getFullYear()}/${d.getMonth() + 1}`;
  });

  const data = months.map((m) => {
    let monthlyDiv = 0;
    stocks.forEach((s) => {
      const annualDiv = s.dividendYield * s.currentPrice * s.shares || 0;
      monthlyDiv += annualDiv / 12;
    });
    return { month: m, dividend: Number(monthlyDiv.toFixed(0)) };
  });

  return (
    <div style={{ width: '100%', height: 250 }}>
      <h3>月別配当推移（概算）</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `${value.toLocaleString()} 円`} />
          <Line
            type="monotone"
            dataKey="dividend"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function App() {
  const [stocks, setStocks] = useState([]);

  const deleteStock = (symbol) => {
    setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
  };

  return (
    <div
      style={{ maxWidth: 900, margin: 'auto', padding: 20, fontFamily: 'sans-serif' }}
    >
      <h1>配当管理アプリ</h1>
      <AddStockForm onAdd={(stock) => setStocks((prev) => [...prev, stock])} />
      <SummaryCard stocks={stocks} />
      <StockTable stocks={stocks} onDelete={deleteStock} />
      <DividendChart stocks={stocks} />
    </div>
  );
}
