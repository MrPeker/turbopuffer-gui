# Vector Search Guide

turbopuffer supports vector search with filtering. Vectors are incrementally indexed in an SPFresh vector index for performant search. Writes appear in search results immediately.

The vector index is automatically tuned for 90-100% recall ("accuracy"). We automatically monitor recall for production queries. You can use the recall endpoint to test yourself.