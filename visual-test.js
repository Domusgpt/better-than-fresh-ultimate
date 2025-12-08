import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const DEPLOYED_URL = 'https://better-than-fresh-513072589861.us-west1.run.app/';
const LOCAL_URL = 'http://localhost:8001';

// Create screenshots directory
const screenshotsDir = './test-screenshots';
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

// Test results storage
const testResults = {
    deployed: {
        url: DEPLOYED_URL,
        screenshots: [],
        issues: [],
        features: {}
    },
    local: {
        url: LOCAL_URL,
        screenshots: [],
        issues: [],
        features: {}
    }
};

async function runVisualTests() {
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        console.log('🚀 Starting comprehensive visual testing...\n');

        // Test deployed site
        console.log('📡 Testing deployed site...');
        await testSite(browser, DEPLOYED_URL, 'deployed');

        // Test local site
        console.log('\n🏠 Testing local site...');
        await testSite(browser, LOCAL_URL, 'local');

        // Generate report
        await generateTestReport();

    } catch (error) {
        console.error('❌ Testing failed:', error);
    } finally {
        await browser.close();
    }
}

async function testSite(browser, url, siteType) {
    const page = await browser.newPage();
    
    try {
        console.log(`\n🌊 Testing: ${url}`);

        // Set viewport for desktop testing
        await page.setViewport({ width: 1920, height: 1080 });

        // Navigate to site with network monitoring
        const response = await page.goto(url, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        if (!response || !response.ok()) {
            testResults[siteType].issues.push({
                type: 'Navigation',
                message: `Failed to load site: ${response?.status()} ${response?.statusText()}`
            });
            return;
        }

        console.log('✅ Site loaded successfully');

        // Wait for initial render
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test 1: Full page screenshot
        console.log('📸 Taking full page screenshot...');
        const screenshotPath = path.join(screenshotsDir, `${siteType}-fullpage-desktop.png`);
        await page.screenshot({ 
            path: screenshotPath, 
            fullPage: true 
        });
        testResults[siteType].screenshots.push({
            name: 'Full Page Desktop',
            path: screenshotPath
        });

        // Test 2: Check for WebGL canvas
        console.log('🎮 Testing WebGL background effects...');
        const webglCanvas = await page.$('canvas');
        if (webglCanvas) {
            console.log('✅ WebGL canvas found');
            testResults[siteType].features.webgl = true;
        } else {
            console.log('❌ WebGL canvas not found');
            testResults[siteType].features.webgl = false;
            testResults[siteType].issues.push({
                type: 'WebGL',
                message: 'WebGL canvas element not found'
            });
        }

        // Test 3: Check for seafood product cards
        console.log('🐟 Testing seafood product cards...');
        const productCards = await page.$$('.card, [data-testid*="card"], .product-card, .seafood-card');
        console.log(`Found ${productCards.length} potential product cards`);
        
        if (productCards.length === 0) {
            testResults[siteType].issues.push({
                type: 'Content',
                message: 'No product cards found'
            });
        }

        // Test 4: Check for images
        console.log('🖼️ Testing image loading...');
        const images = await page.$$('img');
        let loadedImages = 0;
        let brokenImages = 0;

        for (let img of images) {
            const src = await img.evaluate(el => el.src);
            const complete = await img.evaluate(el => el.complete);
            const naturalWidth = await img.evaluate(el => el.naturalWidth);
            
            if (complete && naturalWidth > 0) {
                loadedImages++;
            } else {
                brokenImages++;
                testResults[siteType].issues.push({
                    type: 'Images',
                    message: `Broken image: ${src}`
                });
            }
        }

        console.log(`📊 Images: ${loadedImages} loaded, ${brokenImages} broken`);

        // Test 5: Check navigation menu
        console.log('🧭 Testing navigation menu...');
        const navElements = await page.$$('nav, .nav, .navigation, .menu');
        testResults[siteType].features.navigation = navElements.length > 0;

        // Test 6: Test scroll behavior and animations
        console.log('📜 Testing scroll interactions...');
        await page.evaluate(() => window.scrollTo(0, 500));
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const scrollScreenshotPath = path.join(screenshotsDir, `${siteType}-scroll-test.png`);
        await page.screenshot({ 
            path: scrollScreenshotPath, 
            fullPage: false 
        });
        testResults[siteType].screenshots.push({
            name: 'Scroll Test',
            path: scrollScreenshotPath
        });

        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 7: Responsive design
        console.log('📱 Testing responsive design...');
        
        // Mobile viewport
        await page.setViewport({ width: 375, height: 667 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mobileScreenshotPath = path.join(screenshotsDir, `${siteType}-mobile-375w.png`);
        await page.screenshot({ 
            path: mobileScreenshotPath, 
            fullPage: true 
        });
        testResults[siteType].screenshots.push({
            name: 'Mobile 375px',
            path: mobileScreenshotPath
        });

        // Tablet viewport
        await page.setViewport({ width: 768, height: 1024 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const tabletScreenshotPath = path.join(screenshotsDir, `${siteType}-tablet-768w.png`);
        await page.screenshot({ 
            path: tabletScreenshotPath, 
            fullPage: true 
        });
        testResults[siteType].screenshots.push({
            name: 'Tablet 768px',
            path: tabletScreenshotPath
        });

        // Large desktop viewport
        await page.setViewport({ width: 2560, height: 1440 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const largeScreenshotPath = path.join(screenshotsDir, `${siteType}-large-2560w.png`);
        await page.screenshot({ 
            path: largeScreenshotPath, 
            fullPage: false 
        });
        testResults[siteType].screenshots.push({
            name: 'Large Desktop 2560px',
            path: largeScreenshotPath
        });

        // Test 8: Check for console errors
        console.log('🐛 Checking for console errors...');
        const logs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                logs.push(msg.text());
            }
        });

        // Wait a bit more to catch any delayed errors
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (logs.length > 0) {
            testResults[siteType].issues.push({
                type: 'Console Errors',
                message: logs.join('; ')
            });
        }

        // Test 9: Performance metrics
        console.log('⚡ Gathering performance metrics...');
        const metrics = await page.metrics();
        testResults[siteType].features.performance = {
            JSHeapUsedSize: (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2) + ' MB',
            JSHeapTotalSize: (metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2) + ' MB',
            Timestamp: new Date(metrics.Timestamp * 1000).toISOString()
        };

        // Test 10: Check specific nautical theme elements
        console.log('⚓ Testing nautical theme elements...');
        
        // Check for specific nautical keywords in page content
        const pageContent = await page.content();
        const nauticalKeywords = ['ocean', 'nautical', 'seafood', 'marine', 'compass', 'current'];
        const foundKeywords = nauticalKeywords.filter(keyword => 
            pageContent.toLowerCase().includes(keyword)
        );
        
        testResults[siteType].features.nauticalTheme = {
            foundKeywords,
            hasTheme: foundKeywords.length > 0
        };

        console.log(`✅ Testing complete for ${url}`);

    } catch (error) {
        console.error(`❌ Error testing ${url}:`, error);
        testResults[siteType].issues.push({
            type: 'General Error',
            message: error.message
        });
    } finally {
        await page.close();
    }
}

async function generateTestReport() {
    console.log('\n📋 Generating test report...');
    
    const reportPath = path.join(screenshotsDir, 'test-report.md');
    const timestamp = new Date().toISOString();
    
    let report = `# Better Than Fresh - Visual Testing Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;
    
    // Report for each site
    for (const [siteType, results] of Object.entries(testResults)) {
        report += `## ${siteType.charAt(0).toUpperCase() + siteType.slice(1)} Site Testing\n\n`;
        report += `**URL:** ${results.url}\n\n`;
        
        // Screenshots
        report += `### Screenshots Captured\n\n`;
        results.screenshots.forEach(screenshot => {
            report += `- **${screenshot.name}:** \`${screenshot.path}\`\n`;
        });
        report += `\n`;
        
        // Features
        report += `### Features Detected\n\n`;
        report += `- **WebGL Canvas:** ${results.features.webgl ? '✅ Present' : '❌ Missing'}\n`;
        report += `- **Navigation:** ${results.features.navigation ? '✅ Present' : '❌ Missing'}\n`;
        
        if (results.features.nauticalTheme) {
            report += `- **Nautical Theme:** ${results.features.nauticalTheme.hasTheme ? '✅ Present' : '❌ Missing'}\n`;
            if (results.features.nauticalTheme.foundKeywords.length > 0) {
                report += `  - Keywords found: ${results.features.nauticalTheme.foundKeywords.join(', ')}\n`;
            }
        }
        
        if (results.features.performance) {
            report += `- **Performance Metrics:**\n`;
            report += `  - JS Heap Used: ${results.features.performance.JSHeapUsedSize}\n`;
            report += `  - JS Heap Total: ${results.features.performance.JSHeapTotalSize}\n`;
        }
        report += `\n`;
        
        // Issues
        if (results.issues.length > 0) {
            report += `### Issues Found\n\n`;
            results.issues.forEach((issue, index) => {
                report += `${index + 1}. **${issue.type}:** ${issue.message}\n`;
            });
        } else {
            report += `### Issues Found\n\n✅ No issues detected!\n`;
        }
        report += `\n---\n\n`;
    }
    
    // Recommendations
    report += `## Recommendations\n\n`;
    
    const allIssues = [...testResults.deployed.issues, ...testResults.local.issues];
    if (allIssues.length > 0) {
        const issueTypes = [...new Set(allIssues.map(issue => issue.type))];
        
        issueTypes.forEach(type => {
            const typeIssues = allIssues.filter(issue => issue.type === type);
            report += `### ${type} Issues\n\n`;
            
            switch (type) {
                case 'WebGL':
                    report += `- Ensure WebGL canvas is properly initialized\n`;
                    report += `- Check browser WebGL support\n`;
                    report += `- Verify shader compilation\n`;
                    break;
                case 'Images':
                    report += `- Fix broken image URLs\n`;
                    report += `- Ensure proper image loading error handling\n`;
                    report += `- Consider image lazy loading\n`;
                    break;
                case 'Console Errors':
                    report += `- Fix JavaScript errors in console\n`;
                    report += `- Check for missing dependencies\n`;
                    report += `- Ensure proper error handling\n`;
                    break;
                case 'Content':
                    report += `- Verify product cards are rendering\n`;
                    report += `- Check data loading and state management\n`;
                    report += `- Ensure proper component mounting\n`;
                    break;
                default:
                    report += `- Address specific ${type.toLowerCase()} issues listed above\n`;
            }
            report += `\n`;
        });
    } else {
        report += `✅ No major issues found! The site appears to be functioning well.\n\n`;
        report += `### General Optimization Suggestions\n\n`;
        report += `- Consider adding performance monitoring\n`;
        report += `- Implement progressive image loading\n`;
        report += `- Add loading states for WebGL initialization\n`;
        report += `- Consider adding error boundaries for better error handling\n`;
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Test report saved to: ${reportPath}`);
    
    return report;
}

// Run the tests
runVisualTests().catch(console.error);