import mongoose from 'mongoose';
import Category from '../models/category.js';
import dotenv from 'dotenv';
import slugify from 'slugify';

dotenv.config();

const contractorCategories = [
  {
    name: "Civil & Structural Works",
    existingNames: ["Building and Structure"],
    subcategories: [
      "Civil Contractors",
      "RCC Contractors",
      "Masonry Contractors",
      "Structural Steel Contractors",
      "Waterproofing Contractors",
      "Excavation and foundation contractor",
      { name: "Others", description: "Specify if he or she chose others" }
    ]
  },
  {
    name: "Execution & Turnkey Contractors",
    subcategories: [
      "Interior Contractors",
      "Turnkey Interior Contractors",
      "Office Fit-Out Contractors",
      "Retail Fit-Out Contractors",
      "Facade & Cladding Contractors"
    ]
  },
  {
    name: "Carpentry & Furniture",
    existingNames: ["Interior & furniture"],
    subcategories: [
      "Carpenters",
      "Custom Furniture Makers",
      "Modular Kitchen Vendors",
      "Wardrobe Manufacturers",
      "CNC & Woodwork Experts"
    ]
  },
  {
    name: "Metal & Fabrication",
    existingNames: ["Metal Works"],
    subcategories: [
      "Metal Fabricators",
      "Gate Fabricators",
      "Railing Fabricators",
      "Stainless Steel Fabricators",
      "Aluminum Fabricators"
    ]
  },
  {
    name: "Electrical & Automation",
    existingNames: ["Electrical"],
    subcategories: [
      "Electricians",
      "Smart Automation Integrators",
      "CCTV & Security Installers",
      "Solar System Installers"
    ]
  },
  {
    name: "Plumbing & Sanitary",
    existingNames: ["Plumbing"],
    subcategories: [
      "Plumbers",
      "Bathroom Installation Experts",
      "Drainage Contractors"
    ]
  },
  {
    name: "Surface & Finishing",
    subcategories: [
      "Painters",
      "Texture Artists",
      "Polish Contractors",
      "Wallpaper Installers",
      "False Ceiling Contractors"
    ]
  },
  {
    name: "Flooring & Cladding",
    existingNames: ["Flooring and Surface"],
    subcategories: [
      "Tile Installers",
      "Marble Contractors",
      "Wooden Flooring Installers",
      "Epoxy Flooring Experts",
      "Stone Cladding Contractors"
    ]
  },
  {
    name: "HVAC & Mechanical",
    subcategories: [
      "AC Installation Experts",
      "VRF Contractors",
      "Ventilation Contractors"
    ]
  },
  {
    name: "Doors, Windows & Glass",
    subcategories: [
      "Glass Contractors",
      "UPVC Installers",
      "Aluminium Window Contractors",
      "Door Installation Experts",
      "Shower Partition and glass work"
    ]
  },
  {
    name: "Specialized Systems",
    subcategories: [
      "Lift & Elevator Contractors",
      "Fire Safety Contractors",
      "Acoustic Contractors",
      "Home Theater Installers"
    ]
  },
  {
    name: "Custom Design Studios",
    subcategories: [
      "Mural Artists",
      "Sculptural Installation Studios",
      "Custom Decor Studios",
      "Artistic Metalwork Studios",
      "Feature Wall Experts"
    ]
  }
];

const ROOT_ID = '69e08aeb9d2ba1692febd094'; // Find Contractors
const USER_ID = '699e9bbc69fc9cb5c25c8a7e'; // Standard admin user ID from previous records

const updateCategories = async () => {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to MongoDB');

    // Ensure ROOT exists and is active
    const root = await Category.findById(ROOT_ID);
    if (root) {
        root.isActive = 1;
        root.categoryType = 'contractor_service';
        await root.save();
    }

    for (const catData of contractorCategories) {
      console.log(`\nProcessing L2 Category: ${catData.name}`);
      
      let l2Category = await Category.findOne({
        $or: [
          { name: catData.name },
          { name: { $in: catData.existingNames || [] } }
        ],
        categoryType: 'contractor_service'
      });

      if (!l2Category) {
        l2Category = new Category({
          name: catData.name,
          slug: slugify(catData.name, { lower: true }),
          description: catData.name,
          parentId: ROOT_ID,
          level: 2,
          categoryType: 'contractor_service',
          userid: USER_ID,
          isActive: 1
        });
        await l2Category.save();
        console.log(`Created new L2 Category: ${catData.name}`);
      } else {
        l2Category.name = catData.name;
        l2Category.slug = slugify(catData.name, { lower: true });
        l2Category.parentId = ROOT_ID;
        l2Category.level = 2;
        l2Category.isActive = 1;
        await l2Category.save();
        console.log(`Updated existing L2 Category: ${catData.name}`);
      }

      for (const sub of catData.subcategories) {
        const subName = typeof sub === 'string' ? sub : sub.name;
        const subDesc = typeof sub === 'string' ? sub : sub.description;

        console.log(`  - Subcategory: ${subName}`);

        let l3Category = await Category.findOne({
          name: subName,
          parentId: l2Category._id,
          categoryType: 'contractor_service'
        });

        if (!l3Category) {
          // Check if it exists with a different parent (maybe under the old parent name)
          l3Category = await Category.findOne({
            name: subName,
            categoryType: 'contractor_service'
          });

          if (l3Category) {
            l3Category.parentId = l2Category._id;
            l3Category.level = 3;
            l3Category.isActive = 1;
            l3Category.description = subDesc;
            await l3Category.save();
            console.log(`    Moved L3 Category: ${subName} to parent ${catData.name}`);
          } else {
            l3Category = new Category({
              name: subName,
              slug: slugify(subName, { lower: true }) + '-' + Math.random().toString(36).substring(2, 5),
              description: subDesc,
              parentId: l2Category._id,
              level: 3,
              categoryType: 'contractor_service',
              userid: USER_ID,
              isActive: 1
            });
            await l3Category.save();
            console.log(`    Created new L3 Category: ${subName}`);
          }
        } else {
          l3Category.isActive = 1;
          l3Category.level = 3;
          l3Category.description = subDesc;
          await l3Category.save();
          console.log(`    Ensured L3 Category active: ${subName}`);
        }
      }
    }

    console.log('\nUpdate completed successfully');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateCategories();
