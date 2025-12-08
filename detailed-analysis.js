import puppeteer from 'puppeteer';

async function detailedAnalysis() {
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Monitor console logs
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location()
        });
    });

    // Monitor network requests
    const failedRequests = [];
    page.on('response', response => {
        if (!response.ok()) {
            failedRequests.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            });
        }
    });

    try {
        console.log('🔍 Starting detailed functional analysis...');
        
        // Test deployed site
        await page.goto('https://better-than-fresh-513072589861.us-west1.run.app/', { 
            waitUntil: 'networkidle2' 
        });

        // Wait for site to fully load
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('\n📊 Performance Analysis:');
        const metrics = await page.metrics();
        console.log(`- JS Heap Used: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- JS Heap Total: ${(metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- DOM Nodes: ${metrics.Nodes}`);
        console.log(`- Event Listeners: ${metrics.JSEventListeners}`);

        // Test WebGL functionality
        console.log('\n🎮 WebGL Analysis:');
        const webglInfo = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return { status: 'No canvas found' };
            
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return { status: 'WebGL not supported' };
            
            return {
                status: 'Active',
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                canvasSize: {
                    width: canvas.width,
                    height: canvas.height
                }
            };
        });
        console.log('- Status:', webglInfo.status);
        if (webglInfo.vendor) {
            console.log('- Vendor:', webglInfo.vendor);
            console.log('- Renderer:', webglInfo.renderer);
            console.log('- Canvas Size:', `${webglInfo.canvasSize.width}x${webglInfo.canvasSize.height}`);
        }

        // Check for specific nautical elements
        console.log('\n⚓ Nautical Theme Elements:');
        const nauticalElements = await page.evaluate(() => {
            const elements = {
                shipWheel: !!document.querySelector('[data-lucide="ship-wheel"]'),
                compass: !!document.querySelector('[data-lucide="compass"]'),
                anchor: !!document.querySelector('[data-lucide="anchor"]'),
                backgroundEffects: !!document.querySelector('canvas'),
                depthGauge: !!document.querySelector('.fixed.right-8'),
                navElements: document.querySelectorAll('nav').length
            };
            
            // Check for animated elements
            const animatedElements = Array.from(document.querySelectorAll('*')).filter(el => {
                const style = getComputedStyle(el);
                return style.animationName !== 'none' || style.transform !== 'none';
            });
            
            elements.animatedElements = animatedElements.length;
            return elements;
        });
        
        console.log('- Ship Wheel Icon:', nauticalElements.shipWheel ? '✅' : '❌');
        console.log('- Compass Icons:', nauticalElements.compass ? '✅' : '❌');
        console.log('- Anchor Icon:', nauticalElements.anchor ? '✅' : '❌');
        console.log('- Background Effects:', nauticalElements.backgroundEffects ? '✅' : '❌');
        console.log('- Depth Gauge:', nauticalElements.depthGauge ? '✅' : '❌');
        console.log('- Navigation Elements:', nauticalElements.navElements);
        console.log('- Animated Elements:', nauticalElements.animatedElements);

        // Test scroll behavior
        console.log('\n📜 Scroll Interaction Testing:');
        const initialScroll = await page.evaluate(() => window.pageYOffset);
        console.log('- Initial Scroll Position:', initialScroll);
        
        // Scroll down to test animations
        await page.evaluate(() => window.scrollTo(0, 500));
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const midScroll = await page.evaluate(() => window.pageYOffset);
        console.log('- Mid Scroll Position:', midScroll);
        
        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const bottomScroll = await page.evaluate(() => window.pageYOffset);
        console.log('- Bottom Scroll Position:', bottomScroll);
        
        // Return to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check for seafood content cards
        console.log('\n🐟 Seafood Content Analysis:');
        const contentAnalysis = await page.evaluate(() => {
            // Look for seafood-related content
            const pageText = document.body.innerText.toLowerCase();
            const seafoodTerms = ['tuna', 'swordfish', 'mahi', 'snapper', 'grouper', 'yellowfin'];
            const foundTerms = seafoodTerms.filter(term => pageText.includes(term));
            
            // Count images
            const images = Array.from(document.querySelectorAll('img'));
            const loadedImages = images.filter(img => img.complete && img.naturalWidth > 0);
            
            // Check for product cards (looking for the actual structure)
            const cardContainers = document.querySelectorAll('[class*="card-inner"], .group.cursor-pointer');
            
            return {
                foundSeafoodTerms: foundTerms,
                totalImages: images.length,
                loadedImages: loadedImages.length,
                cardContainers: cardContainers.length,
                hasHeroImage: !!document.querySelector('header img'),
                pageTextLength: pageText.length
            };
        });
        
        console.log('- Seafood Terms Found:', contentAnalysis.foundSeafoodTerms.join(', '));
        console.log('- Total Images:', contentAnalysis.totalImages);
        console.log('- Loaded Images:', contentAnalysis.loadedImages);
        console.log('- Product Card Containers:', contentAnalysis.cardContainers);
        console.log('- Hero Image Present:', contentAnalysis.hasHeroImage ? '✅' : '❌');

        // Check console errors
        console.log('\n🐛 Console Messages:');
        const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
        const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');
        
        console.log('- Error Messages:', errorMessages.length);
        console.log('- Warning Messages:', warningMessages.length);
        
        if (errorMessages.length > 0) {
            console.log('\n❌ Console Errors:');
            errorMessages.forEach((msg, i) => {
                console.log(`${i + 1}. ${msg.text}`);
            });
        }

        // Check failed network requests
        console.log('\n🌐 Network Analysis:');
        console.log('- Failed Requests:', failedRequests.length);
        
        if (failedRequests.length > 0) {
            console.log('\n❌ Failed Requests:');
            failedRequests.forEach((req, i) => {
                console.log(`${i + 1}. ${req.url} - ${req.status} ${req.statusText}`);
            });
        }

        console.log('\n✅ Detailed analysis complete!');

    } catch (error) {
        console.error('❌ Analysis failed:', error);
    } finally {
        await browser.close();
    }
}

detailedAnalysis().catch(console.error);