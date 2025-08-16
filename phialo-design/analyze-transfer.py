import json

with open('lighthouse-master.json', 'r') as f:
    master = json.load(f)

with open('lighthouse-optimized.json', 'r') as f:
    optimized = json.load(f)

def get_network_metrics(data):
    metrics = {}
    
    # Total bytes
    if 'total-byte-weight' in data['audits']:
        metrics['total_bytes'] = data['audits']['total-byte-weight']['numericValue']
    
    # Resource summary
    if 'resource-summary' in data['audits']:
        items = data['audits']['resource-summary']['details']['items']
        for item in items:
            metrics[item['resourceType']] = item['transferSize']
    
    # Network requests
    if 'network-requests' in data['audits']:
        metrics['total_requests'] = len(data['audits']['network-requests']['details']['items'])
        
    # Main document size
    if 'network-requests' in data['audits']:
        for req in data['audits']['network-requests']['details']['items']:
            if req['resourceType'] == 'Document':
                metrics['document_size'] = req.get('transferSize', 0)
                break
    
    return metrics

master_metrics = get_network_metrics(master)
optimized_metrics = get_network_metrics(optimized)

print("=" * 60)
print("NETWORK TRANSFER SIZE COMPARISON")
print("=" * 60)
print()

def format_bytes(bytes):
    if bytes < 1024:
        return f"{bytes}B"
    elif bytes < 1024 * 1024:
        return f"{bytes/1024:.1f}KB"
    else:
        return f"{bytes/(1024*1024):.2f}MB"

def compare_metric(name, master_val, opt_val):
    if master_val == 0:
        return
    diff = opt_val - master_val
    pct = (diff / master_val * 100)
    
    print(f"{name:20} Master: {format_bytes(master_val):>10}")
    print(f"{' '*20} Optimized: {format_bytes(opt_val):>10}")
    
    if abs(diff) > 100:  # Only show diff if > 100 bytes
        sign = '+' if diff > 0 else ''
        better = '✅' if diff < 0 else '⚠️' if diff > 0 else ''
        print(f"{' '*20} Change: {sign}{format_bytes(abs(diff)):>10} ({sign}{pct:.1f}%) {better}")
    print()

# Compare total bytes
if 'total_bytes' in master_metrics and 'total_bytes' in optimized_metrics:
    print("TOTAL TRANSFER SIZE:")
    print("-" * 40)
    compare_metric("Total", master_metrics['total_bytes'], optimized_metrics['total_bytes'])

# Compare by resource type
print("BY RESOURCE TYPE:")
print("-" * 40)
resource_types = ['Document', 'Script', 'Stylesheet', 'Image', 'Font', 'Other']
for rtype in resource_types:
    if rtype in master_metrics and rtype in optimized_metrics:
        compare_metric(rtype, master_metrics[rtype], optimized_metrics[rtype])

# Network requests
if 'total_requests' in master_metrics and 'total_requests' in optimized_metrics:
    print("NETWORK REQUESTS:")
    print("-" * 40)
    print(f"Master:    {master_metrics['total_requests']} requests")
    print(f"Optimized: {optimized_metrics['total_requests']} requests")
    diff = optimized_metrics['total_requests'] - master_metrics['total_requests']
    if diff != 0:
        print(f"Change:    {'+' if diff > 0 else ''}{diff} requests")

print()
print("=" * 60)
print("NOTE: Local preview server may not show full compression")
print("benefits. Production Cloudflare deployment will show better")
print("compression ratios with Brotli serving from edge locations.")
print("=" * 60)

