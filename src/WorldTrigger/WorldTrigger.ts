import {
  App,
  BadgeColor,
  Chapter,
  ChapterDetails,
  ContentRating,
  MangaProviding,
  SearchRequest,
  SearchResultsProviding,
  Source,
  SourceInfo,
  SourceIntents,
  SourceManga,
  PagedResults,
  ChapterProviding
} from "@paperback/types";
import * as cheerio from "cheerio";

const BASE_URL = "https://world-trigger-chapters.online";
const MANGA_ID = "world-trigger";
const MANGA_URL = `${BASE_URL}/`;

export const WorldTriggerInfo: SourceInfo = {
  version: "1.0.0",
  name: "World Trigger Chapters",
  icon: "icon.png",
  author: "Community",
  authorWebsite: "https://github.com/",
  description: "World Trigger source for Paperback 0.8.",
  contentRating: ContentRating.EVERYONE,
  websiteBaseURL: BASE_URL,
  sourceTags: [
    { text: "English", type: BadgeColor.GREY },
    { text: "Fan Translation", type: BadgeColor.YELLOW }
  ],
  intents: SourceIntents.MANGA_CHAPTERS | SourceIntents.SEARCH
};

export class WorldTrigger
  extends Source
  implements MangaProviding, ChapterProviding, SearchResultsProviding {

  requestManager = App.createRequestManager({
    requestsPerSecond: 2,
    requestTimeout: 20000,
    interceptor: {
      interceptRequest: async (request: Request): Promise<Request> => {
        request.headers = {
          ...(request.headers ?? {}),
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        };
        return request;
      }
    }
  });

  private async getHTML(url: string): Promise<string> {
    const request = App.createRequest({
      url,
      method: "GET"
    });
    const response = await this.requestManager.schedule(request, 1);

    if (response.status >= 400) {
      throw new Error(`World Trigger Chapters returned HTTP ${response.status}`);
    }

    return response.data;
  }

  private absoluteURL(value: string): string {
    try {
      return new URL(value, BASE_URL).href;
    } catch {
      return value;
    }
  }

  private chapterNumber(value: string): number {
    const match = value.match(/chapter\s+(\d+(?:\.\d+)?)/i);
    return match ? Number(match[1]) : 0;
  }

  async getSearchResults(
    query: SearchRequest,
    metadata: any
  ): Promise<PagedResults> {
    const title = (query.title ?? "").trim();

    if (!title || /world\s*trigger/i.test(title)) {
      return App.createPagedResults({
        results: [
          App.createSourceManga({
            mangaId: MANGA_ID,
            title: "World Trigger",
            image: await this.getCover()
          })
        ]
      });
    }

    return App.createPagedResults({ results: [] });
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const html = await this.getHTML(MANGA_URL);
    const $ = cheerio.load(html);

    const image =
      $(".summary_image img").first().attr("data-src") ??
      $(".summary_image img").first().attr("src") ??
      $("meta[property='og:image']").attr("content") ??
      "";

    const description =
      $(".description-summary .summary_content").first().text().trim() ||
      $(".summary_content").first().text().trim() ||
      "World Trigger by Daisuke Ashihara.";

    return App.createSourceManga({
      mangaId,
      title: "World Trigger",
      image: this.absoluteURL(image),
      author: "Ashihara Daisuke",
      artist: "Ashihara Daisuke",
      status: "ONGOING",
      genres: ["Action", "Sci-Fi"],
      description
    });
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const html = await this.getHTML(MANGA_URL);
    const $ = cheerio.load(html);

    const chapters: Chapter[] = [];
    const seen = new Set<string>();

    $("a").each((_index, element) => {
      const anchor = $(element);
      const title = anchor.text().replace(/\s+/g, " ").trim();
      const href = anchor.attr("href");

      if (!href || !/chapter\s+\d+(?:\.\d+)?/i.test(title)) return;

      const url = this.absoluteURL(href);
      const id = url.replace(/\/+$/, "");

      if (seen.has(id)) return;

      const number = this.chapterNumber(title);
      if (!number) return;

      seen.add(id);

      chapters.push(
        App.createChapter({
          chapterId: id,
          mangaId,
          name: `Chapter ${number}`,
          chapNum: number,
          volume: 0
        })
      );
    });

    chapters.sort((a, b) => (a.chapNum ?? 0) - (b.chapNum ?? 0));
    return chapters;
  }

  async getChapterDetails(
    mangaId: string,
    chapterId: string
  ): Promise<ChapterDetails> {
    const url = chapterId.startsWith("http")
      ? chapterId
      : `${BASE_URL}/${chapterId.replace(/^\/+/, "").replace(/\/?$/, "/")}`;

    const html = await this.getHTML(url);
    const $ = cheerio.load(html);
    const pages: string[] = [];
    const seen = new Set<string>();

    const selectors = [
      ".reading-content img",
      ".page-break img",
      ".wp-manga-chapter-img",
      ".entry-content img",
      ".chapter-content img",
      "article img"
    ];

    for (const selector of selectors) {
      $(selector).each((_index, element) => {
        const image =
          $(element).attr("data-src") ??
          $(element).attr("data-lazy-src") ??
          $(element).attr("src");

        if (!image) return;

        const absolute = this.absoluteURL(image);

        if (
          !absolute ||
          seen.has(absolute) ||
          /\.(svg|gif)(\?|$)/i.test(absolute)
        ) {
          return;
        }

        seen.add(absolute);
        pages.push(absolute);
      });

      if (pages.length > 0) break;
    }

    if (pages.length === 0) {
      throw new Error("No chapter images were found.");
    }

    return App.createChapterDetails({
      id: chapterId,
      mangaId,
      pages
    });
  }

  getMangaShareUrl(mangaId: string): string {
    return MANGA_URL;
  }

  private async getCover(): Promise<string> {
    const html = await this.getHTML(MANGA_URL);
    const $ = cheerio.load(html);

    return this.absoluteURL(
      $(".summary_image img").first().attr("data-src") ??
      $(".summary_image img").first().attr("src") ??
      $("meta[property='og:image']").attr("content") ??
      ""
    );
  }
}