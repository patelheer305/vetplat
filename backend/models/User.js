import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  village: String,
  tehsil: String,
  district: String,
  state: String,
  mobile: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Farmer','Doctor','Admin'], required: true },
  specialization: String,
  feesTeleconsult: Number,
  feesVisit: Number,
  approved: { type: Boolean, default: false }
});
export default mongoose.model('User', userSchema);
