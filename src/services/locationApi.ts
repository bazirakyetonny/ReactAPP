import { apiGet } from './apiClient';

export interface SDTLocation {
  LocationId: string;
  PublishedActiveAppVersionId: string;
  ActiveAppVersionId: string;
  LocationName: string;
}

export function getLocation(): Promise<SDTLocation> {
  return apiGet<{ BC_Trn_Location: SDTLocation }>(
    '/api/toolbox/v2/get-location',
  ).then((d) => d.BC_Trn_Location);
}
