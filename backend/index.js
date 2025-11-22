import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import User from './models/User.js';
import Product from './models/Product.js';
import Receipt from './models/Receipt.js';
import Delivery from './models/Delivery.js';
import Adjustment from './models/Adjustment.js';
import Transfer from './models/Transfer.js'; 

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://jagjeetdangarcg_db_user:XnGXs5wUbVBRE2Ek@cluster0.gqm0mb6.mongodb.net/stockmaster?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- NODEMAILER CONFIGURATION ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jagjeet.pareshd79@gmail.com',
    pass: 'ieyy xuvg eate dpjo'
  }
});

// ================= ROUTES =================

// --- AUTH ROUTES ---
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({ 
      message: 'Login successful', 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        warehouseName: user.warehouseName,
        lowStockThreshold: user.lowStockThreshold
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: 'jagjeet.pareshd79@gmail.com',
      to: user.email,
      subject: 'StockMaster Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`
    };
    
    await transporter.sendMail(mailOptions);
    res.json({ message: 'OTP sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid OTP' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset success' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- USER UPDATE ROUTE (Profile & Settings) ---
app.put('/api/user/:id', async (req, res) => {
  try {
    const { name, email, password, warehouseName, lowStockThreshold } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Update Settings
    if (warehouseName !== undefined) user.warehouseName = warehouseName;
    if (lowStockThreshold !== undefined) user.lowStockThreshold = Number(lowStockThreshold);

    await user.save();
    
    res.json({ 
      message: 'Profile updated successfully', 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        warehouseName: user.warehouseName,
        lowStockThreshold: user.lowStockThreshold
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- PRODUCT ROUTES ---
app.post('/api/products', async (req, res) => {
  try {
    const { name, sku, category, unitOfMeasure, quantity, minStock } = req.body;
    const existing = await Product.findOne({ sku });
    if (existing) return res.status(400).json({ message: 'Product SKU exists' });
    
    const product = new Product({
      name, sku, category, unitOfMeasure,
      quantity: quantity || 0,
      minStock: minStock || 10
    });
    await product.save();
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- RECEIPTS (IN) ---
app.post('/api/receipts', async (req, res) => {
  try {
    const { supplier, items, status } = req.body;
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      enrichedItems.push({ productId: item.productId, name: product.name, quantity: item.quantity });
    }

    const receipt = new Receipt({ supplier, items: enrichedItems, status: status || 'draft' });
    
    if (status === 'done') {
      for (const item of enrichedItems) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
      }
    }
    await receipt.save();
    res.status(201).json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/receipts', async (req, res) => {
  const receipts = await Receipt.find().sort({ date: -1 });
  res.json(receipts);
});

app.put('/api/receipts/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const receipt = await Receipt.findById(req.params.id);
    if (receipt.status !== 'done' && status === 'done') {
      for (const item of receipt.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
      }
    }
    const updated = await Receipt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- DELIVERIES (OUT) ---
app.post('/api/deliveries', async (req, res) => {
  try {
    const { customer, items, status } = req.body;
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      enrichedItems.push({ productId: item.productId, name: product.name, quantity: item.quantity });
    }

    if (status === 'done') {
      for (const item of enrichedItems) {
        const p = await Product.findById(item.productId);
        if (p.quantity < item.quantity) return res.status(400).json({ message: `Insufficient stock: ${p.name}` });
        p.quantity -= item.quantity;
        await p.save();
      }
    }
    const delivery = new Delivery({ customer, items: enrichedItems, status: status || 'draft' });
    await delivery.save();
    res.status(201).json(delivery);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/deliveries', async (req, res) => {
  const deliveries = await Delivery.find().sort({ date: -1 });
  res.json(deliveries);
});

app.put('/api/deliveries/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    
    if (delivery.status !== 'done' && status === 'done') {
      for (const item of delivery.items) {
        const p = await Product.findById(item.productId);
        if (p.quantity < item.quantity) return res.status(400).json({ message: `Insufficient stock: ${item.name}` });
      }
      for (const item of delivery.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: -item.quantity } });
      }
    }
    const updated = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- ADJUSTMENTS ---
app.post('/api/adjustments', async (req, res) => {
  try {
    const { reason, items } = req.body;
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      enrichedItems.push({ productId: item.productId, name: product.name, quantity: Number(item.quantity) });
    }

    for (const item of enrichedItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
    }

    const adjustment = new Adjustment({ reason, items: enrichedItems });
    await adjustment.save();
    res.status(201).json(adjustment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/adjustments', async (req, res) => {
  const adjustments = await Adjustment.find().sort({ date: -1 });
  res.json(adjustments);
});

// --- TRANSFERS (MOVE) ---
app.post('/api/transfers', async (req, res) => {
  try {
    const { fromLocation, toLocation, items, status } = req.body;
    
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      enrichedItems.push({ productId: item.productId, name: product.name, quantity: item.quantity });
    }

    if (status === 'done') {
      for (const item of enrichedItems) {
        const p = await Product.findById(item.productId);
        if (p.quantity < item.quantity) return res.status(400).json({ message: `Insufficient stock: ${p.name}` });
      }
    }

    const transfer = new Transfer({ fromLocation, toLocation, items: enrichedItems, status: status || 'draft' });
    await transfer.save();
    res.status(201).json(transfer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/transfers', async (req, res) => {
  const transfers = await Transfer.find().sort({ date: -1 });
  res.json(transfers);
});

app.put('/api/transfers/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const transfer = await Transfer.findById(req.params.id);
    
    if (transfer.status !== 'done' && status === 'done') {
       for (const item of transfer.items) {
        const p = await Product.findById(item.productId);
        if (p.quantity < item.quantity) return res.status(400).json({ message: `Insufficient stock: ${item.name}` });
      }
    }
    const updated = await Transfer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));