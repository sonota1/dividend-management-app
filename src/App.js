import React, { useState } from 'react';
import { Sparklines, SparklinesLine } from 'react-sparklines';

const stockNames = ['トヨタ', 'ソニー', '任天堂', '楽天', '日産', 'ホンダ'];

// 仮の配当推移データ（銘柄ごとに用意）
const dividendHistory = {
  トヨタ: [2, 2.5, 3, 3.5, 4, 4.5, 5],
  ソニー: [1, 1.5, 2, 2.5, 3, 3.5, 4],
  任天堂: [3, 3.5, 4, 4.5, 5, 5.5, 6],
  楽天: [0.5, 0.6, 0.8, 1, 1.2, 1.5, 1.8],
  日産: [1, 1.1, 1.3, 1.4, 1.6, 1.8, 2],
  ホンダ: [1.5, 1.7, 1.9, 2, 2.2, 2.4, 2.5],
};

export default function StockAutocompleteWithSparkline() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);

  const onChange = (e) => {
    const val = e.target.value;
    setInput(val);

    if (val.length === 0) {
      setSuggestions([]);
      setSelectedStock(null);
      return;
    }

    const filtered = stockNames.filter(name =>
      name.toLowerCase().includes(val.toLowerCase())
    );
    setSuggestions(filtered);
  };

  const onSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setSuggestions([]);
    setSelectedStock(suggestion);
  };

  return (
    <div style={{ maxWidth: 400, margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h2>銘柄自動補完フォーム＋配当推移スパークライン</h2>

      <input
        style={{ width: '100%', padding: '8px', fontSize: '16px', boxSizing: 'border-box' }}
        value={input}
        onChange={onChange}
        placeholder="銘柄名を入力"
      />

      <ul
        style={{
          border: suggestions.length ? '1px solid #ccc' : 'none',
          padding: 0,
          marginTop: 0,
          maxHeight: 150,
          overflowY: 'auto',
          backgroundColor: '#fff',
          listStyle: 'none',
        }}
      >
        {suggestions.map((s) => (
          <li
            key={s}
            style={{
              padding: '8px',
              cursor: 'pointer',
              borderBottom: '1px solid #eee',
            }}
            onClick={() => onSuggestionClick(s)}
          >
            {s}
          </li>
        ))}
      </ul>

      {selectedStock && (
        <div style={{ marginTop: 20 }}>
          <h3>{selectedStock} の配当推移</h3>
          <Sparklines data={dividendHistory[selectedStock]} width={300} height={50} margin={5}>
            <SparklinesLine color="teal" />
          </Sparklines>
        </div>
      )}
    </div>
  );
}
