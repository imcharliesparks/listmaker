import axios from "axios";
import * as cheerio from "cheerio";
import dns from "dns/promises";
import ipaddr from "ipaddr.js";
import net from "node:net";
import { chromium, Browser } from "playwright";
import { UrlMetadata } from "./urlMetadataServiceTypes.js";

const REQUEST_TIMEOUT = 10_000;
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

class UrlMetadataService {
  private browser: Browser | null = null;
  private browserLaunching: Promise<Browser> | null = null;

  async extractMetadata(url: string): Promise<UrlMetadata> {
    try {
      const sanitizedUrl = await this.ensureSafeUrl(url);
      const sourceType = this.detectSourceType(sanitizedUrl);

      if (sourceType === "youtube") {
        return this.extractYouTubeMetadata(sanitizedUrl);
      }

      if (sourceType === "pinterest") {
        return this.extractPinterestMetadata(sanitizedUrl);
      }

      return this.extractOpenGraphMetadata(sanitizedUrl, sourceType);
    } catch (error) {
      console.error("Error extracting metadata:", error);
      return {
        url,
        title: url,
        sourceType: this.detectSourceType(url),
      };
    }
  }

  private detectSourceType(url: string): string {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      return "youtube";
    }
    if (lowerUrl.includes("amazon.")) {
      return "amazon";
    }
    if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
      return "twitter";
    }
    if (lowerUrl.includes("instagram.com")) {
      return "instagram";
    }
    if (lowerUrl.includes("pinterest.com") || lowerUrl.includes("pin.it")) {
      return "pinterest";
    }
    return "website";
  }

  private async ensureSafeUrl(rawUrl: string): Promise<string> {
    const url = new URL(rawUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Unsupported protocol");
    }

    const addresses = await dns.lookup(url.hostname, { all: true });

    for (const { address } of addresses) {
      if (!ipaddr.isValid(address)) {
        continue;
      }

      let parsed = ipaddr.parse(address);

      if (parsed.kind() === "ipv6" && (parsed as ipaddr.IPv6).isIPv4MappedAddress()) {
        parsed = (parsed as ipaddr.IPv6).toIPv4Address();
      }

      const range = parsed.range();

      if (
        range === "loopback" ||
        range === "linkLocal" ||
        range === "private" ||
        range === "uniqueLocal" ||
        range === "multicast" ||
        range === "unspecified" ||
        range === "reserved"
      ) {
        throw new Error("Blocked address range");
      }
    }

    if (net.isIP(url.hostname)) {
      const parsed = ipaddr.parse(url.hostname);
      const range = parsed.range();
      if (
        range === "loopback" ||
        range === "linkLocal" ||
        range === "private" ||
        range === "uniqueLocal" ||
        range === "multicast" ||
        range === "unspecified" ||
        range === "reserved"
      ) {
        throw new Error("Blocked address range");
      }
    }

    return url.toString();
  }

  private async extractOpenGraphMetadata(
    url: string,
    sourceType: string,
  ): Promise<UrlMetadata> {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
      },
      timeout: REQUEST_TIMEOUT,
    });

    const $ = cheerio.load(response.data);

    return {
      url,
      title:
        $('meta[property="og:title"]').attr("content") ||
        $("title").text() ||
        url,
      description:
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        undefined,
      thumbnail:
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        undefined,
      videoUrl:
        $('meta[property="og:video:secure_url"]').attr("content") ||
        $('meta[property="og:video"]').attr("content") ||
        $('meta[name="twitter:player:stream"]').attr("content") ||
        undefined,
      sourceType,
    };
  }

  private async extractPinterestMetadata(url: string): Promise<UrlMetadata> {
    let resolvedUrl = url;
    let html: string | null = null;

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
        },
        timeout: REQUEST_TIMEOUT,
        maxRedirects: 5,
      });

      const responseUrl =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response.request as any)?.res?.responseUrl as string | undefined;
      resolvedUrl = responseUrl || url;
      html = response.data;
    } catch (error) {
      console.warn("Pinterest HTML fetch failed, falling back to Playwright:", error);
    }

    if (html) {
      const parsed = this.extractMetadataFromHtml(html, resolvedUrl, "pinterest");
      if (parsed.thumbnail || parsed.videoUrl) {
        return parsed;
      }
    }

    const browserData = await this.extractPinterestMetadataWithPlaywright(resolvedUrl);
    if (browserData.thumbnail || browserData.videoUrl) {
      return browserData;
    }

    return {
      url: resolvedUrl,
      title: resolvedUrl,
      sourceType: "pinterest",
    };
  }

  private extractMetadataFromHtml(
    html: string,
    url: string,
    sourceType: string,
  ): UrlMetadata {
    const $ = cheerio.load(html);
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const ogDescription = $('meta[property="og:description"]').attr("content");
    const ogImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[property="og:image:secure_url"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content");
    const ogVideo =
      $('meta[property="og:video:secure_url"]').attr("content") ||
      $('meta[property="og:video"]').attr("content") ||
      $('meta[name="twitter:player:stream"]').attr("content");
    const canonical = $('link[rel="canonical"]').attr("href");
    const jsonLd = this.extractJsonLdMetadata($);

    return {
      url: canonical || url,
      title: ogTitle || jsonLd.title || $("title").text() || url,
      description:
        ogDescription ||
        jsonLd.description ||
        $('meta[name="description"]').attr("content") ||
        undefined,
      thumbnail: ogImage || jsonLd.thumbnail,
      videoUrl: ogVideo || jsonLd.videoUrl,
      sourceType,
      metadata: jsonLd.raw,
    };
  }

  private extractJsonLdMetadata($: cheerio.CheerioAPI): {
    title?: string;
    description?: string;
    thumbnail?: string;
    videoUrl?: string;
    raw?: unknown;
  } {
    const scripts = $('script[type="application/ld+json"]');
    const payloads: unknown[] = [];

    scripts.each((_index, element) => {
      const text = $(element).contents().text();
      if (!text) {
        return;
      }
      try {
        const parsed = JSON.parse(text);
        payloads.push(parsed);
      } catch (error) {
        console.warn("Failed to parse JSON-LD", error);
      }
    });

    if (payloads.length === 0) {
      return {};
    }

    const flattened = payloads.flatMap((payload) => this.flattenJsonLd(payload));
    const candidate = flattened.find((item) => item && typeof item === "object") as
      | Record<string, unknown>
      | undefined;

    if (!candidate) {
      return { raw: payloads };
    }

    const title = this.coerceString(candidate.name || candidate.headline);
    const description = this.coerceString(candidate.description);
    const thumbnail =
      this.coerceString(candidate.thumbnailUrl) ||
      this.coerceString(candidate.image) ||
      this.coerceString(candidate.thumbnail);
    const videoUrl =
      this.coerceString(candidate.contentUrl) ||
      this.coerceString(candidate.embedUrl) ||
      this.coerceString(candidate.url);

    return {
      title,
      description,
      thumbnail,
      videoUrl,
      raw: payloads,
    };
  }

  private flattenJsonLd(payload: unknown): unknown[] {
    if (!payload) {
      return [];
    }
    if (Array.isArray(payload)) {
      return payload.flatMap((item) => this.flattenJsonLd(item));
    }
    if (typeof payload === "object") {
      const record = payload as Record<string, unknown>;
      if (record["@graph"] && Array.isArray(record["@graph"])) {
        return record["@graph"].flatMap((item) => this.flattenJsonLd(item));
      }
      return [record];
    }
    return [];
  }

  private coerceString(value: unknown): string | undefined {
    if (!value) {
      return undefined;
    }
    if (typeof value === "string") {
      return value;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        const coerced = this.coerceString(entry);
        if (coerced) {
          return coerced;
        }
      }
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      return this.coerceString(record.url) || this.coerceString(record.contentUrl);
    }
    return undefined;
  }

  private async extractPinterestMetadataWithPlaywright(url: string): Promise<UrlMetadata> {
    const browser = await this.getBrowser();
    const context = await browser.newContext({
      userAgent: DEFAULT_USER_AGENT,
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    try {
      await page.route("**/*", (route) => {
        const resourceType = route.request().resourceType();
        if (resourceType === "image" || resourceType === "font") {
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: REQUEST_TIMEOUT });
      await page.waitForTimeout(500);

      const html = await page.content();
      const resolvedUrl = page.url();
      return this.extractMetadataFromHtml(html, resolvedUrl, "pinterest");
    } catch (error) {
      console.error("Playwright Pinterest extraction failed:", error);
      return { url, sourceType: "pinterest" };
    } finally {
      await context.close();
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    if (!this.browserLaunching) {
      this.browserLaunching = chromium.launch({ headless: true }).then((browser) => {
        this.browser = browser;
        return browser;
      });
    }

    return this.browserLaunching;
  }

  private async extractYouTubeMetadata(url: string): Promise<UrlMetadata> {
    const videoId = this.extractYouTubeId(url);

    if (!videoId) {
      return { url, sourceType: "youtube" };
    }

    try {
      const response = await axios.get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { timeout: REQUEST_TIMEOUT },
      );

      return {
        url,
        title: response.data.title,
        description: response.data.author_name,
        thumbnail: response.data.thumbnail_url,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        sourceType: "youtube",
        metadata: {
          videoId,
          channelName: response.data.author_name,
        },
      };
    } catch (error) {
      return this.extractOpenGraphMetadata(url, "youtube");
    }
  }

  private extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/i,
      /youtube\.com\/embed\/([^&\s]+)/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  }
}

const urlMetadataService = new UrlMetadataService();

export default urlMetadataService;
