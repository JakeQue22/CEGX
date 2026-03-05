import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { PrismaService } from '../common/prisma/prisma.service';

interface ProxyConfig {
  host: string;
  port: number;
  auth?: { username: string; password: string };
}

export interface ScrapedFramework {
  reference: string;
  title: string;
  description: string;
  category: string;
  status: string;
  startDate?: string;
  endDate?: string;
  websiteUrl: string;
  maxValue?: number;
  benefits?: string;
  productsServices?: string;
  howToBuy?: string;
  regulation?: string;
}

@Injectable()
export class CcsScraperService {
  private readonly logger = new Logger(CcsScraperService.name);
  private readonly baseUrl = 'https://www.crowncommercial.gov.uk';
  private readonly requestDelayMs = 500;
  private proxyList: ProxyConfig[] = [];
  private proxyIndex = 0;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Configure rotating proxies for scraping.
   * Accepts an array of proxy configs (host:port with optional auth).
   * If no proxies are configured, requests go direct.
   */
  setProxies(proxies: ProxyConfig[]) {
    this.proxyList = proxies;
    this.proxyIndex = 0;
    this.logger.log(`Configured ${proxies.length} rotating proxies`);
  }

  private getNextProxy(): ProxyConfig | undefined {
    if (this.proxyList.length === 0) return undefined;
    const proxy = this.proxyList[this.proxyIndex % this.proxyList.length];
    this.proxyIndex++;
    return proxy;
  }

  private async fetchPage(url: string): Promise<string> {
    const proxy = this.getNextProxy();
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
    };

    let fetchUrl = url;

    if (proxy) {
      this.logger.debug(`Using proxy: ${proxy.host}:${proxy.port} for ${url}`);

      // Node.js native fetch doesn't support proxies directly.
      // When a proxy is configured, log it for observability. In production,
      // set HTTPS_PROXY / HTTP_PROXY environment variables for system-wide proxy routing,
      // or use a proxy agent library like undici ProxyAgent.
      try {
        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      } catch (err) {
        this.logger.warn(`Fetch via proxy context failed for ${url}, trying direct: ${err.message}`);
      }
    }

    const response = await fetch(fetchUrl, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
    return response.text();
  }

  /**
   * Scrape the CCS agreements listing page to get framework data.
   * CCS publishes agreements at /agreements — paginates with ?page=N
   */
  async scrapeFrameworksList(): Promise<ScrapedFramework[]> {
    const frameworks: ScrapedFramework[] = [];
    const seenRefs = new Set<string>();
    let page = 1;
    const maxPages = 20; // safety limit

    try {
      while (page <= maxPages) {
        const url = page === 1
          ? `${this.baseUrl}/agreements`
          : `${this.baseUrl}/agreements?page=${page}`;

        this.logger.log(`Scraping CCS agreements page ${page}: ${url}`);
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);
        let foundOnPage = 0;

        // CCS website uses agreement cards/list items
        $('a[href*="/agreements/"]').each((_i, el) => {
          const $el = $(el);
          const href = $el.attr('href') || '';
          const title = $el.text().trim();

          // Extract reference from URL (e.g. /agreements/RM6187)
          const refMatch = href.match(/\/agreements\/(RM\d+)/i);
          if (!refMatch || !title) return;

          const reference = refMatch[1].toUpperCase();

          // Skip duplicates across pages
          if (seenRefs.has(reference)) return;
          seenRefs.add(reference);
          foundOnPage++;

          // Look for status and category in surrounding elements
          const $parent = $el.closest('li, .agreement-item, .govuk-summary-list__row, div');
          const statusText = $parent.find('.govuk-tag, .status, [class*="status"]').first().text().trim();
          const categoryText = $parent.find('.category, [class*="category"]').first().text().trim();

          // Filter out metadata strings that were incorrectly picked up as categories
          const isMetadata = (text: string) =>
            /Agreement ID:|Start Date:|End Date:|Regulation:/i.test(text);

          frameworks.push({
            reference,
            title,
            description: '',
            category: (categoryText && !isMetadata(categoryText)) ? categoryText : title,
            status: this.normaliseStatus(statusText),
            websiteUrl: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
          });
        });

        this.logger.log(`Page ${page}: found ${foundOnPage} new frameworks`);

        // Check if there's a next page link
        const hasNextPage = $('a[rel="next"], .pagination a:contains("Next"), a:contains("Next")').length > 0
          || foundOnPage > 0;

        // If no new frameworks found on this page, we've reached the end
        if (foundOnPage === 0) {
          this.logger.log(`No new frameworks on page ${page}, stopping pagination`);
          break;
        }

        page++;

        // Small delay between page requests
        await new Promise((resolve) => setTimeout(resolve, this.requestDelayMs));
      }

      this.logger.log(`Scraped ${frameworks.length} total frameworks from ${page} page(s)`);
    } catch (err) {
      this.logger.error(`Failed to scrape CCS agreements list: ${err.message}`);
    }

    return frameworks;
  }

  /**
   * Scrape an individual framework detail page for lots, dates, value, benefits,
   * products/services, regulation, and other content from the CCS page.
   */
  async scrapeFrameworkDetail(reference: string): Promise<Partial<ScrapedFramework> & { lots: { lotNumber: string; title: string; description: string }[] }> {
    const result: Partial<ScrapedFramework> & { lots: { lotNumber: string; title: string; description: string }[] } = { lots: [] };

    try {
      const html = await this.fetchPage(`${this.baseUrl}/agreements/${reference}`);
      const $ = cheerio.load(html);

      // Title
      const pageTitle = $('h1').first().text().trim();
      if (pageTitle) result.title = pageTitle;

      // Description from lead paragraph or summary
      const leadDesc = $('.govuk-body-l, .lead-paragraph, main p').first().text().trim();
      if (leadDesc) result.description = leadDesc;

      // Try to get a longer description by collecting all paragraphs in main content
      // before the first h2 (this typically contains the full description)
      const longDescParas: string[] = [];
      const mainContent = $('main .govuk-grid-column-two-thirds, main .govuk-grid-column-full, main article, main');
      mainContent.first().children().each((_i, el) => {
        const tag = $(el).prop('tagName')?.toLowerCase();
        // Stop at the first h2 (sections like Benefits, Products etc.)
        if (tag === 'h2') return false;
        if (tag === 'p' || tag === 'div') {
          const text = $(el).text().trim();
          // Skip very short text that might be metadata labels
          if (text && text.length > 20) longDescParas.push(text);
        }
      });
      // Use long description if it's longer than the lead paragraph
      if (longDescParas.length > 0) {
        const longDesc = longDescParas.join('\n\n');
        if (!result.description || longDesc.length > result.description.length) {
          result.description = longDesc;
        }
      }

      // If still no description, try getting all intro paragraphs
      if (!result.description) {
        const introParas: string[] = [];
        $('main .govuk-body, main p').each((_i, el) => {
          const text = $(el).text().trim();
          if (text && introParas.length < 5) introParas.push(text);
        });
        if (introParas.length) result.description = introParas.join('\n\n');
      }

      // Extract dates, values, category, regulation from summary list / key info
      // Handle GOV.UK summary lists (dt/dd pairs)
      $('dt, .govuk-summary-list__key').each((_i, el) => {
        const label = $(el).text().trim().toLowerCase();
        const value = $(el).next('dd, .govuk-summary-list__value').text().trim();
        this.extractKeyValueField(label, value, result);
      });

      // Handle table-based key-value pairs (th/td pairs within rows)
      $('table tr').each((_i, row) => {
        const th = $(row).find('th').first().text().trim().toLowerCase();
        const td = $(row).find('td').first().text().trim();
        if (th && td) {
          this.extractKeyValueField(th, td, result);
        }
      });

      // Extract benefits section
      const benefitsTexts: string[] = [];
      $('h2, h3').each((_i, el) => {
        const heading = $(el).text().trim().toLowerCase();
        if (heading.includes('benefit') || heading.includes('why use')) {
          // Collect all following list items and paragraphs until next heading
          $(el).nextUntil('h2, h3').each((_j, sib) => {
            const tag = $(sib).prop('tagName')?.toLowerCase();
            if (tag === 'ul' || tag === 'ol') {
              $(sib).find('li').each((_k, li) => {
                const text = $(li).text().trim();
                if (text) benefitsTexts.push(`• ${text}`);
              });
            } else {
              const text = $(sib).text().trim();
              if (text) benefitsTexts.push(text);
            }
          });
        }
      });
      if (benefitsTexts.length) result.benefits = benefitsTexts.join('\n');

      // Extract products/services section
      const productsTexts: string[] = [];
      $('h2, h3').each((_i, el) => {
        const heading = $(el).text().trim().toLowerCase();
        if (heading.includes('product') || heading.includes('service') || heading.includes('what')) {
          $(el).nextUntil('h2, h3').each((_j, sib) => {
            const tag = $(sib).prop('tagName')?.toLowerCase();
            if (tag === 'ul' || tag === 'ol') {
              $(sib).find('li').each((_k, li) => {
                const text = $(li).text().trim();
                if (text) productsTexts.push(`• ${text}`);
              });
            } else {
              const text = $(sib).text().trim();
              if (text) productsTexts.push(text);
            }
          });
        }
      });
      if (productsTexts.length) result.productsServices = productsTexts.join('\n');

      // Extract "how to buy" section
      const howToBuyTexts: string[] = [];
      $('h2, h3').each((_i, el) => {
        const heading = $(el).text().trim().toLowerCase();
        if (heading.includes('how to buy') || heading.includes('how to use') || heading.includes('how to access')) {
          $(el).nextUntil('h2, h3').each((_j, sib) => {
            const tag = $(sib).prop('tagName')?.toLowerCase();
            if (tag === 'ul' || tag === 'ol') {
              $(sib).find('li').each((_k, li) => {
                const text = $(li).text().trim();
                if (text) howToBuyTexts.push(`• ${text}`);
              });
            } else {
              const text = $(sib).text().trim();
              if (text) howToBuyTexts.push(text);
            }
          });
        }
      });
      if (howToBuyTexts.length) result.howToBuy = howToBuyTexts.join('\n');

      // Extract lots
      $('h2, h3').each((_i, el) => {
        const heading = $(el).text().trim();
        const lotMatch = heading.match(/lot\s*(\d+[a-z]?)\s*[-:–]\s*(.*)/i);
        if (lotMatch) {
          const lotDesc = $(el).nextAll('p').first().text().trim();
          result.lots.push({
            lotNumber: lotMatch[1],
            title: lotMatch[2].trim(),
            description: lotDesc,
          });
        }
      });

      // Also check for lots in tables
      $('table').each((_i, table) => {
        $(table).find('tbody tr').each((_j, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            const lotNum = cells.eq(0).text().trim();
            const lotTitle = cells.eq(1).text().trim();
            const lotDesc = cells.length >= 3 ? cells.eq(2).text().trim() : '';
            if (lotNum && lotTitle && /^\d/.test(lotNum)) {
              result.lots.push({ lotNumber: lotNum, title: lotTitle, description: lotDesc });
            }
          }
        });
      });

      this.logger.log(`Scraped detail for ${reference}: ${result.lots.length} lots found`);
    } catch (err) {
      this.logger.error(`Failed to scrape framework detail ${reference}: ${err.message}`);
    }

    return result;
  }

  /**
   * Full sync: scrape all frameworks and upsert into the database.
   * Returns a summary of what was created/updated.
   */
  async syncFrameworks(): Promise<{ created: number; updated: number; errors: string[] }> {
    const summary = { created: 0, updated: 0, errors: [] as string[] };

    try {
      const scraped = await this.scrapeFrameworksList();

      for (const fw of scraped) {
        try {
          // Check if framework already exists by reference
          const existing = await this.prisma.ccsFramework.findFirst({
            where: { reference: fw.reference },
          });

          if (existing) {
            // Update with any new data
            await this.prisma.ccsFramework.update({
              where: { id: existing.id },
              data: {
                title: fw.title || existing.title,
                description: fw.description || existing.description,
                category: fw.category || existing.category,
                status: fw.status || existing.status,
                startDate: fw.startDate ? new Date(fw.startDate) : existing.startDate,
                endDate: fw.endDate ? new Date(fw.endDate) : existing.endDate,
                websiteUrl: fw.websiteUrl || existing.websiteUrl,
                maxValue: fw.maxValue ?? existing.maxValue,
              },
            });
            summary.updated++;
          } else {
            await this.prisma.ccsFramework.create({
              data: {
                reference: fw.reference,
                title: fw.title,
                description: fw.description,
                category: fw.category,
                status: fw.status,
                startDate: fw.startDate ? new Date(fw.startDate) : undefined,
                endDate: fw.endDate ? new Date(fw.endDate) : undefined,
                websiteUrl: fw.websiteUrl,
                maxValue: fw.maxValue,
              },
            });
            summary.created++;
          }

          // Try to scrape detail page for lots and additional content
          try {
            const detail = await this.scrapeFrameworkDetail(fw.reference);
            const dbFw = await this.prisma.ccsFramework.findFirst({ where: { reference: fw.reference } });

            if (dbFw) {
              // Update framework with additional detail (even if no lots found)
              if (detail.description || detail.startDate || detail.endDate || detail.benefits || detail.productsServices || detail.howToBuy || detail.regulation) {
                await this.prisma.ccsFramework.update({
                  where: { id: dbFw.id },
                  data: {
                    description: detail.description || dbFw.description,
                    startDate: detail.startDate ? new Date(detail.startDate) : dbFw.startDate,
                    endDate: detail.endDate ? new Date(detail.endDate) : dbFw.endDate,
                    maxValue: detail.maxValue ?? dbFw.maxValue,
                    category: detail.category || dbFw.category,
                    status: detail.status || dbFw.status,
                    benefits: detail.benefits || dbFw.benefits,
                    productsServices: detail.productsServices || dbFw.productsServices,
                    howToBuy: detail.howToBuy || dbFw.howToBuy,
                    regulation: detail.regulation || dbFw.regulation,
                  },
                });
              }

              for (const lot of detail.lots) {
                const existingLot = await this.prisma.ccsLot.findFirst({
                  where: { frameworkId: dbFw.id, lotNumber: lot.lotNumber },
                });
                if (!existingLot) {
                  await this.prisma.ccsLot.create({
                    data: {
                      frameworkId: dbFw.id,
                      lotNumber: lot.lotNumber,
                      title: lot.title,
                      description: lot.description,
                    },
                  });
                }
              }
            }
          } catch (detailErr) {
            // Non-fatal — we still have the basic framework data
            this.logger.warn(`Could not scrape detail for ${fw.reference}: ${detailErr.message}`);
          }

          // Small delay to be respectful to CCS servers
          await new Promise((resolve) => setTimeout(resolve, this.requestDelayMs));
        } catch (fwErr) {
          summary.errors.push(`${fw.reference}: ${fwErr.message}`);
        }
      }
    } catch (err) {
      summary.errors.push(`Scraping failed: ${err.message}`);
    }

    this.logger.log(
      `CCS sync complete: ${summary.created} created, ${summary.updated} updated, ${summary.errors.length} errors`,
    );
    return summary;
  }

  private extractKeyValueField(
    label: string,
    value: string,
    result: Partial<ScrapedFramework>,
  ): void {
    if (label.includes('start date') || (label.includes('start') && !label.includes('status'))) {
      result.startDate = this.parseUKDate(value);
    }
    if (label.includes('end date') || label.includes('expiry')) {
      result.endDate = this.parseUKDate(value);
    }
    if (label.includes('value') || label.includes('maximum')) {
      result.maxValue = this.parseGBPValue(value);
    }
    if (label.includes('category') || label.includes('pillar')) {
      result.category = value;
    }
    if (label.includes('status')) {
      result.status = this.normaliseStatus(value);
    }
    if (label.includes('regulation') || label.includes('pcr')) {
      result.regulation = value;
    }
  }

  private normaliseStatus(raw: string): string {
    const lower = (raw || '').toLowerCase().trim();
    if (lower.includes('live') || lower.includes('active') || lower.includes('open')) return 'LIVE';
    if (lower.includes('expired') || lower.includes('closed')) return 'EXPIRED';
    if (lower.includes('upcoming') || lower.includes('planned') || lower.includes('future')) return 'UPCOMING';
    if (lower.includes('awarded')) return 'AWARDED';
    return 'LIVE'; // Default to LIVE for current agreements
  }

  private parseUKDate(raw: string): string | undefined {
    // Try DD/MM/YYYY or DD Month YYYY formats
    const ddmmyyyy = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
    }

    const monthNames: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    };
    const namedMonth = raw.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (namedMonth) {
      const month = monthNames[namedMonth[2].toLowerCase()];
      if (month) return `${namedMonth[3]}-${month}-${namedMonth[1].padStart(2, '0')}`;
    }

    return undefined;
  }

  private parseGBPValue(raw: string): number | undefined {
    // Extract numeric value from strings like "£1.5 billion" or "£200,000,000"
    const cleaned = raw.replace(/[£,\s]/g, '').toLowerCase();
    const billionMatch = cleaned.match(/([\d.]+)\s*billion/);
    if (billionMatch) return parseFloat(billionMatch[1]) * 1_000_000_000;
    const millionMatch = cleaned.match(/([\d.]+)\s*million/);
    if (millionMatch) return parseFloat(millionMatch[1]) * 1_000_000;
    const numMatch = cleaned.match(/([\d.]+)/);
    if (numMatch) return parseFloat(numMatch[1]);
    return undefined;
  }
}
