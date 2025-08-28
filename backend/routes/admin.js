import express from 'express';
import User from '../models/User.js';
const router = express.Router();
// list pending doctors
router.get('/pending-doctors', async (req,res)=>{
  const list = await User.find({role:'Doctor', approved:false}).select('-password');
  res.json(list);
});
router.post('/decide-doctor', async (req,res)=>{
  const { doctorId, decision } = req.body;
  const d = await User.findById(doctorId);
  if(!d) return res.status(404).json({error:'not found'});
  d.approved = decision==='approve';
  await d.save();
  res.json({ok:true});
});
export default router;
