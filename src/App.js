import React, { useState, useEffect } from 'react';
import { BarChart, LineChart, XAxis, YAxis, Tooltip, Line, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Plus, 
  Save, 
  X, 
  RefreshCw, 
  Bell, 
  Download, 
  BarChart3, 
  Wallet, 
  AlertCircle 
} from 'lucide-react';

const DividendApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const [stocks, setStocks] = useState([
    {
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 100,
      averagePrice: 150,
      currentPrice: 185.50,
      dividendYield: 0.45,
      country: 'US',
      sector: 'Technology',
      nextDividendDate: '2024-08-15',
      estimatedDividend: 0.25
    },
    {
      id: '2',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 50,
      averagePrice: 300,
      currentPrice: 365.20,
      dividendYield: 0.75,
      country: 'US',
      sector: 'Technology',
      nextDividendDate: '2024-09-12',
      estimatedDividend: 0.75
    },
    {
      id: '3',
      symbol: 'JNJ',
      name: 'Johnson & Johnson',
      shares: 30,
      averagePrice: 160,
      currentPrice: 158.40,
      dividendYield: 3.1,
      country: 'US',
      sector: 'Healthcare',
      nextDividendDate: '2024-08-28',
      estimatedDividend: 1.19
    }
  ]);

  const [dividendRecords, setDividendRecords] = useState([
    { id: '1', stockId: '1', symbol: 'AAPL', amount: 25, paymentDate: '2024-02-15', taxWithheld: 0, country: 'US' },
    { id: '2', stockId: '2', symbol: 'MSFT', amount: 37.5, paymentDate: '2024-03-12', taxWithheld: 0, country: 'US' },
    { id: '3', stockId: '3', symbol: 'JNJ', amount: 35.7, paymentDate: '2024-03-28', taxWithheld: 0, country: 'US' }
  ]);

  const [newStock, setNewStock] = useState({
    symbol: '', 
    name: '', 
    shares: '', 
    averagePrice: '', 
    country: 'US', 
    sector: 'Technology'
  });

  // 計算関数
  const calculateTotalValue = () => {
    return stocks.reduce((total, stock) => {
      return total + (stock.shares * stock.currentPrice * (stock.country === 'US' ? 150 : 1));
    }, 0);
  };

  const calculateTotalGainLoss = () => {
    return stocks.reduce((total, stock) => {
      const gainLoss = (stock.currentPrice - stock.averagePrice) * stock.shares * (stock.country === 'US' ? 150 : 1);
      return total + gainLoss;
    }, 0);
  };

  const calculateTotalDividends = () => {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    return dividendRecords
      .filter(record => new Date(record.paymentDate) >= twelveMonthsAgo)
      .reduce((total, record) => {
        return total + (record.amount * (record.country === 'US' ? 150 : 1));
      }, 0);
  };

  const calculateAnnualDividend = () => {
    return stocks.reduce((total, stock) => {
      const annualDividend = stock.shares * stock.estimatedDividend * 4 * (stock.country === 'US' ? 150 : 1);
      return total + annualDividend;
    }, 0);
  };

  // 株価更新機能
  const updateStockPrices = async () => {
    setIsLoading(true);
    // モック価格更新
    setTimeout(() => {
      const updatedStocks = stocks.map(stock => ({
        ...stock,
        currentPrice: Number((stock.currentPrice + (Math.random() - 0.5) * 2).toFixed(2))
      }));
      setStocks(updatedStocks);
      setLastUpdate(new Date());
      setIsLoading(false);
    }, 1000);
  };

  // CSV出力
  const exportToCSV = () => {
    const headers = ['Symbol', 'Name', 'Shares', 'Average Price', 'Current Price', 'Market Value'];
    const csvData = stocks.map(stock => [
      stock.symbol,
      stock.name,
      stock.shares,
      stock.averagePrice,
      stock.currentPrice,
      stock.shares * stock.currentPrice * (stock.country === 'US' ? 150 : 1)
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio.csv';
    link.click();
  };

  // 銘柄追加
  const addStock = () => {
    if (!newStock.symbol || !newStock.shares || !newStock.averagePrice) return;
    
    const stock = {
      id: Date.now().toString(),
      symbol: newStock.symbol.toUpperCase(),
      name: newStock.name || newStock.symbol,
      shares: parseInt(newStock.shares),
      averagePrice: parseFloat(newStock.averagePrice),
      currentPrice: parseFloat(newStock.averagePrice),
      dividendYield: 2.0,
      country: newStock.country,
      sector: newStock.sector,
      nextDividendDate: '2024-09-15',
      estimatedDividend: 1.0
    };
    
    setStocks([...stocks, stock]);
    setNewStock({ symbol: '', name: '', shares: '', averagePrice: '', country: 'US', sector: 'Technology' });
    setShowAddModal(false);
  };

  const renderDashboard = () => (
    <div className="p-4 space-y-6">
      {/* 4つのカラフルなカード */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">総資産</p>
              <p className="text-xl font-bold">¥{calculateTotalValue().toLocaleString()}</p>
            </div>
            <Wallet className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">損益</p>
              <p className="text-xl font-bold">¥{calculateTotalGainLoss().toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">年間配当予想</p>
              <p className="text-xl font-bold">¥{calculateAnnualDividend().toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">過去12ヶ月配当</p>
              <p className="text-xl font-bold">¥{calculateTotalDividends().toLocaleString()}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* 更新情報 */}
      <div className="bg-white rounded-lg p-3 shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isLoading ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-sm text-gray-600">
              最終更新: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={updateStockPrices}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex-1 bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          銘柄追加
        </button>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-green-700"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* 保有銘柄一覧 */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">保有銘柄</h3>
        <div className="space-y-3">
          {stocks.map((stock) => {
            const marketValue = stock.shares * stock.currentPrice * (stock.country === 'US' ? 150 : 1);
            const gainLoss = (stock.currentPrice - stock.averagePrice) * stock.shares * (stock.country === 'US' ? 150 : 1);
            const gainLossPercent = ((stock.currentPrice - stock.averagePrice) / stock.averagePrice * 100);
            
            return (
              <div key={stock.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{stock.symbol}</span>
                      <span className={`px-2 py-1 text-xs rounded ${stock.country === 'US' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {stock.country}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${stock.currentPrice}</p>
                    <p className={`text-sm ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gainLoss >= 0 ? '+' : ''}¥{gainLoss.toLocaleString()} ({gainLossPercent.toFixed(1)}%)
                    </p>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{stock.shares}株 × 平均¥{(stock.averagePrice * (stock.country === 'US' ? 150 : 1)).toLocaleString()}</span>
                  <span>評価額: ¥{marketValue.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">ポートフォリオ管理</h2>
      <div className="bg-white rounded-lg p-6 shadow-sm border text-center text-gray-500">
        ポートフォリオ分析機能は開発中です
      </div>
    </div>
  );

  const renderDividendManagement = () => (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">配当管理</h2>
      
      {/* 配当履歴 */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">配当履歴</h3>
        <div className="space-y-2">
          {dividendRecords.map((record) => (
            <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{record.symbol}</p>
                <p className="text-sm text-gray-600">{record.paymentDate}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">
                  ¥{(record.amount * (record.country === 'US' ? 150 : 1)).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold flex items-center">
        <Bell className="h-6 w-6 mr-2" />
        通知・アラート
      </h2>
      <div className="bg-white rounded-lg p-6 shadow-sm border text-center text-gray-500">
        現在通知はありません
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-800">配当管理アプリ</h1>
          {isLoading && (
            <div className="flex items-center text-sm text-blue-600 mt-1">
              <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              データ更新中...
            </div>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 pb-20">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'portfolio' && renderPortfolio()}
        {activeTab === 'dividend' && renderDividendManagement()}
        {activeTab === 'notifications' && renderNotifications()}
      </div>

      {/* 銘柄追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">新規銘柄追加</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">銘柄コード *</label>
                <input
                  type="text"
                  value={newStock.symbol}
                  onChange={(e) => setNewStock({...newStock, symbol: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="AAPL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">銘柄名</label>
                <input
                  type="text"
                  value={newStock.name}
                  onChange={(e) => setNewStock({...newStock, name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Apple Inc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">保有株数 *</label>
                <input
                  type="number"
                  value={newStock.shares}
                  onChange={(e) => setNewStock({...newStock, shares: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">平均取得価格 *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newStock.averagePrice}
                  onChange={(e) => setNewStock({...newStock, averagePrice: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="150.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">市場</label>
                <select
                  value={newStock.country}
                  onChange={(e) => setNewStock({...newStock, country: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="US">米国株</option>
                  <option value="JP">日本株</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">セクター</label>
                <select
                  value={newStock.sector}
                  onChange={(e) => setNewStock({...newStock, sector: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="Technology">テクノロジー</option>
                  <option value="Healthcare">ヘルスケア</option>
                  <option value="Finance">金融</option>
                  <option value="Consumer">消費財</option>
                  <option value="Energy">エネルギー</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={addStock}
                className="flex-1 bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center"
              >
                <Save className="h-4 w-4 mr-1" />
                追加
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 p-2 rounded-lg"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ボトムナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 p-3 text-center ${
              activeTab === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <DollarSign className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">ダッシュボード</span>
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 p-3 text-center ${
              activeTab === 'portfolio' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <Target className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">ポートフォリオ</span>
          </button>
          <button
            onClick={() => setActiveTab('dividend')}
            className={`flex-1 p-3 text-center ${
              activeTab === 'dividend' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <Calendar className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">配当管理</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 p-3 text-center ${
              activeTab === 'notifications' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <Bell className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">通知</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DividendApp;
