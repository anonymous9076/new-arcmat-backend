import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const data = [
    {
        'Product Name': 'Premium King Bed',
        'Product URL': 'premium-king-bed',
        'Category Name': 'Beds',
        'Short Description': 'Luxury king size bed with storage',
        'Description': 'Handcrafted king size bed made from solid teak wood. Includes hydraulic storage and premium headboard.',
        'MRP Price': 65000,
        'Selling Price': 52000,
        'Stock': 3,
        'SKU Code': 'BED-K-001',
        'Brand Name': 'ArcMat',
        'Weight': 85,
        'Weight Type': 'kg',
        'Status': 'Active',
        'Images': 'bed1.jpg,bed2.jpg'
    },
    {
        'Product Name': 'Executive Desk',
        'Product URL': 'executive-desk',
        'Category Name': 'Office Desks',
        'Short Description': 'Spacious executive office desk',
        'Description': 'L-shaped executive desk with cable management and mahogany finish. Ideal for home offices or corporate suites.',
        'MRP Price': 18000,
        'Selling Price': 14500,
        'Stock': 12,
        'SKU Code': 'DSK-EX-002',
        'Brand Name': 'ArcMat',
        'Weight': 35,
        'Weight Type': 'kg',
        'Status': 'Active',
        'Images': 'desk1.jpg'
    }
];

const ws = xlsx.utils.json_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'Products');

const templateDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
}

xlsx.writeFile(wb, path.join(templateDir, 'sample_products.xlsx'));

const variantData = [
    {
        'SKU Code': 'BED-K-001-V1',
        'MRP Price': 65000,
        'Selling Price': 52000,
        'Stock': 5,
        'Size': 'King',
        'Color': 'Walnut',
        'Weight': 85,
        'Weight Type': 'kg',
        'Status': 'Active',
        'Images': 'v1_1.jpg,v1_2.jpg'
    },
    {
        'SKU Code': 'BED-K-001-V2',
        'MRP Price': 68000,
        'Selling Price': 55000,
        'Stock': 2,
        'Size': 'King',
        'Color': 'Teak',
        'Weight': 85,
        'Weight Type': 'kg',
        'Status': 'Active',
        'Images': 'v2_1.jpg'
    }
];

const variantWs = xlsx.utils.json_to_sheet(variantData);
const variantWb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(variantWb, variantWs, 'Variants');

xlsx.writeFile(variantWb, path.join(templateDir, 'sample_variants.xlsx'));
