// Product Type + Brand Models mapping - hierarchical structure
// Format: productTypeModels[productType][brand] = models[]
const productBrandModels: Record<string, Record<string, string[]>> = {
    // Electronics - Mobile
    'mobile': {
        'apple': ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13', 'iPhone SE'],
        'samsung': ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23', 'Galaxy A54', 'Galaxy A34', 'Galaxy Z Fold 5'],
        'oneplus': ['OnePlus 12', 'OnePlus 11', 'OnePlus Nord 3', 'OnePlus Nord CE 3'],
        'xiaomi': ['Xiaomi 14 Pro', 'Xiaomi 13', 'Redmi Note 13 Pro', 'Redmi 13C', 'Poco X6 Pro'],
        'oppo': ['Oppo Reno 11 Pro', 'Oppo Find X7', 'Oppo A78', 'Oppo A58'],
        'vivo': ['Vivo V29 Pro', 'Vivo V29', 'Vivo V27', 'Vivo Y100', 'Vivo Y56'],
        'realme': ['Realme 12 Pro+', 'Realme 11 Pro', 'Realme C55', 'Realme Narzo 60'],
        'google': ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7a', 'Pixel Fold'],
        'motorola': ['Moto G84', 'Moto Edge 40', 'Moto G54', 'Razr 40'],
        'nokia': ['Nokia G42', 'Nokia C32', 'Nokia XR21'],
    },

    // Electronics - Laptop
    'laptop': {
        'apple': ['MacBook Air M2', 'MacBook Air M1', 'MacBook Pro 14"', 'MacBook Pro 16"'],
        'dell': ['XPS 13', 'XPS 15', 'XPS 17', 'Inspiron 15', 'Latitude 5430', 'Alienware m15'],
        'hp': ['Spectre x360', 'Envy 13', 'Envy 15', 'Pavilion 15', 'EliteBook 840', 'Omen 16'],
        'lenovo': ['ThinkPad X1 Carbon', 'ThinkPad T14', 'IdeaPad Slim 5', 'Yoga 9i', 'Legion 5 Pro'],
        'asus': ['ZenBook 14', 'ZenBook Duo', 'VivoBook 15', 'ROG Strix G15', 'TUF Gaming A15'],
        'acer': ['Swift 3', 'Swift 5', 'Aspire 5', 'Predator Helios 300', 'Nitro 5'],
        'msi': ['Modern 14', 'Prestige 14', 'GF63 Thin', 'Katana GF66', 'Stealth 15M'],
        'microsoft': ['Surface Laptop 5', 'Surface Laptop Go 3', 'Surface Pro 9', 'Surface Book 3'],
    },

    // Electronics - Tablet
    'tablet': {
        
        'apple': ['iPad Pro 12.9"', 'iPad Pro 11"', 'iPad Air', 'iPad 10th Gen', 'iPad Mini'],
        'samsung': ['Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9', 'Galaxy Tab A9+', 'Galaxy Tab A9'],
        'microsoft': ['Surface Pro 9', 'Surface Go 3'],
        'lenovo': ['Tab P12 Pro', 'Tab P11 Plus', 'Yoga Tab 13'],
    },

    // Electronics - PC
    'pc': {
        'apple': ['Mac Mini M2', 'Mac Studio', 'iMac 24"', 'Mac Pro'],
        'dell': ['OptiPlex 7010', 'XPS Desktop', 'Alienware Aurora R15'],
        'hp': ['Pavilion Desktop', 'OMEN 45L', 'EliteDesk 800'],
        'lenovo': ['IdeaCentre AIO', 'ThinkCentre M90a', 'Legion Tower 5'],
    },

    // Appliances - Refrigerator
    'refrigerator': {
        'samsung': ['French Door RF28R7351', 'Side-by-Side RS27T5200', 'Top Freezer RT18M6213'],
        'lg': ['French Door LFXS28968', 'InstaView LRMVS3006', 'Side-by-Side LSXS26366'],
        'whirlpool': ['French Door WRF535SWHZ', 'Side-by-Side WRS588FIHZ', 'Top Freezer WRT318FZDW'],
        'bosch': ['800 Series B36CL80ENS', '500 Series B11CB50SSS'],
        'ge': ['Profile PFE28KYNFS', 'Cafe CVE28DP4NW2', 'Top Freezer GTS18GTHWW'],
    },

    // Appliances - Washing Machine
    'washing-machine': {
        'samsung': ['Front Load WF45R6100', 'Top Load WA50R5400', 'AddWash WW90K6414'],
        'lg': ['Front Load WM4000HWA', 'Top Load WT7800CW', 'TurboWash WM3900HWA'],
        'whirlpool': ['Front Load WFW6620HC', 'Top Load WTW7120HW', 'Cabrio WTW8700EC'],
        'bosch': ['800 Series WAW285H2UC', '500 Series WAT28401UC'],
    },

    // Appliances - Microwave
    'microwave': {
        'samsung': ['Countertop MS14K6000', 'Over-Range ME21M706BAS', 'Smart MC28H5015AK'],
        'lg': ['NeoChef LMC2075', 'Over-Range LMV2031', 'Countertop LMC0975'],
        'panasonic': ['Cyclonic NN-SD975S', 'Inverter NN-SN966S', 'Compact NN-SN651'],
    },

    // Furniture - Sofa
    'sofa': {
        'ikea': ['EKTORP 3-Seater', 'FRIHETEN Sleeper', 'VIMLE Corner', 'KIVIK Loveseat'],
        'ashley': ['Darcy Sofa', 'Larkinhurst Sofa', 'Alenya Sectional'],
        'wayfair': ['Wade Logan Sectional', 'Zipcode Sleeper', 'Mercury Row Modern'],
    },

    // Furniture - Table
    'table': {
        'ikea': ['LACK Coffee Table', 'LISABO Dining Table', 'MELLTORP Table'],
        'ashley': ['Rokane Dining Table', 'Tyler Creek Coffee Table'],
        'wayfair': ['Three Posts Dining', 'Laurel Foundry Coffee Table'],
    },
};

export default productBrandModels;
