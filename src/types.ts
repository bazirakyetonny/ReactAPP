import { DateTime } from "i18n-js";

export interface ActionPage {
  PageId: string;
  PageName: string;
  TileName: string;
  PageType: string;
}

export interface CategoryTemplates {
  TemplateCategoryId: string;
  TemplateCategoryName: string;
  Versions: AppVersion[];
}

export interface AppVersion {
  AppVersionId: string;
  AppVersionName: string;
  AppVersionOwner?: "Organisation" | "Location" | "Admin";
  LocationId?: string;
  OrganisationId?: string;
  IsActive: boolean;
  IsReadOnly?: boolean;
  AppVersionLanguage: string;
  AppVersionMultiLanguages: string;
  ThemeId: string;
  Pages?: Page[];
  IsPublishedTemplate?: boolean;
  AppVersionDescription?: string;
  TemplateCategoryId: string;
  TemplateCategoryName: string;
  MoodId?: string;
}

export interface CallToAction {
  CallToActionType: string;
  CallToActionEmail: string;
  CallToActionPhoneNumber: string;
  CallToActionUrl: string;
  CallToActionName: string;
  CallToActionId: string;
}

export interface Category {
  name: string;
  displayName: string;
  label: string;
  options: ActionPage[];
  canCreatePage: boolean;
}

export interface CtaAttributes {
  CtaId: string;
  CtaType: string;
  CtaLabel?: string;
  CtaAction?: string;
  CtaColor?: string;
  CtaBGColor?: string;
  CtaButtonType?: string;
  CtaButtonImgUrl?: string;
  CtaButtonIcon?: string;
  CtaSupplierIsConnected?: boolean;
  CtaConnectedSupplierId?: string;
  Action?: {};
}

export interface DebugResults {
  Summary: {
    TotalUrls: string;
    SuccessCount: string;
    FailureCount: string;
  };
  Pages: {
    Page: string;
    PageId: string;
    UrlList: UrlEntry[];
  }[];
}

interface AnalysisMessage {
  AnalyzeMessageInfoContentItemId: string;
  AnalyzeMessageContentItemType: string;
  AnalyzeMessageItemId: string;
  AnalyzeMessageText: string;
}

interface PageAnalysis {
  PageAnalysisPageId: string;
  PageAnalysisPageName: string;
  PageAnalysisMessages: AnalysisMessage[];
}

interface VersionAnalysis {
  VersionAnalysisLanguage: string;
  VersionAnalysisMessages: PageAnalysis[];
}

export type AnalysisResult = VersionAnalysis[];

export type UrlEntry = {
  Url: string;
  StatusCode: string;
  StatusMessage: string;
  AffectedType: string;
  AffectedName: string;
  AffectedInfoId: string;
  UrlType: "ImgUrl" | "ActionUrl";
  AffectedTileId?: string;
  IsFixed?: boolean;
};

export const defaultUrlEntry: Pick<UrlEntry, "IsFixed"> = {
  IsFixed: false,
};

export interface TranslationStructure {
  PageName: string;
  PageStructure: PageStructure;
}

export interface PageStructure {
  InfoContent: InfoType[];
}

export interface InfoType {
  InfoId: string;
  InfoType: string;
  InfoValue?: string;
  InfoPositionId?: string;
  CtaAttributes?: CtaAttributes;
  Tiles?: Tile[];
  Images?: Image[];
  Columns?: Column[];
}

export interface Image {
  InfoImageId: string;
  InfoImageValue?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  name?: string;
  action: (categoryItems?: any[]) => void;
  expandable?: boolean;
  isConnectedFromHome?: boolean;
}

export interface SelectOptionConfig<DropdownOption> {
  labelField: keyof DropdownOption;
  valueField: keyof DropdownOption;
  placeholder?: string;
}

export interface SupplierList {
  SupplierGenId: string;
  SupplierGenKvkNumber: string;
  SupplierGenTypeId: string;
  SupplierGenCompanyName: string;
  SupplierGenAddressCountry: string;
  SupplierGenAddressCity: string;
  SupplierGenAddressZipCode: string;
  SupplierGenAddressLine1: string;
  SupplierGenAddressLine2: string;
  SupplierGenContactName: string;
  SupplierGenContactPhone: string;
  SupplierGenPhoneCode: string;
  SupplierGenPhoneNumber: string;
  SupplierGenEmail: string;
  SupplierGenWebsite: string;
  OrganisationId: string;
}

export interface Template {
  Id: string;
  Rows: Array<{
    Id: string;
    Tiles: Array<{
      Id: string;
      Name: string;
      Text: string;
      Color: string;
      Align: string;
      Icon: string;
      BGColor: string;
      BGImageUrl: string;
      Opacity: string;
      Action: {
        ObjectType: string;
        ObjectId: string;
        ObjectUrl: string;
      };
    }>;
  }>;
}

export interface Column {
  ColId: string;
  Tiles: Tile[];
}

export interface Tile {
  Id: string;
  Name?: string;
  Text?: string;
  Color?: string;
  Align?: string;
  Icon?: string;
  BGColor?: string;
  BGImageUrl?: string;
  Size?: string | number;
  Height?: string | number;
  OriginalImageUrl?: string;
  Opacity?: number;
  Permissions?: [];
  Action?: {
    ObjectType?: string;
    ObjectId?: string;
    ObjectUrl?: string;
    FormId?: number;
  };
  BGSize?: string;
  BGPosition?: string;
  Left?: string;
  Top?: string;
}

export interface TrashItem {
  Type: string;
  Page: any;
  Version: AppVersion;
  DeletedAt: DateTime;
  TrashId: string;
}

export interface TrashItems {
  TrashItems: TrashItem[];
}

export interface ThemeColors {
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  buttonBGColor: string;
  buttonTextColor: string;
  cardBgColor: string;
  cardTextColor: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}

export interface ThemeIcon {
  IconId: string;
  IconName: string;
  IconCategory: string;
  IconSVG: string;
  IconCodeName?: string;
}

export interface ThemeCtaColor {
  CtaColorName: string;
  CtaColorCode: string;
  CtaColorId: string;
}

export interface Theme {
  ThemeId: string;
  ThemeName: string;
  ThemeFontFamily: string;
  ThemeFontSize: number;
  ThemeColors: ThemeColors;
  ThemeCtaColors: ThemeCtaColor[];
  ThemeIcons: ThemeIcon[];
  Icons: [];
}

export interface Form {
  FormId: string;
  ReferenceName: string;
  FormUrl: string;
}

export interface Media {
  MediaId: string;
  MediaName: string;
  MediaImage?: Uint8Array | null;
  MediaImage_GXI?: string | null;
  MediaSize: number;
  MediaType: string;
  MediaUrl: string;
}

export interface Page {
  PageId: string;
  PageName: string;
  IsPredefined: boolean;
  PageStructure: string; // JSON string representation
  PageType: "Information" | "Calendar" | "MyActivity" | "Map" | "BulletinBoard";
  PageThumbnailUrl: string;
  PageInfoStructure: PageInfoStructure;
}

export interface PageInfoStructure {
  InfoContent: InfoType[];
}

export interface PreviewStructure {
  Page: Page;
  ThemeName: string;
  ThemeId: string;
  Version: AppVersion;
  PageStructure: PageStructure;
  AppVersionDescription?: string;
}

export interface ProductService {
  ProductServiceId: string;
  LocationId: string;
  OrganisationId: string;
  ProductServiceName: string;
  ProductServiceTileName: string;
  ProductServiceDescription: string;
  ProductServiceImage: Uint8Array;
  ProductServiceImage_GXI?: string | null;
  ProductServiceGroup: string;
  SupplierGenId?: string | null;
  SupplierAGBId?: string | null;
  ProductServiceClass: string;
}

export interface ResizeState {
  isResizing: boolean;
  isDragging: boolean;
  resizingRowHeight: number;
  resizingRow: HTMLDivElement | null;
  resizingRowParent: HTMLDivElement | null;
  resizeYStart: number;
  initialHeight: number;
  templateBlock: HTMLDivElement | null;
  affectedElements: HTMLElement[] | null;
  originalCursors: string[] | null;
  resizeOverlay: HTMLDivElement | null;
  infoSectionSpacer: HTMLDivElement | null;
  frameChildren: HTMLDivElement[];
  columnComponent: any;
}

export interface TileHeights {
  min: number;
  medium: number;
  max: number;
  snapThreshold: number;
}

export interface SelectedImage {
  Id: string;
  Url: string;
}

export type ImageType = "info" | "tile" | "content" | "cta";

export interface SupportedLanguages {
  value: string;
  label: string;
  flag: string;
}

export interface VersionData {
  Name: string;
  Description: string;
  Language: string;
  Languages: string[];
  CompositionOption: string;
  ThemeId?: string;
  Pages?: Page[];
  MoodId?: string;
}

export interface TemplateSkeleton {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  images: {
    name: string;
    image: string;
  }[];
}

interface ExtractedInfo {
  nature_of_business: string;
  products_services: string;
  location: string;
  call_to_actions: string;
  target_customers: string;
}

export interface ExtractionResult {
  extracted_info: ExtractedInfo;
  status: string;
  missing_fields: string[];
  response: string;
  progress: string;
  next_question: string | null;
  final_summary: string | null;
}

export interface VersionPageTemplate {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  pageStructure?: PageStructure;
}

export interface TabContent {
  id: string;
  title: string;
  description: string;
  type: "template" | "empty" | "generate-ai" | "admin-template";
  themeId: string;
  image: string;
  pagesStructure?: Page[];
  moodId?: string;
}

export interface TabData {
  title: string;
  content: TabContent[];
}

export interface VersionHistoryItem {
  AppVersionId: string;
  VersionHistoryNumber: number;
  DateTime: string;
  PublisherName: string;
  Name: string;
  Description: string;
  Language: string;
  Languages: string[];
  CompositionOption: string;
  ThemeId?: string;
  Pages?: Page[];
  MoodId?: string;
}

export interface Mood {
  MoodId: string;
  MoodName: string;
  ThemeId: string;
  ThemeName: string;
  MoodColorNames: string;
  MoodColors: MoodColor[];
}

export interface MoodColor {
  MoodColorId: string;
  ColorId: string;
  ColorCode: string;
  ColorName: string;
  MoodColorCode: string;
}

export interface TileDropPreview {
  targetGridId: string;
  targetColId: string;
  insertIndex: number;
  newColumn: boolean;
  insertColAfterColId: string | null;
  isColumnSwap: boolean;
  valid: boolean;
  slotHeight?: number;
}

export interface BlockInsertPreview {
  insertBeforeInfoId: string | null;
}
