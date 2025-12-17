// api/track.js
// Vercel Serverless Function (Node.js 18+)

export default async function handler(req, res) {
  // 1. Cấu hình CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Xử lý Preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Chỉ chấp nhận POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Vercel tự động parse req.body cho các hàm Node.js
    const { tracking_number, courier_code, api_key } = req.body || {};

    if (!tracking_number || !courier_code || !api_key) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        received: { tracking_number, courier_code, hasKey: !!api_key } 
      });
    }

    console.log(`Tra cứu: ${tracking_number} - ${courier_code}`);

    // 4. Gọi API TrackingMore (Sử dụng fetch có sẵn trong Node.js 18+)
    const response = await fetch('https://api.trackingmore.com/v4/trackings/realtime', {
      method: 'POST',
      headers: {
        'Tracking-Api-Key': api_key,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        tracking_number: tracking_number,
        courier_code: courier_code
      })
    });

    const responseText = await response.text();
    
    // Kiểm tra xem có phải JSON không
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Upstream returned non-JSON:", responseText);
      return res.status(response.status || 500).json({
        error: 'Upstream API Error',
        message: 'Dữ liệu từ TrackingMore không phải định dạng JSON.',
        raw: responseText.slice(0, 500)
      });
    }

    // Trả về kết quả từ TrackingMore
    return res.status(response.status).json(data);

  } catch (error) {
    console.error("Vercel Function Error:", error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}