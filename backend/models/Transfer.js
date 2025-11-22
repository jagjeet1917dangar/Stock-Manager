import mongoose from 'mongoose';

const TransferSchema = new mongoose.Schema({
  type: { type: String, default: 'transfer' },
  fromLocation: { type: String, required: true },
  toLocation: { type: String, required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 }
    }
  ],
  status: {
    type: String,
    enum: ['draft', 'done'],
    default: 'draft'
  },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Transfer', TransferSchema);