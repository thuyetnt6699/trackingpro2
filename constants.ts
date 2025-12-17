import { Carrier, ShipmentStatus } from './types';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

export const CARRIER_OPTIONS = Object.values(Carrier);

// Mapping to generate external tracking links and API codes for TrackingMore
export const CARRIER_SLUGS: Record<string, string> = {
  [Carrier.SF_EXPRESS]: 'sf-express',
  [Carrier.DEBON]: 'deppon',
  [Carrier.ZTO]: 'zto-express', // TrackingMore code
  [Carrier.YTO]: 'yto',
  [Carrier.STO]: 'sto',
  [Carrier.YUNDA]: 'yunda',
  [Carrier.EMS_CHINA]: 'china-ems',
  [Carrier.BEST_EXPRESS]: 'bestex',
};

export const STATUS_CONFIG = {
  [ShipmentStatus.PENDING]: {
    label: 'Chờ xử lý',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Package,
  },
  [ShipmentStatus.IN_TRANSIT]: {
    label: 'Đang vận chuyển',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Truck,
  },
  [ShipmentStatus.DELIVERING]: {
    label: 'Đang giao hàng',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: MapPin,
  },
  [ShipmentStatus.DELIVERED]: {
    label: 'Đã ký nhận',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  [ShipmentStatus.EXCEPTION]: {
    label: 'Có vấn đề',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
  },
  [ShipmentStatus.UNKNOWN]: {
    label: 'Không xác định',
    color: 'bg-gray-200 text-gray-500 border-gray-300',
    icon: HelpCircle,
  },
};