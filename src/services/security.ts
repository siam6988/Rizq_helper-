import fpPromise from '@fingerprintjs/fingerprintjs';

export interface InitialSecurityState {
  country: string;
  isVPN: boolean;
  deviceId: string;
}

const fetchWithTimeout = async (url: string, timeout = 1500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export async function runSecurityAndFetchCountry(): Promise<InitialSecurityState> {
  let isVPN = false;
  let globalCountry = 'Unknown';
  let deviceId = 'unknown-device';

  try {
    const fp = await fpPromise.load();
    const result = await fp.get();
    deviceId = result.visitorId;
  } catch (e) {
    console.error("Fingerprint failed", e);
  }

  try {
    // LAYER 1: ipapi.co (Highly reliable)
    const r1 = await fetchWithTimeout('https://ipapi.co/json/', 1500);
    const d1 = await r1.json();
    
    if (d1.country_name) {
      globalCountry = d1.country_name;
      // Keyword Blacklist Scanning
      const org = (d1.org || '').toLowerCase();
      const badWords = ['vpn', 'proxy', 'hosting', 'datacenter', 'cloud', 'digitalocean', 'aws', 'amazon', 'tor'];
      if (badWords.some((w) => org.includes(w))) isVPN = true;
    } else {
      throw new Error('API 1 Failed');
    }
  } catch (e1) {
    try {
      // LAYER 2: ipwho.is (Secondary VPN Check)
      const r2 = await fetchWithTimeout('https://ipwho.is/', 1500);
      const d2 = await r2.json();
      
      if (d2.success) {
        globalCountry = d2.country;
        if (d2.security && (d2.security.vpn || d2.security.proxy || d2.security.tor)) {
          isVPN = true;
        }
      } else {
        throw new Error('API 2 Failed');
      }
    } catch (e2) {
      try {
        // LAYER 3: Cloudflare (Bulletproof, fast, Country Only - fallback)
        const r3 = await fetchWithTimeout('https://1.1.1.1/cdn-cgi/trace', 1500);
        const text = await r3.text();
        const locMatch = text.match(/loc=(.*)/);
        
        if (locMatch && locMatch[1]) {
          globalCountry = locMatch[1];
          try {
            const display = new Intl.DisplayNames(['en'], { type: 'region' });
            globalCountry = display.of(locMatch[1]) || locMatch[1];
          } catch (err) {
            // Ignore error if DisplayNames isn't supported or fails
          }
        }
      } catch (e3) {
        globalCountry = 'Global';
      }
    }
  }

  return { country: globalCountry, isVPN, deviceId };
}
