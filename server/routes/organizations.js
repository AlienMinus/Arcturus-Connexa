import express from 'express';
import multer from 'multer';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import authMiddleware from '../middleware/auth.js';
import cloudinary from '../utils/cloudinary.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per document
});

const streamUpload = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// POST /api/organizations - Submit new organization with verification documents
router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'documents', maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        tagline,
        description,
        industry,
        organizationSize,
        organizationType,
        website,
        location,
        documentType,
        customLogoUrl,
        documentUrl,
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Organization name is required.' });
      }

      if (!location || !location.trim()) {
        return res.status(400).json({ error: 'Organization headquarters / location is required.' });
      }

      // Check if organization name already exists
      const existing = await Organization.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });
      if (existing) {
        return res.status(400).json({
          error: `An organization with the name "${name.trim()}" is already registered.`,
        });
      }

      let slug = generateSlug(name);
      let count = 1;
      while (await Organization.findOne({ slug })) {
        slug = `${generateSlug(name)}-${count++}`;
      }

      // 1. Process Logo
      let logoData = {
        url: customLogoUrl || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
        public_id: '',
      };

      if (req.files?.logo?.[0]) {
        try {
          const logoResult = await streamUpload(req.files.logo[0].buffer, {
            folder: 'arcturus/organizations/logos',
            transformation: [{ width: 400, height: 400, crop: 'limit' }],
          });
          logoData = {
            url: logoResult.secure_url,
            public_id: logoResult.public_id,
          };
        } catch (uploadErr) {
          console.warn('Logo upload to Cloudinary failed, using default:', uploadErr);
        }
      }

      // 2. Process Verification Documents (Required Image Files)
      const documentsList = [];

      if (req.files?.documents && req.files.documents.length > 0) {
        for (const file of req.files.documents) {
          try {
            const docResult = await streamUpload(file.buffer, {
              folder: 'arcturus/organizations/documents',
            });
            documentsList.push({
              url: docResult.secure_url,
              public_id: docResult.public_id,
              documentType: documentType || 'Certificate of Incorporation',
              originalName: file.originalname || 'document.png',
              uploadedAt: new Date(),
            });
          } catch (docErr) {
            console.error('Document upload to Cloudinary failed:', docErr);
          }
        }
      } else if (documentUrl && documentUrl.trim()) {
        // Fallback for pre-uploaded/hosted image URLs
        documentsList.push({
          url: documentUrl.trim(),
          public_id: '',
          documentType: documentType || 'Certificate of Incorporation',
          originalName: 'Verification_Document.png',
          uploadedAt: new Date(),
        });
      }

      if (documentsList.length === 0) {
        return res.status(400).json({
          error:
            'At least one official verification document image (e.g. Certificate of Incorporation, Business License, Tax ID) is required to submit your organization for review.',
        });
      }

      // 3. Create Organization in MongoDB Atlas with status: 'pending'
      const newOrganization = await Organization.create({
        name: name.trim(),
        slug,
        tagline: tagline ? tagline.trim() : '',
        description: description ? description.trim() : '',
        industry: industry || 'Software Development',
        organizationSize: organizationSize || '11-50',
        organizationType: organizationType || 'Privately Held',
        website: website ? website.trim() : '',
        location: location.trim(),
        logo: logoData,
        documents: documentsList,
        adminId: req.userId,
        status: 'pending',
        members: [
          {
            userId: req.userId,
            role: 'Admin',
            joinedAt: new Date(),
          },
        ],
      });

      // Link organization to User
      await User.findByIdAndUpdate(req.userId, {
        $addToSet: { organizations: newOrganization._id },
      });

      // Add notification to the user
      await User.findByIdAndUpdate(req.userId, {
        $push: {
          notifications: {
            type: 'other',
            message: `🏢 Your organization registration for "${newOrganization.name}" has been submitted for review by Arcturus Admin.`,
            read: false,
            createdAt: new Date(),
          },
        },
      });

      res.status(201).json({
        message: 'Organization registration submitted successfully! It is now pending review by Arcturus Admin.',
        organization: newOrganization,
      });
    } catch (err) {
      console.error('Failed to create organization:', err);
      res.status(500).json({ error: 'Failed to submit organization registration' });
    }
  }
);

// GET /api/organizations/my - Get organizations owned or managed by the authenticated user
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const organizations = await Organization.find({
      $or: [{ adminId: req.userId }, { 'members.userId': req.userId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ organizations });
  } catch (err) {
    console.error('Failed to fetch user organizations:', err);
    res.status(500).json({ error: 'Failed to retrieve your organizations' });
  }
});

// GET /api/organizations/:idOrSlug - Get specific organization details + jobs
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let query = {};
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      query = { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] };
    } else {
      query = { slug: idOrSlug };
    }

    const organization = await Organization.findOne(query)
      .populate('adminId', 'firstName lastName email profilePicture headline username')
      .lean();

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Fetch active jobs from this organization
    const jobs = await Job.find({
      organizationId: organization._id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ organization, jobs });
  } catch (err) {
    console.error('Failed to fetch organization:', err);
    res.status(500).json({ error: 'Failed to retrieve organization details' });
  }
});

// GET /api/organizations - List approved organizations (Directory / Search)
router.get('/', async (req, res) => {
  try {
    const { q, industry } = req.query;
    const filter = { status: 'approved' };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { tagline: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
      ];
    }

    if (industry && industry !== 'All') {
      filter.industry = industry;
    }

    const organizations = await Organization.find(filter)
      .select('name slug logo tagline industry location organizationSize')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ organizations });
  } catch (err) {
    console.error('Failed to fetch organizations list:', err);
    res.status(500).json({ error: 'Failed to retrieve organizations' });
  }
});

export default router;

