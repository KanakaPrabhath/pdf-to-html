# Sinhala Text Corrections Guide

This guide explains how to add and manage Sinhala text corrections for PDF extraction.

## Corrections File

The corrections are stored in: `src/utils/sinhala-corrections.json`

## Structure

The JSON file has three main sections:

### 1. Titles
Use this for correcting complete titles or headings that need exact matching:

```json
"titles": {
  "හානා හීය පානා අඬ හැරෙන් දැරන්": "හානා හීය පානා අඬහැරෙන් දැනේ"
}
```

### 2. Words
Use this for individual word corrections:

```json
"words": {
  "හඬුනා": "හඳුනා",
  "කෙැණු": "කරුණු",
  "අැති": "ඇති"
}
```

### 3. Patterns
Use this for fixing spacing or repeated patterns:

```json
"patterns": {
  " ් ": "්",
  "  ": " "
}
```

## How to Add Corrections

1. Open `src/utils/sinhala-corrections.json`
2. Find the incorrect text in your HTML output
3. Add it to the appropriate section with the correct version

### Example Workflow

If you see incorrect text in the HTML output:
- **Incorrect:** `වි රශ්‍ේෂතා`
- **Correct:** `විශේෂතා`

Add to the "words" section:
```json
"වි රශ්‍ේෂතා": "විශේෂතා"
```

## Order Matters

Corrections are applied in this order:
1. Titles (most specific)
2. Words
3. Patterns (most general)

**Important:** Put more specific corrections before general ones within each section.

## After Making Changes

1. Save the JSON file
2. Run the conversion again:
   ```bash
   npm run example
   ```

3. Check the output in `examples/output/complete-document.html`

## Tips

- **Longer phrases first**: If you have both `රේ පා ම` and `පා ම`, put the longer one first
- **Test incrementally**: Add a few corrections at a time and test
- **Keep backups**: Save working versions of your corrections file
- **Use exact matches**: Copy the incorrect text exactly as it appears in the HTML

## Common Issues

### Issue: Correction not working
**Solution:** Make sure:
- The text matches exactly (including spaces)
- You saved the JSON file
- You re-ran the conversion

### Issue: JSON parse error
**Solution:** Validate your JSON:
- Check for missing commas
- Check for trailing commas (not allowed in JSON)
- Use a JSON validator like [jsonlint.com](https://jsonlint.com/)

## Example: Full Workflow

1. **Find error in HTML:**
   ```
   පිළිබඬ වර්ගීකෙණය
   ```

2. **Add corrections:**
   ```json
   "words": {
     "පිළිබඬ": "පිළිබඳ",
     "වර්ගීකෙණය": "වර්ගීකරණය"
   }
   ```

3. **Run conversion:**
   ```bash
   npm run example
   ```

4. **Verify output:**
   ```
   පිළිබඳ වර්ගීකරණය
   ```

## Advanced: Escaping Special Characters

If your incorrect text contains special regex characters like `.`, `*`, `+`, `?`, etc., they will be automatically escaped. Just paste the text as-is.

## Questions?

If you encounter issues or need help with specific corrections, please check the main README.md or create an issue in the repository.
