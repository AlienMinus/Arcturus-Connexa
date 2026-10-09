// server/scripts/assignUsernames.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import User from '../models/User.js';
import connectDB from '../db.js';

dotenv.config({ path: '../.env' }); // Assuming the script is run from project root.

// Helper function to generate a random alphanumeric string
function generateRandomAlphaNumeric(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

async function generateUniqueUsername(user, allUsernames) {
    const emailPrefix = (user.email || '').toLowerCase().split('@')[0].split('+')[0] || '';
    let baseUsername = emailPrefix
        .replace(/[\.\-]/g, '_')
        .replace(/[^a-z0-9_]+/g, '')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '');

    if (!baseUsername || baseUsername.length < 3) {
        baseUsername = (baseUsername || 'user').padEnd(3, '0');
    }
    if (baseUsername.length > 25) {
        baseUsername = baseUsername.slice(0, 25).replace(/_+$/, '');
    }

    let username = baseUsername;
    let counter = 1;

    while (allUsernames.has(username)) {
        username = `${baseUsername}${counter++}`;
    }
    
    return username;
}

const assignUsernames = async () => {
    try {
        await connectDB();

        const usersWithoutUsername = await User.find({ $or: [{ username: { $exists: false } }, { username: null }] });
        
        if (usersWithoutUsername.length === 0) {
            console.log("All users already have usernames.");
            return;
        }

        const allUsers = await User.find({ username: { $exists: true, $ne: null } }, 'username');
        const allUsernames = new Set(allUsers.map(u => u.username));
        
        console.log(`Found ${usersWithoutUsername.length} users without a username.`);

        for (const user of usersWithoutUsername) {
            const newUsername = await generateUniqueUsername(user, allUsernames);
            user.username = newUsername;
            allUsernames.add(newUsername);
            await user.save();
            console.log(`Assigned username "${newUsername}" to user ${user.firstName} ${user.lastName} (${user._id})`);
        }

        console.log("Finished assigning usernames.");

    } catch (error) {
        console.error("Error assigning usernames:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
};

assignUsernames();
