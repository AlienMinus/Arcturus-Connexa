import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import mongoose from 'mongoose';
import Organization from './models/Organization.js';
import PlacementDrive from './models/PlacementDrive.js';
import User from './models/User.js';
import PlacementProfile from './models/PlacementProfile.js';
import { getOrganizationByIdOrSlug } from './routes/campuslink/helpers.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const connexaOrg = await getOrganizationByIdOrSlug('arcturus-connexa');
  const bputOrg = await getOrganizationByIdOrSlug('biju-patnaik-university-of-technology');

  console.log('Connexa Org ID:', connexaOrg?._id.toString());
  console.log('BPUT Org ID:', bputOrg?._id.toString());

  // Test 1: Drives for Connexa
  const connexaDrives = await PlacementDrive.find({ organizationId: connexaOrg._id }).lean();
  console.log('Connexa Drives count:', connexaDrives.length, connexaDrives.map(d => d.companyName));

  // Test 2: Drives for BPUT
  const bputDrives = await PlacementDrive.find({ organizationId: bputOrg._id }).lean();
  console.log('BPUT Drives count:', bputDrives.length, bputDrives.map(d => d.companyName));

  // Check if Connexa drive leaks to BPUT
  const leakFound = bputDrives.some(d => d.organizationId.toString() === connexaOrg._id.toString());
  console.log('Leak found in BPUT drives?', leakFound ? 'YES (FAIL)' : 'NO (PASS)');

  // Test 3: Students under BPUT
  const bputStudents = await User.find({
    $or: [
      { 'institute.organizationId': bputOrg._id },
      { 'institute.name': { $regex: new RegExp(`^${bputOrg.name}$`, 'i') } },
    ]
  }).select('username email institute').lean();
  console.log('BPUT enrolled students count in User collection:', bputStudents.length);

  const bputProfiles = await PlacementProfile.find({
    $or: [
      { organizationId: bputOrg._id },
      { collegeName: { $regex: new RegExp(`^${bputOrg.name}$`, 'i') } },
    ]
  }).select('rollNumber branch cgpa').lean();
  console.log('BPUT Placement Profiles count:', bputProfiles.length);

  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
