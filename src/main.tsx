import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { dataStore } from "./data/datastore";

export function createWidget(
  themes: any[],
  Suppliers: any[],
  SDT_ProductServiceCollection: any[],
  SDT_DynamicFormsCollection: any[],
  BC_Trn_MediaCollection: any[],
  CurrentThemeId: any,
  Current_Version: any,
  OrganisationLogo: any,
  Current_Language: any,
  HasMultiLingualSupport: boolean,
  SupportedLanguages: any[],
  UserRoles: any[],
  ResidentPackages: any[],
  Moods: any[],
  TemplatesCollection: any[],
  BC_Trn_TemplateCollection: any[],
  Mode: string,
  PreviewLink: string,
  isBusy: boolean,
) {
  dataStore.set("themes", themes);
  dataStore.set("Suppliers", Suppliers);
  dataStore.set("SDT_ProductServiceCollection", SDT_ProductServiceCollection);
  dataStore.set("SDT_DynamicFormsCollection", SDT_DynamicFormsCollection);
  dataStore.set("BC_Trn_MediaCollection", BC_Trn_MediaCollection);
  dataStore.set("CurrentThemeId", CurrentThemeId);
  dataStore.set("Current_Version", Current_Version);
  dataStore.set("OrganisationLogo", OrganisationLogo);
  dataStore.set("Current_Language", Current_Language);
  dataStore.set("HasMultiLingualSupport", HasMultiLingualSupport);
  dataStore.set("SupportedLanguages", SupportedLanguages);
  dataStore.set("UserRoles", UserRoles);
  dataStore.set("ResidentPackages", ResidentPackages);
  dataStore.set("Moods", Moods);
  dataStore.set("TemplatesCollection", TemplatesCollection);
  dataStore.set("BC_Trn_TemplateCollection", BC_Trn_TemplateCollection);
  dataStore.set("Mode", Mode);
  dataStore.set("PreviewLink", PreviewLink);
  dataStore.set("isBusy", isBusy);
  // console.log("Suppliers", Suppliers);
  // console.log("SDT_ProductServiceCollection", SDT_ProductServiceCollection);
  // console.log("SDT_DynamicFormsCollection", SDT_DynamicFormsCollection);
  // console.log("BC_Trn_MediaCollection", BC_Trn_MediaCollection);
  // console.log("CurrentThemeId", CurrentThemeId);
  // console.log("Current_Version", Current_Version);
  // console.log("OrganisationLogo", OrganisationLogo);
  // console.log("Current_Language", Current_Language);
  // console.log("HasMultiLingualSupport", HasMultiLingualSupport);
  // console.log("SupportedLanguages", SupportedLanguages);
  // console.log("UserRoles", UserRoles);
  // console.log("ResidentPackages", ResidentPackages);
  // console.log("Moods", Moods);
  // console.log("Themes", themes);
  // console.log("TemplatesCollection", TemplatesCollection);
  // console.log("BC_Trn_TemplateCollection", BC_Trn_TemplateCollection);
  // console.log("Mode", Mode);
  // console.log("Previewlink", Previewlink);
  // console.log("IsBusy", isBusy);

  document
    .querySelector(".CellContentHolder")
    ?.classList.remove("CellContentHolder");

  return createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
