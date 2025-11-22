import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true, // SKU must be unique for every product
  },
  category: {
    type: String,
    required: true,
  },
  unitOfMeasure: {
    type: String, // e.g., "kg", "pcs", "liters"
    required: true,
  },
  quantity: {
    type: Number,
    default: 0, // Tracks current stock level
  },
  minStock: {
    type: Number,
    default: 10, // For "Low Stock" alerts mentioned in the PDF
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Product', ProductSchema);