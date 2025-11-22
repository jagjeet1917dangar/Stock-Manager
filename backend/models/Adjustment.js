import mongoose from 'mongoose';

const AdjustmentSchema = new mongoose.Schema({
  type: { type: String, default: 'adjustment' },
  reason: { type: String, required: true }, // e.g., "Damaged", "Audit"
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true } // Can be negative (-3) or positive (+5)
    }
  ],
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Adjustment', AdjustmentSchema);