import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { PrismaService } from '../common/prisma/prisma.service';

export interface LinkedInProfile {
  profileUrl: string;
  name: string;
  headline?: string;
  company?: string;
  location?: string;
}

export interface LinkedInInboxThread {
  participantName: string;
  participantUrl?: string;
  lastMessage: string;
  lastMessageTime?: string;
  isUnread: boolean;
}

@Injectable()
export class LinkedInBrowserService implements OnModuleDestroy {
  private readonly logger = new Logger(LinkedInBrowserService.name);
  private browser: Browser | null = null;
  private readonly SESSION_TIMEOUT_MS = 120_000;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleDestroy() {
    await this.closeBrowser();
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.logger.log('Launching headless Chromium browser');
      const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
      if (executablePath) {
        this.logger.log(`Using system Chromium at ${executablePath}`);
      }
      this.browser = await chromium.launch({
        headless: true,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  private async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // Ignore close errors
      }
      this.browser = null;
    }
  }

  private async createContext(sessionData?: any): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    const contextOptions: any = {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-GB',
    };
    if (sessionData?.cookies) {
      contextOptions.storageState = sessionData;
    }
    return browser.newContext(contextOptions);
  }

  /**
   * Attempts to log in to LinkedIn using email/password.
   * Returns session data (cookies/storage) for future use.
   */
  async login(
    email: string,
    password: string,
    existingSessionData?: any,
  ): Promise<{ success: boolean; sessionData?: any; error?: string }> {
    let context: BrowserContext | null = null;
    try {
      context = await this.createContext(existingSessionData);
      const page = await context.newPage();
      await page.setDefaultTimeout(this.SESSION_TIMEOUT_MS);

      // Try navigating to feed first (session might still be valid)
      if (existingSessionData) {
        await page.goto('https://www.linkedin.com/feed/', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        if (page.url().includes('/feed')) {
          this.logger.log(`Session still valid for ${email}`);
          const sessionData = await context.storageState();
          return { success: true, sessionData };
        }
      }

      // Navigate to login page
      await page.goto('https://www.linkedin.com/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Fill in credentials
      await page.fill('#username', email);
      await page.fill('#password', password);

      // Add human-like delay
      await page.waitForTimeout(1000 + Math.random() * 2000);

      // Click sign in
      await page.click('[data-litms-control-urn="login-submit"]');

      // Wait for navigation
      await page.waitForTimeout(3000);

      // Check if we hit a challenge/captcha page
      const currentUrl = page.url();
      if (currentUrl.includes('/checkpoint') || currentUrl.includes('/challenge')) {
        this.logger.warn(`LinkedIn verification challenge detected for ${email}`);
        return {
          success: false,
          error:
            'LinkedIn requires additional verification (CAPTCHA or email/phone challenge). Please log in manually in a browser first, then try again.',
        };
      }

      if (currentUrl.includes('/feed') || currentUrl.includes('/mynetwork')) {
        this.logger.log(`Successfully logged in to LinkedIn as ${email}`);
        const sessionData = await context.storageState();
        return { success: true, sessionData };
      }

      // Check for error messages
      const errorElement = await page.$('.form__label--error, #error-for-username, #error-for-password');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        return { success: false, error: `Login failed: ${errorText?.trim() || 'Invalid credentials'}` };
      }

      return { success: false, error: `Login failed — ended up at: ${currentUrl}` };
    } catch (error) {
      const msg = (error as Error).message;
      this.logger.error(`LinkedIn login error for ${email}: ${msg}`);
      return { success: false, error: `Login error: ${msg}` };
    } finally {
      if (context) await context.close();
    }
  }

  /**
   * Fetches the current list of LinkedIn connections for a logged-in account.
   */
  async fetchConnections(
    sessionData: any,
  ): Promise<{ connections: LinkedInProfile[]; error?: string }> {
    let context: BrowserContext | null = null;
    try {
      if (!sessionData) {
        return { connections: [], error: 'No session data — please log in first.' };
      }

      context = await this.createContext(sessionData);
      const page = await context.newPage();
      await page.setDefaultTimeout(this.SESSION_TIMEOUT_MS);

      const connections: LinkedInProfile[] = [];
      let pageNum = 0;
      const MAX_PAGES = 10;

      while (pageNum < MAX_PAGES) {
        const start = pageNum * 40;
        const url = `https://www.linkedin.com/mynetwork/invite-connect/connections/?start=${start}`;

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000 + Math.random() * 1000);

        // Check if redirected to login
        if (page.url().includes('/login') || page.url().includes('/checkpoint')) {
          return { connections, error: 'Session expired — please re-authenticate.' };
        }

        // Scrape connection cards
        const cards = await page.$$('li.mn-connection-card');
        if (cards.length === 0 && pageNum === 0) {
          // Try alternative selector
          const altCards = await page.$$('[data-view-name="connection-card"]');
          if (altCards.length === 0) {
            this.logger.log('No connection cards found — may have reached end or selector changed');
            break;
          }
        }

        if (cards.length === 0) break;

        for (const card of cards) {
          try {
            const nameEl = await card.$('.mn-connection-card__name, .entity-result__title-text');
            const name = nameEl ? (await nameEl.textContent())?.trim() || '' : '';

            const linkEl = await card.$('a[href*="/in/"]');
            const profileUrl = linkEl ? (await linkEl.getAttribute('href')) || '' : '';
            const fullUrl = profileUrl.startsWith('http')
              ? profileUrl.split('?')[0]
              : profileUrl
                ? `https://www.linkedin.com${profileUrl.split('?')[0]}`
                : '';

            const headlineEl = await card.$('.mn-connection-card__occupation');
            const headline = headlineEl ? (await headlineEl.textContent())?.trim() || '' : '';

            if (name && fullUrl) {
              connections.push({
                profileUrl: fullUrl,
                name,
                headline: headline || undefined,
              });
            }
          } catch {
            // Skip individual card errors
          }
        }

        this.logger.log(`Fetched page ${pageNum + 1}: ${cards.length} connections (total: ${connections.length})`);

        // If fewer cards than expected, we've reached the end
        if (cards.length < 20) break;
        pageNum++;

        // Human-like delay between pages
        await page.waitForTimeout(2000 + Math.random() * 3000);
      }

      return { connections };
    } catch (error) {
      const msg = (error as Error).message;
      this.logger.error(`Error fetching connections: ${msg}`);
      return { connections: [], error: `Failed to fetch connections: ${msg}` };
    } finally {
      if (context) await context.close();
    }
  }

  /**
   * Fetches the LinkedIn messaging inbox.
   */
  async fetchInbox(
    sessionData: any,
  ): Promise<{ threads: LinkedInInboxThread[]; error?: string }> {
    let context: BrowserContext | null = null;
    try {
      if (!sessionData) {
        return { threads: [], error: 'No session data — please log in first.' };
      }

      context = await this.createContext(sessionData);
      const page = await context.newPage();
      await page.setDefaultTimeout(this.SESSION_TIMEOUT_MS);

      await page.goto('https://www.linkedin.com/messaging/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(3000);

      if (page.url().includes('/login') || page.url().includes('/checkpoint')) {
        return { threads: [], error: 'Session expired — please re-authenticate.' };
      }

      const threads: LinkedInInboxThread[] = [];

      // Scrape message thread list
      const threadItems = await page.$$('li.msg-conversation-listitem, [data-view-name="msg-conversations-list-item"]');

      for (const item of threadItems) {
        try {
          const nameEl = await item.$('.msg-conversation-listitem__participant-names, .msg-conversation-card__participant-names');
          const participantName = nameEl ? (await nameEl.textContent())?.trim() || 'Unknown' : 'Unknown';

          const linkEl = await item.$('a[href*="/messaging/thread/"]');
          const href = linkEl ? (await linkEl.getAttribute('href')) || '' : '';

          const snippetEl = await item.$('.msg-conversation-listitem__message-snippet, .msg-conversation-card__message-snippet');
          const lastMessage = snippetEl ? (await snippetEl.textContent())?.trim() || '' : '';

          const timeEl = await item.$('.msg-conversation-listitem__time-stamp, time');
          const lastMessageTime = timeEl ? (await timeEl.textContent())?.trim() : undefined;

          const isUnread = await item.evaluate((el: Element) =>
            el.classList.contains('msg-conversation-listitem--unread') ||
            el.querySelector('.msg-conversation-listitem__unread-count') !== null,
          );

          threads.push({
            participantName,
            participantUrl: href || undefined,
            lastMessage,
            lastMessageTime,
            isUnread,
          });
        } catch {
          // Skip individual thread errors
        }
      }

      this.logger.log(`Fetched ${threads.length} inbox threads`);
      return { threads };
    } catch (error) {
      const msg = (error as Error).message;
      this.logger.error(`Error fetching inbox: ${msg}`);
      return { threads: [], error: `Failed to fetch inbox: ${msg}` };
    } finally {
      if (context) await context.close();
    }
  }

  /**
   * Sends a connection request to a LinkedIn profile.
   */
  async sendConnectionRequest(
    sessionData: any,
    profileUrl: string,
    message?: string,
  ): Promise<{ success: boolean; name?: string; error?: string }> {
    let context: BrowserContext | null = null;
    try {
      if (!sessionData) {
        return { success: false, error: 'No session data — please log in first.' };
      }

      context = await this.createContext(sessionData);
      const page = await context.newPage();
      await page.setDefaultTimeout(this.SESSION_TIMEOUT_MS);

      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000 + Math.random() * 2000);

      if (page.url().includes('/login')) {
        return { success: false, error: 'Session expired — please re-authenticate.' };
      }

      // Get the person's name from the profile
      const nameEl = await page.$('h1.text-heading-xlarge, h1');
      const name = nameEl ? (await nameEl.textContent())?.trim() || 'Unknown' : 'Unknown';

      // Look for Connect button
      const connectBtn = await page.$('button:has-text("Connect"), [aria-label*="connect" i]');
      if (!connectBtn) {
        // They might already be connected or the button is in the "More" menu
        const moreBtn = await page.$('button:has-text("More"), [aria-label="More actions"]');
        if (moreBtn) {
          await moreBtn.click();
          await page.waitForTimeout(1000);
          const connectInMenu = await page.$('div[role="menu"] span:has-text("Connect")');
          if (!connectInMenu) {
            return { success: false, name, error: 'Connect button not found — may already be connected.' };
          }
          await connectInMenu.click();
        } else {
          return { success: false, name, error: 'Connect button not found on profile.' };
        }
      } else {
        await connectBtn.click();
      }

      await page.waitForTimeout(1500);

      // If there's a custom message option
      if (message) {
        const addNoteBtn = await page.$('button:has-text("Add a note")');
        if (addNoteBtn) {
          await addNoteBtn.click();
          await page.waitForTimeout(500);
          const textarea = await page.$('#custom-message, textarea[name="message"]');
          if (textarea) {
            await textarea.fill(message);
          }
        }
      }

      // Click Send
      const sendBtn = await page.$('button:has-text("Send"), button[aria-label="Send now"]');
      if (sendBtn) {
        await sendBtn.click();
        await page.waitForTimeout(2000);
        this.logger.log(`Connection request sent to ${name} (${profileUrl})`);
        return { success: true, name };
      }

      return { success: false, name, error: 'Could not find the send button.' };
    } catch (error) {
      const msg = (error as Error).message;
      this.logger.error(`Error sending connection request: ${msg}`);
      return { success: false, error: `Failed to send request: ${msg}` };
    } finally {
      if (context) await context.close();
    }
  }

  /**
   * Sends a message to a LinkedIn connection via browser automation.
   */
  async sendMessage(
    sessionData: any,
    profileUrl: string,
    content: string,
  ): Promise<{ success: boolean; error?: string }> {
    let context: BrowserContext | null = null;
    try {
      if (!sessionData) {
        return { success: false, error: 'No session data — please log in first.' };
      }

      context = await this.createContext(sessionData);
      const page = await context.newPage();
      await page.setDefaultTimeout(this.SESSION_TIMEOUT_MS);

      // Navigate to the profile and open message overlay
      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      if (page.url().includes('/login')) {
        return { success: false, error: 'Session expired — please re-authenticate.' };
      }

      const messageBtn = await page.$('button:has-text("Message"), [aria-label*="message" i]');
      if (!messageBtn) {
        return { success: false, error: 'Message button not found on profile.' };
      }

      await messageBtn.click();
      await page.waitForTimeout(2000);

      // Type message into the message input
      const msgInput = await page.$('div.msg-form__contenteditable, div[role="textbox"]');
      if (!msgInput) {
        return { success: false, error: 'Message input not found.' };
      }

      await msgInput.fill(content);
      await page.waitForTimeout(500);

      // Click send
      const sendBtn = await page.$('button.msg-form__send-button, button[type="submit"]:has-text("Send")');
      if (!sendBtn) {
        return { success: false, error: 'Send button not found.' };
      }

      await sendBtn.click();
      await page.waitForTimeout(2000);

      this.logger.log(`Message sent to ${profileUrl}`);
      return { success: true };
    } catch (error) {
      const msg = (error as Error).message;
      this.logger.error(`Error sending message: ${msg}`);
      return { success: false, error: `Failed to send message: ${msg}` };
    } finally {
      if (context) await context.close();
    }
  }
}
