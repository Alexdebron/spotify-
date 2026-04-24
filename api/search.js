import client from "./spotdown.js";

export default async function handler(req, res) {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Missing query" });
    }

    const songs = await client.search(q);

    res.json({
      status: true,
      result: songs
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}
