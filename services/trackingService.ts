import { Shipment, ShipmentStatus, Carrier, TrackingEvent } from '../types';
import { CARRIER_SLUGS } from '../constants';

const STORAGE_KEY_SHIPMENTS = 'chinatrack_shipments';
const STORAGE_KEY_TRACKINGMORE = 'chinatrack_trackingmore_key';
const STORAGE_KEY_BACKEND_URL = 'chinatrack_backend_url';

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
        // Absolute URL
    } else {
         backendUrl = '/api/track';
    }

    if (!carrierSlug) {
        return {
            status: ShipmentStatus.UNKNOWN,
            summary: "Chưa hỗ trợ hãng vận chuyển này.",
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

      const responseText = await response.text();
      let result: any = null;
      try {
          result = JSON.parse(responseText);
      } catch (e) {
          result = { error: responseText || "Empty response from server" };
      }

      if (!response.ok) {
        const errorMsg = result?.details || result?.error || result?.message || response.statusText;
        throw new Error(`${response.status}: ${errorMsg}`);
      }

      if (result.meta?.code !== 200) {
           throw new Error(`API_${result.meta?.code}: ${result.meta?.message}`);
      }

      let trackingData = null;
      if (Array.isArray(result.data)) {
          trackingData = result.data[0];
      } else if (result.data) {
          trackingData = result.data;
      }

      if (trackingData) {
          return trackingService.parseTrackingMoreData(trackingData, code, carrier);
      } else {
          return {
            status: ShipmentStatus.UNKNOWN,
            summary: "Không tìm thấy dữ liệu (Data null).",
            sources: []
          };
      }

    } catch (err: any) {
      console.warn("Lỗi:", err.message);
      
      await new Promise(r => setTimeout(r, 800));

      let mockStatus = ShipmentStatus.IN_TRANSIT;
      let mockSummary = `[MÔ PHỎNG] Đơn hàng đang vận chuyển.`;

      const lastChar = code.slice(-1);
      if (['1', '2', '3'].includes(lastChar)) {
          mockStatus = ShipmentStatus.DELIVERED;
          mockSummary = `[MÔ PHỎNG] Đã giao hàng thành công.`;
      } else if (['4', '5'].includes(lastChar)) {
          mockStatus = ShipmentStatus.PENDING;
          mockSummary = `[MÔ PHỎNG] Chờ bưu tá lấy hàng.`;
      }

      // Hiện lỗi thật sự vào phần chú thích để dễ sửa
      mockSummary += `\n\n(Lỗi thật: ${err.message})`;

      return {
        status: mockStatus,
        summary: mockSummary,
        sources: [{ title: 'Dữ liệu mẫu (Demo)', url: trackingService.getExternalTrackingUrl(carrier, code) }]
      };
    }
  },

  parseTrackingMoreData: (item: any, code: string, carrier: Carrier) => {
      let mappedStatus = ShipmentStatus.UNKNOWN;
      const statusStr = (item.delivery_status || item.status || '').toLowerCase();
      
      switch (statusStr) {
        case 'pending': mappedStatus = ShipmentStatus.PENDING; break;
        case 'transit': mappedStatus = ShipmentStatus.IN_TRANSIT; break;
        case 'pickup': mappedStatus = ShipmentStatus.DELIVERING; break;
        case 'delivered': mappedStatus = ShipmentStatus.DELIVERED; break;
        case 'undelivered': 
        case 'exception': 
        case 'expired': mappedStatus = ShipmentStatus.EXCEPTION; break;
        case 'info_received': mappedStatus = ShipmentStatus.PENDING; break;
        default: mappedStatus = ShipmentStatus.IN_TRANSIT;
      }

      let summary = item.latest_event || "Đang cập nhật...";
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