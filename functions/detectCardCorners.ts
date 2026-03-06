import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return Response.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Use computer vision to detect card corners and quality metrics
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this image for a Pokémon trading card. ONLY if a clear rectangular card is visible, detect:
1. All 4 corners as [x, y] in normalized coords (0-1)
2. Card confidence score (0-100, only >70 means valid card)
3. Perspective skew score (0-100, where 100 is perfect rectangle, <30 is too skewed)
4. Rotation/tilt angle in degrees (-45 to 45, where 0 is perfect)
5. Blur score (0-100, where >70 is sharp)
6. Glare/reflection score (0-100, where >60 means too much glare)
7. Card coverage % (0-100, % of frame the card fills)
8. Aspect ratio match (0-100, trading cards are ~1.4:1)

If NO valid card or confidence <70, return detected: false.

Return JSON: {
  detected: boolean,
  confidence: number,
  corners: null | [[x1,y1], [x2,y2], [x3,y3], [x4,y4]],
  perspective_score: number,
  tilt_angle: number,
  blur_score: number,
  glare_score: number,
  card_coverage: number,
  aspect_ratio_match: number,
  capture_ready: boolean
}`,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          detected: { type: "boolean" },
          confidence: { type: "number" },
          corners: { type: ["array", "null"] },
          perspective_score: { type: "number" },
          tilt_angle: { type: "number" },
          blur_score: { type: "number" },
          glare_score: { type: "number" },
          card_coverage: { type: "number" },
          aspect_ratio_match: { type: "number" },
          capture_ready: { type: "boolean" }
        }
      }
    });

    return Response.json(result.data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});