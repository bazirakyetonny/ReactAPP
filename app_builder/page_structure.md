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
| `ObjectType` | Type of target — `Information`, `Calendar`, `Map`, `WebLink`, `DynamicForm`, `MyActivity`, or empty |
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
