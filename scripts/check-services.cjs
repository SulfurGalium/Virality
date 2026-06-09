const fs = require("fs");

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) continue;
  process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
}

(async () => {
  const { Redis } = require("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    await redis.set("virality:test", "ok", { ex: 60 });
    const value = await redis.get("virality:test");
    console.log("UPSTASH_OK", value);
  } catch (err) {
    console.log("UPSTASH_ERR", err.constructor.name, err.status, err.message);
  }

  const Anthropic = require("@anthropic-ai/sdk").default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 20,
      messages: [{ role: "user", content: 'Return JSON only: {"ok":true}' }],
    });
    console.log("ANTHROPIC_OK", response.content.map((block) => block.type).join(","));
  } catch (err) {
    console.log("ANTHROPIC_ERR", err.constructor.name, err.status, err.message);
  }
})();
