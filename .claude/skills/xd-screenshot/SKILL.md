---
name: xd-screenshot
description: Take a screenshot of a specific screen from the Adobe XD prototype at https://xd.adobe.com/view/69ef15d5-8d52-44a5-a8fe-bc1e64d0ac10-3cbc/grid/. Use this skill whenever the user asks to "screenshot screen N", "show me screen N from XD", "take a screenshot of XD screen N", or any similar phrasing that references a screen number from the Adobe XD design.
---

# XD Screen Screenshot

Capture a screenshot of one screen from the Adobe XD prototype grid at:
`https://xd.adobe.com/view/69ef15d5-8d52-44a5-a8fe-bc1e64d0ac10-3cbc/grid/`

The screenshot is automatically saved to `e:\ReactAPP\screenshots\screen-N.png`.

## Steps

1. **Extract the screen number** from the user's message — a 1-based integer (e.g. "screen 5" → `5`). If no number is given, ask the user which screen they want.

2. **Call the MCP tool** `mcp__browser__screenshot_xd_screen` with:
   - `screen_number`: the integer from step 1

3. **Show the image** returned by the tool inline and report the saved file path from the text content block.

4. If the tool returns an error like "Screen N not found. Grid contains X screens.", tell the user the valid range (1–X) and ask them to pick again.
