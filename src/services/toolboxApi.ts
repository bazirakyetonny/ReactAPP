import { apiPost } from "./apiClient";

export async function releaseToolbox(): Promise<void> {
  await apiPost("/api/toolbox/v2/release-toolbox");
}
