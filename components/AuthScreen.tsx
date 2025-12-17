import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { ShieldCheck, Truck } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  allowRegistration: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, allowRegistration }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
        // In a real app, registration would create a new user record.
        // Here, we just log them in via the mock service.
        const user = await authService.login(email, isAdmin);
        onLogin(user);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-3 rounded-full mb-4">
                <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">ChinaTrack Pro</h1>
            <p className="text-gray-500 text-sm mt-2 text-center">
              Hệ thống theo dõi vận đơn nội địa Trung Quốc
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="nhanvien@congty.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center mt-2">
            <input
                id="admin-check"
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="admin-check" className="ml-2 block text-sm text-gray-600 flex items-center gap-1">
                Đăng nhập với quyền Admin <ShieldCheck size={14} />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center"
          >
            {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
                isLoginView ? 'Đăng nhập' : 'Đăng ký'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
            {allowRegistration && (
                <button
                    onClick={() => setIsLoginView(!isLoginView)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                    {isLoginView ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                </button>
            )}
            {!allowRegistration && isLoginView && (
                <p className="text-xs text-gray-400 mt-2">Đăng ký mới đang tạm khóa bởi quản trị viên.</p>
            )}
        </div>
      </div>
    </div>
  );
};