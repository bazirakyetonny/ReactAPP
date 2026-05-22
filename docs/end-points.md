---
noteId: "d6c3efb054cd11f1ad532b9446e7aeb2"
tags: []

---

# Toolbox API Endpoint Reference

Base URL: `window.location.origin` (production) or `window.location.origin + process.env.ENVIRONMENT` (localhost).  
Auth: admin session cookie set by GeneXus — no explicit auth header needed.  
All responses include an `error` field (`{ Message: string, Type: string }`). On `Message === "Not Authenticated"` the consuming app should re-authenticate.

---

## App Versions

### GET /api/toolbox/v2/appversions
Returns all app versions for the current location.

**Response**
```json
{
  "AppVersions": [ SDT_AppVersion ],
  "error": SDT_Error
}
```

---

### GET /api/toolbox/v2/appversion
Returns the currently active app version.

**Response**
```json
{
  "AppVersion": SDT_AppVersion,
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/create-appversion
Creates a new app version.

**Request body**
```json
{
  "AppVersionName": "string",
  "AppVersionDescription": "string",
  "AppVersionLanguage": "string",
  "IsActive": false,
  "TranslateLanguages": "[\"nl\",\"fr\"]",
  "MoodId": "00000000-0000-0000-0000-000000000000",
  "ThemeId": "00000000-0000-0000-0000-000000000000",
  "VersionTemplatePagesCollection": [],
  "TemplateCategoryId": "00000000-0000-0000-0000-000000000000"
}
```

> `TranslateLanguages` is a JSON-stringified array, not a raw array.  
> `MoodId`, `ThemeId`, `TemplateCategoryId` use the zero UUID when omitted.

**Response**
```json
{
  "AppVersion": SDT_AppVersion,
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/copy-appversion
Duplicates an existing app version under a new name.

**Request body**
```json
{
  "AppVersionId": "uuid",
  "AppVersionName": "string"
}
```

**Response**
```json
{
  "AppVersion": SDT_AppVersion,
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/copy-history-version
Creates a new version from a historical snapshot.

**Request body**
```json
{
  "AppVersionId": "uuid",
  "AppVersionHistoryNumber": 1,
  "AppVersionName": "string"
}
```

---

### POST /api/toolbox/v2/restore-history-version
Restores the active version to a historical snapshot in-place.

**Request body**
```json
{
  "AppVersionId": "uuid",
  "AppVersionHistoryNumber": 1
}
```

---

### POST /api/toolbox/v2/update-appversion
Updates the name and/or description of a version.

**Request body**
```json
{
  "AppVersionId": "uuid",
  "AppVersionName": "string",
  "AppVersionDescription": "string"
}
```

**Response**
```json
{
  "AppVersion": SDT_AppVersion,
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/update-appversion-category
Assigns a template category to a version.

**Request body**
```json
{
  "AppVersionId": "uuid",
  "TemplateCategoryId": "uuid"
}
```

---

### POST /api/toolbox/v2/activate-appversion
Sets a version as the active (live) version.

**Request body**
```json
{
  "AppVersionId": "uuid"
}
```

**Response**
```json
{
  "AppVersion": SDT_AppVersion,
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/delete-version

**Request body**
```json
{
  "AppVersionId": "uuid"
}
```

**Response**
```json
{
  "result": "string",
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/create-ai-appversion
Creates a version from an AI-generated structure.

**Request body**
```json
{
  "AppVersion": { }
}
```

---

### POST /api/toolbox/v2/update-version-translation-languages
Sets which languages this version should be translated into.

**Request body**
```json
{
  "AppVersionId": "uuid",
  "TranslateLanguages": "[\"nl\",\"fr\"]"
}
```

> `TranslateLanguages` is a JSON-stringified array.

---

### POST /api/toolbox/v2/publish-appversion

**Request body**
```json
{
  "AppVersionId": "uuid",
  "Notify": false
}
```

**Response** `SDT_Error`

---

### GET /api/toolbox/v2/app-version-history?AppVersionId={uuid}
Returns history snapshots for a version.

---

## Pages

### GET /api/toolbox/pages/list
Returns a flat list of all pages for the active version.

**Response**
```json
{
  "SDT_PageCollection": [ SDT_Page ],
  "error": SDT_Error
}
```

> The app extracts `response.SDT_PageCollection` before returning to callers.

---

### GET /api/toolbox/singlepage?Pageid={uuid}
Returns a single page with its full tile/structure data.

**Response**
```json
{
  "SDT_Page": SDT_Page,
  "error": SDT_Error
}
```

---

### GET /api/toolbox/pages/tree
Returns the page hierarchy used to render the sidebar navigation tree.

**Response**
```json
{
  "SDT_PageStructureCollection": [ SDT_PageStructure ],
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/create-menu-page

**Request body**
```json
{
  "appVersionId": "uuid",
  "pageName": "string"
}
```

**Response**
```json
{
  "MenuPage": [ SDT_AppVersion.Pages_PagesItem ],
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/create-info-page

**Request body**
```json
{
  "appVersionId": "uuid",
  "pageName": "string"
}
```

**Response** same shape as `create-menu-page`.

---

### POST /api/toolbox/v2/create-link-page

**Request body**
```json
{
  "appVersionId": "uuid",
  "pageName": "string",
  "url": "string",
  "WWPFormId": 0,
  "WWPFormReferenceName": "string"
}
```

**Response** same shape as `create-menu-page`.

---

### POST /api/toolbox/v2/create-service-page

**Request body**
```json
{
  "appVersionId": "uuid",
  "ProductServiceId": "uuid"
}
```

**Response**
```json
{
  "ContentPage": [ SDT_AppVersion.Pages_PagesItem ],
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/create-content-page

**Request body**
```json
{
  "appVersionId": "uuid",
  "PageName": "string"
}
```

**Response**
```json
{
  "result": "string",
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/create-service-cta
Body is an arbitrary payload object describing the CTA configuration.

---

### POST /api/toolbox/v2/save-page
Persists the full PageStructure JSON for a page (auto-save).

**Request body**
```json
{
  "AppVersionId": "uuid",
  "PageId": "uuid",
  "PageName": "string",
  "PageType": "string",
  "PageStructure": "string"
}
```

**Response** `SDT_Error`

---

### POST /api/toolbox/v2/save-page-thumbnail

**Request body**
```json
{
  "PageId": "uuid",
  "PageThumbnailData": "base64string"
}
```

**Response** `SDT_Error`

---

### POST /api/toolbox/v2/update-page-title

**Request body**
```json
{
  "AppVersionId": "uuid",
  "PageId": "uuid",
  "PageName": "string"
}
```

**Response** `SDT_Error`

---

### POST /api/toolbox/v2/delete-page

**Request body**
```json
{
  "AppVersionId": "uuid",
  "PageId": "uuid"
}
```

**Response**
```json
{
  "AppVersion": SDT_AppVersion,
  "error": SDT_Error
}
```

---

### POST /api/toolbox/create-page
Legacy create-page without version context.

**Request body**
```json
{
  "PageName": "string",
  "PageJsonContent": "{}"
}
```

**Response**
```json
{
  "result": "string",
  "error": SDT_Error
}
```

---

### POST /api/toolbox/update-pages-batch
Updates ordering or visibility of multiple pages at once.

**Request body**
```json
{
  "PagesList": [ SDT_PublishPage ],
  "IsNotifyResidents": false
}
```

**Response**
```json
{
  "result": "string",
  "error": SDT_Error
}
```

---

### POST /api/toolbox/add-page-children
Sets a parent–child relationship between two pages.

**Request body**
```json
{
  "ParentPageId": "uuid",
  "ChildPageId": "uuid"
}
```

**Response**
```json
{
  "result": "string",
  "error": SDT_Error
}
```

---

### POST /api/toolbox/create-dynamic-form-page

**Request body**
```json
{
  "FormId": "uuid",
  "PageName": "string"
}
```

**Response**
```json
{
  "SDT_Page": SDT_Page,
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/update-page-groups
Updates page group assignments. Body is the full pageData object.

---

## Publish & Debug

### POST /api/toolbox/v2/publish-appversion
See [App Versions — publish-appversion](#post-apitoolboxv2publish-appversion).

---

### POST /api/toolbox/v2/analyze-version
Validates page URLs before or during the publish flow.

**Request body**
```json
{
  "AppVersionId": "uuid",
  "PageUrlList": [ SDT_PageUrl ]
}
```

---

### POST /api/toolbox/v2/debug
Runs URL validation outside of the publish flow (debug mode).

**Request body**
```json
{
  "PageUrlList": [ SDT_PageUrl ]
}
```

**Response**
```json
{
  "DebugResults": SDT_DebugResults,
  "error": SDT_Error
}
```

---

## Theme

### GET /api/toolbox/location-theme
Returns the theme configuration for the current location.

**Response**
```json
{
  "SDT_LocationTheme": SDT_LocationTheme,
  "error": SDT_Error
}
```

---

### POST /api/toolbox/update-appversion-theme

**Request body**
```json
{
  "AppVersionId": "uuid",
  "ThemeId": "uuid"
}
```

---

## Translation

### POST /api/toolbox/v2/get-translated-version

**Request body**
```json
{
  "AppVersionId": "uuid",
  "LanguageCode": "nl"
}
```

---

### POST /api/toolbox/v2/update-translated-page

**Request body**
```json
{
  "DynamicTranslationPrimaryKey": "uuid",
  "Language": "nl",
  "SDT_TranslatedPage": { }
}
```

---

### POST /api/toolbox/v2/check-translations-before-publish
Returns translation warnings/errors before publishing.

**Request body**
```json
{
  "AppVersionId": "uuid"
}
```

---

### POST /api/toolbox/translate-appversion
Translates a version into one or more target languages.

**Single target language:**
```json
{
  "AppVersionId": "uuid",
  "LanguageFrom": "nl",
  "LanguageTo": "fr"
}
```

**Multiple target languages:**
```json
{
  "AppVersionId": "uuid",
  "ActivePageId": "uuid",
  "LanguageFrom": "nl",
  "LanguageToCollection": ["fr", "de"]
}
```

---

### POST /api/toolbox/translate-appversion-before-publish

**Request body**
```json
{
  "AppVersionId": "uuid",
  "LanguageFrom": "nl",
  "LanguageToCollection": ["fr", "de"]
}
```

---

### POST /api/toolbox/translate-page-after-save
Translates a single page immediately after it is saved.

**Request body**
```json
{
  "ActivePageId": "uuid",
  "LanguageFrom": "nl",
  "LanguageToCollection": ["fr"]
}
```

---

### POST /api/toolbox/v2/get-translated-page

**Request body**
```json
{
  "DynamicTranslationPrimaryKey": "uuid",
  "Language": "nl"
}
```

---

## Media

### GET /api/toolbox/media
Returns all media files for the location.

**Response**
```json
{
  "SDT_MediaCollection": [ SDT_Media ],
  "error": SDT_Error
}
```

> The app extracts `response.SDT_MediaCollection` before returning to callers.

---

### GET /api/media/delete?MediaId={uuid}

**Response**
```json
{
  "result": "string",
  "error": SDT_Error
}
```

---

### POST /api/media/upload

**Request body**
```json
{
  "MediaName": "string",
  "MediaImageData": "base64string",
  "MediaSize": 0,
  "MediaType": "string"
}
```

**Response**
```json
{
  "BC_Trn_Media": Trn_Media,
  "error": SDT_Error
}
```

---

### POST /api/media/upload/cropped
Same shape as `/api/media/upload`, plus one additional field:

```json
{
  "CroppedOriginalMediaId": "uuid"
}
```

---

### POST /api/media/upload/logo

**Request body**
```json
{
  "LogoUrl": "string"
}
```

**Response** `SDT_Error`

---

### POST /api/media/upload/profile

**Request body**
```json
{
  "ProfileImageUrl": "string"
}
```

**Response** `SDT_Error`

---

## Trash

### GET /api/toolbox/v2/get-trash

**Response**
```json
{
  "TrashItems": [ SDT_TrashItem ],
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/restore-trash

**Request body**
```json
{
  "Type": "string",
  "TrashId": "uuid"
}
```

**Response** `SDT_Error`

---

### POST /api/toolbox/v2/delete-trash
Permanently deletes a single trash item.

**Request body**
```json
{
  "Type": "string",
  "TrashId": "uuid"
}
```

**Response** `SDT_Error`

---

### POST /api/toolbox/v2/bulk-restore-trash

**Request body**
```json
{
  "TrashItems": [
    {
      "Type": "string",
      "TrashId": "uuid",
      "Version": "string",
      "Page": "string",
      "DeletedAt": "string"
    }
  ]
}
```

---

### POST /api/toolbox/v2/bulk-delete-trash
Permanently deletes multiple trash items.

**Request body**
```json
{
  "TrashItems": [ SDT_TrashItem ]
}
```

---

## Services / Supplier

### GET /api/toolbox/services
Returns all product/care services for the location.

**Response**
```json
{
  "SDT_ProductServiceCollection": [ SDT_ProductService ],
  "error": SDT_Error
}
```

---

### GET /api/toolbox/v2/supplier-forms?Supplierid={id}
Returns forms associated with a supplier.

---

### GET /api/productservice?Productserviceid={uuid}
Returns a single product/service record.

**Response**
```json
{
  "SDT_ProductService": SDT_ProductService,
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/update-service
Updates the description or hero image of a service.

**Request body**
```json
{
  "ProductServiceId": "uuid",
  "ProductServiceDescription": "string",
  "ProductServiceImageBase64": "string"
}
```

**Response** `SDT_Error`

---

### POST /api/toolbox/v2/delete-service-image
Removes the hero image from a service.

**Request body**
```json
{
  "ProductServiceId": "uuid"
}
```

**Response** `SDT_Error`

---

### GET /api/toolbox/v2/get-location
Returns the current location record including description and reception info.

**Response**
```json
{
  "BC_Trn_Location": Trn_Location,
  "error": SDT_Error
}
```

---

### POST /api/toolbox/v2/update-location

**Request body**
```json
{
  "LocationDescription": "string",
  "LocationImageBase64": "string",
  "ReceptionDescription": "string",
  "ReceptionImageBase64": "string"
}
```

**Response** `SDT_Error`

---

### GET /api/toolbox/v2/resident-packages
Returns available resident package options.

---

## Common types

### SDT_Error
```json
{
  "Message": "string",
  "Type": "string"
}
```
> `Message === "Not Authenticated"` means the session has expired — re-authenticate.

### SDT_AppVersion (key fields)
```
AppVersionId        uuid
AppVersionName      string
AppVersionDescription string
AppVersionLanguage  string
IsActive            boolean
Pages               SDT_AppVersion.Pages_PagesItem[]
TranslateLanguages  string   (JSON-stringified language-code array)
ThemeId             uuid
MoodId              uuid
```

### SDT_Page (key fields)
```
PageId              uuid
PageName            string
PageType            string
PageStructure       string   (JSON-stringified tile/content structure)
PageThumbnail       string
AppVersionId        uuid
```

### SDT_TrashItem (key fields)
```
TrashId     uuid
Type        string
Version     string
Page        string
DeletedAt   string
```

### SDT_Media (key fields)
```
MediaId     uuid
MediaName   string
MediaType   string
MediaSize   integer
MediaUrl    string
```

### SDT_ProductService (key fields)
```
ProductServiceId          uuid
ProductServiceName        string
ProductServiceDescription string
ProductServiceImage       string
```


