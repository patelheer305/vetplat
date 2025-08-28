import mongoose from 'mongoose';
const appointmentSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['Online','In-person'], required: true },
  date: Date,
  slot: String,
  symptoms: String,
  animalType: String,
  status: { type: String, enum: ['Pending','Accepted','Rejected'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Pending','Paid'], default: 'Pending' },
  meetLink: String,
}, { timestamps: true });
export default mongoose.model('Appointment', appointmentSchema);
