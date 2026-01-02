export const runtime = "edge";

export async function GET() {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`));

      // Send heartbeat every 30 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`)
          );
        } catch {
          clearInterval(interval);
        }
      }, 30000);

      // Clean up on close
      return () => {
        clearInterval(interval);
      };
    },
  });

  return new Response(customReadable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
