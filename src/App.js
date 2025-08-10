import React, { useState, useEffect } from 'react';
import { Sparklines, SparklinesLine } from 'react-sparklines';

// ----- ダミーデータ -----
const stockNames = ['トヨタ', 'ソニー', '任天堂', '楽天', '日産', 'ホンダ'];

const dividendHistory = {
  トヨタ: [2, 2.5, 3, 3.5, 4, 4.5, 5],
  ソニー: [1, 1.5, 2, 2.5, 3, 3.5, 4],
  任天堂: [3, 3.5, 4, 4.5, 5, 5.5, 6],
  楽天: [0.5, 0.6, 0.8, 1, 1.2, 1.5, 1.8],
  日産: [1, 1.1, 1.3, 1.4, 1.6, 1.8, 2],
  ホンダ: [1.5, 1.7, 1.9, 2, 2.2, 2.4, 2.5],
};

const sectorOptions = ['自動車', 'IT', '金融', '製造', 'サービス'];
const riskOptions = ['低', '中', '高'];
const dividendTypeOptions = ['普通配当', '特別配当'];

export default function StockManagementApp() {
  // 銘柄一覧
  const [stocks, setStocks] = useState([
    { id: 1, name: 'トヨタ', sector: '自動車', risk: '中', dividendType: '普通配当', dividendYield: 3.5, shares: 100, priceChange: 2 },
    { id: 2, name: 'ソニー', sector: 'IT', risk: '高', dividendType: '普通配当', dividendYield: 1.8, shares: 50, priceChange: 5 },
    { id: 3, name: '任天堂', sector: 'IT', risk: '中', dividendType: '特別配当', dividendYield: 2.0, shares: 70, priceChange: -1 },
  ]);

  // フィルター状態
  const [filters, setFilters] = useState({
    sector: '',
    risk: '',
    dividendType: '',
  });

  // 並べ替え
  const [sortKey, setSortKey] = useState('nameAsc');

  // 銘柄自動補完入力
  const [autocompleteInput, setAutocompleteInput] = useState('');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);

  // 編集フォーム用
  const [editStock, setEditStock] = useState(null);

  // フィルター変更時
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 並べ替え変更時
  const handleSortChange = (e) => {
    setSortKey(e.target.value);
  };

  // フィルターと並べ替えをかけた銘柄リスト作成
  const filteredStocks = stocks
    .filter(s => (filters.sector ? s.sector === filters.sector : true))
    .filter(s => (filters.risk ? s.risk === filters.risk : true))
    .filter(s => (filters.dividendType ? s.dividendType === filters.dividendType : true));

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    switch (sortKey) {
      case 'nameAsc': return a.name.localeCompare(b.name);
      case 'nameDesc': return b.name.localeCompare(a.name);
      case 'yieldDesc': return b.dividendYield - a.dividendYield;
      case 'sharesDesc': return b.shares - a.shares;
      case 'priceChangeDesc': return b.priceChange - a.priceChange;
      default: return 0;
    }
  });

  // 銘柄追加
  const addStock = (stock) => {
    setStocks(prev => [...prev, { ...stock, id: Date.now() }]);
  };

  // 銘柄削除
  const deleteStock = (id) => {
    setStocks(prev => prev.filter(s => s.id !== id));
    if(editStock && editStock.id === id) setEditStock(null);
  };

  // 銘柄更新
  const updateStock = (updated) => {
    setStocks(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    setEditStock(null);
  };

  // 銘柄自動補完候補更新
  const onAutocompleteChange = (val) => {
    setAutocompleteInput(val);
    if (!val) {
      setAutocompleteSuggestions([]);
      return;
    }
    const filtered = stockNames.filter(n => n.includes(val));
    setAutocompleteSuggestions(filtered);
  };

  // 自動補完候補クリック
  const onAutocompleteSelect = (name) => {
    setAutocompleteInput(name);
    setAutocompleteSuggestions([]);
  };

  // 新規銘柄フォームの入力状態
  const [newStock, setNewStock] = useState({
    name: '',
    sector: '',
    risk: '',
    dividendType: '',
    dividendYield: '',
    shares: '',
    priceChange: '',
  });

  // 新規銘柄入力変更
  const onNewStockChange = (key, value) => {
    setNewStock(prev => ({ ...prev, [key]: value }));
  };

  // 新規銘柄追加 submit
  const onAddStockSubmit = (e) => {
    e.preventDefault();
    if (!newStock.name) {
      alert('銘柄名を入力してください');
      return;
    }
    addStock({
      name: newStock.name,
      sector: newStock.sector,
      risk: newStock.risk,
      dividendType: newStock.dividendType,
      dividendYield: parseFloat(newStock.dividendYield) || 0,
      shares: parseInt(newStock.shares) || 0,
      priceChange: parseFloat(newStock.priceChange) || 0,
    });
    setNewStock({
      name: '',
      sector: '',
      risk: '',
      dividendType: '',
      dividendYield: '',
      shares: '',
      priceChange: '',
    });
  };

  // 編集フォーム入力変更
  const onEditStockChange = (key, value) => {
    setEditStock(prev => ({ ...prev, [key]: value }));
  };

  // 編集フォーム submit
  const onEditStockSubmit = (e) => {
    e.preventDefault();
    updateStock(editStock);
  };

  return (
    <div style={{ maxWidth: 900, margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h1>銘柄管理アプリ</h1>

      {/* 自動補完入力 */}
      <div style={{ marginBottom: 20 }}>
        <label>
          銘柄自動補完: 
          <input
            value={autocompleteInput}
            onChange={e => onAutocompleteChange(e.target.value)}
            style={{ marginLeft: 8, padding: 4, fontSize: 16 }}
            placeholder="銘柄名を入力"
          />
        </label>
        <ul style={{ border: autocompleteSuggestions.length ? '1px solid #ccc' : 'none', maxHeight: 120, overflowY: 'auto', marginTop: 4, paddingLeft: 0, listStyle: 'none', backgroundColor: 'white' }}>
          {autocompleteSuggestions.map(s => (
            <li
              key={s}
              onClick={() => onAutocompleteSelect(s)}
              style={{ padding: 6, cursor: 'pointer', borderBottom: '1px solid #eee' }}
            >
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* フィルター */}
      <fieldset style={{ marginBottom: 20 }}>
        <legend>タグでフィルター</legend>
        <label>
          セクター: 
          <select value={filters.sector} onChange={e => handleFilterChange('sector', e.target.value)} style={{ marginLeft: 6 }}>
            <option value="">全て</option>
            {sectorOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label style={{ marginLeft: 20 }}>
          リスク: 
          <select value={filters.risk} onChange={e => handleFilterChange('risk', e.target.value)} style={{ marginLeft: 6 }}>
            <option value="">全て</option>
            {riskOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label style={{ marginLeft: 20 }}>
          配当タイプ: 
          <select value={filters.dividendType} onChange={e => handleFilterChange('dividendType', e.target.value)} style={{ marginLeft: 6 }}>
            <option value="">全て</option>
            {dividendTypeOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </fieldset>

      {/* 並べ替え */}
      <fieldset style={{ marginBottom: 20 }}>
        <legend>並べ替え</legend>
        <select value={sortKey} onChange={handleSortChange}>
          <option value="nameAsc">銘柄名昇順</option>
          <option value="nameDesc">銘柄名降順</option>
          <option value="yieldDesc">配当利回り順</option>
          <option value="sharesDesc">保有株数順</option>
          <option value="priceChangeDesc">値上がり率順</option>
        </select>
      </fieldset>

      {/* 銘柄一覧 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>銘柄名</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>セクター</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>リスク</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>配当タイプ</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>配当利回り(%)</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>保有株数</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>値上がり率(%)</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>配当推移</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {sortedStocks.map(stock => (
            <tr key={stock.id}>
              <td style={{ padding: 8 }}>{stock.name}</td>
              <td style={{ padding: 8 }}>{stock.sector}</td>
              <td style={{ padding: 8 }}>{stock.risk}</td>
              <td style={{ padding: 8 }}>{stock.dividendType}</td>
              <td style={{ padding: 8 }}>{stock.dividendYield.toFixed(2)}</td>
              <td style={{ padding: 8 }}>{stock.shares}</td>
              <td style={{ padding: 8 }}>{stock.priceChange.toFixed(2)}</td>
              <td style={{ padding: 8, width: 120 }}>
                <Sparklines data={dividendHistory[stock.name] || []} width={100} height={30} margin={4}>
                  <SparklinesLine color="teal" />
                </Sparklines>
              </td>
              <td style={{ padding: 8 }}>
                <button onClick={() => setEditStock(stock)} style={{ marginRight: 8 }}>編集</button>
                <button onClick={() => deleteStock(stock.id)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 新規銘柄追加フォーム */}
      <form onSubmit={onAddStockSubmit} style={{ borderTop: '1px solid #ccc', paddingTop: 20 }}>
        <h2>銘柄追加</h2>
        <div style={{ marginBottom: 10 }}>
          <input
            placeholder="銘柄名"
            value={newStock.name}
            onChange={e => onNewStockChange('name', e.target.value)}
            style={{ marginRight: 8 }}
          />
          <select value={newStock.sector} onChange={e => onNewStockChange('sector', e.target.value)} style={{ marginRight: 8 }}>
            <option value="">セクター</option>
            {sectorOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={newStock.risk} onChange={e => onNewStockChange('risk', e.target.value)} style={{ marginRight: 8 }}>
            <option value="">リスク</option>
            {riskOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={newStock.dividendType} onChange={e => onNewStockChange('dividendType', e.target.value)} style={{ marginRight: 8 }}>
            <option value="">配当タイプ</option>
            {dividendTypeOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 10 }}>
          <input
            type="number"
            step="0.01"
            placeholder="配当利回り(%)"
            value={newStock.dividendYield}
            onChange={e => onNewStockChange('dividendYield', e.target.value)}
            style={{ marginRight: 8, width: 140 }}
          />
          <input
            type="number"
            placeholder="保有株数"
            value={newStock.shares}
            onChange={e => onNewStockChange('shares', e.target.value)}
            style={{ marginRight: 8, width: 120 }}
          />
          <input
            type="number"
            step="0.01"
            placeholder="値上がり率(%)"
            value={newStock.priceChange}
            onChange={e => onNewStockChange('priceChange', e.target.value)}
            style={{ width: 140 }}
          />
        </div>
        <button type="submit">追加</button>
      </form>

      {/* 編集フォーム（モーダル的に） */}
      {editStock && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <form
            onSubmit={onEditStockSubmit}
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 8,
              width: 400,
              boxSizing: 'border-box',
            }}
          >
            <h2>銘柄編集</h2>
            <div style={{ marginBottom: 10 }}>
              <input
                value={editStock.name}
                onChange={e => onEditStockChange('name', e.target.value)}
                placeholder="銘柄名"
                style={{ marginRight: 8 }}
                disabled
              />
              <select
                value={editStock.sector}
                onChange={e => onEditStockChange('sector', e.target.value)}
                style={{ marginRight: 8 }}
              >
                {sectorOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={editStock.risk}
                onChange={e => onEditStockChange('risk', e.target.value)}
                style={{ marginRight: 8 }}
              >
                {riskOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <select
                value={editStock.dividendType}
                onChange={e => onEditStockChange('dividendType', e.target.value)}
                style={{ marginRight: 8 }}
              >
                {dividendTypeOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                type="number"
                step="0.01"
                value={editStock.dividendYield}
                onChange={e => onEditStockChange('dividendYield', e.target.value)}
                style={{ marginRight: 8, width: 140 }}
                placeholder="配当利回り(%)"
              />
              <input
                type="number"
                value={editStock.shares}
                onChange={e => onEditStockChange('shares', e.target.value)}
                style={{ marginRight: 8, width: 120 }}
                placeholder="保有株数"
              />
              <input
                type="number"
                step="0.01"
                value={editStock.priceChange}
                onChange={e => onEditStockChange('priceChange', e.target.value)}
                style={{ width: 140 }}
                placeholder="値上がり率(%)"
              />
            </div>
            <div style={{ textAlign: 'right' }}>
              <button type="button" onClick={() => setEditStock(null)} style={{ marginRight: 8 }}>
                キャンセル
              </button>
              <button type="submit">更新</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

