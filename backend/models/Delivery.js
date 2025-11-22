import mongoose from 'mongoose';

const DeliverySchema = new mongoose.Schema({
  type: { type: String, default: 'delivery' }, // Distinguishes it in "All Activity"
  customer: { type: String, required: true },   // "Customer" instead of "Supplier"
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 }
    }
  ],
  status: {
    type: String,
    enum: ['draft', 'ready', 'done'], // 'ready' implies picked/packed
    default: 'draft'
  },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Delivery', DeliverySchema);