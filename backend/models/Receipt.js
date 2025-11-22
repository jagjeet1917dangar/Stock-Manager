import mongoose from 'mongoose';

const ReceiptSchema = new mongoose.Schema({
  type: { type: String, default: 'receipt' }, // To distinguish in "All Activity" lists
  supplier: { type: String, required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true }, // Store name snapshot
      quantity: { type: Number, required: true, min: 1 }
    }
  ],
  status: {
    type: String,
    enum: ['draft', 'waiting', 'done'],
    default: 'draft'
  },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Receipt', ReceiptSchema);