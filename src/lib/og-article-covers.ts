/**
 * Knowledge-hub article covers cropped to exactly 1200x630 for social previews.
 * Keyed by the original (in-page) cover asset URL so routes can swap the
 * rendered hero image for its OG derivative without changing article data.
 */
import src_k01 from "@/assets/knowledge/01_blueprint.jpg";
import src_k03 from "@/assets/knowledge/03_3d_factory.jpg";
import src_k06 from "@/assets/knowledge/06_production_line.jpg";
import src_k07 from "@/assets/knowledge/07_laminator.jpg";
import src_k14 from "@/assets/knowledge/14_polyol.jpg";
import src_k16 from "@/assets/knowledge/16_rockwool.jpg";
import src_k17 from "@/assets/knowledge/17_pir_panel.jpg";
import src_k21 from "@/assets/knowledge/21_coldroom_panel.jpg";
import src_k23 from "@/assets/knowledge/23_cleanroom.jpg";
import src_k26 from "@/assets/knowledge/26_industrial_bldg.jpg";
import src_k28 from "@/assets/knowledge/28_fire_rating.jpg";
import src_k33 from "@/assets/knowledge/33_layout.jpg";
import src_k36 from "@/assets/knowledge/36_investment_report.jpg";
import og_k01 from "@/assets/og/knowledge/01_blueprint.jpg";
import og_k03 from "@/assets/og/knowledge/03_3d_factory.jpg";
import og_k06 from "@/assets/og/knowledge/06_production_line.jpg";
import og_k07 from "@/assets/og/knowledge/07_laminator.jpg";
import og_k14 from "@/assets/og/knowledge/14_polyol.jpg";
import og_k16 from "@/assets/og/knowledge/16_rockwool.jpg";
import og_k17 from "@/assets/og/knowledge/17_pir_panel.jpg";
import og_k21 from "@/assets/og/knowledge/21_coldroom_panel.jpg";
import og_k23 from "@/assets/og/knowledge/23_cleanroom.jpg";
import og_k26 from "@/assets/og/knowledge/26_industrial_bldg.jpg";
import og_k28 from "@/assets/og/knowledge/28_fire_rating.jpg";
import og_k33 from "@/assets/og/knowledge/33_layout.jpg";
import og_k36 from "@/assets/og/knowledge/36_investment_report.jpg";

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
