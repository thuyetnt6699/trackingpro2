// api/track.js
export default async function handler(req, res) {
  // Cấu hình CORS đầy đủ để tránh lỗi chặn request từ trình duyệt
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Xử lý preflight request (khi trình duyệt hỏi "tôi có được gửi request không?")
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Chỉ chấp nhận method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { tracking_number, courier_code, api_key } = req.body;

    if (!tracking_number || !courier_code || !api_key) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Gọi API của TrackingMore
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

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error("API Proxy Error:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}