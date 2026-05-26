import Campaign from "../models/Campaign.js";
import User from "../models/User.js";


export const getCampaigns = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 9,
      category,
      search,
      wilaya,
      sort = "-createdAt",
    } = req.query;

    const query = { status: "active" };
    if (category) query.category = category;
    if (wilaya) query.wilaya = wilaya;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate("association", "name organizationName avatar")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Campaign.countDocuments(query),
    ]);

    res.json({
      campaigns,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ═══════════════════════════════════════════
   PUBLIC — GET single campaign
   GET /api/campaigns/:id
═══════════════════════════════════════════ */
export const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate(
      "association",
      "name organizationName avatar email description",
    );
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ═══════════════════════════════════════════
   ASSOCIATION — GET my campaigns
   GET /api/campaigns/my
═══════════════════════════════════════════ */
export const getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ association: req.user._id }).sort(
      "-createdAt",
    );
    res.json({ campaigns, total: campaigns.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ═══════════════════════════════════════════
   ASSOCIATION — CREATE campaign
   POST /api/campaigns
═══════════════════════════════════════════ */
export const createCampaign = async (req, res) => {
  try {
    // Only approved associations can create
    if (req.user.status !== "active" || !req.user.isApproved) {
      return res.status(403).json({
        message: "Your association must be approved before creating campaigns",
      });
    }

    const {
      title,
      description,
      category,
      moneyGoal,
      needsObjects,
      objectNeeds,
      deadline,
      location,
      wilaya,
      status,
      isUrgent,
    } = req.body;

    // Handle cover image (uploaded via multer → Cloudinary)
    const coverImage = req.file ? req.file.path : null;

    // Parse objectNeeds if sent as JSON string (FormData)
    let parsedObjectNeeds = [];
    if (needsObjects && objectNeeds) {
      parsedObjectNeeds =
        typeof objectNeeds === "string" ? JSON.parse(objectNeeds) : objectNeeds;
    }

    const campaign = await Campaign.create({
      title,
      description,
      category,
      association: req.user._id,
      moneyGoal: Number(moneyGoal) || 0,
      needsObjects: needsObjects === "true" || needsObjects === true,
      objectNeeds: parsedObjectNeeds,
      deadline,
      location,
      wilaya,
      coverImage,
      status: status || "active",
      isUrgent: isUrgent === "true" || isUrgent === true,
    });

    await campaign.populate("association", "name organizationName");
    res
      .status(201)
      .json({ message: "Campaign created successfully", campaign });
  } catch (err) {
    console.error("Create campaign error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    if (campaign.association.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this campaign" });
    }

    const allowed = [
      "title",
      "description",
      "category",
      "moneyGoal",
      "needsObjects",
      "objectNeeds",
      "deadline",
      "location",
      "wilaya",
      "status",
      "isUrgent",
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    if (req.file) campaign.coverImage = req.file.path;

    if (req.body.objectNeeds && typeof req.body.objectNeeds === "string") {
      campaign.objectNeeds = JSON.parse(req.body.objectNeeds);
    }

    await campaign.save();
    res.json({ message: "Campaign updated", campaign });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ═══════════════════════════════════════════
   ASSOCIATION — DELETE campaign
   DELETE /api/campaigns/:id
═══════════════════════════════════════════ */
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });

    if (campaign.association.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await campaign.deleteOne();
    res.json({ message: "Campaign deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


export const getAllCampaignsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 12, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [{ title: { $regex: search, $options: "i" } }];

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate("association", "name organizationName")
        .sort("-createdAt")
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Campaign.countDocuments(query),
    ]);

    res.json({ campaigns, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const getAllCampaignsDonorActive = async (req, res) => {
  try {
    const { page = 1, limit = 12, status, search } = req.query;

    const query = {
      status: status || "active", // ✅ default to active
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate("association", "name organizationName")
        .sort("-createdAt")
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Campaign.countDocuments(query),
    ]);

    res.json({
      campaigns,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err); // ✅ ADD THIS
    res.status(500).json({ message: "Server error" });
  }
};
export const updateCampaignStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["active", "draft", "completed", "cancelled"];

    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({
          message: `Invalid status. Must be one of: ${allowed.join(", ")}`,
        });
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });

    campaign.status = status;
    await campaign.save();

    res.json({ message: `Campaign status updated to ${status}`, campaign });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ── ADMIN: hard delete any campaign ── */
export const deleteCampaignAdmin = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });

    await campaign.deleteOne();
    res.json({ message: "Campaign permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
