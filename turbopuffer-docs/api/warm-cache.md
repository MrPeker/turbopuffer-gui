# Warm cache

## GET /v1/namespaces/:namespace/hint_cache_warm

Warm the cache for a namespace.

Hints to turbopuffer that it should warm up the NVMe cache for the specified namespace.

turbopuffer responds to the request once the cache warming operation has been started. It does not wait for the operation to complete, which can take multiple minutes for large namespaces.

### Billing

If the cache is already warm, or if there is already a cache warming operation in progress for the namespace, this request is free.

Otherwise, this request is billed as a query that returns zero rows.

### Use cases

A common use case is for applications to send cache warming hints for all namespaces associated with a user whenever a user begins a new session, so that users don't experience cold latency when they trigger their first turbopuffer query.