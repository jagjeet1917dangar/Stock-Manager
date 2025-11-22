import mongoose from 'mongoose';

const AdjustmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // <--- Added
  type: { type: String, default: 'adjustment' },
  reason: { type: String, required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true }
    }
  ],
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Adjustment', AdjustmentSchema);