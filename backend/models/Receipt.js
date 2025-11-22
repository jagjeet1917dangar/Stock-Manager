import mongoose from 'mongoose';

const ReceiptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // <--- Added
  type: { type: String, default: 'receipt' },
  supplier: { type: String, required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 }
    }
  ],
  status: { type: String, enum: ['draft', 'waiting', 'done'], default: 'draft' },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Receipt', ReceiptSchema);