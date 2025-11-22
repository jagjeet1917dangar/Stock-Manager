import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // <--- Added
  name: { type: String, required: true },
  sku: { type: String, required: true }, // Removed global 'unique' constraint here, we handle it per user in code
  category: { type: String, required: true },
  unitOfMeasure: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  minStock: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now },
});

// Compound index to ensure SKU is unique ONLY per user
ProductSchema.index({ userId: 1, sku: 1 }, { unique: true });

export default mongoose.model('Product', ProductSchema);