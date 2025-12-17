// api/track.js
const https = require('https');

module.exports = (req, res) => {
  // 1. Cấu hình CORS (Cho phép mọi nguồn)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Xử lý Preflight Request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Chỉ nhận method POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // 4. Lấy dữ liệu từ Body
  // Vercel tự động parse JSON body, nhưng ta kiểm tra kỹ
  const body = req.body || {};
  const { tracking_number, courier_code, api_key } = body;

  if (!tracking_number || !courier_code || !api_key) {
    res.status(400).json({ error: 'Missing required fields', received: body });
    return;
  }

  // 5. Chuẩn bị dữ liệu gửi sang TrackingMore
  const postData = JSON.stringify({
    tracking_number,
    courier_code
  });

  const options = {
    hostname: 'api.trackingmore.com',
    port: 443,
    path: '/v4/trackings/realtime',
    method: 'POST',
    headers: {
      'Tracking-Api-Key': api_key,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  // 6. Thực hiện Request bằng module 'https' (Native Node.js)
  const request = https.request(options, (response) => {
    let data = '';

    // Nhận từng chunk dữ liệu
    response.on('data', (chunk) => {
      data += chunk;
    });

    // Kết thúc nhận dữ liệu
    response.on('end', () => {
      try {
        const jsonResponse = JSON.parse(data);
        
        // Trả về đúng status code từ TrackingMore
        res.status(response.statusCode).json(jsonResponse);
      } catch (e) {
        console.error("Parse Error:", e);
        res.status(500).json({ error: 'Invalid JSON from upstream', raw: data });
      }
    });
  });

  // 7. Xử lý lỗi kết nối
  request.on('error', (e) => {
    console.error("Request Error:", e);
    res.status(500).json({ error: 'Internal Server Error', details: e.message });
  });

  // Gửi dữ liệu đi
  request.write(postData);
  request.end();
};