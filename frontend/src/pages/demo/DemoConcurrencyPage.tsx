import React, { useState } from 'react';

const API_URL = 'http://localhost:3000/api/demo';

export default function DemoConcurrencyPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const callApi = async (endpoint: string, method: string = 'POST', id: string) => {
    setIsLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`SUCCESS (${id}): ${JSON.stringify(data)}`);
      } else {
        addLog(`ERROR (${id}): ${data.error || JSON.stringify(data)}`);
      }
    } catch (err: any) {
      addLog(`FAILED (${id}): ${err.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const resetData = async () => {
    setIsLoading(prev => ({ ...prev, 'reset': true }));
    try {
      const res = await fetch(`${API_URL}/reset`, { method: 'POST' });
      if (res.ok) addLog('Reset dữ liệu thành công');
    } finally {
      setIsLoading(prev => ({ ...prev, 'reset': false }));
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Trang Demo Lỗi Tương Tranh (Concurrency)</h1>
        <button 
          onClick={resetData}
          disabled={isLoading['reset']}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading['reset'] ? 'Đang reset...' : 'Reset Dữ Liệu Ban Đầu'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Lost Update */}
        <div className="border rounded-lg p-6 bg-white shadow">
          <h2 className="text-xl font-bold text-red-600 mb-2">1. Lost Update (Cập nhật mất mát)</h2>
          <p className="text-gray-600 mb-4 text-sm">Kho thuốc đang có 50. Bác sĩ A lấy 10, Bác sĩ B lấy 15. Kết quả bị đè thành 35 (hoặc 40) thay vì 25.</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => callApi('/lost-update/a', 'POST', 'LostUpdate_A')}
              disabled={isLoading['LostUpdate_A']}
              className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading['LostUpdate_A'] ? 'Đang chạy (5s)...' : 'Bác sĩ A (-10ml)'}
            </button>
            <button 
              onClick={() => callApi('/lost-update/b', 'POST', 'LostUpdate_B')}
              disabled={isLoading['LostUpdate_B']}
              className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading['LostUpdate_B'] ? 'Đang chạy...' : 'Bác sĩ B (-15ml)'}
            </button>
          </div>
        </div>

        {/* 2. Dirty Read */}
        <div className="border rounded-lg p-6 bg-white shadow">
          <h2 className="text-xl font-bold text-yellow-600 mb-2">2. Dirty Read (Đọc dữ liệu rác)</h2>
          <p className="text-gray-600 mb-4 text-sm">Quản lý tăng giá thành 250k rồi Rollback. Cùng lúc, Thu ngân in hóa đơn đọc nhầm giá chưa commit.</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => callApi('/dirty-read/update', 'POST', 'DirtyRead_Update')}
              disabled={isLoading['DirtyRead_Update']}
              className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {isLoading['DirtyRead_Update'] ? 'Đang sửa (5s)...' : 'Quản lý (Đổi giá)'}
            </button>
            <button 
              onClick={() => callApi('/dirty-read/select', 'GET', 'DirtyRead_Select')}
              disabled={isLoading['DirtyRead_Select']}
              className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {isLoading['DirtyRead_Select'] ? 'Đang in...' : 'Thu ngân (In Hóa Đơn)'}
            </button>
          </div>
        </div>

        {/* 3. Unrepeatable Read */}
        <div className="border rounded-lg p-6 bg-white shadow">
          <h2 className="text-xl font-bold text-blue-600 mb-2">3. Unrepeatable Read (Đọc không lặp lại)</h2>
          <p className="text-gray-600 mb-4 text-sm">Thu ngân xem giá tạm tính. Sau đó quản lý đổi giá thành công. Hóa đơn chốt bị đổi giá.</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => callApi('/unrepeatable-read/select', 'GET', 'Unrepeatable_Select')}
              disabled={isLoading['Unrepeatable_Select']}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading['Unrepeatable_Select'] ? 'Đang xem (5s)...' : 'Thu ngân (Xem & In)'}
            </button>
            <button 
              onClick={() => callApi('/unrepeatable-read/update', 'POST', 'Unrepeatable_Update')}
              disabled={isLoading['Unrepeatable_Update']}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading['Unrepeatable_Update'] ? 'Đang sửa...' : 'Quản lý (Tăng giá)'}
            </button>
          </div>
        </div>

        {/* 4. Phantom Read */}
        <div className="border rounded-lg p-6 bg-white shadow">
          <h2 className="text-xl font-bold text-purple-600 mb-2">4. Phantom Read / Deadlock</h2>
          <p className="text-gray-600 mb-4 text-sm">Hai lễ tân cùng kiểm tra lịch (đang có 4/5 ca) và cùng xếp thêm lịch mới. Kết quả vượt quá giới hạn.</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => callApi('/phantom-read/a', 'POST', 'PhantomRead_A')}
              disabled={isLoading['PhantomRead_A']}
              className="flex-1 bg-purple-500 text-white py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {isLoading['PhantomRead_A'] ? 'Đang xếp (5s)...' : 'Lễ tân 1 (Xếp lịch)'}
            </button>
            <button 
              onClick={() => callApi('/phantom-read/b', 'POST', 'PhantomRead_B')}
              disabled={isLoading['PhantomRead_B']}
              className="flex-1 bg-purple-500 text-white py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {isLoading['PhantomRead_B'] ? 'Đang xếp...' : 'Lễ tân 2 (Xếp lịch)'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm h-64 overflow-y-auto">
        <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
          <h3 className="font-bold text-white">Kết quả / Log:</h3>
          <button onClick={() => setLogs([])} className="text-gray-400 hover:text-white text-xs">Clear</button>
        </div>
        {logs.length === 0 ? (
          <p className="text-gray-600 italic">Chưa có thao tác nào...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))
        )}
      </div>
    </div>
  );
}
