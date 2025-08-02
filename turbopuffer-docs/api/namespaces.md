# List namespaces

## GET /v1/namespaces

Paginate through your namespaces.

### Parameters

**cursor** string (optional)

retrieve the next page of results (pass next_cursor from the response payload)

**prefix** string (optional)

retrieve only namespaces that match the prefix, e.g. foo would return foo and foo-bar.

**page_size** string (default: 100)

limit the number of results per page (max of 1000)