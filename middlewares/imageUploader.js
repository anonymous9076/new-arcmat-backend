import multer from "multer";
import path from "path";


// Minimalist memory storage configuration for direct S3 uploads
const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedArchiveTypes = /zip|x-zip-compressed|x-zip/;
  const allowedExtensions = /jpeg|jpg|png|gif|webp|zip/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedImageTypes.test(file.mimetype) || allowedArchiveTypes.test(file.mimetype);

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
  }
};

// Single consolidated uploader - no file size limit
// const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB limit
// Single consolidated uploader - all files go to temp then S3
// const upload = multer({ storage, limits, fileFilter });
const upload = multer({ storage, fileFilter });

// Maintain named exports for backward compatibility without creating folders
upload.product = upload;
upload.userprofile = upload;
upload.banner = upload;
upload.category = upload;
upload.brand = upload;
upload.variant = upload;
upload.info = upload;

// Brand-based and Temp uploaders - all now point to the same temp logic
upload.productByBrand = upload;
upload.variantByBrand = upload;
upload.productTemp = upload;
upload.variantTemp = upload;

// Specialized uploader for Excel files (Bulk Import)
const excelFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls') {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'));
  }
};

// const excelLimits = { fileSize: 10 * 1024 * 1024 }; // 10MB limit for bulk import

export const excelUploader = multer({
  storage,
  // limits: excelLimits,
  fileFilter: excelFileFilter
});

export default upload;

