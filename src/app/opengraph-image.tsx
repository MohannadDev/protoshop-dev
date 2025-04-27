/**
 * Generates the OpenGraph image for social sharing.
 * By customizing this, you can ensure that your site looks great when shared on social media.
 */
import OpengraphImage from "@/components/opengraph-image";

export const runtime = "edge"; // Run at the edge for fast response

export default async function Image() {
  return await OpengraphImage();
}
