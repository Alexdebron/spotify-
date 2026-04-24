import axios from "axios";

class Spotdown {
  constructor() {
    this.token = null;
    this.tokenExpires = 0;
    this.client = axios.create({ baseURL: "https://spotdown.org" });
  }

  async solveCF() {
    const { data } = await axios.post(
      "https://cf-solver-renofc.my.id/api/solvebeta",
      { url: "https://spotdown.org", mode: "waf-session" },
      { headers: { "Content-Type": "application/json" }, timeout: 60000 }
    );

    const cookieStr = Array.isArray(data.cookies)
      ? data.cookies.map(c => `${c.name}=${c.value}`).join("; ")
      : "";

    this.client.defaults.headers = {
      ...this.client.defaults.headers,
      ...data.headers,
      Cookie: cookieStr,
      Referer: "https://spotdown.org",
      Origin: "https://spotdown.org"
    };
  }

  async issueNonce() {
    const { data: ts } = await axios.post(
      "https://cf-solver-renofc.my.id/api/solvebeta",
      { url: "https://spotdown.org", mode: "turnstile-min", siteKey: "0x4AAAAAACrWMhU5hqsstO80" },
      { headers: { "Content-Type": "application/json" }, timeout: 60000 }
    );

    const cfToken = ts.token?.result?.token ?? ts.result?.token ?? ts.token;
    if (!cfToken) throw new Error("Turnstile failed");

    const { data } = await this.client.post("/api/issue-nonce", { cfToken });

    this.token = data.token;
    this.tokenExpires = data.expires ?? Date.now() + 600000;
    this.client.defaults.headers["X-Session-Token"] = this.token;
  }

  async ensureToken() {
    if (this.token && Date.now() + 180000 < this.tokenExpires) return;
    await this.issueNonce();
  }

  async init() {
    await this.solveCF();
    await this.issueNonce();
  }

  async search(query) {
    await this.ensureToken();
    const { data } = await this.client.get("/api/song-details", {
      params: { url: query }
    });
    return data.songs ?? [];
  }

  async downloadBuffer(url) {
    await this.ensureToken();

    const response = await this.client.get("/api/direct-download", {
      params: { url, token: this.token },
      responseType: "arraybuffer"
    });

    return {
      buffer: response.data,
      contentType: response.headers["content-type"] || "audio/mpeg"
    };
  }
}

const client = new Spotdown();
await client.init();

export default client;
