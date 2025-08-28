import express from 'express';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
const router = express.Router();
// create appointment (farmer)
router.post('/', async (req,res)=>{
  try{
    const { farmerId, doctorId, mode, date, slot, symptoms, animalType } = req.body;
    const farmer = await User.findById(farmerId);
    const doctor = await User.findById(doctorId);
    if(!farmer||!doctor) return res.status(400).json({error:'Invalid ids'});
    const ap = await Appointment.create({ farmer:farmerId, doctor:doctorId, mode, date: date? new Date(date): null, slot, symptoms, animalType, status: mode==='In-person'?'Pending':'Accepted' });
    res.json(ap);
  }catch(e){ console.error(e); res.status(500).json({error:'server'}) }
});
// list appointments by user id query param (either farmerId or doctorId)
router.get('/', async (req,res)=>{
  const { farmerId, doctorId } = req.query;
  const q = {};
  if(farmerId) q.farmer = farmerId;
  if(doctorId) q.doctor = doctorId;
  const list = await Appointment.find(q).populate('farmer','firstName lastName village mobile email').populate('doctor','firstName lastName specialization');
  res.json(list);
});
// doctor accepts/rejects in-person request
router.post('/:id/decide', async (req,res)=>{
  const { decision } = req.body; // 'accept' or 'reject'
  const ap = await Appointment.findById(req.params.id);
  if(!ap) return res.status(404).json({error:'not found'});
  if(decision==='accept'){ ap.status='Accepted'; await ap.save(); return res.json({ok:true}); }
  ap.status='Rejected'; await ap.save(); res.json({ok:true});
});
// mark paid (simulate)
router.post('/:id/paid', async (req,res)=>{
  const ap = await Appointment.findById(req.params.id);
  if(!ap) return res.status(404).json({error:'not found'});
  ap.paymentStatus='Paid';
  // simulate meet link generation for online
  if(ap.mode==='Online') ap.meetLink = `https://meet.google.com/${Math.random().toString(36).slice(2,10)}`;
  await ap.save();
  res.json({ok:true, meetLink: ap.meetLink});
});
export default router;
