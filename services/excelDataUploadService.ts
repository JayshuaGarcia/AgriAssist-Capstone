import {
    collection,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from '../lib/firebase';

// Interface for Excel/CSV data
export interface ExcelPriceData {
  commodityName: string;
  price: number;
  date: string;
  unit: string;
  category: string;
  type?: string;
  specification?: string;
  source?: string;
}

// Interface for processed price record
export interface ProcessedPriceRecord {
  commodityId: string;
  commodityName: string;
  category: string;
  type?: string;
  specification?: string;
  price: number;
  unit: string;
  date: Timestamp;
  source: string;
  confidence: number;
  factors: string[];
  createdAt: Timestamp;
}

export class ExcelDataUploadService {
  
  // Collection names
  private static readonly PRICE_HISTORY_COLLECTION = 'price_history';
  private static readonly COMMODITIES_COLLECTION = 'commodities';
  private static readonly CATEGORIES_COLLECTION = 'categories';

  // Parse Excel binary data (base64 string from file picker)
  static parseExcelBinaryData(base64String: string): ExcelPriceData[] {
    try {
      console.log('🔄 Parsing Excel binary data...');
      console.log(`📏 Base64 string length: ${base64String.length}`);
      
      // Convert base64 string to binary string
      const binaryString = atob(base64String);
      console.log(`📏 Binary string length: ${binaryString.length}`);
      
      // Read the Excel workbook with more options
      const workbook = XLSX.read(binaryString, { 
        type: 'binary',
        cellDates: true,
        cellNF: false,
        cellText: false,
        cellFormula: false,
        cellStyles: false,
        sheetStubs: false,
        bookProps: false,
        bookSheets: false,
        bookVBA: false,
        password: '',
        WTF: false
      });
      
      console.log(`📚 Workbook sheets: ${workbook.SheetNames.join(', ')}`);
      console.log(`📚 Workbook object keys:`, Object.keys(workbook));
      
      // Try to get the first worksheet with better error handling
      let sheetName = '';
      let worksheet = null;
      
      if (workbook.SheetNames && workbook.SheetNames.length > 0) {
        sheetName = workbook.SheetNames[0];
        console.log(`📋 Trying to access sheet: "${sheetName}"`);
        worksheet = workbook.Sheets[sheetName];
        console.log(`📋 Worksheet object:`, worksheet ? 'Found' : 'Not found');
      } else {
        console.error('❌ No sheet names found in workbook');
        return [];
      }
      
      if (!worksheet) {
        console.error(`❌ Worksheet "${sheetName}" not found in workbook`);
        console.log(`📚 Available sheets:`, workbook.SheetNames);
        console.log(`📚 Workbook.Sheets keys:`, Object.keys(workbook.Sheets || {}));
        
        // Try to access the worksheet directly by name
        if (workbook.Sheets && workbook.Sheets[sheetName]) {
          worksheet = workbook.Sheets[sheetName];
          console.log(`✅ Found worksheet by direct access`);
        } else {
          console.error('❌ Worksheet not accessible by any method');
          return [];
        }
      }
      
      // Get worksheet range with better error handling
      console.log(`📊 Worksheet keys:`, Object.keys(worksheet));
      console.log(`📊 Worksheet !ref:`, worksheet['!ref']);
      
      if (!worksheet['!ref']) {
        console.error('❌ No data range found in worksheet');
        console.log(`📊 Worksheet structure:`, worksheet);
        return [];
      }
      
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      console.log(`📊 Worksheet range: ${worksheet['!ref']}`);
      console.log(`📊 Rows: ${range.e.r + 1}, Cols: ${range.e.c + 1}`);
      
      // Convert worksheet to JSON array with more options
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: '',
        blankrows: true, // Include blank rows to see structure
        header: 1 // Use first row as header
      });
      
      console.log(`📊 Excel file parsed: ${jsonData.length} rows found`);
      console.log(`📋 First few rows:`, jsonData.slice(0, 3));
      
      if (jsonData.length === 0) {
        console.log('⚠️ No data found, trying alternative parsing...');
        
        // Try parsing as array of arrays
        const arrayData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          defval: '',
          blankrows: true,
          header: 1
        });
        
        console.log(`📊 Array data: ${arrayData.length} rows`);
        console.log(`📋 Array sample:`, arrayData.slice(0, 3));
        
        if (arrayData.length > 0 && Array.isArray(arrayData[0])) {
          // Convert array format to object format
          const headers = arrayData[0] as string[];
          console.log(`📋 Headers found:`, headers);
          
          const objectData = arrayData.slice(1).map((row: any[], index) => {
            const obj: any = {};
            headers.forEach((header, colIndex) => {
              obj[header] = row[colIndex] || '';
            });
            return obj;
          });
          
          console.log(`📊 Converted to objects: ${objectData.length} rows`);
          console.log(`📋 Object sample:`, objectData.slice(0, 2));
          
          // Use the converted data
          return this.processExcelRows(objectData);
        }
        
        // Try parsing with different options
        console.log('⚠️ Trying different parsing options...');
        
        const alternativeData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: true,
          defval: '',
          blankrows: false,
          header: 1
        });
        
        console.log(`📊 Alternative data: ${alternativeData.length} rows`);
        console.log(`📋 Alternative sample:`, alternativeData.slice(0, 3));
        
        if (alternativeData.length > 0) {
          return this.processExcelRows(alternativeData);
        }
        
        // Last resort: try to get raw cell data
        console.log('⚠️ Trying raw cell data access...');
        const cellKeys = Object.keys(worksheet).filter(key => !key.startsWith('!'));
        console.log(`📊 Cell keys found: ${cellKeys.length}`);
        console.log(`📋 Sample cell keys:`, cellKeys.slice(0, 10));
        
        if (cellKeys.length > 0) {
          // Try to extract data from cells
          const extractedData = this.extractDataFromCells(worksheet, cellKeys);
          console.log(`📊 Extracted data: ${extractedData.length} rows`);
          return extractedData;
        }
      }
      
      // Convert to our ExcelPriceData format
      return this.processExcelRows(jsonData);
      
    } catch (error) {
      console.error('❌ Error parsing Excel binary data:', error);
      console.error('❌ Error details:', error);
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to extract data from raw cells
  private static extractDataFromCells(worksheet: any, cellKeys: string[]): ExcelPriceData[] {
    try {
      console.log('🔍 Extracting data from raw cells...');
      
      // Group cells by row
      const rows: { [key: number]: { [key: string]: any } } = {};
      
      cellKeys.forEach(cellKey => {
        const cell = worksheet[cellKey];
        if (cell && cell.v !== undefined) {
          const match = cellKey.match(/^([A-Z]+)(\d+)$/);
          if (match) {
            const col = match[1];
            const rowNum = parseInt(match[2]);
            
            if (!rows[rowNum]) {
              rows[rowNum] = {};
            }
            rows[rowNum][col] = cell.v;
          }
        }
      });
      
      const rowNumbers = Object.keys(rows).map(Number).sort((a, b) => a - b);
      console.log(`📊 Found ${rowNumbers.length} rows with data`);
      
      if (rowNumbers.length === 0) {
        return [];
      }
      
      // Get headers from first row
      const headerRow = rows[rowNumbers[0]];
      const headers = Object.keys(headerRow).sort();
      console.log(`📋 Headers:`, headers);
      
      // Convert to object format
      const data = rowNumbers.slice(1).map(rowNum => {
        const row = rows[rowNum];
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[header] || '';
        });
        return obj;
      });
      
      console.log(`📊 Extracted ${data.length} data rows`);
      return this.processExcelRows(data);
      
    } catch (error) {
      console.error('❌ Error extracting data from cells:', error);
      return [];
    }
  }

  // Helper method to process Excel rows
  private static processExcelRows(jsonData: any[]): ExcelPriceData[] {
    const excelData: ExcelPriceData[] = jsonData.map((row, index) => {
      // Map columns based on your Excel structure
      const commodity = this.getFieldValue(row, ['Commodity', 'Commodity Name', 'Product', 'Item', 'Name']);
      const type = this.getFieldValue(row, ['Type', 'Variety', 'Grade', 'Quality']);
      const specification = this.getFieldValue(row, ['Specification', 'Spec', 'Details', 'Description', 'Notes']);
      const amount = this.getFieldValue(row, ['Amount', 'Price', 'Cost', 'Value', 'Rate']);
      const date = this.getFieldValue(row, ['Date', 'Date Created', 'Timestamp', 'Created']);
      
      // Create commodity name by combining Type and Specification
      const commodityName = type ? `${type}${specification ? ` - ${specification}` : ''}` : `Row ${index + 1}`;
      
      // Use Commodity as category
      const category = commodity || 'Unknown';
      
      return {
        commodityName: commodityName,
        price: parseFloat(amount) || 0,
        date: date || new Date().toISOString().split('T')[0],
        category: category,
        unit: 'kg', // Default unit
        type: type || '',
        specification: specification || ''
      };
    }).filter(item => item.commodityName && item.price > 0);
    
    console.log(`✅ Parsed ${excelData.length} valid records from Excel binary data`);
    console.log(`📋 Sample processed data:`, excelData.slice(0, 3));
    return excelData;
  }

  // Helper method to get field value from row object
  private static getFieldValue(row: any, possibleNames: string[]): string {
    for (const name of possibleNames) {
      // Try exact match first
      if (row[name]) {
        return String(row[name]).trim();
      }
      
      // Try case insensitive match
      const lowerName = name.toLowerCase();
      for (const key of Object.keys(row)) {
        if (key.toLowerCase() === lowerName) {
          return String(row[key]).trim();
        }
      }
    }
    return '';
  }

  // Parse CSV/Excel data from text
  static parseExcelData(csvText: string): ExcelPriceData[] {
    console.log('🔄 Parsing Excel/CSV data...');
    
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    console.log('📋 Headers found:', headers);
    
    const data: ExcelPriceData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length < 3) continue; // Skip invalid rows
      
      try {
        const record: ExcelPriceData = {
          commodityName: this.getFieldValue(values, headers, ['commodity', 'name', 'product', 'item']),
          price: parseFloat(this.getFieldValue(values, headers, ['price', 'cost', 'amount', 'value'])),
          date: this.getFieldValue(values, headers, ['date', 'timestamp', 'created']),
          unit: this.getFieldValue(values, headers, ['unit', 'measure', 'kg', 'piece']) || 'kg',
          category: this.getFieldValue(values, headers, ['category', 'type', 'group', 'class']),
          type: this.getFieldValue(values, headers, ['type', 'variety', 'grade', 'quality']),
          specification: this.getFieldValue(values, headers, ['specification', 'spec', 'details', 'description']),
          source: 'excel-upload'
        };
        
        // Validate required fields
        if (record.commodityName && !isNaN(record.price) && record.date) {
          data.push(record);
        }
      } catch (error) {
        console.warn(`⚠️ Skipping invalid row ${i + 1}:`, error);
      }
    }
    
    console.log(`✅ Parsed ${data.length} valid records from Excel data`);
    return data;
  }

  // Helper function to find field value by multiple possible header names
  private static getFieldValue(values: string[], headers: string[], possibleNames: string[]): string {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name));
      if (index !== -1 && values[index]) {
        return values[index];
      }
    }
    return '';
  }

  // Generate commodity ID from name and category
  private static generateCommodityId(name: string, category: string): string {
    return `${category.toLowerCase().replace(/\s+/g, '-')}-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  }

  // Process Excel data into Firebase format
  static processExcelData(excelData: ExcelPriceData[]): ProcessedPriceRecord[] {
    console.log('🔄 Processing Excel data for Firebase...');
    
    const processedRecords: ProcessedPriceRecord[] = [];
    
    excelData.forEach((record, index) => {
      try {
        const commodityId = this.generateCommodityId(record.commodityName, record.category);
        const priceDate = new Date(record.date);
        
        // Validate date
        if (isNaN(priceDate.getTime())) {
          console.warn(`⚠️ Invalid date for ${record.commodityName}, using current date`);
          priceDate.setTime(Date.now());
        }
        
        const processedRecord: ProcessedPriceRecord = {
          commodityId,
          commodityName: record.commodityName,
          category: record.category,
          type: record.type,
          specification: record.specification,
          price: record.price,
          unit: record.unit,
          date: Timestamp.fromDate(priceDate),
          source: record.source || 'excel-upload',
          confidence: 100, // Excel data is considered 100% confident
          factors: ['Historical price data from Excel'],
          createdAt: Timestamp.now()
        };
        
        processedRecords.push(processedRecord);
      } catch (error) {
        console.error(`❌ Error processing record ${index + 1}:`, error);
      }
    });
    
    console.log(`✅ Processed ${processedRecords.length} records for Firebase upload`);
    return processedRecords;
  }

  // Upload processed data to Firebase in batches
  static async uploadToFirebase(processedRecords: ProcessedPriceRecord[]): Promise<{
    success: boolean;
    uploaded: number;
    errors: number;
    message: string;
  }> {
    try {
      console.log('🔄 Uploading data to Firebase...');
      
      const batch = writeBatch(db);
      let uploaded = 0;
      let errors = 0;
      
      // Process in batches of 500 (Firebase limit)
      const batchSize = 500;
      const batches = [];
      
      for (let i = 0; i < processedRecords.length; i += batchSize) {
        batches.push(processedRecords.slice(i, i + batchSize));
      }
      
      console.log(`📦 Processing ${batches.length} batches of data...`);
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const currentBatch = batches[batchIndex];
        const firebaseBatch = writeBatch(db);
        
        for (const record of currentBatch) {
          try {
            const docRef = collection(db, this.PRICE_HISTORY_COLLECTION);
            firebaseBatch.set(docRef, record);
            uploaded++;
          } catch (error) {
            console.error('❌ Error adding record to batch:', error);
            errors++;
          }
        }
        
        // Commit this batch
        await firebaseBatch.commit();
        console.log(`✅ Uploaded batch ${batchIndex + 1}/${batches.length} (${currentBatch.length} records)`);
      }
      
      const message = `✅ Successfully uploaded ${uploaded} price records to Firebase!${errors > 0 ? ` (${errors} errors)` : ''}`;
      
      console.log(message);
      return {
        success: true,
        uploaded,
        errors,
        message
      };
      
    } catch (error) {
      console.error('❌ Error uploading to Firebase:', error);
      return {
        success: false,
        uploaded: 0,
        errors: processedRecords.length,
        message: `❌ Failed to upload data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Complete workflow: Parse → Process → Upload
  static async uploadExcelData(csvText: string): Promise<{
    success: boolean;
    uploaded: number;
    errors: number;
    message: string;
    sampleData?: ProcessedPriceRecord[];
  }> {
    try {
      console.log('🚀 Starting Excel data upload workflow...');
      
      // Step 1: Parse Excel data
      const excelData = this.parseExcelData(csvText);
      
      if (excelData.length === 0) {
        return {
          success: false,
          uploaded: 0,
          errors: 0,
          message: '❌ No valid data found in Excel file. Please check the format.'
        };
      }
      
      // Step 2: Process data
      const processedRecords = this.processExcelData(excelData);
      
      // Step 3: Upload to Firebase
      const uploadResult = await this.uploadToFirebase(processedRecords);
      
      return {
        ...uploadResult,
        sampleData: processedRecords.slice(0, 5) // Return first 5 records as sample
      };
      
    } catch (error) {
      console.error('❌ Error in Excel upload workflow:', error);
      return {
        success: false,
        uploaded: 0,
        errors: 1,
        message: `❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Complete workflow with progress tracking: Parse → Process → Upload
  static async uploadExcelDataWithProgress(
    data: string, 
    progressCallback?: (progress: { batch: number; totalBatches: number; uploaded: number; progress: number }) => void,
    isExcelBinary: boolean = false
  ): Promise<{
    success: boolean;
    uploaded: number;
    errors: number;
    message: string;
    sampleData?: ProcessedPriceRecord[];
  }> {
    try {
      console.log('🚀 Starting Excel data upload workflow with progress...');
      
      // Step 1: Parse Excel data
      const excelData = isExcelBinary ? this.parseExcelBinaryData(data) : this.parseExcelData(data);
      
      if (excelData.length === 0) {
        return {
          success: false,
          uploaded: 0,
          errors: 0,
          message: '❌ No valid data found in Excel file. Please check the format.'
        };
      }
      
      // Step 2: Process data
      const processedRecords = this.processExcelData(excelData);
      
      // Step 3: Upload to Firebase with progress tracking
      const uploadResult = await this.uploadToFirebaseWithProgress(processedRecords, progressCallback);
      
      return {
        ...uploadResult,
        sampleData: processedRecords.slice(0, 5) // Return first 5 records as sample
      };
      
    } catch (error) {
      console.error('❌ Error in Excel upload workflow:', error);
      return {
        success: false,
        uploaded: 0,
        errors: 1,
        message: `❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Upload to Firebase with progress tracking
  static async uploadToFirebaseWithProgress(
    processedRecords: ProcessedPriceRecord[],
    progressCallback?: (progress: { batch: number; totalBatches: number; uploaded: number; progress: number }) => void
  ): Promise<{ success: boolean; uploaded: number; errors: number; message: string; }> {
    try {
      console.log(`📤 Starting Firebase upload of ${processedRecords.length} records...`);
      
      const batchSize = 100;
      const batches = [];
      
      // Create batches
      for (let i = 0; i < processedRecords.length; i += batchSize) {
        batches.push(processedRecords.slice(i, i + batchSize));
      }
      
      console.log(`📦 Created ${batches.length} batches of ${batchSize} records each`);
      
      let uploadedCount = 0;
      let errorCount = 0;
      
      // Upload each batch with progress updates
      for (let i = 0; i < batches.length; i++) {
        try {
          const batch = writeBatch(db);
          const currentBatch = batches[i];
          
          // Add each record to the batch
          currentBatch.forEach(record => {
            const docRef = collection(db, this.PRICE_HISTORY_COLLECTION);
            batch.set(docRef, {
              ...record,
              uploadedAt: new Date().toISOString()
            });
          });
          
          // Commit the batch
          await batch.commit();
          uploadedCount += currentBatch.length;
          
          console.log(`✅ Batch ${i + 1}/${batches.length} uploaded (${currentBatch.length} records)`);
          
          // Update progress
          if (progressCallback) {
            const progress = (i + 1) / batches.length;
            progressCallback({
              batch: i + 1,
              totalBatches: batches.length,
              uploaded: uploadedCount,
              progress: progress
            });
          }
          
          // Small delay between batches to prevent overwhelming Firebase
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          errorCount += batches[i].length;
          console.error(`❌ Batch ${i + 1} failed:`, error);
        }
      }
      
      const success = uploadedCount > 0;
      const message = success 
        ? `✅ Successfully uploaded ${uploadedCount} records to Firebase!`
        : `❌ Failed to upload any records. Please check your Firebase configuration.`;
      
      console.log(`🎉 Upload completed: ${uploadedCount} uploaded, ${errorCount} errors`);
      
      return {
        success,
        uploaded: uploadedCount,
        errors: errorCount,
        message
      };
      
    } catch (error) {
      console.error('❌ Firebase upload error:', error);
      return {
        success: false,
        uploaded: 0,
        errors: processedRecords.length,
        message: `❌ Failed to upload data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Generate sample Excel format for user reference
  static generateSampleFormat(): string {
    return `Commodity Name,Price,Date,Unit,Category,Type,Specification
Beef Brisket Imported,450.00,2024-01-15,kg,BEEF MEAT PRODUCTS,Imported,Premium
Pork Belly Local,320.00,2024-01-15,kg,PORK MEAT PRODUCTS,Local,Standard
Rice Premium,65.00,2024-01-15,kg,LOCAL COMMERCIAL RICE,Premium,Well Milled
Chicken Breast,220.00,2024-01-15,kg,POULTRY PRODUCTS,Local,Fresh
Tomato,45.00,2024-01-15,kg,LOWLAND VEGETABLES,Local,Medium Size
Garlic,150.00,2024-01-15,kg,SPICES,Local,Native
Corn Yellow,25.00,2024-01-15,kg,CORN PRODUCTS,Local,Feed Grade
Bangus,280.00,2024-01-15,kg,FISH PRODUCTS,Local,Large
Apple,80.00,2024-01-15,kg,FRUITS,Imported,Red Delicious
Carrot,35.00,2024-01-15,kg,LOWLAND VEGETABLES,Local,Fresh`;
  }
}

export default ExcelDataUploadService;
