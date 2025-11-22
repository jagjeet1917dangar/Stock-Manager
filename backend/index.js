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
import Transfer from './models/Transfer.js'; // <--- Added Import

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://jagjeetdangarcg_db_user:XnGXs5wUbVBRE2Ek@cluster0.gqm0mb6.mongodb.net/';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// --- NODEMAILER CONFIGURATION ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jagjeet.pareshd79@gmail.com',
    pass: 'ieyy xuvg eate dpjo'
  }
});

// --- ROUTES ---

// 1. Sign Up Route
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    res.json({ 
      message: 'Login successful', 
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Forgot Password - Send OTP
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found with this email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: 'jagjeet.pareshd79@gmail.com',
      to: user.email,
      subject: 'StockMaster Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`
    };

    console.log(`DEBUG: OTP for ${email} is ${otp}`); 
    await transporter.sendMail(mailOptions);

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. Verify OTP & Reset Password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- PRODUCT ROUTES ---

app.post('/api/products', async (req, res) => {
  try {
    const { name, sku, category, unitOfMeasure, quantity, minStock } = req.body;
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) return res.status(400).json({ message: 'Product with this SKU already exists' });

    const newProduct = new Product({
      name, sku, category, unitOfMeasure,
      quantity: quantity || 0,
      minStock: minStock || 10
    });
    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- RECEIPT ROUTES (Incoming Stock) ---

app.post('/api/receipts', async (req, res) => {
  try {
    const { supplier, items, status } = req.body;
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product ID ${item.productId} not found` });
      enrichedItems.push({
        productId: item.productId,
        name: product.name,
        quantity: item.quantity
      });
    }

    const newReceipt = new Receipt({ supplier, items: enrichedItems, status: status || 'draft' });

    if (status === 'done') {
      for (const item of enrichedItems) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
      }
    }
    await newReceipt.save();
    res.status(201).json({ message: 'Receipt created successfully', receipt: newReceipt });
  } catch (error) {
    console.error("Error creating receipt:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/receipts', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const receipts = await Receipt.find(filter).sort({ date: -1 });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/receipts/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    if (receipt.status !== 'done' && status === 'done') {
      for (const item of receipt.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
      }
    }
    const updatedReceipt = await Receipt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedReceipt);
  } catch (error) {
    console.error("Error updating receipt:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- DELIVERY ROUTES (Outgoing Stock) ---

app.post('/api/deliveries', async (req, res) => {
  try {
    const { customer, items, status } = req.body;
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product ID ${item.productId} not found` });
      enrichedItems.push({
        productId: item.productId,
        name: product.name,
        quantity: item.quantity
      });
    }

    if (status === 'done') {
      for (const item of enrichedItems) {
        const product = await Product.findById(item.productId);
        if (product.quantity < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        }
        product.quantity -= item.quantity;
        await product.save();
      }
    }

    const newDelivery = new Delivery({ customer, items: enrichedItems, status: status || 'draft' });
    await newDelivery.save();
    res.status(201).json({ message: 'Delivery created successfully', delivery: newDelivery });
  } catch (error) {
    console.error("Error creating delivery:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/deliveries', async (req, res) => {
  try {
    const deliveries = await Delivery.find().sort({ date: -1 });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/deliveries/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

    if (delivery.status !== 'done' && status === 'done') {
      for (const item of delivery.items) {
        const product = await Product.findById(item.productId);
        if (!product || product.quantity < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
        }
      }
      for (const item of delivery.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: -item.quantity } });
      }
    }
    const updatedDelivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedDelivery);
  } catch (error) {
    console.error("Error updating delivery:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- STOCK ADJUSTMENT ROUTES ---

app.post('/api/adjustments', async (req, res) => {
  try {
    const { reason, items } = req.body;
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product ID ${item.productId} not found` });
      enrichedItems.push({
        productId: item.productId,
        name: product.name,
        quantity: Number(item.quantity)
      });
    }

    for (const item of enrichedItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
    }

    const newAdjustment = new Adjustment({ reason, items: enrichedItems });
    await newAdjustment.save();
    res.status(201).json({ message: 'Stock adjustment applied', adjustment: newAdjustment });
  } catch (error) {
    console.error("Error creating adjustment:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/adjustments', async (req, res) => {
  try {
    const adjustments = await Adjustment.find().sort({ date: -1 });
    res.json(adjustments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- TRANSFER ROUTES (Internal Moves) ---

// 1. Create Transfer
app.post('/api/transfers', async (req, res) => {
  try {
    const { fromLocation, toLocation, items, status } = req.body;
    
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      enrichedItems.push({ productId: item.productId, name: product.name, quantity: item.quantity });
    }

    // Simple validation: Check global stock availability
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

// 2. Get Transfers
app.get('/api/transfers', async (req, res) => {
  try {
    const transfers = await Transfer.find().sort({ date: -1 });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Update Transfer (Validate)
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