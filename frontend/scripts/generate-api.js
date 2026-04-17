const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:8080';
const OPENAPI_JSON_URL = `${API_URL}/v3/api-docs`;
const OUTPUT_DIR = path.join(__dirname, '../src/lib/api');

console.log(`Fetching OpenAPI spec from ${OPENAPI_JSON_URL}...`);

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Download OpenAPI JSON
const openApiJsonPath = path.join(__dirname, '../openapi.json');
const url = new URL(OPENAPI_JSON_URL);
const client = url.protocol === 'https:' ? https : http;

const file = fs.createWriteStream(openApiJsonPath);

client.get(OPENAPI_JSON_URL, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to fetch OpenAPI spec: ${response.statusCode}`);
    console.error('Make sure the backend server is running on', API_URL);
    process.exit(1);
  }

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('OpenAPI spec downloaded successfully');

    // Generate TypeScript client
    console.log('Generating TypeScript client...');
    try {
      execSync(
        `npx openapi-typescript-codegen --input ${openApiJsonPath} --output ${OUTPUT_DIR} --client axios`,
        { stdio: 'inherit' }
      );
      console.log('✅ API client generated successfully!');
      console.log(`📁 Output directory: ${OUTPUT_DIR}`);
      
      // Clean up temporary file
      fs.unlinkSync(openApiJsonPath);
    } catch (error) {
      console.error('Failed to generate API client:', error.message);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error(`Failed to fetch OpenAPI spec: ${err.message}`);
  console.error('Make sure the backend server is running on', API_URL);
  process.exit(1);
});
