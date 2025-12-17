import React, { useState, useEffect } from 'react';
import { User, Shipment, ShipmentStatus, Carrier } from '../types';
import { trackingService } from '../services/trackingService';
import { CARRIER_OPTIONS, STATUS_CONFIG } from '../constants';
import { 
    Plus, 
    RefreshCw, 
    Trash2, 
    LogOut, 
    PackageSearch, 
    ChevronDown, 
    ChevronUp,
    Clock,
    Filter,
    Bot,
    ExternalLink,
    Globe,
    Settings,
    X,
    Save,
    Server
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings State
  const [apiKey, setApiKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  
  // New Shipment State
  const [newCode, setNewCode] = useState('');
  const [newCarrier, setNewCarrier] = useState<Carrier>(Carrier.SF_EXPRESS);
  const [isAdding, setIsAdding] = useState(false);

  // Filter/Sort State
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');

  useEffect(() => {
    loadData();
    setApiKey(trackingService.getTrackingMoreKey());
    setBackendUrl(trackingService.getBackendUrl());
  }, []);

  const loadData = () => {
    setLoading(true);
    const data = trackingService.getShipments();
    setShipments(data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const updatedData = await trackingService.refreshAllShipments();
    setShipments(updatedData);
    setRefreshing(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode) return;

    setIsAdding(true);
    try {
        const newItem = await trackingService.addShipment(newCode, newCarrier);
        setShipments(prev => [newItem, ...prev]);
        setNewCode('');
    } catch (error) {
        console.error("Failed to add shipment", error);
    } finally {
        setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vận đơn này?')) return;
    trackingService.deleteShipment(id);
    setShipments(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveSettings = () => {
      trackingService.saveTrackingMoreKey(apiKey);
      trackingService.saveBackendUrl(backendUrl);
      setShowSettings(false);
      alert("Đã lưu cấu hình thành công!");
  };

  // Sorting Logic
  const sortedShipments = [...shipments].sort((a, b) => {
      if (sortBy === 'date') {
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      } else {
          const order = [
              ShipmentStatus.EXCEPTION, 
              ShipmentStatus.DELIVERING, 
              ShipmentStatus.IN_TRANSIT, 
              ShipmentStatus.PENDING, 
              ShipmentStatus.DELIVERED,
              ShipmentStatus.UNKNOWN
            ];
          return order.indexOf(a.status) - order.indexOf(b.status);
      }
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-12 relative">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                    <PackageSearch className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-800 hidden sm:block">ChinaTrack Pro</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.isAdmin ? 'Administrator' : 'Nhân viên'}</p>
                </div>
                {user.isAdmin && (
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Cài đặt API"
                    >
                        <Settings size={20} />
                    </button>
                )}
                <button 
                    onClick={onLogout}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Đăng xuất"
                >
                    <LogOut size={20} />
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Settings size={18} /> Cài đặt hệ thống
                      </h3>
                      <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">TrackingMore API Key</label>
                          <input 
                              type="text" 
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              placeholder="Nhập API Key..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono"
                          />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <Server size={14} /> Server Backend URL (Vercel)
                          </label>
                          <input 
                              type="text" 
                              value={backendUrl}
                              onChange={(e) => setBackendUrl(e.target.value)}
                              placeholder="Ví dụ: https://my-app.vercel.app/api/track"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                             Link đến Serverless Function để xử lý CORS. Nếu để trống, hệ thống sẽ dùng dữ liệu giả lập (Demo).
                          </p>
                      </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                      <button 
                        onClick={() => setShowSettings(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                      >
                          Hủy
                      </button>
                      <button 
                        onClick={handleSaveSettings}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                      >
                          <Save size={16} /> Lưu cấu hình
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Add Shipment */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Thêm vận đơn mới</h2>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Nhập mã vận đơn (VD: SF123456789)..."
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="sm:w-64">
                    <div className="relative">
                        <select
                            value={newCarrier}
                            onChange={(e) => setNewCarrier(e.target.value as Carrier)}
                            className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white pr-8 text-gray-700"
                        >
                            {CARRIER_OPTIONS.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isAdding || !newCode}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                    {isAdding ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"/> : <><Plus size={20} /> Thêm</>}
                </button>
            </form>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-800">Danh sách theo dõi</h2>
                <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {shipments.length}
                </span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full sm:w-auto appearance-none pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="date">Mới cập nhật</option>
                        <option value="status">Theo trạng thái</option>
                    </select>
                    <Filter className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={14} />
                    <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={14} />
                </div>
                
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                    <RefreshCw size={16} className={refreshing ? "animate-spin text-blue-600" : ""} />
                    {refreshing ? 'Đang tra cứu...' : 'Làm mới & Tra cứu'}
                </button>
            </div>
        </div>

        {/* List */}
        <div className="space-y-3">
            {loading ? (
                <div className="text-center py-12 text-gray-500">Đang tải dữ liệu...</div>
            ) : sortedShipments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <PackageSearch className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">Chưa có vận đơn nào</h3>
                    <p className="text-gray-500 mt-1">Hãy nhập mã vận đơn ở trên để bắt đầu theo dõi.</p>
                </div>
            ) : (
                sortedShipments.map(shipment => (
                    <ShipmentCard 
                        key={shipment.id} 
                        shipment={shipment} 
                        onDelete={user.isAdmin ? () => handleDelete(shipment.id) : undefined} 
                    />
                ))
            )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual cards
const ShipmentCard: React.FC<{ 
    shipment: Shipment; 
    onDelete?: () => void 
}> = ({ shipment, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    const config = STATUS_CONFIG[shipment.status] || STATUS_CONFIG[ShipmentStatus.UNKNOWN];
    const StatusIcon = config.icon;

    // Use AI analysis as main description
    const displayDescription = shipment.aiAnalysis || "Chưa có thông tin cập nhật";
    const hasSources = shipment.sourceLinks && shipment.sourceLinks.length > 0;
    
    // Generate External Link
    const directLink = trackingService.getExternalTrackingUrl(shipment.carrier, shipment.trackingCode);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-4 sm:p-5 cursor-pointer sm:cursor-default" onClick={() => { if(window.innerWidth < 640) setExpanded(!expanded) }}>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${config.color}`}>
                                <StatusIcon size={12} />
                                {config.label}
                            </span>
                            <span className="text-xs text-gray-400 hidden sm:inline-block">
                                {shipment.carrier}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 truncate tracking-tight">
                            {shipment.trackingCode}
                        </h3>
                        <div className="mt-3 flex items-start gap-3">
                            <div className="mt-0.5 shrink-0 bg-blue-50 text-blue-600 p-1 rounded">
                                <Bot size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                    {expanded ? displayDescription : (displayDescription.slice(0, 150) + (displayDescription.length > 150 ? '...' : ''))}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={12} /> Cập nhật: {new Date(shipment.lastUpdated).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {onDelete && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa vận đơn"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <a
                            href={directLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mở trang theo dõi gốc"
                        >
                            <Globe size={18} />
                        </a>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hidden sm:block"
                        >
                            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Expanded Source Links & Details */}
            {expanded && (
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                        <div className="flex-1">
                             {hasSources ? (
                                <div className="mb-2">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">Nguồn thông tin xác thực</p>
                                    <ul className="space-y-2">
                                        {shipment.sourceLinks?.map((link, idx) => (
                                            <li key={idx}>
                                                <a 
                                                    href={link.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline flex items-start gap-2"
                                                >
                                                    <ExternalLink size={14} className="mt-0.5 shrink-0" />
                                                    <span className="truncate">{link.title || link.url}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic">Dữ liệu được AI tổng hợp từ internet.</p>
                            )}
                        </div>

                        <div className="sm:w-1/3 pt-2 sm:pt-0 sm:border-l sm:border-gray-200 sm:pl-6">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">Công cụ hỗ trợ</p>
                            <a 
                                href={directLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors shadow-sm"
                            >
                                <Globe size={16} />
                                Xem trên web hãng
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};