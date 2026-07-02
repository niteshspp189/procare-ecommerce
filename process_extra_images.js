const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/procare-mail/june30/unzipped/New folder (3)& 4th Images';
const targetDir = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/storefront/public/images/extra';
const sqlOut = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/extra_images.sql';

const productMap = {
    'Application Brush': 'prod_01KWC2J4SMTFJMFT81CZ1QD61B',
    'Foam Cleaner -Neutral': 'prod_01KWC2J4SM7XXFZ78B4458373X',
    'Gloss Brush': 'prod_01KWC2J4SMFT52SKBGS1P6A6AN',
    'Horse hair Brush': 'prod_01KWC2J4SMRYRRJ0ZJB499MAXA',
    'Hydro Sheild': 'prod_01KWC2J4SNHWADF3T4RHW6C27F',
    'Instant Shine': 'prod_01KWC2J4SKT0W9HXFKV6JK4ZG4',
    'Leather Moisturize -Neutral': 'prod_01KWC2J4SK93N7MKMM1ZA9KF6V',
    'Nubuck 2 in 1 Neutral': 'prod_01KWC2J4SNAY3D4H0MMPDB0Z0Z',
    'Perfect Clean Gel 50ml Neutral': 'prod_01KWC2J4SNBG599MTGHP1VGKTV',
    'Power Sneaker Cleaner -Neutral': 'prod_01KWC2J4SKVWWMWQR68QQJRM7K',
    'PRO GOLD Clean Power Cleaner(Cleaning Shampoo & Mini Brush) -Neutral': 'prod_01KWC2J4SKFAKMSSBDP2FKNY4V',
    'PRO GOLD Clean Sneaker Wipes-Pack of 30 -Neutral': 'prod_01KWC2J4SK6QPE0G45PEWQBTBT',
    'Self Shine': 'prod_01KWC2J4SK03SFWVYVQQ71VT5Q',
    'Shoe Cream': 'prod_01KWC2J4SJBGR7R9RF3303YA43',
    'Shoe cream with applicator': 'prod_01KWC2J4SKFHSD8BDBPEAB9KWT',
    'Shoe Deo': 'prod_01KWC2J4SMGAHQWBD14VH90V76',
    'Shoe Tree/Premium Shoe Tree': 'prod_01KWC2J4SNMWFGK91RXJXPC2RB',
    'Shoe Tree/Shoe Tree With Spiral': 'prod_01KWC2J4SNX3CWBH1EA1CN62YA',
    'Sports & Sneaker Kit': 'prod_01KWC2J4SMEPE3FM8DE64HV6BZ'
};

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

let sqlStatements = [];
let rankTracker = {};

function getFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            getFiles(filepath, files);
        } else {
            files.push(filepath);
        }
    }
    return files;
}

const generateId = () => 'img_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const allFiles = getFiles(sourceDir);

for (const file of allFiles) {
    let relPath = path.relative(sourceDir, file);
    let matchedKey = null;
    let productId = null;

    // Special check for Shoe Tree subfolders
    if (relPath.startsWith('Shoe Tree/Premium Shoe Tree')) {
        matchedKey = 'Shoe Tree/Premium Shoe Tree';
    } else if (relPath.startsWith('Shoe Tree/Shoe Tree With Spiral')) {
        matchedKey = 'Shoe Tree/Shoe Tree With Spiral';
    } else {
        matchedKey = Object.keys(productMap).find(k => relPath.startsWith(k));
    }

    if (matchedKey) {
        productId = productMap[matchedKey];
    }

    if (productId) {
        if (!rankTracker[productId]) rankTracker[productId] = 2; // starting rank at 2 (assuming 0,1 are already there)
        const rank = rankTracker[productId]++;

        const ext = path.extname(file);
        const baseName = path.basename(file, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        
        // Target filename
        const outName = `${productId}_${rank}_${baseName}.webp`;
        const outPath = path.join(targetDir, outName);
        const webUrl = `/images/extra/${outName}`;

        console.log(`Converting ${relPath} to ${outName}`);
        try {
            execSync(`magick "${file}" -quality 80 "${outPath}"`);
            
            const imgId = generateId();
            sqlStatements.push(`INSERT INTO image (id, url, created_at, updated_at, rank, product_id) VALUES ('${imgId}', '${webUrl}', NOW(), NOW(), ${rank}, '${productId}');`);
        } catch (err) {
            console.error(`Failed to convert ${file}`, err.message);
        }
    } else {
        console.warn(`No product match for ${relPath}`);
    }
}

fs.writeFileSync(sqlOut, sqlStatements.join('\n'));
console.log('SQL file written to', sqlOut);
