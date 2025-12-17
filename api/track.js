// api/track.js
// Sử dụng async/await để đảm bảo Vercel đợi cho đến khi có kết quả trả về từ API

module.exports = async (req, res) => {
  // 1. Cấu hình CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Xử lý Preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Chỉ nhận POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { tracking_number, courier_code, api_key } = req.body || {};

    if (!tracking_number || !courier_code || !api_key) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    console.log(`Tra cứu: ${tracking_number} (${courier_code})`);

    // 4. Gọi API TrackingMore sử dụng fetch (Node 18+ hỗ trợ sẵn)
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

    // 5. Đọc kết quả dưới dạng text trước để tránh lỗi parse JSON nếu API trả về lỗi HTML
    const responseText = await response.text();
    
    try {
      const jsonData = JSON.parse(responseText);
      // Trả về kết quả và status code tương ứng cho Frontend
      res.status(response.status).json(jsonData);
    } catch (parseError) {
      console.error("Lỗi parse JSON:", responseText);
      res.status(500).json({
        error: 'Upstream API Error (Non-JSON)',
        status: response.status,
        details: responseText.slice(0, 200) // Trả về 200 ký tự đầu để xem lỗi là gì
      });
    }

  } catch (error) {
    console.error("Serverless Function Error:", error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};