import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { applyOverrides, buildOverrideMap, fetchActiveOverrides } from "@/lib/image-overrides";

/**
 * Applies admin-uploaded image replacements across the whole site.
 *
 * Mounted once in the root route. Components keep importing their original
 * asset — this swaps the rendered source when an admin has replaced that slot
 * in Admin > Images, so no code change is needed to publish new photography.
 */
export function ImageOverrideProvider() {
  const { data } = useQuery({
    queryKey: ["image-slot-overrides", "active"],
    queryFn: fetchActiveOverrides,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (!data || data.length === 0) return;
    return applyOverrides(buildOverrideMap(data));
  }, [data]);

  return null;
}
