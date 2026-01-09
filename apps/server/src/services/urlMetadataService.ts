import axios from "axios";
import * as cheerio from "cheerio";
import dns from "dns/promises";
import ipaddr from "ipaddr.js";
import net from "node:net";
import { UrlMetadata } from "../types/index.js";

const REQUEST_TIMEOUT = 10_000;

class UrlMetadataService {
  async extractMetadata(url: string): Promise<UrlMetadata> {
    try {
      const sanitizedUrl = await this.ensureSafeUrl(url);
      const sourceType = this.detectSourceType(sanitizedUrl);

      if (sourceType === "youtube") {
        return this.extractYouTubeMetadata(sanitizedUrl);
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
        "User-Agent": "Mozilla/5.0 (compatible; ListmakerBot/1.0)",
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
      sourceType,
    };
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
