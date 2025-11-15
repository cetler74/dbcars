# How to Add Category Images

## Quick Steps

1. **Prepare your 4 images:**
   - Luxury Sedans image (Mercedes-Benz S-Class)
   - Sports Cars image (Sports coupe)
   - SUVs image (SUV)
   - Supercars image (Lamborghini Huracán)

2. **Rename them exactly as:**
   - `luxury-sedans.jpg`
   - `sports-cars.jpg`
   - `suvs.jpg`
   - `supercars.jpg`

3. **Copy them to this folder:**
   ```
   /dbcars/frontend/public/category-images/
   ```

4. **Restart your Next.js server** (if running)

## File Location

**Full path:**
```
/Users/tiagocordeiro/Desktop/DBLUXCARSWEB/dbcars/frontend/public/category-images/
```

## Image Requirements

- **Format**: JPG, PNG, or WebP
- **Size**: Recommended 800x800px or larger (square works best)
- **File Size**: Keep under 500KB each for fast loading
- **Background**: Dark backgrounds work best for text overlay

## Verification

After adding the images, you can verify they're in place by running:
```bash
ls -la /Users/tiagocordeiro/Desktop/DBLUXCARSWEB/dbcars/frontend/public/category-images/
```

You should see all 4 image files plus the README.md file.

## Troubleshooting

If images don't appear:
1. Check filenames are EXACTLY as listed (case-sensitive)
2. Check file extensions (.jpg, .jpeg, or .png)
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
4. Restart Next.js dev server

