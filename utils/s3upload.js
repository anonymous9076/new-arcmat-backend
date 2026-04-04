import { PutObjectCommand, DeleteObjectsCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/s3.js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * Uploads one or multiple files to AWS S3.
 * 
 * @param {string} userId - ID of the user uploading the file (used in prefix)
 * @param {Object|Array} files - Single file object or array of file objects from Multer.
 * @param {string} folder - Destination folder within the bucket.
 * @returns {Promise<Array>} - Array of objects containing public_id (S3 Key) and secure_url.
 */
export const s3Upload = async (userId, files, folder = 'user_uploads') => {
    try {
        const filesToUpload = Array.isArray(files) ? files : [files];

        const uploadPromises = filesToUpload.map(async (file) => {
            const imageName = path.parse(file.originalname).name;
            const extension = path.extname(file.originalname);
            const fileName = `${userId}_${imageName}_${Date.now()}${extension}`;
            const key = `${folder}/${fileName}`;

            const params = {
                Bucket: BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            await s3Client.send(new PutObjectCommand(params));

            // Construct the secure URL
            const secureUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

            return {
                public_id: key, // Using Key as public_id for consistency
                secure_url: secureUrl,
            };
        });

        const results = await Promise.all(uploadPromises);
        return results;

    } catch (error) {
        console.error('S3 upload error:', error);
        throw new Error(`Failed to upload file(s) to S3: ${error.message}`);
    }
};

/**
 * Deletes one or multiple files from AWS S3.
 * 
 * @param {string|Array} publicIds - Single S3 key or an array of S3 keys.
 * @returns {Promise<Object>} - S3 deletion result.
 */
export const s3Delete = async (publicIds) => {
    try {
        const idsToDelete = Array.isArray(publicIds) ? publicIds : [publicIds];

        if (idsToDelete.length === 0) return { result: 'nothing to delete' };

        if (idsToDelete.length === 1) {
            const result = await s3Client.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: idsToDelete[0],
            }));
            return result;
        }

        const deleteParams = {
            Bucket: BUCKET_NAME,
            Delete: {
                Objects: idsToDelete.map(key => ({ Key: key })),
            },
        };

        const result = await s3Client.send(new DeleteObjectsCommand(deleteParams));
        return result;
    } catch (error) {
        console.error('S3 deletion error:', error);
        throw new Error(`Failed to delete file(s) from S3: ${error.message}`);
    }
};

/**
 * Lists objects in an S3 bucket with a specific prefix.
 * 
 * @param {string} prefix - The prefix to search for.
 * @returns {Promise<Array>} - Array of objects containing Key and LastModified.
 */
export const listObjects = async (prefix) => {
    try {
        const params = {
            Bucket: BUCKET_NAME,
            Prefix: prefix,
        };

        const result = await s3Client.send(new ListObjectsV2Command(params));
        return result.Contents || [];
    } catch (error) {
        console.error('S3 list error:', error);
        throw new Error(`Failed to list objects from S3: ${error.message}`);
    }
};
