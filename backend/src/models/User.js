import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

/* ── Address sub-schema ── */
const addressSubSchema = new mongoose.Schema({
  label:      { type: String, required: true, trim: true }, // e.g. "Main Office", "Pickup Point"
  street:     { type: String, trim: true },
  city:       { type: String, trim: true },
  state:      { type: String, trim: true },
  country:    { type: String, trim: true },
  postalCode: { type: String, trim: true },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }, // [longitude, latitude]
  },
});

/* ── Main user schema ── */
const userSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, trim: true },
    email:            { type: String, required: true, unique: true, lowercase: true },
    password:         { type: String, required: true, minlength: 6, select: false },
    role:             { type: String, enum: ['donor', 'association', 'admin'], default: 'donor' },
    status:           { type: String, enum: ['active', 'pending', 'rejected'], default: 'active' },

    // Profile
    phone:            { type: String, default: null },
    avatar:           { type: String, default: null },

    // Association-specific
    isApproved:       { type: Boolean, default: false },
    organizationName: { type: String, default: null },
    description:      { type: String, default: null },

    // Multiple uploaded documents (array of file paths/URLs)
    documents:        { type: [String], default: [] },

    // Multiple addresses
    addresses:        [addressSubSchema],

    // Password reset
    resetPasswordCode:    { type: String, select: false },
    resetPasswordExpires: { type: Date,   select: false },
  },
  { timestamps: true }
);

/* ── Hash password before save ── */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/* ── Compare password ── */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);