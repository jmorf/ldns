// WHOIS server lookup by TLD
// Reference: https://www.iana.org/assignments/registrar-ids/registrar-ids.xhtml
const WHOIS_SERVERS: Record<string, string> = {
  // Generic TLDs
  'com': 'whois.verisign-grs.com',
  'net': 'whois.verisign-grs.com',
  'org': 'whois.pir.org',
  'info': 'whois.afilias.net',
  'biz': 'whois.biz',
  'name': 'whois.nic.name',
  'mobi': 'whois.dotmobiregistry.net',
  'pro': 'whois.registrypro.pro',
  'aero': 'whois.aero',
  'asia': 'whois.nic.asia',
  'cat': 'whois.nic.cat',
  'coop': 'whois.nic.coop',
  'jobs': 'whois.nic.jobs',
  'museum': 'whois.nic.museum',
  'tel': 'whois.nic.tel',
  'travel': 'whois.nic.travel',
  'xxx': 'whois.nic.xxx',

  // New gTLDs (popular ones)
  'app': 'whois.nic.google',
  'dev': 'whois.nic.google',
  'page': 'whois.nic.google',
  'how': 'whois.nic.google',
  'soy': 'whois.nic.google',
  'chrome': 'whois.nic.google',
  'gmail': 'whois.nic.google',
  'youtube': 'whois.nic.google',
  'docs': 'whois.nic.google',
  'cloud': 'whois.nic.google',
  'io': 'whois.nic.io',
  'co': 'whois.nic.co',
  'me': 'whois.nic.me',
  'cc': 'ccwhois.verisign-grs.com',
  'ws': 'whois.website.ws',
  'blog': 'whois.nic.blog',
  'xyz': 'whois.nic.xyz',
  'online': 'whois.nic.online',
  'site': 'whois.nic.site',
  'tech': 'whois.nic.tech',
  'store': 'whois.nic.store',
  'fun': 'whois.nic.fun',
  'space': 'whois.nic.space',
  'website': 'whois.nic.website',
  'club': 'whois.nic.club',
  'top': 'whois.nic.top',
  'work': 'whois.nic.work',
  'live': 'whois.nic.live',
  'shop': 'whois.nic.shop',

  // Country code TLDs
  'ac': 'whois.nic.ac',
  'ad': 'whois.nic.ad',
  'ae': 'whois.aeda.net.ae',
  'af': 'whois.nic.af',
  'ag': 'whois.nic.ag',
  'ai': 'whois.nic.ai',
  'al': 'whois.ripe.net',
  'am': 'whois.amnic.net',
  'ao': 'whois.dns.ao',
  'aq': 'whois.nic.aq',
  'ar': 'whois.nic.ar',
  'as': 'whois.nic.as',
  'at': 'whois.nic.at',
  'au': 'whois.auda.org.au',
  'aw': 'whois.nic.aw',
  'ax': 'whois.ax',
  'az': 'whois.az',
  'ba': 'whois.nic.ba',
  'bb': 'whois.nic.bb',
  'bd': 'whois.btcl.net.bd',
  'be': 'whois.dns.be',
  'bf': 'whois.nic.bf',
  'bg': 'whois.register.bg',
  'bh': 'whois.nic.bh',
  'bi': 'whois1.nic.bi',
  'bj': 'whois.nic.bj',
  'bm': 'whois.nic.bm',
  'bn': 'whois.bnnic.bn',
  'bo': 'whois.nic.bo',
  'br': 'whois.registro.br',
  'bs': 'whois.nic.bs',
  'bt': 'whois.nic.bt',
  'bw': 'whois.nic.net.bw',
  'by': 'whois.cctld.by',
  'bz': 'whois.afilias-grs.info',
  'ca': 'whois.cira.ca',
  'cd': 'whois.nic.cd',
  'cf': 'whois.dot.cf',
  'cg': 'whois.nic.cg',
  'ch': 'whois.nic.ch',
  'ci': 'whois.nic.ci',
  'ck': 'whois.nic.ck',
  'cl': 'whois.nic.cl',
  'cm': 'whois.netcom.cm',
  'cn': 'whois.cnnic.cn',
  'cr': 'whois.nic.cr',
  'cu': 'whois.nic.cu',
  'cv': 'whois.nic.cv',
  'cw': 'whois.nic.cw',
  'cx': 'whois.nic.cx',
  'cy': 'whois.nic.cy',
  'cz': 'whois.nic.cz',
  'de': 'whois.denic.de',
  'dj': 'whois.nic.dj',
  'dk': 'whois.dk-hostmaster.dk',
  'dm': 'whois.nic.dm',
  'do': 'whois.nic.do',
  'dz': 'whois.nic.dz',
  'ec': 'whois.nic.ec',
  'ee': 'whois.tld.ee',
  'eg': 'whois.nic.eg',
  'es': 'whois.nic.es',
  'et': 'whois.nic.et',
  'eu': 'whois.eu',
  'fi': 'whois.fi',
  'fj': 'whois.nic.fj',
  'fk': 'whois.nic.fk',
  'fm': 'whois.nic.fm',
  'fo': 'whois.nic.fo',
  'fr': 'whois.nic.fr',
  'ga': 'whois.dot.ga',
  'gd': 'whois.nic.gd',
  'ge': 'whois.nic.ge',
  'gf': 'whois.nic.gf',
  'gg': 'whois.gg',
  'gh': 'whois.nic.gh',
  'gi': 'whois2.afilias-grs.net',
  'gl': 'whois.nic.gl',
  'gm': 'whois.nic.gm',
  'gn': 'whois.nic.gn',
  'gp': 'whois.nic.gp',
  'gq': 'whois.dominio.gq',
  'gr': 'grwhois.ics.forth.gr',
  'gs': 'whois.nic.gs',
  'gt': 'whois.gt',
  'gu': 'whois.nic.gu',
  'gw': 'whois.nic.gw',
  'gy': 'whois.registry.gy',
  'hk': 'whois.hkirc.hk',
  'hm': 'whois.registry.hm',
  'hn': 'whois.nic.hn',
  'hr': 'whois.dns.hr',
  'ht': 'whois.nic.ht',
  'hu': 'whois.nic.hu',
  'id': 'whois.pandi.or.id',
  'ie': 'whois.weare.ie',
  'il': 'whois.isoc.org.il',
  'im': 'whois.nic.im',
  'in': 'whois.registry.in',
  'iq': 'whois.cmc.iq',
  'ir': 'whois.nic.ir',
  'is': 'whois.isnic.is',
  'it': 'whois.nic.it',
  'je': 'whois.je',
  'jm': 'whois.nic.jm',
  'jo': 'whois.nic.jo',
  'jp': 'whois.jprs.jp',
  'ke': 'whois.kenic.or.ke',
  'kg': 'whois.kg',
  'kh': 'whois.nic.kh',
  'ki': 'whois.nic.ki',
  'km': 'whois.nic.km',
  'kn': 'whois.nic.kn',
  'kr': 'whois.kr',
  'kw': 'whois.nic.kw',
  'ky': 'whois.nic.ky',
  'kz': 'whois.nic.kz',
  'la': 'whois.nic.la',
  'lb': 'whois.lbdr.org.lb',
  'lc': 'whois.afilias-grs.info',
  'li': 'whois.nic.li',
  'lk': 'whois.nic.lk',
  'lr': 'whois.nic.lr',
  'ls': 'whois.nic.ls',
  'lt': 'whois.domreg.lt',
  'lu': 'whois.dns.lu',
  'lv': 'whois.nic.lv',
  'ly': 'whois.nic.ly',
  'ma': 'whois.registre.ma',
  'mc': 'whois.nic.mc',
  'md': 'whois.nic.md',
  'mg': 'whois.nic.mg',
  'mh': 'whois.nic.mh',
  'mk': 'whois.marnet.mk',
  'ml': 'whois.dot.ml',
  'mm': 'whois.nic.mm',
  'mn': 'whois.nic.mn',
  'mo': 'whois.monic.mo',
  'mp': 'whois.nic.mp',
  'mq': 'whois.nic.mq',
  'mr': 'whois.nic.mr',
  'ms': 'whois.nic.ms',
  'mt': 'whois.nic.mt',
  'mu': 'whois.nic.mu',
  'mv': 'whois.nic.mv',
  'mw': 'whois.nic.mw',
  'mx': 'whois.mx',
  'my': 'whois.mynic.my',
  'mz': 'whois.nic.mz',
  'na': 'whois.na-nic.com.na',
  'nc': 'whois.nc',
  'ne': 'whois.nic.ne',
  'nf': 'whois.nic.nf',
  'ng': 'whois.nic.net.ng',
  'ni': 'whois.nic.ni',
  'nl': 'whois.domain-registry.nl',
  'no': 'whois.norid.no',
  'np': 'whois.nic.np',
  'nr': 'whois.nic.nr',
  'nu': 'whois.iis.nu',
  'nz': 'whois.irs.net.nz',
  'om': 'whois.nic.om',
  'pa': 'whois.nic.pa',
  'pe': 'whois.nic.pe',
  'pf': 'whois.nic.pf',
  'pg': 'whois.nic.pg',
  'ph': 'whois.nic.ph',
  'pk': 'whois.pknic.net.pk',
  'pl': 'whois.dns.pl',
  'pm': 'whois.nic.pm',
  'pn': 'whois.nic.pn',
  'pr': 'whois.nic.pr',
  'ps': 'whois.nic.ps',
  'pt': 'whois.dns.pt',
  'pw': 'whois.nic.pw',
  'py': 'whois.nic.py',
  'qa': 'whois.registry.qa',
  're': 'whois.nic.re',
  'ro': 'whois.rotld.ro',
  'rs': 'whois.rnids.rs',
  'ru': 'whois.tcinet.ru',
  'rw': 'whois.ricta.org.rw',
  'sa': 'whois.nic.net.sa',
  'sb': 'whois.nic.sb',
  'sc': 'whois.nic.sc',
  'sd': 'whois.nic.sd',
  'se': 'whois.iis.se',
  'sg': 'whois.sgnic.sg',
  'sh': 'whois.nic.sh',
  'si': 'whois.register.si',
  'sk': 'whois.sk-nic.sk',
  'sl': 'whois.nic.sl',
  'sm': 'whois.nic.sm',
  'sn': 'whois.nic.sn',
  'so': 'whois.nic.so',
  'sr': 'whois.nic.sr',
  'ss': 'whois.nic.ss',
  'st': 'whois.nic.st',
  'su': 'whois.tcinet.ru',
  'sv': 'whois.nic.sv',
  'sx': 'whois.sx',
  'sy': 'whois.nic.sy',
  'sz': 'whois.nic.sz',
  'tc': 'whois.nic.tc',
  'td': 'whois.nic.td',
  'tf': 'whois.nic.tf',
  'tg': 'whois.nic.tg',
  'th': 'whois.thnic.co.th',
  'tj': 'whois.nic.tj',
  'tk': 'whois.dot.tk',
  'tl': 'whois.nic.tl',
  'tm': 'whois.nic.tm',
  'tn': 'whois.ati.tn',
  'to': 'whois.tonic.to',
  'tr': 'whois.trabis.gov.tr',
  'tt': 'whois.nic.tt',
  'tv': 'whois.nic.tv',
  'tw': 'whois.twnic.net.tw',
  'tz': 'whois.tznic.or.tz',
  'ua': 'whois.ua',
  'ug': 'whois.co.ug',
  'uk': 'whois.nic.uk',
  'us': 'whois.nic.us',
  'uy': 'whois.nic.org.uy',
  'uz': 'whois.cctld.uz',
  'va': 'whois.nic.va',
  'vc': 'whois.afilias-grs.info',
  've': 'whois.nic.ve',
  'vg': 'whois.nic.vg',
  'vi': 'whois.nic.vi',
  'vn': 'whois.vnnic.vn',
  'vu': 'whois.nic.vu',
  'wf': 'whois.nic.wf',
  'yt': 'whois.nic.yt',
  'za': 'whois.registry.net.za',
  'zm': 'whois.nic.zm',
  'zw': 'whois.nic.zw',

  // Second-level domains
  'co.uk': 'whois.nic.uk',
  'org.uk': 'whois.nic.uk',
  'me.uk': 'whois.nic.uk',
  'ltd.uk': 'whois.nic.uk',
  'plc.uk': 'whois.nic.uk',
  'net.uk': 'whois.nic.uk',
  'sch.uk': 'whois.nic.uk',
  'ac.uk': 'whois.nic.uk',
  'gov.uk': 'whois.nic.uk',
  'nhs.uk': 'whois.nic.uk',
  'police.uk': 'whois.nic.uk',
  'mod.uk': 'whois.nic.uk',
  'com.au': 'whois.auda.org.au',
  'net.au': 'whois.auda.org.au',
  'org.au': 'whois.auda.org.au',
  'edu.au': 'whois.auda.org.au',
  'gov.au': 'whois.auda.org.au',
  'asn.au': 'whois.auda.org.au',
  'id.au': 'whois.auda.org.au',
};

export interface WhoisResponse {
  raw: string;
  parsed: {
    domainName: string;
    registrar: string | null;
    created: string | null;
    updated: string | null;
    expires: string | null;
    nameservers: string[];
    status: string[];
  };
  whoisServer: string;
}

/**
 * Get the TLD from a domain name
 */
function getTld(domain: string): string {
  const parts = domain.toLowerCase().split('.');
  if (parts.length < 2) return '';

  // Check for second-level TLDs first (e.g., co.uk)
  if (parts.length >= 3) {
    const secondLevel = parts.slice(-2).join('.');
    if (WHOIS_SERVERS[secondLevel]) {
      return secondLevel;
    }
  }

  return parts[parts.length - 1];
}

/**
 * Find the WHOIS server for a domain
 */
function getWhoisServer(domain: string): string | null {
  const tld = getTld(domain);
  return WHOIS_SERVERS[tld] || null;
}

/**
 * Query a WHOIS server using Cloudflare's TCP socket API
 */
async function queryWhoisTcp(server: string, domain: string): Promise<string> {
  // Dynamic import - only available in Cloudflare Workers runtime
  const { connect } = await import('cloudflare:sockets');

  const socket = connect(
    { hostname: server, port: 43 },
    { allowHalfOpen: true }
  );

  // Wait for connection to be established
  await socket.opened;

  const writer = socket.writable.getWriter();
  const encoder = new TextEncoder();

  // Send the domain query followed by CRLF
  await writer.write(encoder.encode(`${domain}\r\n`));
  // Release the writer but don't close the socket yet
  writer.releaseLock();

  // Read the response, bounded so a hostile/buggy registry can't stream an
  // unbounded body and exhaust the Worker.
  const MAX_WHOIS_BYTES = 256 * 1024;
  const reader = socket.readable.getReader();
  const decoder = new TextDecoder();
  let response = '';
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value?.length ?? 0;
    response += decoder.decode(value, { stream: true });
    if (total >= MAX_WHOIS_BYTES) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      break;
    }
  }

  // Close the socket
  await socket.close();

  return response;
}

/**
 * Parse raw WHOIS response into structured data
 */
function parseWhoisResponse(raw: string, domain: string): WhoisResponse['parsed'] {
  const lines = raw.split('\n');
  const result: WhoisResponse['parsed'] = {
    domainName: domain,
    registrar: null,
    created: null,
    updated: null,
    expires: null,
    nameservers: [],
    status: [],
  };

  // Common field patterns (case-insensitive)
  const patterns: Record<string, RegExp[]> = {
    registrar: [
      /^registrar:\s*(.+)/i,
      /^registrar name:\s*(.+)/i,
      /^sponsoring registrar:\s*(.+)/i,
    ],
    created: [
      /^creat(?:ed|ion) date:\s*(.+)/i,
      /^registration date:\s*(.+)/i,
      /^registered on:\s*(.+)/i,
      /^created:\s*(.+)/i,
      /^domain registration date:\s*(.+)/i,
    ],
    updated: [
      /^updated date:\s*(.+)/i,
      /^last updated:\s*(.+)/i,
      /^last modified:\s*(.+)/i,
      /^modified:\s*(.+)/i,
      /^changed:\s*(.+)/i,
    ],
    expires: [
      /^expir(?:y|ation|es) date:\s*(.+)/i,
      /^registry expiry date:\s*(.+)/i,
      /^registrar registration expiration date:\s*(.+)/i,
      /^paid-till:\s*(.+)/i,
      /^expiry:\s*(.+)/i,
    ],
    nameserver: [
      /^name server:\s*(.+)/i,
      /^nameserver:\s*(.+)/i,
      /^nserver:\s*(.+)/i,
      /^ns\d*:\s*(.+)/i,
    ],
    status: [
      /^domain status:\s*(.+)/i,
      /^status:\s*(.+)/i,
    ],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%') || trimmed.startsWith('#')) continue;

    // Check each pattern group
    for (const [field, regexes] of Object.entries(patterns)) {
      for (const regex of regexes) {
        const match = trimmed.match(regex);
        if (match) {
          const value = match[1].trim();
          if (field === 'nameserver') {
            // Nameservers: extract hostname, ignore IP if present
            const ns = value.split(/\s+/)[0].toLowerCase();
            if (ns && !result.nameservers.includes(ns)) {
              result.nameservers.push(ns);
            }
          } else if (field === 'status') {
            // Status: extract status code before URL
            const status = value.split(/\s+/)[0];
            if (status && !result.status.includes(status)) {
              result.status.push(status);
            }
          } else if (field === 'registrar' && !result.registrar) {
            result.registrar = value;
          } else if (field === 'created' && !result.created) {
            result.created = value;
          } else if (field === 'updated' && !result.updated) {
            result.updated = value;
          } else if (field === 'expires' && !result.expires) {
            result.expires = value;
          }
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Query WHOIS data for a domain
 */
export async function queryWhoisServer(domain: string): Promise<WhoisResponse> {
  const normalizedDomain = domain.toLowerCase().trim();
  const whoisServer = getWhoisServer(normalizedDomain);

  if (!whoisServer) {
    throw new Error(`No WHOIS server found for TLD of ${normalizedDomain}`);
  }

  try {
    const raw = await queryWhoisTcp(whoisServer, normalizedDomain);

    if (!raw || raw.length < 50) {
      throw new Error('Empty or invalid WHOIS response');
    }

    const parsed = parseWhoisResponse(raw, normalizedDomain);

    return {
      raw,
      parsed,
      whoisServer,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`WHOIS query failed for ${normalizedDomain}: ${error.message}`);
    }
    throw new Error(`WHOIS query failed for ${normalizedDomain}`);
  }
}
