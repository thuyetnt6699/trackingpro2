// api/track.js
export default async function handler(req, res) {
  // 1. Cấu hình CORS chặt chẽ để trình duyệt không chặn
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 2. Xử lý preflight request (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Chỉ chấp nhận method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { tracking_number, courier_code, api_key } = req.body;

    if (!tracking_number || !courier_code || !api_key) {
      return res.status(400).json({ error: 'Missing required fields: tracking_number, courier_code, or api_key' });
    }

    // 4. Gọi sang TrackingMore
    const response = await fetch('https://api.trackingmore.com/v4/trackings/realtime', {
      method: 'POST',
      headers: {
        'Tracking-Api-Key': api_key,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        tracking_number,
        courier_code
      })
    });

    // Đọc dữ liệu trả về
    const data = await response.json();
    
    // 5. Trả kết quả về cho App
    return res.status(response.status).json(data);

  } catch (error) {
    console.error("API Proxy Error:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}