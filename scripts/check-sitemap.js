#!/usr/bin/env node

/**
 * Скрипт для проверки доступности и формата sitemap.xml
 */

const https = require('https');
const http = require('http');

const SITEMAP_URL = 'https://kids-park.club/sitemap.xml';

function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('Слишком много редиректов (>5)'));
      return;
    }
    
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      // Обработка редиректов
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : new URL(res.headers.location, url).toString();
        console.log(`   Редирект ${res.statusCode} -> ${redirectUrl}`);
        return fetchUrl(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data, finalUrl: url });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function validateSitemap(xmlString) {
  const issues = [];
  const warnings = [];
  
  // Проверка наличия обязательных элементов
  if (!xmlString.includes('<urlset')) {
    issues.push('❌ Отсутствует корневой элемент <urlset>');
    return { issues, warnings, urlCount: 0 };
  }
  
  // Подсчет URL
  const urlMatches = xmlString.match(/<url>/g);
  const urlCount = urlMatches ? urlMatches.length : 0;
  
  console.log(`✅ Найдено URL: ${urlCount}`);
  
  if (urlCount === 0) {
    issues.push('❌ Sitemap пуст - нет элементов <url>');
  }
  
  if (urlCount > 50000) {
    issues.push(`❌ Слишком много URL: ${urlCount} (максимум 50,000)`);
  }
  
  // Проверка размера файла
  const xmlSize = Buffer.byteLength(xmlString, 'utf8');
  const sizeInMB = xmlSize / (1024 * 1024);
  
  console.log(`✅ Размер файла: ${sizeInMB.toFixed(2)} MB`);
  
  if (sizeInMB > 50) {
    issues.push(`❌ Размер файла слишком большой: ${sizeInMB.toFixed(2)} MB (максимум 50 MB)`);
  }
  
  // Проверка структуры XML (простая проверка на закрывающие теги)
  const locMatches = xmlString.match(/<loc>(.*?)<\/loc>/g);
  if (locMatches) {
    console.log(`✅ Найдено элементов <loc>: ${locMatches.length}`);
    
    // Проверка первых 10 URL
    const sampleLocs = locMatches.slice(0, 10).map(match => {
      return match.replace(/<\/?loc>/g, '');
    });
    
    sampleLocs.forEach((url, index) => {
      if (!url.startsWith('https://')) {
        issues.push(`❌ URL #${index + 1}: не начинается с https://: ${url.substring(0, 50)}...`);
      } else if (!url.includes('kids-park.club')) {
        warnings.push(`⚠️  URL #${index + 1}: не содержит kids-park.club: ${url.substring(0, 50)}...`);
      }
    });
    
    // Проверка на дубликаты (первые 100)
    const firstHundred = locMatches.slice(0, 100).map(m => m.replace(/<\/?loc>/g, ''));
    const unique = new Set(firstHundred);
    if (firstHundred.length !== unique.size) {
      warnings.push(`⚠️  Обнаружены возможные дубликаты URL в первых 100 записях`);
    }
  } else {
    issues.push('❌ Не найдено ни одного элемента <loc>');
  }
  
  // Проверка валидности XML структуры
  const openTags = (xmlString.match(/<[^/!?][^>]*>/g) || []).length;
  const closeTags = (xmlString.match(/<\/[^>]+>/g) || []).length;
  
  if (Math.abs(openTags - closeTags) > 5) {
    warnings.push(`⚠️  Возможная проблема со структурой XML: открывающих тегов ${openTags}, закрывающих ${closeTags}`);
  }
  
  return { issues, warnings, urlCount };
}

async function checkSitemap() {
  console.log('🔍 Проверка sitemap.xml...\n');
  console.log(`URL: ${SITEMAP_URL}\n`);
  
  try {
    // Проверка доступности
    console.log('1. Проверка доступности...');
    const response = await fetchUrl(SITEMAP_URL);
    
    if (response.status !== 200) {
      console.error(`❌ Ошибка: HTTP ${response.status}`);
      console.error(`   Ответ сервера: ${response.body.substring(0, 200)}`);
      process.exit(1);
    }
    
    console.log(`✅ HTTP статус: ${response.status}`);
    console.log(`✅ Final URL: ${response.finalUrl || SITEMAP_URL}`);
    console.log(`✅ Content-Type: ${response.headers['content-type'] || 'не указан'}`);
    
    if (!response.headers['content-type']?.includes('xml') && !response.headers['content-type']?.includes('text')) {
      console.log(`⚠️  Предупреждение: Content-Type не содержит 'xml' или 'text'`);
    }
    
    console.log('');
    
    // Проверка формата XML
    console.log('2. Проверка формата XML...');
    if (!response.body.trim().startsWith('<?xml') && !response.body.trim().startsWith('<urlset')) {
      console.error('❌ Ответ не является валидным XML');
      console.error('Первые 200 символов ответа:');
      console.error(response.body.substring(0, 200));
      process.exit(1);
    }
    console.log('✅ XML структура найдена');
    
    console.log('');
    
    // Валидация структуры sitemap
    console.log('3. Проверка структуры sitemap...');
    const { issues, warnings, urlCount } = validateSitemap(response.body);
    
    if (issues.length > 0) {
      console.log('\n❌ Найдены проблемы:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Предупреждения:');
      warnings.forEach(warning => console.log(`   ${warning}`));
    }
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ Все проверки пройдены успешно!');
    }
    
    console.log('');
    
    // Показать примеры URL
    const locMatches = response.body.match(/<loc>(.*?)<\/loc>/g);
    if (locMatches && locMatches.length > 0) {
      console.log('4. Примеры URL (первые 5):');
      locMatches.slice(0, 5).forEach((match, index) => {
        const url = match.replace(/<\/?loc>/g, '');
        // Попробуем найти lastmod и priority для этого URL
        const urlBlock = response.body.substring(
          response.body.indexOf(match),
          response.body.indexOf(match) + 500
        );
        const lastmodMatch = urlBlock.match(/<lastmod>(.*?)<\/lastmod>/);
        const priorityMatch = urlBlock.match(/<priority>(.*?)<\/priority>/);
        const lastmod = lastmodMatch ? lastmodMatch[1] : 'N/A';
        const priority = priorityMatch ? priorityMatch[1] : 'N/A';
        
        console.log(`   ${index + 1}. ${url}`);
        console.log(`      Last modified: ${lastmod}, Priority: ${priority}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке sitemap:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('   Возможная причина: домен не найден или недоступен');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Возможная причина: соединение отклонено (сайт не запущен?)');
    }
    process.exit(1);
  }
}

// Запуск проверки
checkSitemap().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});

