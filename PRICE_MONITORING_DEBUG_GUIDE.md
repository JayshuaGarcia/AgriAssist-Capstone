# Price Monitoring Debug Guide

## Issue: "No Data" Showing in Price Monitoring

The price monitoring screen is showing "No data" for commodities even though data has been stored in AsyncStorage. This guide will help you debug and fix this issue.

## 🔍 **Root Cause Analysis**

The issue is likely caused by one of these factors:

1. **Data Matching Problems**: The stored JSON data doesn't match the commodity definitions
2. **Data Format Issues**: The data structure doesn't match what the system expects
3. **AsyncStorage Issues**: Data isn't properly stored or retrieved
4. **Matching Logic Problems**: The price monitoring service can't find matches

## 🛠️ **Debugging Steps**

### Step 1: Check if Data is Stored
1. Go to **Admin Panel**
2. Click **"Storage Info"** button
3. Verify that `price_data_v1` key exists with data

### Step 2: Use Debug Tools
1. Go to **Admin Panel**
2. Click **"Debug Matching"** button
3. Check the debug information:
   - Total price records found
   - Number of matched commodities
   - Sample data structure

### Step 3: Check Console Logs
Look for these log messages in the console:
- `📊 Found X price records in storage`
- `🔍 Looking for match for commodity: [name]`
- `✅ Found exact match` or `❌ No match found`

## 🔧 **Common Issues and Fixes**

### Issue 1: Data Not Stored
**Symptoms**: Debug shows 0 price records
**Fix**: 
1. Go to Admin Panel
2. Click **"Store Price Data"**
3. Confirm the operation
4. Check Storage Info again

### Issue 2: No Matches Found
**Symptoms**: Debug shows price records but 0 matched commodities
**Fix**: The matching logic needs adjustment

### Issue 3: Wrong Data Format
**Symptoms**: Data exists but doesn't match expected structure
**Fix**: Verify JSON data format matches expected structure

## 📊 **Expected Data Structure**

Your stored data should look like this:
```json
{
  "metadata": {
    "storedAt": "2025-01-15T10:30:00.000Z",
    "dataSource": "provided_json_data",
    "recordCount": 4577,
    "version": "1.0"
  },
  "data": [
    {
      "Commodity": "KADIWA RICE-FOR-ALL",
      "Type": "Premium (RFA5)",
      "Specification": null,
      "Amount": 43.0,
      "Date": "2025-10-01T00:00:00"
    }
  ]
}
```

## 🎯 **Commodity Matching Logic**

The system tries to match commodities in this order:

1. **Exact Name Match**: `commodity.name` matches `data.Commodity`
2. **Type Match**: `commodity.name` matches `data.Type`
3. **Category Match**: Uses keywords from category

### Example Matching:
- **Commodity**: "Premium (RFA5)" (category: "KADIWA RICE-FOR-ALL")
- **Data**: "KADIWA RICE-FOR-ALL" with Type "Premium (RFA5)"
- **Match**: Should match on Type field

## 🔄 **Updated Matching Logic**

The system has been enhanced with better matching:

```typescript
// Try exact commodity name match
let match = latestPriceData.find(item => 
  item.Commodity.toLowerCase().includes(commodity.name.toLowerCase()) ||
  commodity.name.toLowerCase().includes(item.Commodity.toLowerCase())
);

// Try type field match (for cases like "Premium (RFA5)")
if (!match) {
  match = latestPriceData.find(item => 
    item.Type.toLowerCase().includes(commodity.name.toLowerCase()) ||
    commodity.name.toLowerCase().includes(item.Type.toLowerCase())
  );
}

// Try category-based matching
if (!match) {
  const keywords = getCategoryKeywords(commodity.category);
  match = latestPriceData.find(item => 
    item.Commodity.toLowerCase().includes(keyword.toLowerCase()) ||
    item.Type.toLowerCase().includes(keyword.toLowerCase())
  );
}
```

## 🚀 **Quick Fix Steps**

### If Data is Not Stored:
1. **Store Price Data**: Admin Panel → Store Price Data → Confirm
2. **Verify Storage**: Admin Panel → Storage Info
3. **Refresh Monitoring**: Go to Price Monitoring screen

### If Data Exists But No Matches:
1. **Debug Matching**: Admin Panel → Debug Matching
2. **Check Console**: Look for matching logs
3. **Update Monitoring**: Admin Panel → Update Price Monitoring

### If Still Not Working:
1. **Clear Storage**: Admin Panel → Clear Storage
2. **Re-store Data**: Admin Panel → Store Price Data
3. **Update Monitoring**: Admin Panel → Update Price Monitoring

## 📱 **Testing the Fix**

After implementing fixes:

1. **Go to Price Monitoring Screen**
2. **Check if prices are displayed** (should show ₱43.00 instead of "No data")
3. **Pull to refresh** to ensure data loads
4. **Check different commodities** to verify all are working

## 🔍 **Debug Information**

The debug tool will show:
- **Total price records**: Number of records in AsyncStorage
- **Matched commodities**: Number of commodities with prices
- **Sample data**: First few records from storage
- **Matched prices**: Successfully matched commodities

## 📋 **Troubleshooting Checklist**

- [ ] Data is stored in AsyncStorage (Storage Info shows data)
- [ ] JSON data format is correct
- [ ] Commodity names match data structure
- [ ] Console logs show matching attempts
- [ ] Price monitoring screen refreshes
- [ ] Manual price entry works (test with a simple entry)

## 🎯 **Expected Results**

After fixing the issue, you should see:

1. **Price Monitoring Screen**: Shows actual prices (₱43.00, ₱35.00, etc.)
2. **Debug Tool**: Shows matched commodities > 0
3. **Console Logs**: Show successful matches
4. **Statistics**: Admin panel shows commodities with prices

## 📞 **Support Commands**

Use these admin panel buttons for debugging:

1. **"Storage Info"** → Check if data exists
2. **"View Price Data"** → See stored data structure
3. **"Debug Matching"** → Check matching logic
4. **"Update Price Monitoring"** → Force refresh
5. **"Store Price Data"** → Re-store data if needed
6. **"Clear Storage"** → Reset everything

## 🎉 **Success Indicators**

You'll know it's working when:
- ✅ Price monitoring shows actual prices
- ✅ Debug shows matched commodities
- ✅ Console logs show successful matches
- ✅ No more "No data" messages
- ✅ Statistics show commodities with prices

---

## 📝 **Quick Summary**

The "No data" issue is likely caused by data matching problems. Use the debug tools in the admin panel to identify the specific issue, then follow the appropriate fix steps. The enhanced matching logic should resolve most common matching problems.

The key is to ensure your JSON data structure matches the expected format and that the commodity names in your data align with the commodity definitions in the system.





