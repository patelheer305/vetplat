import express from 'express';
import User from '../models/User.js';
const router = express.Router();
// list approved doctors with optional filters
router.get('/', async (req,res)=>{
  const { specialization, location } = req.query;
  const q = { role:'Doctor', approved:true };
  if(specialization) q.specialization = specialization;
  if(location) q.$or = [{district:location},{state:location},{village:location}];
  const docs = await User.find(q).select('-password');
  res.json(docs);
});
export default router;
