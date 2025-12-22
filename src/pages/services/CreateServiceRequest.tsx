import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Search,
    Plus,
    Trash2,
    CloudUpload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { toast } from 'sonner';
import { useServiceRequest } from '@/contexts/ServiceRequestContext';
import productBrandModels from '@/data/productBrandModels';


type ProductCategory = 'electronics' | 'appliances' | 'furniture';

interface PartItem {
    id: string;
    name: string;
    sku: string;
    status: string;
    quantity: number;
    price: number;
}

// Parts catalog organized by category and product type
const partsCatalog = {
    electronics: {
        mobile: [
            { id: 'mob-scr-001', name: 'Mobile Screen', sku: 'MOB-SCR-001', status: 'In Stock', quantity: 1, price: 150.00 },
            { id: 'mob-bat-001', name: 'Mobile Battery', sku: 'MOB-BAT-001', status: 'In Stock', quantity: 1, price: 50.00 },
            { id: 'mob-cam-001', name: 'Back Camera', sku: 'MOB-CAM-001', status: 'In Stock', quantity: 1, price: 80.00 },
            { id: 'mob-chg-001', name: 'Charging Port', sku: 'MOB-CHG-001', status: 'In Stock', quantity: 1, price: 30.00 },
            { id: 'mob-spk-001', name: 'Speaker', sku: 'MOB-SPK-001', status: 'In Stock', quantity: 1, price: 25.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 80.00 },
        ],
        laptop: [
            { id: 'lap-scr-001', name: 'Laptop Screen', sku: 'LAP-SCR-001', status: 'In Stock', quantity: 1, price: 250.00 },
            { id: 'lap-bat-001', name: 'Laptop Battery', sku: 'LAP-BAT-001', status: 'In Stock', quantity: 1, price: 120.00 },
            { id: 'lap-kbd-001', name: 'Keyboard', sku: 'LAP-KBD-001', status: 'In Stock', quantity: 1, price: 60.00 },
            { id: 'lap-ram-001', name: 'RAM 8GB', sku: 'LAP-RAM-001', status: 'In Stock', quantity: 1, price: 80.00 },
            { id: 'lap-hdd-001', name: 'SSD 256GB', sku: 'LAP-HDD-001', status: 'In Stock', quantity: 1, price: 100.00 },
            { id: 'lap-fan-001', name: 'Cooling Fan', sku: 'LAP-FAN-001', status: 'In Stock', quantity: 1, price: 40.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 100.00 },
        ],
        tablet: [
            { id: 'tab-scr-001', name: 'Tablet Screen', sku: 'TAB-SCR-001', status: 'In Stock', quantity: 1, price: 180.00 },
            { id: 'tab-bat-001', name: 'Tablet Battery', sku: 'TAB-BAT-001', status: 'In Stock', quantity: 1, price: 70.00 },
            { id: 'tab-chg-001', name: 'Charging Port', sku: 'TAB-CHG-001', status: 'In Stock', quantity: 1, price: 35.00 },
            { id: 'tab-cam-001', name: 'Camera Module', sku: 'TAB-CAM-001', status: 'In Stock', quantity: 1, price: 60.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 80.00 },
        ],
        pc: [
            { id: 'pc-cpu-001', name: 'CPU Processor', sku: 'PC-CPU-001', status: 'In Stock', quantity: 1, price: 300.00 },
            { id: 'pc-ram-001', name: 'RAM 16GB', sku: 'PC-RAM-001', status: 'In Stock', quantity: 1, price: 150.00 },
            { id: 'pc-gpu-001', name: 'Graphics Card', sku: 'PC-GPU-001', status: 'In Stock', quantity: 1, price: 400.00 },
            { id: 'pc-psu-001', name: 'Power Supply', sku: 'PC-PSU-001', status: 'In Stock', quantity: 1, price: 100.00 },
            { id: 'pc-ssd-001', name: 'SSD 512GB', sku: 'PC-SSD-001', status: 'In Stock', quantity: 1, price: 120.00 },
            { id: 'pc-fan-001', name: 'Case Fan', sku: 'PC-FAN-001', status: 'In Stock', quantity: 1, price: 30.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 120.00 },
        ],
    },
    appliances: {
        refrigerator: [
            { id: 'ref-com-001', name: 'Compressor', sku: 'REF-COM-001', status: 'In Stock', quantity: 1, price: 350.00 },
            { id: 'ref-thr-001', name: 'Thermostat', sku: 'REF-THR-001', status: 'In Stock', quantity: 1, price: 80.00 },
            { id: 'ref-fan-001', name: 'Evaporator Fan', sku: 'REF-FAN-001', status: 'In Stock', quantity: 1, price: 60.00 },
            { id: 'ref-dor-001', name: 'Door Seal', sku: 'REF-DOR-001', status: 'In Stock', quantity: 1, price: 40.00 },
            { id: 'ref-def-001', name: 'Defrost Timer', sku: 'REF-DEF-001', status: 'In Stock', quantity: 1, price: 50.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 120.00 },
        ],
        'washing-machine': [
            { id: 'wm-mtr-001', name: 'Motor', sku: 'WM-MTR-001', status: 'In Stock', quantity: 1, price: 200.00 },
            { id: 'wm-pmp-001', name: 'Water Pump', sku: 'WM-PMP-001', status: 'In Stock', quantity: 1, price: 70.00 },
            { id: 'wm-blt-001', name: 'Drive Belt', sku: 'WM-BLT-001', status: 'In Stock', quantity: 1, price: 30.00 },
            { id: 'wm-dor-001', name: 'Door Lock', sku: 'WM-DOR-001', status: 'In Stock', quantity: 1, price: 50.00 },
            { id: 'wm-vlv-001', name: 'Water Inlet Valve', sku: 'WM-VLV-001', status: 'In Stock', quantity: 1, price: 40.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 100.00 },
        ],
        microwave: [
            { id: 'mw-mag-001', name: 'Magnetron', sku: 'MW-MAG-001', status: 'In Stock', quantity: 1, price: 120.00 },
            { id: 'mw-trn-001', name: 'Turntable Motor', sku: 'MW-TRN-001', status: 'In Stock', quantity: 1, price: 35.00 },
            { id: 'mw-dor-001', name: 'Door Switch', sku: 'MW-DOR-001', status: 'In Stock', quantity: 1, price: 25.00 },
            { id: 'mw-cap-001', name: 'High Voltage Capacitor', sku: 'MW-CAP-001', status: 'In Stock', quantity: 1, price: 40.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 80.00 },
        ],
        dishwasher: [
            { id: 'dw-pmp-001', name: 'Drain Pump', sku: 'DW-PMP-001', status: 'In Stock', quantity: 1, price: 90.00 },
            { id: 'dw-arm-001', name: 'Spray Arm', sku: 'DW-ARM-001', status: 'In Stock', quantity: 1, price: 50.00 },
            { id: 'dw-htr-001', name: 'Heating Element', sku: 'DW-HTR-001', status: 'In Stock', quantity: 1, price: 70.00 },
            { id: 'dw-dor-001', name: 'Door Latch', sku: 'DW-DOR-001', status: 'In Stock', quantity: 1, price: 45.00 },
            { id: 'dw-rck-001', name: 'Dish Rack', sku: 'DW-RCK-001', status: 'In Stock', quantity: 1, price: 60.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 100.00 },
        ],
    },
    furniture: {
        sofa: [
            { id: 'sof-csh-001', name: 'Cushion Foam', sku: 'SOF-CSH-001', status: 'In Stock', quantity: 1, price: 80.00 },
            { id: 'sof-leg-001', name: 'Sofa Leg (Set of 4)', sku: 'SOF-LEG-001', status: 'In Stock', quantity: 1, price: 40.00 },
            { id: 'sof-spr-001', name: 'Spring Replacement', sku: 'SOF-SPR-001', status: 'In Stock', quantity: 1, price: 60.00 },
            { id: 'sof-fab-001', name: 'Upholstery Fabric (per yard)', sku: 'SOF-FAB-001', status: 'In Stock', quantity: 1, price: 50.00 },
            { id: 'sof-frm-001', name: 'Frame Repair Kit', sku: 'SOF-FRM-001', status: 'In Stock', quantity: 1, price: 70.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 100.00 },
        ],
        table: [
            { id: 'tbl-top-001', name: 'Table Top', sku: 'TBL-TOP-001', status: 'In Stock', quantity: 1, price: 150.00 },
            { id: 'tbl-leg-001', name: 'Table Leg (Set of 4)', sku: 'TBL-LEG-001', status: 'In Stock', quantity: 1, price: 60.00 },
            { id: 'tbl-hng-001', name: 'Hinges', sku: 'TBL-HNG-001', status: 'In Stock', quantity: 1, price: 25.00 },
            { id: 'tbl-ext-001', name: 'Extension Mechanism', sku: 'TBL-EXT-001', status: 'In Stock', quantity: 1, price: 80.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 80.00 },
        ],
        chair: [
            { id: 'chr-csh-001', name: 'Chair Cushion', sku: 'CHR-CSH-001', status: 'In Stock', quantity: 1, price: 40.00 },
            { id: 'chr-leg-001', name: 'Chair Leg (Set of 4)', sku: 'CHR-LEG-001', status: 'In Stock', quantity: 1, price: 35.00 },
            { id: 'chr-bck-001', name: 'Backrest', sku: 'CHR-BCK-001', status: 'In Stock', quantity: 1, price: 60.00 },
            { id: 'chr-whl-001', name: 'Wheels (Set of 5)', sku: 'CHR-WHL-001', status: 'In Stock', quantity: 1, price: 30.00 },
            { id: 'chr-gas-001', name: 'Gas Lift Cylinder', sku: 'CHR-GAS-001', status: 'In Stock', quantity: 1, price: 50.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 60.00 },
        ],
        bed: [
            { id: 'bed-mat-001', name: 'Mattress', sku: 'BED-MAT-001', status: 'In Stock', quantity: 1, price: 300.00 },
            { id: 'bed-frm-001', name: 'Bed Frame', sku: 'BED-FRM-001', status: 'In Stock', quantity: 1, price: 250.00 },
            { id: 'bed-slt-001', name: 'Slat Set', sku: 'BED-SLT-001', status: 'In Stock', quantity: 1, price: 80.00 },
            { id: 'bed-hdb-001', name: 'Headboard', sku: 'BED-HDB-001', status: 'In Stock', quantity: 1, price: 120.00 },
            { id: 'bed-leg-001', name: 'Bed Legs (Set of 4)', sku: 'BED-LEG-001', status: 'In Stock', quantity: 1, price: 50.00 },
            { id: 'gen-lbr-001', name: 'Standard Labor', sku: 'SVC-LBR-1', status: 'Available', quantity: 1, price: 100.00 },
        ],
    },
};

// Product type images - static URLs for each product type


// Brand logos mapping - using logo.dev for reliable logo delivery
const brandLogos: Record<string, string> = {
    // Electronics brands
    'apple': 'https://1000logos.net/wp-content/uploads/2016/10/Apple-Logo.png',
    'samsung': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcReUuTHRDMBjRpMlVVk8YsPYS79B-U2oLdJuw&s',
    'oneplus': 'https://static.vecteezy.com/system/resources/previews/068/842/048/non_2x/oneplus-wordmark-logo-mobile-company-brand-official-icon-emblem-transparent-background-free-png.png',
    'xiaomi': 'https://1000logos.net/wp-content/uploads/2021/08/Xiaomi-Logo-2014.png',
    'oppo': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8oDIBg2zyPE1ree8dclglIj_ppBgHGziUhw&s',
    'vivo': 'https://crystalpng.com/wp-content/uploads/2025/05/vivo-logo.png',
    'realme': 'https://img.logo.dev/realme.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'google': 'https://img.logo.dev/google.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'microsoft': 'https://img.logo.dev/microsoft.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'dell': 'https://img.logo.dev/dell.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'hp': 'https://img.logo.dev/hp.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'lenovo': 'https://img.logo.dev/lenovo.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'asus': 'https://img.logo.dev/asus.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'acer': 'https://img.logo.dev/acer.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'msi': 'https://img.logo.dev/msi.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'sony': 'https://img.logo.dev/sony.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'huawei': 'https://img.logo.dev/huawei.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'nokia': 'https://img.logo.dev/nokia.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'motorola': 'https://img.logo.dev/motorola.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',

    // Appliances brands
    'lg': 'https://www.freepnglogos.com/uploads/lg-logo-png/lg-logo-partnership-with-bang-olufsen-yields-top-class-1.png',
    'whirlpool': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUxc2F6dZuBnPQEDnpX9a35qIGWCIXDteHIg&s',
    'bosch': 'https://img.logo.dev/bosch.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'ge': 'https://img.logo.dev/ge.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'frigidaire': 'https://img.logo.dev/frigidaire.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'maytag': 'https://img.logo.dev/maytag.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'kenmore': 'https://img.logo.dev/kenmore.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'kitchenaid': 'https://img.logo.dev/kitchenaid.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'electrolux': 'https://img.logo.dev/electrolux.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'haier': 'https://img.logo.dev/haier.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'panasonic': 'https://img.logo.dev/panasonic.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'sharp': 'https://img.logo.dev/sharp.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'toshiba': 'https://img.logo.dev/toshiba.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',

    // Furniture brands
    'ikea': 'https://img.logo.dev/ikea.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'ashley': 'https://img.logo.dev/ashleyfurniture.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'wayfair': 'https://img.logo.dev/wayfair.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'west elm': 'https://img.logo.dev/westelm.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'pottery barn': 'https://img.logo.dev/potterybarn.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'crate and barrel': 'https://img.logo.dev/crateandbarrel.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'restoration hardware': 'https://img.logo.dev/rh.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
    'ethan allen': 'https://img.logo.dev/ethanallen.com?token=pk_X-kOU0U6SoCqAHpreE1lLA',
};


const CreateServiceRequest = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { addServiceRequest, updateServiceRequest, customers, getServiceRequestById, addCustomer } = useServiceRequest();
    const isEditMode = Boolean(id);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [productCategory, setProductCategory] = useState<ProductCategory>('electronics');
    const [productType, setProductType] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [problemPreset, setProblemPreset] = useState('');
    const [problemDescription, setProblemDescription] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [tags, setTags] = useState('');
    const [discount, setDiscount] = useState(0);

    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

    // Customer form state
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerEmail, setNewCustomerEmail] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerAddress, setNewCustomerAddress] = useState('');

    // Parts management
    const [parts, setParts] = useState<PartItem[]>([]);
    const [availableParts, setAvailableParts] = useState<PartItem[]>([]);
    const [partSearchQuery, setPartSearchQuery] = useState('');

    // Get product image based on category and type

    // Get brand logo based on brand name
    const getBrandLogo = (brandName: string): string | null => {
        if (!brandName || brandName.trim().length === 0) return null;
        const brandKey = brandName.toLowerCase().trim();
        return brandLogos[brandKey] || null;
    };

    // Get available models based on product type and brand
    const getProductBrandModels = (productType: string, brand: string): string[] => {
        if (!productType || !brand || productType.trim().length === 0 || brand.trim().length === 0) return [];
        const typeKey = productType.toLowerCase().trim();
        const brandKey = brand.toLowerCase().trim();

        const typeModels = productBrandModels[typeKey];
        if (!typeModels) return [];

        return typeModels[brandKey] || [];
    };


    // Get available parts based on category and product type
    const getAvailableParts = (category: ProductCategory, type: string): PartItem[] => {
        if (!type) return [];

        const categoryParts = partsCatalog[category] as Record<string, PartItem[]>;
        return categoryParts[type] || [];
    };

    // Update available parts when category or product type changes
    useEffect(() => {
        const parts = getAvailableParts(productCategory, productType);
        setAvailableParts(parts);
    }, [productCategory, productType]);

    // Add part to the list
    const addPartToList = (part: PartItem) => {
        // Check if part already exists
        const existingPart = parts.find(p => p.id === part.id);
        if (existingPart) {
            // Increase quantity
            setParts(parts.map(p =>
                p.id === part.id
                    ? { ...p, quantity: p.quantity + 1 }
                    : p
            ));
            toast.success(`Increased ${part.name} quantity`);
        } else {
            // Add new part
            setParts([...parts, { ...part }]);
            toast.success(`Added ${part.name} to the list`);
        }
    };

    // Remove part from the list
    const removePartFromList = (partId: string) => {
        setParts(parts.filter(p => p.id !== partId));
        toast.success('Part removed from the list');
    };

    // Update quantity for a part
    const updatePartQuantity = (partId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            removePartFromList(partId);
            return;
        }
        setParts(parts.map(p =>
            p.id === partId
                ? { ...p, quantity: newQuantity }
                : p
        ));
    };

    // Filter available parts by search query
    const filteredParts = availableParts.filter(part =>
        part.name.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
        part.sku.toLowerCase().includes(partSearchQuery.toLowerCase())
    );

    // Load existing service request data in edit mode
    useEffect(() => {
        if (isEditMode && id) {
            const existingRequest = getServiceRequestById(id);
            if (existingRequest) {
                // Populate form with existing data
                setSelectedCustomer(existingRequest.customer.id);
                setProductCategory(existingRequest.productCategory);
                setProductType(existingRequest.productType);
                setBrand(existingRequest.brand);
                setModel(existingRequest.model);
                setProblemPreset(existingRequest.problemPreset);
                setProblemDescription(existingRequest.problemDescription);
                setInternalNotes(existingRequest.internalNotes);
                setTags(existingRequest.tags);
                setDiscount(existingRequest.discount);
                setParts(existingRequest.parts);
                setUploadedImages(existingRequest.images);
            } else {
                toast.error('Service request not found');
                navigate('/dashboard/services');
            }
        }
    }, [isEditMode, id, getServiceRequestById, navigate]);

    // Load images from localStorage on component mount
    useEffect(() => {
        const storageKey = id ? `service_images_${id}` : 'service_images_draft';
        const storedImages = localStorage.getItem(storageKey);

        if (storedImages) {
            try {
                const parsedImages = JSON.parse(storedImages);
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                    setUploadedImages(parsedImages);
                }
            } catch (error) {
                console.error('Failed to parse stored images:', error);
                // Clear corrupted data
                localStorage.removeItem(storageKey);
            }
        }
    }, [id]);

    // Problem presets based on category
    const problemPresets = {
        electronics: [
            { value: 'screen', label: 'Screen Cracked' },
            { value: 'battery', label: 'Battery Issue' },
            { value: 'power', label: 'Will Not Power On' },
            { value: 'water', label: 'Water Damage' },
            { value: 'charging', label: 'Charging Port Not Working' },
            { value: 'speaker', label: 'Speaker/Audio Issue' },
            { value: 'camera', label: 'Camera Not Working' },
            { value: 'touchscreen', label: 'Touch Screen Malfunction' },
            { value: 'others', label: 'Others (Specify in description)' },
        ],
        appliances: [
            { value: 'not-cooling', label: 'Not Cooling/Heating Properly' },
            { value: 'noise', label: 'Making Unusual Noise' },
            { value: 'leaking', label: 'Leaking Water' },
            { value: 'not-starting', label: 'Not Starting/Turning On' },
            { value: 'electrical', label: 'Electrical Issue' },
            { value: 'door', label: 'Door Not Closing Properly' },
            { value: 'smell', label: 'Burning Smell' },
            { value: 'cycle', label: 'Cycle Not Completing' },
            { value: 'others', label: 'Others (Specify in description)' },
        ],
        furniture: [
            { value: 'broken', label: 'Broken/Cracked Parts' },
            { value: 'loose', label: 'Loose Joints/Screws' },
            { value: 'stain', label: 'Stain/Discoloration' },
            { value: 'tear', label: 'Tear/Rip in Upholstery' },
            { value: 'scratch', label: 'Scratches/Dents' },
            { value: 'unstable', label: 'Wobbly/Unstable' },
            { value: 'spring', label: 'Spring/Cushion Issue' },
            { value: 'assembly', label: 'Assembly/Hardware Missing' },
            { value: 'others', label: 'Others (Specify in description)' },
        ],
    };

    const subtotal = parts.reduce((sum, part) => sum + part.price * part.quantity, 0);
    const tax = subtotal * 0.08;
    const grandTotal = subtotal + tax - discount;

    // Handle image file uploads with localStorage
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            // Convert each file to base64
            const imagePromises = Array.from(files).map((file) => {
                return new Promise<string>((resolve, reject) => {
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                        reject(new Error(`${file.name} is not an image file`));
                        return;
                    }

                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        reject(new Error(`${file.name} exceeds 5MB limit`));
                        return;
                    }

                    const reader = new FileReader();

                    reader.onload = (event) => {
                        if (event.target?.result) {
                            resolve(event.target.result as string);
                        } else {
                            reject(new Error('Failed to read file'));
                        }
                    };

                    reader.onerror = () => {
                        reject(new Error(`Failed to read ${file.name}`));
                    };

                    // Read file as base64 data URL
                    reader.readAsDataURL(file);
                });
            });

            const base64Images = await Promise.all(imagePromises);

            // Update state with new images
            const updatedImages = [...uploadedImages, ...base64Images];
            setUploadedImages(updatedImages);

            // Store in localStorage with service request ID as key
            const storageKey = id ? `service_images_${id}` : 'service_images_draft';
            localStorage.setItem(storageKey, JSON.stringify(updatedImages));

            toast.success(`${files.length} image(s) uploaded and saved successfully`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
            toast.error(errorMessage);
        }
    };

    // Remove image and update localStorage
    const handleRemoveImage = (index: number) => {
        const updatedImages = uploadedImages.filter((_, i) => i !== index);
        setUploadedImages(updatedImages);

        // Update localStorage
        const storageKey = id ? `service_images_${id}` : 'service_images_draft';
        localStorage.setItem(storageKey, JSON.stringify(updatedImages));

        toast.success('Image removed successfully');
    };

    const handleSubmit = () => {
        // Validation
        if (!selectedCustomer) {
            toast.error('Please select a customer');
            return;
        }
        if (!productType || !brand || !model) {
            toast.error('Please fill in all product details');
            return;
        }
        if (!problemPreset || !problemDescription) {
            toast.error('Please provide problem details');
            return;
        }

        // Find the selected customer
        const customer = customers.find(c => c.id === selectedCustomer);
        if (!customer) {
            toast.error('Customer not found');
            return;
        }

        // Get the service type label from problem preset
        const serviceTypeLabel = problemPresets[productCategory].find(p => p.value === problemPreset)?.label || problemPreset;

        // Create service request object
        const serviceRequest = {
            serviceType: serviceTypeLabel,
            customer: customer,
            device: `${brand} ${model}`,
            productCategory,
            productType,
            brand,
            model,
            problemPreset,
            problemDescription,
            internalNotes,
            tags,
            parts,
            subtotal,
            discount,
            tax,
            grandTotal,
            images: uploadedImages,
        };

        // Save to context (create or update)
        if (isEditMode && id) {
            updateServiceRequest(id, serviceRequest);
            toast.success('Service request updated successfully');
        } else {
            addServiceRequest(serviceRequest);
            toast.success('Service request created successfully');
        }

        navigate('/dashboard/services');
    };

    const handleAddCustomer = () => {
        // Validation
        if (!newCustomerName.trim()) {
            toast.error('Please enter customer name');
            return;
        }
        if (!newCustomerEmail.trim() || !newCustomerEmail.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (!newCustomerPhone.trim()) {
            toast.error('Please enter customer phone number');
            return;
        }

        // Create customer object
        const newCustomer = {
            name: newCustomerName.trim(),
            email: newCustomerEmail.trim(),
            phone: newCustomerPhone.trim(),
            ...(newCustomerAddress.trim() && { address: newCustomerAddress.trim() }),
        };

        // Calculate the new customer ID before adding (next ID in sequence)
        const newCustomerId = `CUST${String(customers.length + 1).padStart(3, '0')}`;

        // Add to context
        addCustomer(newCustomer);

        // Select the newly added customer
        setSelectedCustomer(newCustomerId);
        toast.success(`Customer "${newCustomerName}" has been added and selected.`);

        // Clear form and close modal
        setNewCustomerName('');
        setNewCustomerEmail('');
        setNewCustomerPhone('');
        setNewCustomerAddress('');
        setIsModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50  flex-col">
            {/* Add Customer Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                        <DialogDescription>
                            Enter the customer's details below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-sm font-medium mb-2 block">Full Name *</label>
                                <Input
                                    placeholder="e.g., Jane Doe"
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Email Address *</label>
                                <Input
                                    type="email"
                                    placeholder="e.g., jane.doe@example.com"
                                    value={newCustomerEmail}
                                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Phone Number *</label>
                                <Input
                                    type="tel"
                                    placeholder="e.g., +1 234 567 8900"
                                    value={newCustomerPhone}
                                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Address</label>
                            <Input
                                placeholder="e.g., 123 Main St, Anytown, CA 12345"
                                value={newCustomerAddress}
                                onChange={(e) => setNewCustomerAddress(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddCustomer}>
                            Save Customer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main Content */}
            <main className="flex-1 px-3 py-3">
                {/* Header */}
                <div className="mb-3">
                    <h1 className="text-lg font-bold text-gray-900">
                        {isEditMode ? 'Edit Service Request' : 'Create New Service Request'}
                    </h1>
                </div>

                {/* Customer Selection - Minimal & Compact */}
                <div className="mb-2">
                    <div className="flex justify-between items-center mb-1.5">
                        <h2 className="text-xs font-semibold text-gray-700">Customer</h2>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-1 px-2 py-1 bg-primary text-white rounded text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="h-3 w-3" />
                            <span>Add</span>
                        </button>
                    </div>

                    {/* Customer Card Display */}
                    {selectedCustomer ? (
                        <div className="border border-gray-200 rounded p-2 bg-white hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                        {customers.find(c => c.id === selectedCustomer)?.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 text-xs">
                                            {customers.find(c => c.id === selectedCustomer)?.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {customers.find(c => c.id === selectedCustomer)?.phone}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedCustomer('')}
                                    className="text-xs h-6 px-2"
                                >
                                    Change
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                            <SelectTrigger className="h-9 text-xs border border-gray-300 hover:border-primary transition-colors">
                                <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-xs">{customer.name}</p>
                                                <p className="text-xs text-gray-500">{customer.phone}</p>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Product Category - Flipkart Style Horizontal */}
                <div className="mb-3 border-b pb-2">
                    <div className="flex items-center gap-4">
                        {/* Electronics */}
                        <HoverCard openDelay={200}>
                            <HoverCardTrigger asChild>
                                <button
                                    onClick={() => {
                                        setProductCategory('electronics');
                                        setProductType('');
                                    }}
                                    className={`flex flex-col items-center gap-1.5 py-2 px-3 transition-colors group ${productCategory === 'electronics'
                                        ? 'border-b-2 border-primary'
                                        : 'border-b-2 border-transparent hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`transition-colors ${productCategory === 'electronics'
                                        ? 'text-primary'
                                        : 'text-gray-600 group-hover:text-primary'
                                        }`}>
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className={`text-xs font-medium ${productCategory === 'electronics' ? 'text-primary' : 'text-gray-700 group-hover:text-primary'
                                        }`}>
                                        Electronics
                                    </span>
                                </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-56" side="top">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-900">Select Product Type</h4>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            onClick={() => setProductType('mobile')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'mobile'
                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'mobile' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            )}
                                            <span>Mobile</span>
                                        </button>
                                        <button
                                            onClick={() => setProductType('laptop')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'laptop'
                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'laptop' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            )}
                                            <span>Laptop</span>
                                        </button>
                                        <button
                                            onClick={() => setProductType('tablet')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'tablet'
                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'tablet' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            )}
                                            <span>Tablet</span>
                                        </button>
                                        <button
                                            onClick={() => setProductType('pc')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'pc'
                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'pc' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            )}
                                            <span>PC</span>
                                        </button>
                                    </div>
                                </div>
                            </HoverCardContent>
                        </HoverCard>

                        {/* Appliances */}
                        <HoverCard openDelay={200}>
                            <HoverCardTrigger asChild>
                                <button
                                    onClick={() => {
                                        setProductCategory('appliances');
                                        setProductType('');
                                    }}
                                    className={`flex flex-col items-center gap-1.5 py-2 px-3 transition-colors group ${productCategory === 'appliances'
                                        ? 'border-b-2 border-primary'
                                        : 'border-b-2 border-transparent hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`transition-colors ${productCategory === 'appliances'
                                        ? 'text-primary'
                                        : 'text-gray-600 group-hover:text-primary'
                                        }`}>
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                        </svg>
                                    </div>
                                    <span className={`text-xs font-medium ${productCategory === 'appliances' ? 'text-primary' : 'text-gray-700 group-hover:text-primary'
                                        }`}>
                                        Appliances
                                    </span>
                                </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-56" side="top">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-900">Select Product Type</h4>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            onClick={() => setProductType('refrigerator')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'refrigerator'
                                                ? 'bg-green-100 text-green-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'refrigerator' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                            )}
                                            <span>Refrigerator</span>
                                        </button>
                                        <button
                                            onClick={() => setProductType('washing-machine')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'washing-machine'
                                                ? 'bg-green-100 text-green-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'washing-machine' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                            )}
                                            <span>Washing Machine</span>
                                        </button>
                                        <button
                                            onClick={() => setProductType('microwave')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'microwave'
                                                ? 'bg-green-100 text-green-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'microwave' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                            )}
                                            <span>Microwave</span>
                                        </button>
                                        <button
                                            onClick={() => setProductType('dishwasher')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'dishwasher'
                                                ? 'bg-green-100 text-green-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'dishwasher' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                            )}
                                            <span>Dishwasher</span>
                                        </button>
                                    </div>
                                </div>
                            </HoverCardContent>
                        </HoverCard>

                        {/* Furniture */}
                        <HoverCard openDelay={200}>
                            <HoverCardTrigger asChild>
                                <button
                                    onClick={() => {
                                        setProductCategory('furniture');
                                        setProductType('');
                                    }}
                                    className={`flex flex-col items-center gap-1.5 py-2 px-3 transition-colors group ${productCategory === 'furniture'
                                        ? 'border-b-2 border-primary'
                                        : 'border-b-2 border-transparent hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`transition-colors ${productCategory === 'furniture'
                                        ? 'text-primary'
                                        : 'text-gray-600 group-hover:text-primary'
                                        }`}>
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                    </div>
                                    <span className={`text-xs font-medium ${productCategory === 'furniture' ? 'text-primary' : 'text-gray-700 group-hover:text-primary'
                                        }`}>
                                        Furniture
                                    </span>
                                </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-56" side="top">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-900">Select Product Type</h4>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            onClick={() => setProductType('sofa')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'sofa'
                                                ? 'bg-amber-100 text-amber-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'sofa' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            )}
                                            <span>Sofa</span>
                                        </button>
                                        <button
                                            onClick={() => setProductType('table')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'table'
                                                ? 'bg-amber-100 text-amber-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'table' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            )}
                                            <span>Table</span>
                                        </button>
                                        <button
                                            onClick={() => setProductType('chair')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'chair'
                                                ? 'bg-amber-100 text-amber-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'chair' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            )}
                                            <span>Chair</span>
                                        </button>
                                        <button
                                            onClick={() => setProductType('bed')}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${productType === 'bed'
                                                ? 'bg-amber-100 text-amber-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {productType === 'bed' ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            )}
                                            <span>Bed</span>
                                        </button>
                                    </div>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    </div>
                </div>



                {/* Brand and Model - Compact Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-700">Brand</label>
                        <Input
                            placeholder="e.g., Apple, Samsung, LG"
                            className="h-9 text-sm"
                            value={brand}
                            onChange={(e) => {
                                setBrand(e.target.value);
                                setModel(''); // Reset model when brand changes
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-700">Model</label>
                        {getProductBrandModels(productType, brand).length > 0 ? (
                            <Select value={model} onValueChange={setModel}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getProductBrandModels(productType, brand).map((modelName: string) => (
                                        <SelectItem key={modelName} value={modelName}>
                                            {modelName}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="custom">Other (Custom Entry)</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                placeholder="e.g., iPhone 14 Pro"
                                className="h-9 text-sm"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                            />
                        )}
                    </div>
                </div>

                {/* Brand Logo Display - Compact */}
                {brand && brand.trim().length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50">
                            <div className="w-10 h-10 flex items-center justify-center bg-white rounded border border-gray-200 p-1.5 overflow-hidden">
                                {getBrandLogo(brand) ? (
                                    <img
                                        src={getBrandLogo(brand)!}
                                        alt={`${brand} logo`}
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => {
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-sm uppercase">${brand.charAt(0)}</div>`;
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-sm uppercase">
                                        {brand.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-900 capitalize">{brand}</p>
                                {/* {getBrandLogo(brand) && (
                                    <p className="text-xs text-green-600">✓ Logo recognized</p>
                                )} */}
                            </div>
                        </div>
                    </div>
                )}





                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Left Column */}
                    <div className="flex flex-col gap-3">
                        {/* Problem Details */}
                        <Card>
                            <CardHeader className="pb-1.5 pt-3 px-3">
                                <CardTitle className="text-sm font-bold text-gray-900">
                                    Problem Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 px-3 pb-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-700">
                                        Problem Presets
                                    </label>
                                    <Select value={problemPreset} onValueChange={setProblemPreset}>
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="Select a problem" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {problemPresets[productCategory].map((preset) => (
                                                <SelectItem key={preset.value} value={preset.value}>
                                                    {preset.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-700">
                                        Problem Description
                                    </label>
                                    <Textarea
                                        placeholder="Describe the issue in detail..."
                                        className="min-h-20 text-sm"
                                        value={problemDescription}
                                        onChange={(e) => setProblemDescription(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-700">
                                        Internal Notes
                                    </label>
                                    <Textarea
                                        placeholder="Add any internal notes here..."
                                        className="min-h-16 bg-gray-50 text-sm"
                                        value={internalNotes}
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-700">Tags</label>
                                    <Input placeholder="urgent, vip, warranty" className="h-8 text-sm" value={tags} onChange={(e) => setTags(e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-3">
                        {/* Parts & Estimates */}
                        <Card>
                            <CardHeader className="pb-1.5 pt-3 px-3">
                                <CardTitle className="text-sm font-bold text-gray-900">
                                    Parts & Estimates
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 px-3 pb-3">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <Input
                                        placeholder="Search parts catalog..."
                                        className="pl-8 h-8 text-sm"
                                        value={partSearchQuery}
                                        onChange={(e) => setPartSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Message when no product type selected */}
                                {!productType && (
                                    <div className="text-center py-4 text-sm text-gray-500">
                                        Select a product type to view available parts
                                    </div>
                                )}

                                {/* Quick Add Buttons - Show first 3 parts from available catalog */}
                                {productType && availableParts.length > 0 && (
                                    <div className="flex gap-3">
                                        {availableParts.slice(0, 3).map((part) => (
                                            <Button
                                                key={part.id}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 gap-1 text-xs h-8"
                                                onClick={() => addPartToList(part)}
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                {part.name.split(' ')[0]}
                                            </Button>
                                        ))}
                                    </div>
                                )}

                                {/* Available Parts List with Search */}
                                {productType && partSearchQuery && (
                                    <div className="border rounded-lg p-2 max-h-40 overflow-y-auto bg-gray-50">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Available Parts:</p>
                                        {filteredParts.length > 0 ? (
                                            <div className="space-y-1">
                                                {filteredParts.map((part) => (
                                                    <div
                                                        key={part.id}
                                                        className="flex justify-between items-center p-1.5 rounded hover:bg-white cursor-pointer"
                                                        onClick={() => addPartToList(part)}
                                                    >
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium text-gray-800">{part.name}</p>
                                                            <p className="text-xs text-gray-500">SKU: {part.sku}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-gray-800">${part.price.toFixed(2)}</span>
                                                            <Plus className="h-3.5 w-3.5 text-primary" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500">No parts found</p>
                                        )}
                                    </div>
                                )}

                                {/* Selected Parts List */}
                                <div className="border-t pt-2 flex flex-col gap-1.5">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Selected Parts:</p>
                                    {parts.length === 0 ? (
                                        <p className="text-xs text-gray-500 text-center py-2">No parts added yet</p>
                                    ) : (
                                        parts.map((part) => (
                                            <div
                                                key={part.id}
                                                className="grid grid-cols-[1fr,auto,auto,auto,auto] gap-2 items-center p-1.5 rounded-lg hover:bg-gray-50"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-800 text-xs">{part.name}</p>
                                                    <p className="text-xs text-gray-500">SKU: {part.sku}</p>
                                                </div>
                                                <span className="text-xs font-medium text-green-600">
                                                    {part.status}
                                                </span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={part.quantity}
                                                    onChange={(e) => updatePartQuantity(part.id, parseInt(e.target.value) || 1)}
                                                    className="w-12 h-6 text-xs text-center border rounded"
                                                />
                                                <span className="font-medium text-gray-800 text-xs">
                                                    ${(part.price * part.quantity).toFixed(2)}
                                                </span>
                                                <button
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => removePartFromList(part.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Totals */}
                                <div className="border-t pt-2 space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-600">Subtotal</p>
                                        <p className="text-xs font-medium text-gray-800">${subtotal.toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between items-center gap-3">
                                        <p className="text-xs text-gray-600">Discount</p>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="w-16 h-6 text-right text-xs"
                                            value={discount}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-600">Tax</p>
                                        <p className="text-xs font-medium text-gray-800">${tax.toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-1.5 mt-1.5">
                                        <p className="text-xs font-bold text-gray-900">Grand Total</p>
                                        <p className="text-xs font-bold text-gray-900">
                                            ${grandTotal.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inspection Images */}
                        <Card>
                            <CardHeader className="pb-1.5 pt-3 px-3">
                                <CardTitle className="text-sm font-bold text-gray-900">
                                    Inspection Images
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 px-3 pb-3">
                                {/* Upload Area */}
                                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                    <div className="flex flex-col items-center justify-center">
                                        <CloudUpload className="h-6 w-6 text-gray-500 mb-0.5" />
                                        <p className="text-xs text-gray-500">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </label>

                                {/* Image Gallery */}
                                <div className="grid grid-cols-4 gap-2">
                                    {uploadedImages.map((img, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={img}
                                                alt={`Inspection ${index + 1}`}
                                                className="w-full aspect-square object-cover rounded-md"
                                            />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="text-white hover:text-red-400"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Sticky Footer */}
            <footer className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-sm border-t border-gray-200 px-3 py-2.5">
                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard/services')}
                        className="text-sm h-8"
                    >
                        Cancel
                    </Button>
                    <Button variant="outline" size="sm" className="text-sm h-8">
                        Save Draft
                    </Button>
                    <Button onClick={handleSubmit} size="sm" className="bg-primary hover:bg-primary/90 text-sm h-8">
                        {isEditMode ? 'Update Request' : 'Create Request'}
                    </Button>
                </div>
            </footer>
        </div>
    );
}; 0

export default CreateServiceRequest;
