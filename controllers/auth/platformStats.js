import Usertable from "../../models/user.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getPlatformStats = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        if (!isAdmin) {
            return fail(res, { message: "Access denied" }, 403);
        }

        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats = await Usertable.aggregate([
            {
                $facet: {
                    totalUsers: [{ $count: "count" }],
                    roleCounts: [
                        { $group: { _id: "$role", count: { $sum: 1 } } }
                    ],
                    dailyLogins: [
                        { $match: { lastLoginAt: { $gte: last24h } } },
                        { $count: "count" }
                    ],
                    mau: [
                        { $match: { lastLoginAt: { $gte: last30d } } },
                        { $count: "count" }
                    ],
                    newSignups: [
                        { $match: { createdAt: { $gte: last30d } } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const result = stats[0];

        // Format role counts for easier frontend consumption
        const roles = {
            architect: 0,
            brand: 0,
            vendor: 0,
            retailer: 0,
            professional: 0,
            customer: 0, // include legacy role
            admin: 0
        };

        result.roleCounts.forEach(r => {
            if (roles.hasOwnProperty(r._id)) {
                roles[r._id] = r.count;
            }
        });

        // Consolidate brand/vendor if necessary or keep separate as per data
        const finalStats = {
            totalUsers: result.totalUsers[0]?.count || 0,
            roles: {
                architects: roles.architect,
                brands: roles.brand + roles.vendor,
                retailers: roles.retailer,
                professionals: roles.professional + roles.customer, // Sum both new and legacy roles
            },
            activity: {
                dailyLogins: result.dailyLogins[0]?.count || 0,
                monthlyActiveUsers: result.mau[0]?.count || 0,
                newSignups: result.newSignups[0]?.count || 0
            }
        };

        return success(res, finalStats, 200);
    } catch (err) {
        console.error("getPlatformStats error:", err);
        return fail(res, err, 500);
    }
};

export default getPlatformStats;
