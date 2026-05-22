import { apiGet, apiPost } from './apiClient';

export interface ProductService {
  ProductServiceId: string;
  ProductServiceName: string;
  ProductServiceDescription: string;
  ProductServiceImage: string;
}

export interface SupplierForm {
  FormId: string;
  FormName: string;
  [key: string]: unknown;
}

export interface TrnLocation {
  LocationId: string;
  LocationDescription: string;
  LocationImage: string;
  ReceptionDescription: string;
  ReceptionImage: string;
  [key: string]: unknown;
}

export function getServices(): Promise<ProductService[]> {
  return apiGet<{ SDT_ProductServiceCollection: ProductService[] }>('/api/toolbox/services').then(
    (d) => d.SDT_ProductServiceCollection ?? []
  );
}

export function getSupplierForms(supplierId: string): Promise<SupplierForm[]> {
  return apiGet<{ Forms: SupplierForm[] }>(
    '/api/toolbox/v2/supplier-forms',
    { Supplierid: supplierId }
  ).then((d) => d.Forms ?? []);
}

export function getProductService(productServiceId: string): Promise<ProductService> {
  return apiGet<{ SDT_ProductService: ProductService }>(
    '/api/productservice',
    { Productserviceid: productServiceId }
  ).then((d) => d.SDT_ProductService);
}

export interface UpdateServicePayload {
  productServiceId: string;
  productServiceDescription: string;
  productServiceImageBase64?: string;
}

export function updateService(payload: UpdateServicePayload): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/update-service', {
    ProductServiceId: payload.productServiceId,
    ProductServiceDescription: payload.productServiceDescription,
    ProductServiceImageBase64: payload.productServiceImageBase64 ?? '',
  }).then(() => undefined);
}

export function deleteServiceImage(productServiceId: string): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/delete-service-image', {
    ProductServiceId: productServiceId,
  }).then(() => undefined);
}

export function getLocation(): Promise<TrnLocation> {
  return apiGet<{ BC_Trn_Location: TrnLocation }>('/api/toolbox/v2/get-location').then(
    (d) => d.BC_Trn_Location
  );
}

export interface UpdateLocationPayload {
  locationDescription?: string;
  locationImageBase64?: string;
  receptionDescription?: string;
  receptionImageBase64?: string;
}

export function updateLocation(payload: UpdateLocationPayload): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/update-location', {
    LocationDescription: payload.locationDescription ?? '',
    LocationImageBase64: payload.locationImageBase64 ?? '',
    ReceptionDescription: payload.receptionDescription ?? '',
    ReceptionImageBase64: payload.receptionImageBase64 ?? '',
  }).then(() => undefined);
}

export function getResidentPackages(): Promise<unknown[]> {
  return apiGet<{ Packages: unknown[] }>('/api/toolbox/v2/resident-packages').then(
    (d) => d.Packages ?? []
  );
}
