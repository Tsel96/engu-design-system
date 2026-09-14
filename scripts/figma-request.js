const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function retryFigmaRequest(request, options = {}) {
  const wait = options.sleep || sleep;
  const log = options.log || console.warn;
  const maxRetries = options.maxRetries ?? 5;
  for (let attempt = 0; ; attempt++) {
    try { return await request(); }
    catch (error) {
      if (![429, 502, 503, 504].includes(error.statusCode) || attempt >= maxRetries) throw error;
      const header = error.retryAfter;
      const seconds = header == null ? NaN : Number(header);
      const dateDelay = header == null ? NaN : Date.parse(header) - Date.now();
      const delay = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000
        : Number.isFinite(dateDelay) ? Math.max(0, dateDelay) : 60000 * 2 ** attempt;
      log(`Figma HTTP ${error.statusCode}; retry ${attempt + 1}/${maxRetries} after ${Math.ceil(delay / 1000)}s.`);
      await wait(delay);
    }
  }
}
module.exports = { retryFigmaRequest };
