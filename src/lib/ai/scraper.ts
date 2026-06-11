import * as cheerio from 'cheerio';

export const searchCompanyIntel = async (companyName: string, role: string): Promise<string> => {
  try {
    const query = encodeURIComponent(`"${companyName}" ${role} interview questions India ambitionbox glassdoor`);
    const url = `https://html.duckduckgo.com/html/?q=${query}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      console.error(`[Scraper] Search failed with status ${response.status}`);
      return '';
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const snippets: string[] = [];
    $('.result__snippet').each((i, el) => {
      if (i < 5) snippets.push($(el).text().trim());
    });

    const links: string[] = [];
    $('.result__url').each((i, el) => {
      const rawHref = $(el).attr('href');
      if (rawHref && rawHref.includes('uddg=')) {
        const urlParams = new URLSearchParams(rawHref.split('?')[1]);
        const actualUrl = urlParams.get('uddg');
        if (actualUrl && links.length < 3) {
          links.push(actualUrl);
        }
      }
    });

    let jinaMarkdown = '';
    if (links.length > 0) {
      console.log(`[Scraper] Fetching ${links.length} pages via Jina AI...`);
      const jinaPromises = links.map(link => 
        fetch(`https://r.jina.ai/${link}`)
          .then(res => res.ok ? res.text() : '')
          .catch(() => '')
      );
      
      const jinaResults = await Promise.allSettled(jinaPromises);
      
      jinaResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          // Truncate to 2500 chars to avoid prompt token explosion
          jinaMarkdown += result.value.substring(0, 2500) + '\n\n---\n\n';
        }
      });
    }

    let finalContext = '';
    if (snippets.length > 0) {
      finalContext += `SEARCH SNIPPETS:\n${snippets.join('\n\n')}\n\n`;
    }
    if (jinaMarkdown.length > 0) {
      finalContext += `FULL PAGE EXTRACTS:\n${jinaMarkdown}`;
    }

    return finalContext.trim();
  } catch (error) {
    console.error('[Scraper] Error scraping data:', error);
    return '';
  }
};
