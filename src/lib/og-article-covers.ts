/**
 * Knowledge-hub article covers cropped to exactly 1200x630 for social previews.
 * Keyed by the original (in-page) cover asset URL so routes can swap the
 * rendered hero image for its OG derivative without changing article data.
 */
import src_k01 from "@/assets/knowledge/01-blueprint.jpg";
import src_k03 from "@/assets/knowledge/03-3d-factory.jpg";
import src_k06 from "@/assets/knowledge/06-production-line.jpg";
import src_k07 from "@/assets/knowledge/07-laminator.jpg";
import src_k14 from "@/assets/knowledge/14-polyol.jpg";
import src_k16 from "@/assets/knowledge/16-rockwool.jpg";
import src_k17 from "@/assets/knowledge/17-pir-panel.jpg";
import src_k21 from "@/assets/knowledge/21-coldroom-panel.jpg";
import src_k23 from "@/assets/knowledge/23-cleanroom.jpg";
import src_k26 from "@/assets/knowledge/26-industrial-bldg.jpg";
import src_k28 from "@/assets/knowledge/28-fire-rating.jpg";
import src_k33 from "@/assets/knowledge/33-layout.jpg";
import src_k36 from "@/assets/knowledge/36-investment-report.jpg";
import og_k01 from "@/assets/og/knowledge/01-blueprint.jpg";
import og_k03 from "@/assets/og/knowledge/03-3d-factory.jpg";
import og_k06 from "@/assets/og/knowledge/06-production-line.jpg";
import og_k07 from "@/assets/og/knowledge/07-laminator.jpg";
import og_k14 from "@/assets/og/knowledge/14-polyol.jpg";
import og_k16 from "@/assets/og/knowledge/16-rockwool.jpg";
import og_k17 from "@/assets/og/knowledge/17-pir-panel.jpg";
import og_k21 from "@/assets/og/knowledge/21-coldroom-panel.jpg";
import og_k23 from "@/assets/og/knowledge/23-cleanroom.jpg";
import og_k26 from "@/assets/og/knowledge/26-industrial-bldg.jpg";
import og_k28 from "@/assets/og/knowledge/28-fire-rating.jpg";
import og_k33 from "@/assets/og/knowledge/33-layout.jpg";
import og_k36 from "@/assets/og/knowledge/36-investment-report.jpg";

export const OG_ARTICLE_COVERS: Record<string, string> = {
  [src_k01]: og_k01,
  [src_k03]: og_k03,
  [src_k06]: og_k06,
  [src_k07]: og_k07,
  [src_k14]: og_k14,
  [src_k16]: og_k16,
  [src_k17]: og_k17,
  [src_k21]: og_k21,
  [src_k23]: og_k23,
  [src_k26]: og_k26,
  [src_k28]: og_k28,
  [src_k33]: og_k33,
  [src_k36]: og_k36,
};

/** Return the 1200x630 OG derivative for an article cover, or the cover itself. */
export function ogCoverFor(cover: string): string {
  return OG_ARTICLE_COVERS[cover] ?? cover;
}
