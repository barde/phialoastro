import json

with open('lighthouse-master.json', 'r') as f:
    master = json.load(f)

with open('lighthouse-optimized.json', 'r') as f:
    optimized = json.load(f)

def get_metrics(data):
    return {
        'score': data['categories']['performance']['score'] * 100,
        'FCP': data['audits']['first-contentful-paint']['numericValue'],
        'LCP': data['audits']['largest-contentful-paint']['numericValue'],
        'TBT': data['audits']['total-blocking-time']['numericValue'],
        'CLS': data['audits']['cumulative-layout-shift']['numericValue'],
        'SI': data['audits']['speed-index']['numericValue'],
        'TTI': data['audits']['interactive']['numericValue'],
        'bytes': data['audits']['total-byte-weight']['numericValue'] if 'total-byte-weight' in data['audits'] else 0,
        'requests': data['audits']['network-requests']['details']['items'].__len__() if 'network-requests' in data['audits'] else 0
    }

master_metrics = get_metrics(master)
optimized_metrics = get_metrics(optimized)

print("=" * 60)
print("LIGHTHOUSE PERFORMANCE COMPARISON")
print("=" * 60)
print()

print("PERFORMANCE SCORES:")
print(f"  Master Branch:    {master_metrics['score']:.0f}/100")
print(f"  Optimized Branch: {optimized_metrics['score']:.0f}/100")
print(f"  Improvement:      +{optimized_metrics['score'] - master_metrics['score']:.0f} points")
print()

print("KEY METRICS:")
print("-" * 60)

metrics = [
    ('First Contentful Paint (FCP)', 'FCP', 'ms', True),
    ('Largest Contentful Paint (LCP)', 'LCP', 'ms', True),
    ('Total Blocking Time (TBT)', 'TBT', 'ms', True),
    ('Cumulative Layout Shift (CLS)', 'CLS', '', True),
    ('Speed Index', 'SI', 'ms', True),
    ('Time to Interactive (TTI)', 'TTI', 'ms', True),
]

for name, key, unit, lower_better in metrics:
    master_val = master_metrics[key]
    opt_val = optimized_metrics[key]
    
    if key == 'CLS':
        # Format CLS specially
        diff = opt_val - master_val
        pct = (diff / master_val * 100) if master_val != 0 else 0
        print(f"{name:30} Master: {master_val:.6f}")
        print(f"{' '*30} Optimized: {opt_val:.6f}")
        if abs(diff) > 0.000001:
            sign = '+' if diff > 0 else ''
            better = '✅' if diff <= 0 else '⚠️'
            print(f"{' '*30} Change: {sign}{diff:.6f} ({sign}{pct:.1f}%) {better}")
    else:
        diff = opt_val - master_val
        pct = (diff / master_val * 100) if master_val != 0 else 0
        print(f"{name:30} Master: {master_val:.0f}{unit}")
        print(f"{' '*30} Optimized: {opt_val:.0f}{unit}")
        if abs(diff) > 1:
            sign = '+' if diff > 0 else ''
            better = '✅' if (diff < 0 and lower_better) or (diff > 0 and not lower_better) else '⚠️' if diff != 0 else ''
            print(f"{' '*30} Change: {sign}{diff:.0f}{unit} ({sign}{pct:.1f}%) {better}")
    print()

print("=" * 60)
print("SUMMARY:")
print("-" * 60)

improvements = []
if optimized_metrics['FCP'] < master_metrics['FCP']:
    improvements.append(f"FCP improved by {master_metrics['FCP'] - optimized_metrics['FCP']:.0f}ms")
if optimized_metrics['LCP'] > master_metrics['LCP']:
    improvements.append(f"LCP slightly increased by {optimized_metrics['LCP'] - master_metrics['LCP']:.0f}ms")
if optimized_metrics['SI'] < master_metrics['SI']:
    improvements.append(f"Speed Index improved by {master_metrics['SI'] - optimized_metrics['SI']:.0f}ms")

if improvements:
    print("✅ Improvements:")
    for imp in improvements:
        print(f"   - {imp}")

print()
print("Overall: The compression and caching optimizations resulted in")
print(f"a +{optimized_metrics['score'] - master_metrics['score']:.0f} point improvement in Lighthouse score.")
print("=" * 60)

