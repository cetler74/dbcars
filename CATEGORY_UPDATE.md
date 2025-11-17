# Vehicle Category Update

## Overview
Updated the vehicle category system to use the following categories in this specific order:

1. **Luxury Sedans** (`luxury_sedans`)
2. **Economic** (`economic`)
3. **Sportscars** (`sportscars`)
4. **Supercars** (`supercars`)
5. **SUVs** (`suvs`)

## Changes Made

### Frontend Updates

#### 1. Homepage (`frontend/app/page.tsx`)
- Updated category cards in the "Search by Category" section
- Reordered categories to match the new specification
- Updated category URLs to use the new category values

#### 2. Cars Page (`frontend/app/cars/page.tsx`)
- Updated category filter dropdown options
- Updated quick filter buttons to show all 5 categories
- Updated `getActiveFilterLabel` function to handle both underscore and kebab-case formats
- Added label mappings for consistent display

#### 3. Admin Vehicles Page (`frontend/app/admin/vehicles/page.tsx`)
- Updated category dropdown in vehicle creation/edit form
- Changed default category from `luxury` to `luxury_sedans`
- Updated all category options

#### 4. Vehicle Card Component (`frontend/components/VehicleCard.tsx`)
- Updated `getCategoryLabel` function with new categories
- Updated `getCategoryColor` function with color schemes:
  - Luxury Sedans: Blue
  - Economic: Green
  - Sportscars: Red
  - Supercars: Purple
  - SUVs: Orange

#### 5. FAQ Page (`frontend/app/faq/page.tsx`)
- Updated minimum age requirement text
- Updated security deposit information with all 5 categories:
  - Economic: €500
  - Luxury Sedans: €1,000
  - Sportscars: €2,000
  - SUVs: €1,500
  - Supercars: €5,000

### Database Updates

#### Migration File (`database/migrations/004_update_vehicle_categories.sql`)
Created migration script to update existing vehicles:
- `luxury` → `luxury_sedans`
- `exotic` → `supercars`
- `super_luxury` → `sportscars`

## Category Value Format

The system uses **underscore notation** for category values in the backend:
- `luxury_sedans`
- `economic`
- `sportscars`
- `supercars`
- `suvs`

URLs accept both formats for backward compatibility:
- `luxury_sedans` or `luxury-sedans`
- `sportscars` or `sports-cars`

## To Apply Database Changes

Run the migration script to update existing vehicles:

```bash
psql -U your_username -d dbcars_db -f database/migrations/004_update_vehicle_categories.sql
```

Or if using the existing database connection:

```sql
-- Connect to your database and run:
\i database/migrations/004_update_vehicle_categories.sql
```

## Testing Checklist

- [ ] Homepage category cards display correctly
- [ ] Category links navigate to filtered car listings
- [ ] Cars page filter dropdown shows all 5 categories
- [ ] Quick filter buttons work correctly
- [ ] Admin form shows new categories
- [ ] Vehicle cards display correct category badges with colors
- [ ] FAQ page reflects updated category information
- [ ] Existing vehicles updated to new categories (after migration)

## Notes

- All frontend files updated without linter errors
- Backend routes don't require changes (they accept any category value)
- Category images in `/public/category-images/` directory should remain as-is (they're referenced correctly)
- The system now supports 5 distinct categories instead of 3

