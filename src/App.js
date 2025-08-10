import React, { useState } from 'react';

export default function PortfolioApp() {
  const [stocks, setStocks] = useState([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [formStock, setFormStock] = useState({
    symbol: '',
    name: '',
    shares: '',
    averagePrice: '',
    country: 'US',
    sector: 'Technology'
  });
  const [editStock, setEditStock] = useState(null);

  // 新規追加モーダル
  const openAddStockModal = () => {
    setEditStock(null);
    setFormStock({
      symbol: '',
      name: '',
      shares: '',
      averagePrice: '',
      country: 'US',
      sector: 'Technology'
    });
    setShowStockModal(true);
  };

  // 編集モーダル
  const openEditStockModal = (stock) => {
    setEditStock(stock);
    setFormStock(stock);
    setShowStockModal(true);
  };

  // 保存処理
  const saveStock = () => {
    if (editStock) {
      setStocks(stocks.map(s => (s.id === editStock.id ? { ...formStock, id: editStock.id } : s)));
    } else {
      setStocks([...stocks, { ...formStock, id: Date.now() }]);
    }
    setShowStockModal(false);
  };

  // 削除処理
  const deleteStock = (id) => {
    if (window.confirm('この銘柄を削除しますか？')) {
      setStocks(stocks.filter(s => s.id !== id));
    }
  };

  // モーダルUI
  const StockModal = () => {
    if (!showStockModal) return null;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white', padding: 20, borderRadius: 12, width: '90%', maxWidth: 400,
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)', animation: 'fadeIn 0.2s ease-out'
        }}>
          <h3 style={{ marginBottom: 15, textAlign: 'center' }}>
            {editStock ? '📄 銘柄編集' : '➕ 銘柄追加'}
          </h3>
          {['symbol','name','shares','averagePrice'].map(field => (
            <input
              key={field}
              type={['shares','averagePrice'].includes(field) ? 'number' : 'text'}
              placeholder={
                field === 'symbol' ? '銘柄コード' :
                field === 'name' ? '会社名' :
                field === 'shares' ? '株数' : '平均取得価格'
              }
              value={formStock[field]}
              onChange={e => setFormStock({ ...formStock, [field]: e.target.value })}
              style={{
                width: '100%', padding: '10px', marginBottom: '10px',
                border: '1px solid #ccc', borderRadius: '8px'
              }}
            />
          ))}
          <select
            value={formStock.country}
            onChange={e => setFormStock({ ...formStock, country: e.target.value })}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          >
            <option value="US">米国</option>
            <option value="JP">日本</option>
          </select>
          <select
            value={formStock.sector}
            onChange={e => setFormStock({ ...formStock, sector: e.target.value })}
            style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ccc' }}
          >
            <option value="Technology">テクノロジー</option>
            <option value="Healthcare">ヘルスケア</option>
            <option value="Finance">金融</option>
          </select>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={saveStock}
              style={{ flex: 1, padding: '10px', backgroundColor: '#4caf50', color: 'white', borderRadius: '8px', border: 'none' }}
            >
              保存
            </button>
            <button
              onClick={() => setShowStockModal(false)}
              style={{ flex: 1, padding: '10px', backgroundColor: '#999', color: 'white', borderRadius: '8px', border: 'none' }}
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    );
  };

  // リスト表示
  const renderPortfolio = () => (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <h2 style={{ marginBottom: 10 }}>📊 ポートフォリオ</h2>
      <button
        onClick={openAddStockModal}
        style={{ marginBottom: 15, padding: '10px 15px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '8px' }}
      >
        ＋ 銘柄追加
      </button>
      {stocks.map(stock => (
        <div
          key={stock.id}
          style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '12px 15px',
            marginBottom: 12
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{stock.symbol} - {stock.name}</div>
          <div style={{ color: '#555', fontSize: '14px' }}>{stock.shares}株 @ {stock.averagePrice}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button
              onClick={() => openEditStockModal(stock)}
              style={{ flex: 1, padding: '8px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '6px' }}
            >
              編集
            </button>
            <button
              onClick={() => deleteStock(stock.id)}
              style={{ flex: 1, padding: '8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px' }}
            >
              削除
            </button>
          </div>
        </div>
      ))}
      <StockModal />
    </div>
  );

  return renderPortfolio();
}
