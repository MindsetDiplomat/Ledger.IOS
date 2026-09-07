export default async function handler(req, res) {
  try {
    const { default: server } = await import('../dist/server/server.js');
    
    const request = new Request(
      new URL(req.url, `http://${req.headers.host}`),
      {
        method: req.method,
        headers: req.headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      }
    );

    const response = await server.fetch(request);
    
    res.status(response.status);
    for (const [key, value] of response.headers) {
      res.setHeader(key, value);
    }
    
    return res.end(await response.text());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
