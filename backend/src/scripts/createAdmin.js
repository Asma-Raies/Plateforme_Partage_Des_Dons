import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import dotenv   from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join }  from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

console.log('MONGO_URI =', process.env.MONGO_URI ?? '⚠️  undefined');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Use raw collection — NO model, NO pre-save hook
    const collection = mongoose.connection.db.collection('users');

    const existing = await collection.findOne({ email: 'admin@donationconnect.tn' });
    if (existing) {
      console.log('⚠️  Admin already exists:', existing.email);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash manually — bypasses the broken pre-save hook completely
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);

    await collection.insertOne({
      name:             'Super Admin',
      email:            'admin@donationconnect.tn',
      password:         hashedPassword,
      role:             'admin',
      status:           'active',
      isApproved:       true,
      organizationName: null,
      description:      null,
      document:         null,
      createdAt:        new Date(),
      updatedAt:        new Date(),
    });

    console.log('✅ Admin created successfully');
    console.log('   Email   : admin@donationconnect.tn');
    console.log('   Password: Admin@123456');
    console.log('   Role    : admin');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();