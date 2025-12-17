import { Shipment, ShipmentStatus, Carrier, TrackingEvent } from '../types';
import { CARRIER_SLUGS } from '../constants';

const STORAGE_KEY_SHIPMENTS = 'chinatrack_shipments';
const STORAGE_KEY_TRACKINGMORE = 'chinatrack_trackingmore_key';
const STORAGE_KEY_BACKEND_URL = 'chinatrack_backend_url';

// Default key for demo purposes
const DEFAULT_TRACKINGMORE_KEY = 'u84jhs7u-c3em-42ro-4r72-63idxaxliyrg';

export const trackingService = {
  getShipments: (): Shipment[] => {
    const stored = localStorage.getItem(STORAGE_KEY_SHIPMENTS);
    return stored ? JSON.parse(stored) : [];
  },

  getTrackingMoreKey: (): string => {
    return localStorage.getItem(STORAGE_KEY_TRACKINGMORE) || DEFAULT_TRACKINGMORE_KEY;
  },

  saveTrackingMoreKey: (key: string): void => {
    localStorage.setItem(STORAGE_KEY_TRACKINGMORE, key.trim());
  },

  getBackendUrl: (): string => {
    return localStorage.getItem(STORAGE_KEY_BACKEND_URL) || '/api/track';
  },

  saveBackendUrl: (url: string): void => {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
        cleanUrl = cleanUrl.slice(0, -1);
    }
    if (cleanUrl === '') {
        localStorage.removeItem(STORAGE_KEY_BACKEND_URL);
    } else {
        localStorage.setItem(STORAGE_KEY_BACKEND_URL, cleanUrl);
    }
  },

  getExternalTrackingUrl: (carrier: Carrier, code: string): string => {
    const slug = CARRIER_SLUGS[carrier];
    if (slug) {
        return `https://www.trackingmore.com/track/en/${code}?express=${slug}`;
    }
    return `https://t.17track.net/en#nums=${code}`;
  },

  fetchRealTrackingInfo: async (code: string, carrier: Carrier): Promise<{ status: ShipmentStatus, summary: string, sources: {title: string, url: string}[] }> => {
    const apiKey = trackingService.getTrackingMoreKey();
    const carrierSlug = CARRIER_SLUGS[carrier];
    
    let backendUrl = trackingService.getBackendUrl();
    if (backendUrl !== '/api/track' && backendUrl.startsWith('http')) {
        // Valid absolute URL
    } else if (backendUrl !== '/api/track') {
         backendUrl = '/api/track';
    }

    if (!carrierSlug) {
        return {
            status: ShipmentStatus.UNKNOWN,
            summary: "Chưa hỗ trợ hãng vận chuyển này qua API.",
            sources: []
        };
    }

    try {
      console.log(`Calling Backend: ${backendUrl}`);

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracking_number: code,
          courier_code: carrierSlug,
          api_key: apiKey
        })
      });

      const result = await response.json().catch(() => null);

      if (response.status === 404) {
          throw new Error("API_NOT_FOUND_404: Không tìm thấy đường dẫn API (Kiểm tra vercel.json)");
      }

      if (!response.ok) {
        // Lấy chi tiết lỗi từ backend gửi về
        // Code mới trong api/track.js sẽ trả về 'raw_body' nếu parse JSON thất bại
        const errorDetail = result?.raw_body || result?.details || result?.error || response.statusText;
        throw new Error(`SERVER_ERROR_${response.status}: ${JSON.stringify(errorDetail).slice(0, 100)}`);
      }

      // Check TrackingMore Meta Code
      if (result.meta?.code !== 200) {
           throw new Error(`API_ERROR_${result.meta?.code}: ${result.meta?.message}`);
      }

      // SỬA LỖI PARSING Ở ĐÂY:
      // TrackingMore v4 realtime trả về data là Object, v4 get trả về data là Array.
      // Chúng ta hỗ trợ cả hai.
      let trackingData = null;

      if (Array.isArray(result.data)) {
          if (result.data.length > 0) {
              trackingData = result.data[0];
          }
      } else if (result.data) {
          trackingData = result.data;
      }

      if (trackingData) {
          return trackingService.parseTrackingMoreData(trackingData, code, carrier);
      } else {
          return {
            status: ShipmentStatus.UNKNOWN,
            summary: "Không tìm thấy dữ liệu vận đơn này (Data null).",
            sources: []
          };
      }

    } catch (err: any) {
      console.warn("Lỗi khi gọi API, chuyển sang chế độ Mock:", err.message);
      
      // Delay để trải nghiệm người dùng mượt hơn
      await new Promise(r => setTimeout(r, 800));

      // Mock Data Logic (Giữ nguyên như cũ để demo)
      let mockStatus = ShipmentStatus.IN_TRANSIT;
      let mockSummary = `[MÔ PHỎNG] Đơn hàng đang được vận chuyển.`;

      const lastChar = code.slice(-1);
      if (['1', '2', '3'].includes(lastChar)) {
          mockStatus = ShipmentStatus.DELIVERED;
          mockSummary = `[MÔ PHỎNG] Đã giao hàng thành công.`;
      } else if (['4', '5'].includes(lastChar)) {
          mockStatus = ShipmentStatus.PENDING;
          mockSummary = `[MÔ PHỎNG] Chờ lấy hàng.`;
      } else if (['0'].includes(lastChar)) {
          mockStatus = ShipmentStatus.EXCEPTION;
          mockSummary = `[MÔ PHỎNG] Giao hàng thất bại.`;
      }

      mockSummary += `\n\n(Lỗi Server: ${err.message})`;

      return {
        status: mockStatus,
        summary: mockSummary,
        sources: [{ title: 'Dữ liệu mô phỏng (Demo)', url: trackingService.getExternalTrackingUrl(carrier, code) }]
      };
    }
  },

  parseTrackingMoreData: (item: any, code: string, carrier: Carrier) => {
      let mappedStatus = ShipmentStatus.UNKNOWN;
      
      // Map TrackingMore statuses to our types
      const statusStr = (item.delivery_status || item.status || '').toLowerCase();
      
      switch (statusStr) {
        case 'pending': mappedStatus = ShipmentStatus.PENDING; break;
        case 'notfound': mappedStatus = ShipmentStatus.UNKNOWN; break;
        case 'transit': mappedStatus = ShipmentStatus.IN_TRANSIT; break;
        case 'pickup': mappedStatus = ShipmentStatus.DELIVERING; break;
        case 'delivered': mappedStatus = ShipmentStatus.DELIVERED; break;
        case 'undelivered': mappedStatus = ShipmentStatus.EXCEPTION; break;
        case 'exception': mappedStatus = ShipmentStatus.EXCEPTION; break;
        case 'expired': mappedStatus = ShipmentStatus.EXCEPTION; break;
        case 'info_received': mappedStatus = ShipmentStatus.PENDING; break; // Thêm trường hợp này
        default: mappedStatus = ShipmentStatus.IN_TRANSIT;
      }

      let summary = item.latest_event || "Đang cập nhật...";
      
      // Nối thêm địa điểm nếu có
      if (item.destination_country || item.destination_city) {
        const loc = [item.destination_city, item.destination_state, item.destination_country].filter(Boolean).join(', ');
        if (loc) summary += `\nĐến: ${loc}`;
      }

      if (item.latest_checkpoint_time) {
          summary += `\n(${item.latest_checkpoint_time})`;
      }

      return {
        status: mappedStatus,
        summary: summary,
        sources: [{ title: 'TrackingMore Realtime', url: `https://www.trackingmore.com/track/en/${code}` }]
      };
    },

  addShipment: async (code: string, carrier: Carrier): Promise<Shipment> => {
    const initialInfo = await trackingService.fetchRealTrackingInfo(code, carrier);

    const newShipment: Shipment = {
      id: Date.now().toString(),
      trackingCode: code,
      carrier: carrier,
      status: initialInfo.status,
      events: [],
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      aiAnalysis: initialInfo.summary,
      sourceLinks: initialInfo.sources
    };

    const currentList = trackingService.getShipments();
    const updatedList = [newShipment, ...currentList];
    localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(updatedList));
    return newShipment;
  },

  deleteShipment: (id: string): void => {
    const currentList = trackingService.getShipments();
    const updatedList = currentList.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(updatedList));
  },

  refreshAllShipments: async (): Promise<Shipment[]> => {
    const currentList = trackingService.getShipments();
    const updatedList = await Promise.all(currentList.map(async (shipment) => {
      const { status, summary, sources } = await trackingService.fetchRealTrackingInfo(shipment.trackingCode, shipment.carrier);
      return {
        ...shipment,
        status: status,
        aiAnalysis: summary,
        sourceLinks: sources,
        lastUpdated: new Date().toISOString(),
      };
    }));
    localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(updatedList));
    return updatedList;
  }
};