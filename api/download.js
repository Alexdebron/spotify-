import client from "./spotdown.js";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Missing URL" });
    }

    const { buffer, contentType } = await client.downloadBuffer(url);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "attachment; filename=song.mp3");

    res.send(buffer);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}
