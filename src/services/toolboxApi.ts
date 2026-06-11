import { apiPost } from "./apiClient";

export async function releaseToolbox(isActive: boolean): Promise<void> {
  await apiPost("/api/toolbox/v2/release-toolbox", { IsActive: isActive });
}
