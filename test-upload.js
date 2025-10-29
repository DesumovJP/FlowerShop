const fs = require('fs');
const path = require('path');

// Створюємо простий тестовий файл зображення
const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

// Зберігаємо тестовий файл
const testImagePath = path.join(__dirname, 'test-image.png');
fs.writeFileSync(testImagePath, testImageContent);

console.log('Test image created at:', testImagePath);
console.log('File size:', fs.statSync(testImagePath).size, 'bytes');

// Тепер тестуємо завантаження через наш API
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    const form = new FormData();
    form.append('files', fs.createReadStream(testImagePath));
    form.append('ref', 'api::bouquet.bouquet');
    form.append('refId', 'test-id');
    form.append('field', 'image');

    console.log('Testing upload to Strapi...');
    
    const response = await fetch('http://localhost:1337/api/upload', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer 6788d62078ae71268daa71618bf1ada0b3531de7f1991680cb271737aacb5d081538e30d5a6c4288e748ae50155b8bd8843551405b5d55d7c1c15c475d29758d2145363a5a9e9b55be69953c03c733b53dacf23e59acd5a6d16940762e6d7ae5a8d9dc23aa3c96ba97154936d9bb4b5e1887836322c533e0cb4130f0a990e73e'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload successful!');
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Upload failed!');
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  } finally {
    // Видаляємо тестовий файл
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('Test file cleaned up');
    }
  }
}

// Перевіряємо, чи запущений Strapi
fetch('http://localhost:1337/api/upload')
  .then(response => {
    if (response.status === 401) {
      console.log('✅ Strapi is running (401 = auth required)');
      testUpload();
    } else {
      console.log('❌ Strapi might not be running. Status:', response.status);
    }
  })
  .catch(error => {
    console.log('❌ Cannot connect to Strapi:', error.message);
    console.log('Make sure Strapi is running on http://localhost:1337');
  });
