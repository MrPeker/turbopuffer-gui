/**
 * Reciprocal Rank Fusion (RRF)
 *
 * Combines multiple ranked result lists into a single fused list. For each
 * document, scores from each list are summed as `1 / (k + rank)` where
 * `rank` is the document's 0-indexed position in that list. Documents not
 * present in a list contribute 0 from that list.
 *
 * RRF is rank-based rather than score-based, which is what makes it
 * appropriate for fusing incompatible scoring systems (e.g. vector cosine
 * scores in [0, 1] with BM25 scores in [0, ∞)). No normalization needed.
 *
 * Reference: Turbopuffer docs (`turbopuffer-docs/turbopuffer.com_docs_hybrid.md`),
 * Cormack et al. 2009, "Reciprocal Rank Fusion outperforms Condorcet and
 * individual Rank Learning Methods".
 */

import type { Document } from "../../types/document";

/**
 * The constant added to ranks before reciprocation. 60 is the value
 * Cormack recommends and the value the Turbopuffer docs use as the
 * canonical example. Lower values weight high-ranked items more aggressively.
 */
export const DEFAULT_RRF_K = 60;

export interface FusedDocument extends Document {
  /**
   * The RRF score assigned during fusion. Attached for diagnostics and so
   * downstream views can sort or display it. Not part of the Turbopuffer
   * Document shape itself.
   */
  $rrf_score: number;
}

/**
 * Fuses multiple ranked document lists via Reciprocal Rank Fusion.
 *
 * @param resultLists  Ranked result arrays. Order within each list is
 *                     significant: index 0 is the top result.
 * @param k            RRF smoothing constant (default 60). Must be > 0.
 * @returns            Documents sorted by descending RRF score, each
 *                     annotated with `$rrf_score`. Order within ties is
 *                     stable in insertion order.
 */
export function reciprocalRankFusion(
  resultLists: Document[][],
  k: number = DEFAULT_RRF_K
): FusedDocument[] {
  if (k <= 0) {
    throw new Error(`RRF k must be > 0, got ${k}`);
  }

  // Track running scores per id, preserving first-seen document object so
  // ties resolve in insertion order across all source lists.
  const byId = new Map<string | number, { doc: Document; score: number; firstSeen: number }>();
  let insertionCounter = 0;

  for (const list of resultLists) {
    list.forEach((doc, rank) => {
      const rrfContribution = 1 / (k + rank);
      const existing = byId.get(doc.id);
      if (existing) {
        existing.score += rrfContribution;
      } else {
        byId.set(doc.id, { doc, score: rrfContribution, firstSeen: insertionCounter++ });
      }
    });
  }

  return Array.from(byId.values())
    .sort((a, b) => {
      // Primary: descending RRF score.
      if (b.score !== a.score) return b.score - a.score;
      // Tie-break: stable insertion order.
      return a.firstSeen - b.firstSeen;
    })
    .map(({ doc, score }) => ({ ...doc, $rrf_score: score }));
}
