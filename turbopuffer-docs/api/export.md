# Export documents

To export all documents in a namespace, use the query API to page through documents by advancing a filter on the id attribute.

Documents inserted while the export is in progress will be included.

A common use-case for this is to copy your all documents to a different namespace after some client-side transformation. To copy documents without transformation, use copy_from_namespace for a more efficient server-side copy (follow with delete_by_filter to copy only a subset of documents).