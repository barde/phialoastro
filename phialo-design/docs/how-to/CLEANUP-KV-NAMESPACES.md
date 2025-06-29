# How to Clean Up Old KV Namespaces

After migrating to Workers static assets, the old KV namespaces are no longer needed and can be cleaned up to free storage space.

## ⚠️ Important Warning

**Only perform this cleanup AFTER confirming the static assets migration is working properly in all environments!**

## Prerequisites

- Cloudflare API token with KV permissions
- Wrangler CLI installed
- Successful deployment with static assets confirmed

## Step 1: List Existing KV Namespaces

```bash
npx wrangler kv namespace list
```

Look for namespaces related to Workers Sites:
- Names containing `__STATIC_CONTENT`
- Names related to your worker (e.g., `phialo-design`, `phialo-design-preview`)

## Step 2: Identify Safe-to-Delete Namespaces

KV namespaces that can be deleted:
- `__phialo-design-phialo-design__STATIC_CONTENT`
- `__phialo-design-preview-phialo-design-preview__STATIC_CONTENT`
- Any PR preview namespaces: `__phialo-pr-*__STATIC_CONTENT`

## Step 3: Check Namespace Contents (Optional)

To verify a namespace contains only static assets:

```bash
# List keys in a namespace
npx wrangler kv key list --namespace-id=<NAMESPACE_ID>

# Check a specific key
npx wrangler kv key get <KEY> --namespace-id=<NAMESPACE_ID>
```

## Step 4: Delete KV Namespaces

```bash
# Delete a specific namespace
npx wrangler kv namespace delete --namespace-id=<NAMESPACE_ID>
```

## Step 5: Clean Up Bindings

After deleting namespaces, remove any KV bindings from your Worker settings in the Cloudflare dashboard:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages
3. Select your worker
4. Go to Settings → Variables
5. Remove any KV namespace bindings

## Automation Script

Create a cleanup script for multiple namespaces:

```bash
#!/bin/bash
# cleanup-kv.sh

echo "Listing KV namespaces..."
npx wrangler kv namespace list

echo ""
echo "⚠️  This will delete KV namespaces used by Workers Sites"
echo "Make sure the static assets migration is working properly!"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Add namespace IDs to delete here
    NAMESPACES=(
        # "namespace-id-1"
        # "namespace-id-2"
    )
    
    for NS_ID in "${NAMESPACES[@]}"
    do
        echo "Deleting namespace: $NS_ID"
        npx wrangler kv namespace delete --namespace-id="$NS_ID" --force
    done
    
    echo "Cleanup complete!"
else
    echo "Cleanup cancelled."
fi
```

## Verification

After cleanup:
1. Verify your site still works: `https://phialo.de`
2. Check preview deployments still work
3. Confirm no errors in Worker logs: `npx wrangler tail`

## Rollback

If you need to rollback to Workers Sites:
1. The KV namespaces will be recreated automatically on next deployment
2. Revert the code changes from the migration
3. Deploy with the old configuration

## Storage Savings

Expected savings after cleanup:
- ~500MB freed from KV storage
- Return to well under free tier limits
- No more storage accumulation from deployments