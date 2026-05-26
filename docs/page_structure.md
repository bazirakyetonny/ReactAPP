# Page Structure

## Overview

The datastore holds the **current app version** — the version that is displayed on the mobile frame. The app version is the top-level object. It contains identity, theme, and mood settings, and an array of **pages** that make up the full application.

The goal of this structure is to be interpreted and rendered visually as a mobile application inside the frame.

---

## App Version

The current version is the root object in the datastore.

| Property | Description |
|---|---|
| `AppVersionId` | Unique ID of the version |
| `AppVersionName` | Display name of the version |
| `AppVersionThemeId` | ID of the theme applied to this version |
| `MoodId` | ID of the mood applied to this version |
| `Page` | Array of pages that make up this version |

---

## Pages

Pages make up the app version. Each page has the following properties:

| Property | Description |
|---|---|
| `PageId` | Unique ID of the page |
| `PageName` | Display name of the page |
| `PageType` | Type of page — see Page Types below |
| `PageStructure` | JSON string describing the content composition of the page |
| `PagePublishedStructure` | The last published snapshot of the page structure |

### Page Types

| Type | Description |
|---|---|
| `Information` | A content page built from building blocks (TileGrid, Cta, Description, Image) |
| `BulletinBoard` | A bulletin board page |
| `Calendar` | A calendar page |
| `Map` | A map page |
| `WebLink` | A page that opens an external URL |

---

## BulletinBoard Page

A `BulletinBoard` page renders a fixed empty-state UI — a board illustration, a message listing the content categories users can post, and a disabled floating action button (FAB). It has no editable building blocks.

### Tile Action

To link a tile to a BulletinBoard page, set the tile's `Action.ObjectType` to `"BulletinBoard"` and `Action.ObjectId` to the target page's `PageId`.

```json
{
  "Action": {
    "ObjectType": "BulletinBoard",
    "ObjectId": "0f90d3e6-98fd-4f0a-8bf5-8a74e7b84f5f"
  }
}
```

### Page object

```json
{
  "PageId": "0f90d3e6-98fd-4f0a-8bf5-8a74e7b84f5f",
  "PageName": "Bulletin Board",
  "IsPredefined": false,
  "PageStructure": "",
  "PageType": "BulletinBoard",
  "PageThumbnailUrl": "",
  "PageGroups": "",
  "AppVersionId": "1807af56-0adc-42aa-b82f-588a904649dd"
}
```

`PageStructure` is empty — the page content is entirely determined by its type and is not user-configurable in the builder.

---

## Calendar Page

A `Calendar` page renders a 24-hour day-view schedule. It includes a blue date navigation bar (prev/next arrows + formatted date label) and a scrollable list of hourly time slots. A current-time indicator (coloured line + dot) marks the active hour. The view auto-scrolls to the current hour on open. Uses `primaryColor` for the header, `backgroundColor`, `borderColor`, `secondaryColor`, and `accentColor`.

### Tile Action

```json
{ "Action": { "ObjectType": "Calendar", "ObjectId": "<CalendarPageId>" } }
```

### Page object

```json
{
  "PageId": "<uuid>",
  "PageName": "Calendar",
  "IsPredefined": false,
  "PageStructure": "",
  "PageType": "Calendar",
  "PageThumbnailUrl": "",
  "AppVersionId": "<AppVersionId>"
}
```

`PageStructure` is empty — the page content is determined by its type.

---

## MyActivity Page

A `MyActivity` page renders a messaging inbox with two tabs — **Messages** and **Requests**. The active tab uses `primaryColor`; the inactive tab is light grey (`#e1e1e1`). The body shows an empty-state illustration and "No messages yet" when there are no items. Uses `primaryColor`, `backgroundColor`, and `secondaryColor`.

### Tile Action

```json
{ "Action": { "ObjectType": "MyActivity", "ObjectId": "<MyActivityPageId>" } }
```

### Page object

```json
{
  "PageId": "<uuid>",
  "PageName": "My Activity",
  "IsPredefined": false,
  "PageStructure": "",
  "PageType": "MyActivity",
  "PageThumbnailUrl": "",
  "AppVersionId": "<AppVersionId>"
}
```

`PageStructure` is empty — the page content is determined by its type.

---

## Map Page

A `Map` page embeds a Google Maps view centred on the user's current location (via `navigator.geolocation`). If geolocation is denied or unavailable, it falls back to Utrecht (52.0907, 5.1214). A spinner is shown while the map loads. The Google Maps Embed API key is read from the `VITE_MAPS_API_KEY` environment variable. Uses `primaryColor` for the spinner accent.

### Tile Action

```json
{ "Action": { "ObjectType": "Map", "ObjectId": "<MapPageId>" } }
```

### Page object

```json
{
  "PageId": "<uuid>",
  "PageName": "Map",
  "IsPredefined": false,
  "PageStructure": "",
  "PageType": "Map",
  "PageThumbnailUrl": "",
  "AppVersionId": "<AppVersionId>"
}
```

`PageStructure` is empty — the page content is determined by its type.

---

## Page Structure

`PageStructure` is a JSON string. When parsed, it contains an `InfoContent` array — the ordered list of building blocks that compose the page.

```json
{
  "InfoContent": [ ...building blocks... ]
}
```

Each building block has:

| Property | Description |
|---|---|
| `InfoId` | Unique ID of the building block |
| `InfoType` | Type of building block — `TileGrid`, `Cta`, `Description`, `Image` |
| `InfoValue` | Used by `Description` to hold HTML content |

---

## Building Block Types

### TileGrid

A grid of tiles arranged in columns.

- Maximum **3 columns** per TileGrid
- Maximum **3 tiles** per column

**Column properties:**

| Property | Description |
|---|---|
| `ColId` | Unique ID of the column |
| `Tiles` | Array of tile objects in this column |

**Tile properties:**

| Property | Description |
|---|---|
| `Id` | Unique tile ID |
| `Name` | Tile name |
| `Text` | Display text on the tile |
| `Color` | Text color (hex) |
| `Align` | Text alignment — `center`, `left` |
| `Icon` | Icon identifier |
| `BGColor` | Background color key (e.g. `accentColor`, `secondaryColor`, `backgroundColor`, `textColor`) or empty |
| `BGImageUrl` | Background image URL |
| `Opacity` | Background image opacity |
| `Size` | Tile height in px (0 = auto) |
| `Height` | Tile height as string |
| `Action` | Navigation action on tap — see Action below |

**Action properties:**

| Property | Description |
|---|---|
| `ObjectType` | Type of target — `Information`, `BulletinBoard`, `Calendar`, `Map`, `WebLink`, `DynamicForm`, `MyActivity`, or empty |
| `ObjectId` | ID of the target page or object |
| `ObjectUrl` | URL for web link targets |
| `FormId` | Form ID for form-type actions |

---

### Cta (Call to Action)

A button or link element. Held inside `CtaAttributes`.

| Property | Description |
|---|---|
| `CtaId` | Unique ID |
| `CtaType` | `WebLink`, `Form`, etc. |
| `CtaLabel` | Button label text |
| `CtaAction` | Target URL or action |
| `CtaColor` | Text color (hex) |
| `CtaBGColor` | Background color key (e.g. `ctaColor1`, `ctaColor2`) |
| `CtaButtonType` | Button style — `FullWidth`, `Round`, `Image`, `Icon` |
| `CtaButtonImgUrl` | Image URL when button type is `Image` |
| `CtaButtonIcon` | Icon identifier |
| `CtaSupplierIsConnected` | Whether a supplier is linked |
| `CtaConnectedSupplierId` | Linked supplier ID |
| `Action` | Navigation action — same shape as Tile Action |

---

### Description

A rich-text block. The content is stored as an HTML string in `InfoValue`.

```json
{
  "InfoId": "...",
  "InfoType": "Description",
  "InfoValue": "<p>Your text here</p>"
}
```

---

### Image

An image building block. Uses `InfoValue` for the image URL or configuration.

---

## Example — Page with TileGrid and Cta

Below is the parsed `PageStructure` for the page **"To be a man"** (`PageType: Information`):

```json
{
  "InfoContent": [
    {
      "InfoId": "LnbnlCds20260420134424425",
      "InfoType": "TileGrid",
      "Columns": [
        {
          "ColId": "FpzHGOLo20260420134424425",
          "Tiles": [
            {
              "Id": "kPDdIAjP20260420134424425",
              "Name": "Title",
              "Text": "Name",
              "Color": "#ffffff",
              "Align": "center",
              "Icon": "library",
              "BGColor": "backgroundColor",
              "Height": "",
              "Action": { "ObjectType": "", "ObjectId": "", "ObjectUrl": "" }
            }
          ]
        }
      ]
    },
    {
      "InfoId": "geSuqPgKrirmhnG20260420134446042",
      "InfoType": "Cta",
      "CtaAttributes": {
        "CtaLabel": "call",
        "CtaType": "Form",
        "CtaButtonType": "Image",
        "CtaColor": "#ffffff",
        "CtaBGColor": "ctaColor1",
        "Action": { "ObjectType": "DynamicForm", "ObjectId": "5" }
      }
    }
  ]
}
```

---

## Rendering Goal

The page structure is interpreted to draw the page content inside the **mobile frame**. Building blocks are rendered top to bottom in the order they appear in `InfoContent`. TileGrids are rendered as column-and-tile grids; Cta blocks as buttons; Description blocks as styled text.
