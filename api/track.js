// api/track.js
const https = require('https');

module.exports = (req, res) => {
  // 1. Cấu hình CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const body = req.body || {};
  const { tracking_number, courier_code, api_key } = body;

  if (!tracking_number || !courier_code || !api_key) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Sử dụng endpoint Realtime của TrackingMore v4
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

  const request = https.request(options, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      try {
        // Cố gắng parse JSON
        const jsonResponse = JSON.parse(data);
        // Trả về kết quả cho Frontend
        res.status(response.statusCode).json(jsonResponse);
      } catch (e) {
        // Nếu không phải JSON (VD: HTML lỗi từ TrackingMore), trả về text gốc để debug
        console.error("Non-JSON response:", data);
        res.status(500).json({ 
            error: 'Upstream API Error (Non-JSON response)', 
            statusCode: response.statusCode,
            raw_body: data 
        });
      }
    });
  });

  request.on('error', (e) => {
    console.error("Request Error:", e);
    res.status(500).json({ error: 'Internal Server Error', details: e.message });
  });

  request.write(postData);
  request.end();
};