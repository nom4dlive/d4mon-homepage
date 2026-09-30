import glob
import urllib.request
import ssl
from html.parser import HTMLParser

class LinkExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.current_a = None

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            attr_dict = dict(attrs)
            self.current_a = {
                'href': attr_dict.get('href', '').strip(),
                'target': attr_dict.get('target', ''),
                'rel': attr_dict.get('rel', ''),
                'download': attr_dict.get('download', None),
                'text': ''
            }

    def handle_endtag(self, tag):
        if tag == 'a' and self.current_a:
            self.links.append(self.current_a)
            self.current_a = None

    def handle_data(self, data):
        if self.current_a:
            self.current_a['text'] += data.strip() + ' '

files = glob.glob(r"D:\Design\00 Nomad\Damon\Site\*.html")
all_records = []
external_links = set()

for f in sorted(files):
    fname = f.split("\\")[-1]
    with open(f, 'r', encoding='utf-8') as fp:
        html = fp.read()
    
    parser = LinkExtractor()
    parser.feed(html)
    
    for l in parser.links:
        l['file'] = fname
        l['text'] = l['text'].strip()
        all_records.append(l)
        if l['href'].startswith('http'):
            external_links.add(l['href'])

print(f"Total HTML files analyzed: {len(files)}")
print(f"Total anchor links found: {len(all_records)}")
print("\n" + "="*85)
print(f"{'FILE':<16} | {'HREF':<32} | {'TEXT':<18} | {'TARGET':<8} | {'REL':<15}")
print("="*85)

for r in all_records:
    print(f"{r['file']:<16} | {r['href']:<32} | {r['text'][:16]:<18} | {r['target']:<8} | {r['rel']:<15}")

print("\n" + "="*85)
print(f"TESTING EXTERNAL LINKS LIVE REACHABILITY ({len(external_links)} unique):")
print("="*85)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for url in sorted(external_links):
    try:
        req = urllib.request.Request(url, headers=headers, method='HEAD')
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            print(f"✓ [{resp.status}] {url}")
    except Exception as e:
        try:
            req = urllib.request.Request(url, headers=headers, method='GET')
            with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
                print(f"✓ [{resp.status}] (GET) {url}")
        except Exception as e2:
            print(f"✗ [FAIL] {url} -> {e2}")
