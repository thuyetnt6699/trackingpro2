// api/track.js
// Sử dụng CommonJS syntax để đảm bảo tương thích tốt nhất với Vercel Serverless mặc định

module.exports = async (req, res) => {
  // Cấu hình CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Preflight check
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Method check
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { tracking_number, courier_code, api_key } = req.body;

    if (!tracking_number || !courier_code || !api_key) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    console.log(`Tracking: ${tracking_number} - ${courier_code}`);

    // Call TrackingMore API
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

    // Check raw response status
    if (!response.ok) {
        const errorText = await response.text();
        console.error("TrackingMore Error:", response.status, errorText);
        res.status(response.status).json({ error: `Upstream Error ${response.status}`, details: errorText });
        return;
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error("Server Function Error:", error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};