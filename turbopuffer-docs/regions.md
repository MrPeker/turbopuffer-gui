# Regions

turbopuffer supports multiple regions, choose the one closest to your backend.

| Region | URL | Location |
| --- | --- | --- |
| gcp-us-central1 | gcp-us-central1.turbopuffer.com | Iowa |
| gcp-us-west1 | gcp-us-west1.turbopuffer.com | Oregon |
| gcp-us-east4 | gcp-us-east4.turbopuffer.com | N. Virginia |
| gcp-northamerica-northeast2 | gcp-northamerica-northeast2.turbopuffer.com | Toronto |
| gcp-europe-west3 | gcp-europe-west3.turbopuffer.com | Frankfurt |
| gcp-asia-southeast1 | gcp-asia-southeast1.turbopuffer.com | Singapore |
| aws-ap-southeast-2 | aws-ap-southeast-2.turbopuffer.com | Sydney |
| aws-eu-central-1 | aws-eu-central-1.turbopuffer.com | Frankfurt |
| aws-us-east-1 | aws-us-east-1.turbopuffer.com | N. Virginia |
| aws-us-east-2 | aws-us-east-2.turbopuffer.com | Ohio |
| aws-us-west-2 | aws-us-west-2.turbopuffer.com | Oregon |

We support Azure for "Deploy in your VPC", but no public regions yet. Contact us if you need a public Azure region.

In addition to these public clusters, we run dedicated clusters in various other regions for single-tenancy customers and in any region inside your VPC in AWS, GCP and Azure (BYOC). We can spin up dedicated or BYOC clusters in hours upon request, contact us. We will continue to expand public regions with demand.

To move data between regions, use the export and write APIs with a client for each region.

## Cross-Cloud Latency

Since response times for vector search are typically above 10ms, the contribution of cross-cloud latency is generally acceptable. Traffic within a cloud provider's region is lower latency (< 1ms) than cross-cloud traffic (1-10ms), even if the providers are geographically close. For larger customers, cross-cloud interconnects can be set up to reduce network latency.

## Cross-Cloud Egress Fees

A common misconception is that as long as your vendor is in the same Cloud as you (e.g. AWS ↔️ AWS), you will be charged lower networking fees. This is generally not the case, as most providers' API endpoints point to public IPs that route through the public internet, unless you've set up a private connect (see below; you'll know if you have). Any traffic leaving your VPC incurs $0.05-0.09/GB Internet egress fees (AWS / GCP/ Azure).

Egress networking fees are charged to you on your bill by your provider. For larger customers, we will work with you to set up AWS Private Link, GCP Private Service Connect, Azure Private Link or an interconnect to reduce networking fees to $0.01/GB. Unless you're transferring tens of billions of vectors per month, this is unlikely to have a large effect on your bill (1B vectors = 6TB would be $600 of egress, not a significant issue).