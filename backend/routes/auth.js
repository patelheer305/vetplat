import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
router.post('/register', async (req,res)=>{
  try{
    const { firstName,lastName,village,tehsil,district,state,mobile,email,password,role,specialization,feesTeleconsult,feesVisit } = req.body;
    if(!firstName||!lastName||!mobile||!email||!password||!role) return res.status(400).json({error:'Missing fields'});
    const existing = await User.findOne({email});
    if(existing) return res.status(400).json({error:'Email exists'});
    const hash = await bcrypt.hash(password,10);
    const user = await User.create({ firstName,lastName,village,tehsil,district,state,mobile,email,password:hash,role,specialization,feesTeleconsult,feesVisit, approved: role==='Doctor'? false: true });
    res.json({ok:true, userId:user._id});
  }catch(e){ console.error(e); res.status(500).json({error:'server'}) }
});
router.post('/login', async (req,res)=>{
  try{
    const { email,password } = req.body;
    const user = await User.findOne({email});
    if(!user) return res.status(400).json({error:'Invalid'});
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(400).json({error:'Invalid'});
    const token = jwt.sign({id:user._id,role:user.role}, JWT_SECRET, { expiresIn:'7d' });
    res.json({token, user:{ firstName:user.firstName,lastName:user.lastName,role:user.role,approved:user.approved, id:user._id }});
  }catch(e){ console.error(e); res.status(500).json({error:'server'}) }
});
export default router;
