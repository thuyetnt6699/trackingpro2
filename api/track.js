
// api/track.js
// Vercel Serverless Function (Node.js 18+)

export default async function handler(req, res) {
  // 1. Cấu hình CORS cho phép Frontend gọi vào
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Xử lý yêu cầu kiểm tra (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { tracking_number, courier_code, api_key } = req.body || {};

    if (!tracking_number || !courier_code || !api_key) {
      return res.status(400).json({ 
        error: 'Thiếu thông tin',
        details: 'Cần có mã vận đơn, mã hãng và API Key.'
      });
    }

    console.log(`[Backend] Đang tra cứu: ${tracking_number} (${courier_code})`);

    // 4. Gọi API TrackingMore Realtime
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
    
    // Kiểm tra định dạng trả về
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("[Error] TrackingMore trả về không phải JSON:", responseText);
      return res.status(502).json({
        error: 'Lỗi dịch vụ bên thứ 3',
        message: 'Không thể đọc dữ liệu từ TrackingMore.',
        raw: responseText.slice(0, 200)
      });
    }

    // Trả về kết quả cho App
    return res.status(response.status).json(data);

  } catch (error) {
    console.error("[Fatal Error]:", error);
    return res.status(500).json({
      error: 'Lỗi máy chủ nội bộ',
      message: error.message
    });
  }
}
