import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Models
import User from './models/User.js';
import Product from './models/Product.js';
import Receipt from './models/Receipt.js';
import Delivery from './models/Delivery.js';
import Adjustment from './models/Adjustment.js';
import Transfer from './models/Transfer.js'; 
import Location from './models/Location.js'; // <--- Ensure this is imported

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
    user: 'jagjeet.pareshd79@gmail.com', // Replace with env vars in production
    pass: 'ieyy xuvg eate dpjo'
  }
});

// --- HELPER: Get User ID ---
const getUserId = (req) => {
  return req.headers['x-user-id'];
};

// --- HELPER: Update Stock Logic ---
// This handles the complex math of updating the specific location AND the global total
async function updateProductStock(productId, locationId, changeInQty) {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  // 1. Find if stock entry exists for this location
  const stockIndex = product.stock.findIndex(s => s.locationId.toString() === locationId.toString());

  if (stockIndex > -1) {
    // Update existing location
    product.stock[stockIndex].quantity += changeInQty;
  } else {
    // Create new location entry
    product.stock.push({ locationId, quantity: changeInQty });
  }

  // 2. Recalculate Global Total
  product.quantity = product.stock.reduce((acc, curr) => acc + curr.quantity, 0);

  await product.save();
}

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

    // --- CREATE DEFAULT LOCATIONS ---
    const locations = [
      { userId: newUser._id, name: 'Main Warehouse', type: 'internal', isDefault: true },
      { userId: newUser._id, name: 'Vendors', type: 'supplier' },
      { userId: newUser._id, name: 'Customers', type: 'customer' },
      { userId: newUser._id, name: 'Inventory Adjustment', type: 'loss' }
    ];
    await Location.insertMany(locations);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
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

// --- PASSWORD RESET ROUTES ---

// 3. Forgot Password - Generate OTP & Send Email
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    const mailOptions = {
      from: 'jagjeet.pareshd79@gmail.com', 
      to: user.email,
      subject: 'StockMaster Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`
    };

    // Log for testing if email fails
    console.log(`DEBUG: OTP for ${email} is ${otp}`); 
    
    // Send email using the existing 'transporter' defined at the top of index.js
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
      resetPasswordExpires: { $gt: Date.now() } // Check if not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    // Clear OTP fields
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
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, sku, category, unitOfMeasure, quantity, minStock } = req.body;
    
    // Check duplicate SKU
    const existing = await Product.findOne({ sku, userId });
    if (existing) return res.status(400).json({ message: 'Product SKU exists' });
    
    // Find Default Location for Initial Stock
    const defaultLoc = await Location.findOne({ userId, isDefault: true });
    const initialStock = [];
    if (quantity > 0 && defaultLoc) {
      initialStock.push({ locationId: defaultLoc._id, quantity: Number(quantity) });
    }

    const product = new Product({
      userId,
      name, sku, category, unitOfMeasure,
      quantity: quantity || 0,
      stock: initialStock, // <--- Save initial stock to default warehouse
      minStock: minStock || 10
    });
    await product.save();
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    console.error("Product Create Error:", error); 
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// index.js - Find and REPLACE the existing GET /api/products route
app.get('/api/products', async (req, res) => {
  try {
    const userId = getUserId(req);
    // --- UPDATE: Populate location names so frontend can display them ---
    const products = await Product.find({ userId })
      .sort({ createdAt: -1 })
      .populate('stock.locationId', 'name type'); 
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const deleted = await Product.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/products/:id', async (req, res) => {
    try {
      const userId = getUserId(req);
      const updated = await Product.findOneAndUpdate(
        { _id: req.params.id, userId }, 
        req.body, 
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: 'Product not found' });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

// --- RECEIPTS (Incoming) ---
app.post('/api/receipts', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { supplier, items, status } = req.body;
    
    // Find Default Location (Main Warehouse) to receive goods into
    const defaultLoc = await Location.findOne({ userId, isDefault: true });
    if (!defaultLoc) return res.status(400).json({ message: "No default warehouse found" });

    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, userId });
      if (!product) return res.status(404).json({ message: 'Product not found' });
      enrichedItems.push({ productId: item.productId, name: product.name, quantity: Number(item.quantity) });
    }

    const receipt = new Receipt({ userId, supplier, items: enrichedItems, status: status || 'draft' });
    
    if (status === 'done') {
      for (const item of enrichedItems) {
        await updateProductStock(item.productId, defaultLoc._id, item.quantity);
      }
    }
    await receipt.save();
    res.status(201).json(receipt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/receipts/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { status } = req.body;
    const receipt = await Receipt.findOne({ _id: req.params.id, userId });
    const defaultLoc = await Location.findOne({ userId, isDefault: true });

    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    if (receipt.status !== 'done' && status === 'done') {
      for (const item of receipt.items) {
         await updateProductStock(item.productId, defaultLoc._id, item.quantity);
      }
    }
    const updated = await Receipt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- DELIVERIES (Outgoing) ---
app.post('/api/deliveries', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { customer, items, status } = req.body;
    const defaultLoc = await Location.findOne({ userId, isDefault: true });

    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, userId });
      if (!product) return res.status(404).json({ message: 'Product not found' });
      enrichedItems.push({ productId: item.productId, name: product.name, quantity: Number(item.quantity) });
    }

    if (status === 'done') {
      // Validation Phase
      for (const item of enrichedItems) {
        const p = await Product.findById(item.productId);
        // Check stock in Default Warehouse specifically
        const locStock = p.stock.find(s => s.locationId.toString() === defaultLoc._id.toString());
        const qtyAvailable = locStock ? locStock.quantity : 0;
        
        if (qtyAvailable < item.quantity) {
            return res.status(400).json({ message: `Insufficient stock in Main Warehouse: ${p.name}` });
        }
      }
      // Execution Phase
      for (const item of enrichedItems) {
        await updateProductStock(item.productId, defaultLoc._id, -item.quantity);
      }
    }
    const delivery = new Delivery({ userId, customer, items: enrichedItems, status: status || 'draft' });
    await delivery.save();
    res.status(201).json(delivery);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/deliveries/:id', async (req, res) => {
    try {
      const userId = getUserId(req);
      const { status } = req.body;
      const delivery = await Delivery.findOne({ _id: req.params.id, userId });
      const defaultLoc = await Location.findOne({ userId, isDefault: true });
      
      if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
      
      if (delivery.status !== 'done' && status === 'done') {
        // Check stock
        for (const item of delivery.items) {
            const p = await Product.findById(item.productId);
            const locStock = p.stock.find(s => s.locationId.toString() === defaultLoc._id.toString());
            const qtyAvailable = locStock ? locStock.quantity : 0;

            if (qtyAvailable < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock: ${item.name}` });
            }
        }
        // Deduct stock
        for (const item of delivery.items) {
           await updateProductStock(item.productId, defaultLoc._id, -item.quantity);
        }
      }
      const updated = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

// --- TRANSFERS (Internal) ---
app.post('/api/transfers', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { fromLocation, toLocation, items, status } = req.body;

    // Resolve Location Names to IDs
    const sourceLoc = await Location.findOne({ userId, name: fromLocation });
    const destLoc = await Location.findOne({ userId, name: toLocation });

    if (!sourceLoc || !destLoc) {
        return res.status(400).json({ message: "Invalid Source or Destination Location" });
    }

    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, userId });
      if (!product) return res.status(404).json({ message: 'Product not found' });
      enrichedItems.push({ productId: item.productId, name: product.name, quantity: Number(item.quantity) });
    }

    if (status === 'done') {
      // Check Availability at Source
      for (const item of enrichedItems) {
        const p = await Product.findById(item.productId);
        const locStock = p.stock.find(s => s.locationId.toString() === sourceLoc._id.toString());
        const qtyAvailable = locStock ? locStock.quantity : 0;

        if (qtyAvailable < item.quantity) {
            return res.status(400).json({ message: `Insufficient stock at ${fromLocation}: ${p.name}` });
        }
      }
      // Move Stock
      for (const item of enrichedItems) {
        await updateProductStock(item.productId, sourceLoc._id, -item.quantity); // Remove from Source
        await updateProductStock(item.productId, destLoc._id, item.quantity);  // Add to Dest
      }
    }

    const transfer = new Transfer({ userId, fromLocation, toLocation, items: enrichedItems, status: status || 'draft' });
    await transfer.save();
    res.status(201).json(transfer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/transfers/:id', async (req, res) => {
    try {
      const userId = getUserId(req);
      const { status } = req.body;
      const transfer = await Transfer.findOne({ _id: req.params.id, userId });
      
      if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
      
      const sourceLoc = await Location.findOne({ userId, name: transfer.fromLocation });
      const destLoc = await Location.findOne({ userId, name: transfer.toLocation });
  
      if (transfer.status !== 'done' && status === 'done') {
         // Check Availability
         for (const item of transfer.items) {
            const p = await Product.findById(item.productId);
            const locStock = p.stock.find(s => s.locationId.toString() === sourceLoc._id.toString());
            const qtyAvailable = locStock ? locStock.quantity : 0;
    
            if (qtyAvailable < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock at ${transfer.fromLocation}: ${item.name}` });
            }
         }
         // Move Stock
         for (const item of transfer.items) {
            await updateProductStock(item.productId, sourceLoc._id, -item.quantity);
            await updateProductStock(item.productId, destLoc._id, item.quantity);
         }
      }
      const updated = await Transfer.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

// --- GENERIC GET ROUTES ---
app.get('/api/receipts', async (req, res) => {
    const userId = getUserId(req);
    const receipts = await Receipt.find({ userId }).sort({ date: -1 });
    res.json(receipts);
});
app.get('/api/deliveries', async (req, res) => {
    const userId = getUserId(req);
    const deliveries = await Delivery.find({ userId }).sort({ date: -1 });
    res.json(deliveries);
});
app.get('/api/transfers', async (req, res) => {
    const userId = getUserId(req);
    const transfers = await Transfer.find({ userId }).sort({ date: -1 });
    res.json(transfers);
});
app.get('/api/adjustments', async (req, res) => {
    const userId = getUserId(req);
    const adjustments = await Adjustment.find({ userId }).sort({ date: -1 });
    res.json(adjustments);
});

// --- ADJUSTMENTS (User Specific) ---
app.post('/api/adjustments', async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  
      const { reason, items } = req.body;
      // Adjustment usually affects default warehouse unless specified otherwise
      // For now, we assume adjustments happen in Main Warehouse
      const defaultLoc = await Location.findOne({ userId, isDefault: true });

      const enrichedItems = [];
      for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, userId });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        enrichedItems.push({ productId: item.productId, name: product.name, quantity: Number(item.quantity) });
      }
  
      for (const item of enrichedItems) {
        await updateProductStock(item.productId, defaultLoc._id, item.quantity);
      }
  
      const adjustment = new Adjustment({ userId, reason, items: enrichedItems });
      await adjustment.save();
      res.status(201).json(adjustment);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

// --- LOCATION ROUTES (FIXED) ---
app.get('/api/locations', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const locations = await Location.find({ userId });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/locations', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const { name, type, address, isDefault } = req.body;
    
    // Check for duplicate name
    const existing = await Location.findOne({ userId, name });
    if (existing) {
      return res.status(400).json({ message: "A location with this name already exists." });
    }

    // If setting as default, unset others
    if (isDefault) {
      await Location.updateMany({ userId }, { isDefault: false });
    }

    const location = new Location({ userId, name, type, address, isDefault });
    await location.save();
    res.status(201).json(location);
  } catch (error) {
    console.error("Location Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/locations/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    await Location.findOneAndDelete({ _id: req.params.id, userId });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- ADJUSTMENTS (User Specific) ---
app.post('/api/adjustments', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { reason, items, locationName } = req.body;
    
    // 1. Determine which location we are counting
    let targetLoc;
    if (locationName) {
      targetLoc = await Location.findOne({ userId, name: locationName });
    }
    // Fallback to default if none selected
    if (!targetLoc) {
      targetLoc = await Location.findOne({ userId, isDefault: true });
    }
    if (!targetLoc) return res.status(400).json({ message: "Location not found" });

    const adjustmentItems = []; // We will store the DIFFERENCE here for history

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, userId });
      if (!product) return res.status(404).json({ message: `Product not found: ${item.productId}` });

      // 2. Get Current Stock at this location
      const currentStockEntry = product.stock.find(s => s.locationId.toString() === targetLoc._id.toString());
      const currentQty = currentStockEntry ? currentStockEntry.quantity : 0;

      // 3. Calculate Difference (Physical Count - System Qty)
      // Example: Counted 8, System has 10. Diff = -2.
      const countedQty = Number(item.quantity);
      const difference = countedQty - currentQty;

      if (difference !== 0) {
        // 4. Update Stock with the Difference
        await updateProductStock(product._id, targetLoc._id, difference);
        
        // 5. Record the Difference in the Ledger (so we know what changed)
        adjustmentItems.push({
          productId: item.productId,
          name: product.name,
          quantity: difference // Storing -2, not 8
        });
      }
    }

    // Only save adjustment if there were actual changes
    if (adjustmentItems.length > 0) {
      const adjustment = new Adjustment({ 
        userId, 
        reason, 
        items: adjustmentItems,
        location: targetLoc.name // Optional: You might need to add 'location' field to Adjustment Model if you want to see it later
      });
      await adjustment.save();
      res.status(201).json(adjustment);
    } else {
      res.status(200).json({ message: "No changes needed. Counts matched system stock." });
    }

  } catch (error) {
    console.error("Adjustment Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));