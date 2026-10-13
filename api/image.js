export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  
  if (req.method === "OPTIONS") return res.status(200).end();

  const KEY = process.env.REPLICATE_API_KEY;
  if (!KEY) return res.status(500).json({ error: "Vercel 환경변수에 API 키가 없습니다." });

  // ── GET: 폴링 ──────────────────────────────────────────
  if (req.method === "GET") {
    const { id } = req.query;
    if (!id || id === "undefined") return res.status(400).json({ error: "유효하지 않은 그림 ID입니다." });

    const r = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { "Authorization": `Bearer ${KEY}` }
    });
    const data = await r.json();

    if (data.status === "succeeded") {
      return res.status(200).json({ status: "succeeded", url: data.output[0] });
    }
    if (data.status === "failed" || data.detail) {
      return res.status(500).json({ status: "failed", error: data.error || data.detail || "생성 실패" });
    }
    return res.status(200).json({ status: data.status });
  }

  // ── POST: 생성 시작 ────────────────────────────────────
  if (req.method === "POST") {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt 필요" });

    const r = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Prefer": "wait"
      },
      body: JSON.stringify({
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 85
        }
      })
    });

    const data = await r.json();

    // ✨ 핵심! 레플리케이트가 몰래 보낸 에러(detail)까지 전부 잡아냄
    if (!r.ok || data.error || data.detail) {
      return res.status(500).json({ error: data.error || data.detail || "레플리케이트 API 거절됨" });
    }

    // wait 모드 — 바로 완료
    if (data.output && data.output[0]) {
      return res.status(200).json({ url: data.output[0] });
    }

    return res.status(200).json({ id: data.id, status: data.status });
  }

  return res.status(405).end();
}
