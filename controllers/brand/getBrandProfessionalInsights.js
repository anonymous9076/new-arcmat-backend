import mongoose from 'mongoose';
import Product from '../../models/product.js';
import SampleRequest from '../../models/sampleRequest.js';
import RetailerRequest from '../../models/retailerRequest.js';
import Discussion from '../../models/discussion.js';
import Usertable from '../../models/user.js';
import Project from '../../models/project.js';
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Get Professional Insights for a specific Brand
 * GET /analytics/brand/professional-insights
 */
const getBrandProfessionalInsights = async (req, res) => {
    try {
        let brandId = req.query.brandId;

        if (req.user.role === 'brand' || req.user.role === 'vendor') {
            const rawId = req.user.selectedBrands && req.user.selectedBrands[0];
            brandId = (rawId?._id || rawId?.id || rawId);
        }

        if (!brandId) {
            return fail(res, 'Brand ID is required', 400);
        }

        const brandObjectId = new mongoose.Types.ObjectId(brandId);

        // 1. Find all products for this brand
        const brandProducts = await Product.find({ brand: brandObjectId }).select('_id').lean();
        const productIds = brandProducts.map(p => p._id);

        // 2. Find all unique professional IDs from various interactions
        const sampleProfessionals = await SampleRequest.distinct('professionalId', { materialId: { $in: productIds } });
        const retailerProfessionals = await RetailerRequest.distinct('professionalId', { materialId: { $in: productIds } });
        const discussionProfessionals = await Discussion.distinct('authorId', { referencedMaterialId: { $in: productIds } });

        // Merge and unique IDs
        const uniqueProfessionalIds = [...new Set([...sampleProfessionals, ...retailerProfessionals, ...discussionProfessionals])];

        if (uniqueProfessionalIds.length === 0) {
            return success(res, {
                professionals: [],
                metrics: {
                    total: 0,
                    architects: 0,
                    designers: 0,
                    contractors: 0,
                    inquiries: 0
                }
            }, 200);
        }

        // 3. Fetch Professional Details
        const professionals = await Usertable.find({ _id: { $in: uniqueProfessionalIds } })
            .select('name email mobile role profile createdAt')
            .lean();

        // 4. Enrich data with project info and interactions
        const enrichedProfessionals = await Promise.all(professionals.map(async (prof) => {
            // Find sample requests for this brand's products by this professional
            const samples = await SampleRequest.find({
                professionalId: prof._id,
                materialId: { $in: productIds }
            }).lean();

            // Find retailer requests
            const retailerReqs = await RetailerRequest.find({
                professionalId: prof._id,
                materialId: { $in: productIds }
            }).lean();

            // Find discussions (reviews) for this brand's products
            const discussions = await Discussion.find({
                authorId: prof._id,
                referencedMaterialId: { $in: productIds }
            }).lean();

            // Find Projects linked to these requests
            const linkedProjectIds = [
                ...samples.map(s => s.projectId),
                ...retailerReqs.map(r => r.projectId),
                ...discussions.map(d => d.projectId)
            ].filter(id => id);

            const uniqueProjectIds = [...new Set(linkedProjectIds.map(id => id.toString()))];

            let latestProject = null;
            if (uniqueProjectIds.length > 0) {
                latestProject = await Project.findOne({ _id: { $in: uniqueProjectIds } })
                    .sort({ updatedAt: -1 })
                    .select('projectName phase location')
                    .lean();
            }

            return {
                id: prof._id,
                name: prof.name,
                type: prof.role === 'customer' ? (prof.profile || 'Professional') : prof.role,
                email: prof.email,
                phone: prof.mobile,
                location: latestProject?.location?.city ? `${latestProject.location.city}, ${latestProject.location.country || ''}` : 'Unknown',
                joinedDate: new Date(prof.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
                avatar: prof.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
                totalOrders: 0, // Placeholder until order logic is clarified
                totalSpend: '₹0',
                projectStage: latestProject?.phase || 'Unknown',
                contactRequests: retailerReqs.length,
                sampleRequests: samples.length,
                purchased: false, // Placeholder
                reviews: discussions.filter(d => d.type === 'review').map(d => ({
                    rating: d.rating || 5, // Default if not found
                    comment: d.content
                })),
                orders: [] // Placeholder
            };
        }));

        const metrics = {
            total: enrichedProfessionals.length,
            architects: enrichedProfessionals.filter(p => p.type.toLowerCase().includes('architect')).length,
            designers: enrichedProfessionals.filter(p => p.type.toLowerCase().includes('design')).length,
            contractors: enrichedProfessionals.filter(p => p.type.toLowerCase().includes('contractor')).length,
            inquiries: enrichedProfessionals.reduce((sum, p) => sum + p.contactRequests + p.sampleRequests, 0)
        };

        return success(res, {
            professionals: enrichedProfessionals,
            metrics
        }, 200);

    } catch (error) {
        console.error('getBrandProfessionalInsights error:', error);
        return fail(res, error, 500);
    }
};

export default getBrandProfessionalInsights;
